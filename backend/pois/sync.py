"""Synchronise les points d'intérêt OpenStreetMap vers la table `map_pois`.

Lancé ponctuellement via `make sync-pois`. La carte ne dépend donc jamais
d'Overpass à l'exécution : elle lit la base.

L'emprise géographique est celle du profil de graphe actif (`GRAPH_PROFILE`),
si bien que les POI couvrent exactement la même zone que le réseau de routage.
"""

import time
from datetime import datetime

import osmnx as ox
import pandas as pd
from sqlalchemy import select, delete
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.sql import func

from database import SessionLocal
from graph.graph_manager import load_graph_profile
from models.poi import MapPoi


POI_TAGS = {
    "amenity": [
        "drinking_water",
        "fountain",
        "toilets",
        "bicycle_parking",
        "bicycle_repair_station",
        "compressed_air",
    ],
    "man_made": ["water_tap"],
    "shop": ["bicycle"],
}

_NON_TAG_COLUMNS = {"geometry", "nodes", "ways", "members"}

_TRUTHY = ("yes", "1", "true")

MAX_RETRIES = 3
UPSERT_CHUNK_SIZE = 500


def classify(tags: dict) -> str | None:
    """Range un objet OSM dans une de nos 4 catégories, ou None s'il n'y a pas sa place."""
    amenity = tags.get("amenity")
    man_made = tags.get("man_made")
    shop = tags.get("shop")

    if amenity == "drinking_water" or man_made == "water_tap":
        return "water"
    if amenity == "fountain" and str(tags.get("drinking_water", "")).lower() in _TRUTHY:
        return "water"
    if amenity == "toilets":
        return "toilets"
    if amenity == "bicycle_parking":
        return "parking"
    if amenity in ("bicycle_repair_station", "compressed_air"):
        return "repair"
    if shop == "bicycle" and str(tags.get("service:bicycle:repair", "")).lower() in ("yes", "only"):
        return "repair"
    return None


def _fetch(communes):
    """Interroge Overpass, avec backoff : les grandes emprises déclenchent des 429/504."""
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            return ox.features_from_place(communes, POI_TAGS)
        except Exception as exc:
            print(f"[sync-pois] tentative {attempt}/{MAX_RETRIES} échouée : {exc}", flush=True)
            if attempt == MAX_RETRIES:
                raise
            time.sleep(15 * attempt)


def _clean_tags(feature) -> dict:
    tags = {}
    for key, value in feature.items():
        if key in _NON_TAG_COLUMNS:
            continue
        try:
            if pd.isna(value):
                continue
        except (TypeError, ValueError):
            pass
        tags[key] = value
    return tags


def _rows_from_gdf(gdf) -> list[dict]:
    """Convertit le GeoDataFrame osmnx (index ("element", "id")) en lignes map_pois."""
    rows = {}
    for (osm_type, osm_id), feature in gdf.iterrows():
        tags = _clean_tags(feature)
        category = classify(tags)
        if category is None:
            continue

        geom = feature.geometry
        if geom is None or geom.is_empty:
            continue

        point = geom if geom.geom_type == "Point" else geom.representative_point()

        name = tags.get("name")
        rows[(osm_type, int(osm_id), category)] = {
            "osm_type": osm_type,
            "osm_id": int(osm_id),
            "category": category,
            "name": str(name)[:255] if name else None,
            "latitude": float(point.y),
            "longitude": float(point.x),
            "tags": tags,
        }
    return list(rows.values())


def _count_created(db, rows) -> int:
    """Nombre de POI absents de la base avant l'upsert.

    `ON CONFLICT DO UPDATE` ne distingue pas insertion et mise à jour : on
    compare donc les clés OSM à celles déjà présentes.
    """
    existing = set(
        db.execute(select(MapPoi.osm_type, MapPoi.osm_id, MapPoi.category)).all()
    )
    return sum(
        1 for row in rows
        if (row["osm_type"], row["osm_id"], row["category"]) not in existing
    )


def _upsert(db, rows):
    for start in range(0, len(rows), UPSERT_CHUNK_SIZE):
        chunk = rows[start:start + UPSERT_CHUNK_SIZE]
        stmt = pg_insert(MapPoi).values(chunk)
        stmt = stmt.on_conflict_do_update(
            constraint="uq_map_pois_osm_object_category",
            set_={
                "name": stmt.excluded.name,
                "latitude": stmt.excluded.latitude,
                "longitude": stmt.excluded.longitude,
                "tags": stmt.excluded.tags,
                "updated_at": func.now(),
            },
        )
        db.execute(stmt)


def sync() -> dict:
    """Synchronise la base avec OSM et renvoie les compteurs du run.

    Retourne {"total", "created", "deleted"} : respectivement le nombre de POI
    en base à l'issue du run, ceux qui n'y étaient pas, et ceux qui ont disparu
    d'OSM. Ces compteurs alimentent l'historique des synchros (`poi_sync_runs`).
    """
    profile = load_graph_profile()
    communes = profile["communes"]

    print(f"[sync-pois] Interrogation d'Overpass pour {len(communes)} communes...", flush=True)
    gdf = _fetch(communes)
    rows = _rows_from_gdf(gdf)
    print(f"[sync-pois] {len(gdf)} objets OSM reçus, {len(rows)} POI retenus.", flush=True)

    db = SessionLocal()
    try:
        if not rows:
            total = db.execute(select(func.count(MapPoi.id))).scalar_one()
            print("[sync-pois] Aucun POI retenu : la base est laissée inchangée.", flush=True)
            return {"total": total, "created": 0, "deleted": 0}

        run_start: datetime = db.execute(select(func.now())).scalar_one()

        created = _count_created(db, rows)

        _upsert(db, rows)

        purged = db.execute(
            delete(MapPoi).where(MapPoi.updated_at < run_start)
        ).rowcount
        db.commit()

        print(
            f"[sync-pois] {len(rows)} POI enregistrés ({created} nouveaux), "
            f"{purged} obsolètes purgés.",
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
