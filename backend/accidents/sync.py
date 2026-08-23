"""Synchronise les accidents corporels géolocalisés vers la table `road_accidents`."""

from datetime import datetime

from shapely.geometry import shape
from shapely.ops import unary_union
from sqlalchemy import select, delete
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.sql import func

from accidents import config
from accidents.providers import providers_for
from database import SessionLocal
from geocoding.service import countries_of
from graph.communes import CommuneNotFound, geometry_of
from graph.graph_manager import load_data_profile
from models.accident import RoadAccident


def profile_zones(db, communes):
    """Polygones des communes du profil, fusionnés en zones d'un seul tenant."""
    geometries = []
    for name in communes:
        try:
            geometries.append(shape(geometry_of(db, name)))
        except CommuneNotFound as exc:
            print(f"[sync-accidents] {exc}", flush=True)

    if not geometries:
        raise RuntimeError(
            "Aucun contour de commune n'a pu être obtenu pour ce profil : "
            "impossible de délimiter l'emprise des accidents."
        )

    merged = unary_union(geometries)
    return list(merged.geoms) if merged.geom_type == "MultiPolygon" else [merged]


def _count_created(db, rows) -> int:
    """Nombre d'accidents absents de la base avant l'upsert.

    `ON CONFLICT DO UPDATE` ne distingue pas insertion et mise à jour : on
    compare donc les clés de source à celles déjà présentes.
    """
    existing = set(
        db.execute(select(RoadAccident.source, RoadAccident.source_ref)).all()
    )
    return sum(1 for row in rows if (row["source"], row["source_ref"]) not in existing)


def _upsert(db, rows):
    for start in range(0, len(rows), config.UPSERT_CHUNK_SIZE):
        chunk = rows[start:start + config.UPSERT_CHUNK_SIZE]
        stmt = pg_insert(RoadAccident).values(chunk)
        stmt = stmt.on_conflict_do_update(
            constraint="uq_road_accidents_source_ref",
            set_={
                "country": stmt.excluded.country,
                "latitude": stmt.excluded.latitude,
                "longitude": stmt.excluded.longitude,
                "occurred_on": stmt.excluded.occurred_on,
                "severity": stmt.excluded.severity,
                "involves_bicycle": stmt.excluded.involves_bicycle,
                "properties": stmt.excluded.properties,
                "updated_at": func.now(),
            },
        )
        db.execute(stmt)


def sync(since_year: int | None = None) -> dict:
    """Synchronise la base avec les sources d'accidentologie de l'emprise de données.

    Emprise donnée par `load_data_profile()` : le profil de graphe actif, ou
    celui que désigne `DATA_PROFILE` quand les deux sont découplés.
    """
    since_year = since_year or config.DEFAULT_SINCE_YEAR

    profile = load_data_profile()
    communes = profile["communes"]
    countries = countries_of(communes)

    providers = providers_for(countries)
    if not providers:
        raise RuntimeError(
            f"Aucune source d'accidentologie ne couvre les pays du profil : "
            f"{', '.join(countries)}."
        )

    db = SessionLocal()
    try:
        zones = profile_zones(db, communes)
        print(
            f"[sync-accidents] Profil '{profile['name']}' : {len(zones)} zone(s), "
            f"sources {', '.join(p.label for p in providers)}, depuis {since_year}.",
            flush=True,
        )

        rows = []
        for provider in providers:
            rows.extend(provider.fetch(zones, since_year))

        if not rows:
            total = db.execute(select(func.count(RoadAccident.id))).scalar_one()
            print("[sync-accidents] Aucun accident retenu : la base est laissée inchangée.",
                  flush=True)
            return {"total": total, "created": 0, "deleted": 0}

        run_start: datetime = db.execute(select(func.now())).scalar_one()

        created = _count_created(db, rows)
        _upsert(db, rows)

        purged = db.execute(
            delete(RoadAccident).where(RoadAccident.updated_at < run_start)
        ).rowcount
        db.commit()

        print(
            f"[sync-accidents] {len(rows)} accident(s) enregistré(s) ({created} nouveaux), "
            f"{purged} obsolète(s) purgé(s).",
            flush=True,
        )
        return {"total": len(rows), "created": created, "deleted": purged}
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    sync()
