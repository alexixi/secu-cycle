"""Synchronise les points lumineux d'éclairage public vers `street_lamps`.

Lancé ponctuellement via `make sync-lighting`. La carte et le graphe lisent
ensuite la base ; ils ne dépendent jamais d'Overpass ni des portails open data
à l'exécution.

Deux familles de sources sont fusionnées sur l'emprise du profil actif :
- OSM `highway=street_lamp` (universel) ;
- les jeux « points lumineux » OpenDataSoft des métropoles couvertes (registre
  `lighting.config.ODS_LIGHTING_DATASETS`).

Un lampadaire OSM proche d'un point officiel est écarté (dédoublonnage), pour ne
pas gonfler artificiellement la densité d'éclairage.
"""

from datetime import datetime

import numpy as np
from shapely.geometry import shape
from shapely.ops import unary_union
from sklearn.neighbors import BallTree
from sqlalchemy import and_, select, delete
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.sql import func

from database import SessionLocal
from graph.communes import CommuneNotFound, geometry_of
from graph.extent import bbox_clause
from graph.graph_manager import load_data_profile
from lighting import config
from lighting.providers import OsmStreetLampProvider, ods_providers_for
from models.street_lamp import StreetLamp

_EARTH_RADIUS_M = 6_371_000.0


def profile_zones(db, communes):
    """Polygones des communes du profil, fusionnés en zones d'un seul tenant."""
    geometries = []
    for name in communes:
        try:
            geometries.append(shape(geometry_of(db, name)))
        except CommuneNotFound as exc:
            print(f"[sync-lighting] {exc}", flush=True)

    if not geometries:
        raise RuntimeError(
            "Aucun contour de commune n'a pu être obtenu pour ce profil : "
            "impossible de délimiter l'emprise de l'éclairage."
        )

    merged = unary_union(geometries)
    return list(merged.geoms) if merged.geom_type == "MultiPolygon" else [merged]


def _dedup_osm(osm_rows, official_rows):
    """Écarte les lampadaires OSM situés à moins de `DEDUP_RADIUS_M` d'un point officiel."""
    if not osm_rows or not official_rows:
        return osm_rows

    off = np.deg2rad([[r["latitude"], r["longitude"]] for r in official_rows])
    tree = BallTree(off, metric="haversine")
    radius = config.DEDUP_RADIUS_M / _EARTH_RADIUS_M

    osm = np.deg2rad([[r["latitude"], r["longitude"]] for r in osm_rows])
    counts = tree.query_radius(osm, r=radius, count_only=True)
    kept = [row for row, n in zip(osm_rows, counts) if n == 0]
    dropped = len(osm_rows) - len(kept)
    if dropped:
        print(f"[sync-lighting] {dropped} lampadaire(s) OSM en doublon d'un point "
              f"officiel écarté(s).", flush=True)
    return kept


def _count_created(db, rows) -> int:
    """Nombre de points absents de la base avant l'upsert (cf. accidents/pois)."""
    existing = set(
        db.execute(select(StreetLamp.source, StreetLamp.source_ref)).all()
    )
    return sum(1 for row in rows if (row["source"], row["source_ref"]) not in existing)


def _upsert(db, rows):
    for start in range(0, len(rows), config.UPSERT_CHUNK_SIZE):
        chunk = rows[start:start + config.UPSERT_CHUNK_SIZE]
        stmt = pg_insert(StreetLamp).values(chunk)
        stmt = stmt.on_conflict_do_update(
            constraint="uq_street_lamps_source_ref",
            set_={
                "latitude": stmt.excluded.latitude,
                "longitude": stmt.excluded.longitude,
                "tags": stmt.excluded.tags,
                "updated_at": func.now(),
            },
        )
        db.execute(stmt)


def sync() -> dict:
    """Synchronise `street_lamps` avec les sources d'éclairage de l'emprise de données.

    Emprise donnée par `load_data_profile()` : le profil de graphe actif, ou
    celui que désigne `DATA_PROFILE` quand les deux sont découplés.

    Retourne {"total", "created", "deleted"}.
    """
    profile = load_data_profile()
    communes = profile["communes"]

    db = SessionLocal()
    try:
        zones = profile_zones(db, communes)
        ods_providers = ods_providers_for(communes)
        print(
            f"[sync-lighting] Profil '{profile['name']}' : {len(zones)} zone(s), "
            f"sources OSM"
            + (", " + ", ".join(p.label for p in ods_providers) if ods_providers else "")
            + ".",
            flush=True,
        )

        official_rows = []
        ods_failed = False
        for provider in ods_providers:
            try:
                official_rows.extend(provider.fetch(communes, zones))
            except Exception as exc:
                ods_failed = True
                print(f"[sync-lighting] {provider.label} ignorée : {exc}", flush=True)

        osm_rows, covered = OsmStreetLampProvider().fetch(communes, zones)
        osm_rows = _dedup_osm(osm_rows, official_rows)

        rows = official_rows + osm_rows

        if not rows:
            total = db.execute(select(func.count(StreetLamp.id))).scalar_one()
            print("[sync-lighting] Aucun point retenu : la base est laissée inchangée.",
                  flush=True)
            return {"total": total, "created": 0, "deleted": 0}

        run_start: datetime = db.execute(select(func.now())).scalar_one()

        created = _count_created(db, rows)
        _upsert(db, rows)

        # La purge ne doit toucher que ce qui vient d'être rafraîchi. Une source
        # officielle en panne est le cas le plus dangereux : ses dizaines de
        # milliers de luminaires ne sont pas dans le lot, et une purge globale
        # les effacerait tous. On s'abstient alors complètement, quitte à garder
        # des points périmés — ils reviendront au prochain passage.
        stale = StreetLamp.updated_at < run_start
        if ods_failed:
            purged = 0
            print("[sync-lighting] Source officielle en échec : purge suspendue.",
                  flush=True)
        elif len(covered) < len(zones):
            print(f"[sync-lighting] {len(zones) - len(covered)} zone(s) sur "
                  f"{len(zones)} non rafraîchie(s) : la purge les épargne.", flush=True)
            purged = db.execute(
                delete(StreetLamp).where(and_(
                    stale,
                    bbox_clause(StreetLamp.latitude, StreetLamp.longitude, covered),
                ))
            ).rowcount
        else:
            purged = db.execute(delete(StreetLamp).where(stale)).rowcount
        db.commit()

        print(
            f"[sync-lighting] {len(rows)} point(s) enregistré(s) ({created} nouveaux), "
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
