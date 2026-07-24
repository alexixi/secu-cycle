"""Accès aux sources de trafic. Entrées/sorties pures, aucun état conservé.

Un provider renvoie une liste de tronçons normalisés :

    {"id": str, "level": str, "etat": str, "commune": str, "coordinates": [[lon, lat], ...]}

Toutes les sources parlent la même API Opendatasoft `explore/v2.1` ; un seul
fetch générique, paramétré par le descriptif de source (`config.PROVIDERS`),
les couvre. Charge au service d'en faire une couche d'affichage et un ensemble
d'arêtes pénalisées.
"""

import logging

import httpx

from traffic import config

logger = logging.getLogger(__name__)


def _first_id(record: dict, id_fields) -> str:
    """Premier identifiant présent parmi `id_fields`, en chaîne."""
    for field in id_fields:
        value = record.get(field)
        if value:
            return str(value)
    return ""


def _normalise(record: dict, spec: dict) -> dict | None:
    """Un enregistrement brut → tronçon normalisé, ou None s'il est inexploitable."""
    prefix_field = spec.get("exclude_prefix_field")
    if prefix_field:
        value = record.get(prefix_field) or ""
        if str(value).lower().startswith(spec["exclude_prefix"]):
            return None

    geometry = (record.get("geo_shape") or {}).get("geometry") or {}
    if geometry.get("type") != "LineString":
        return None

    coordinates = geometry.get("coordinates") or []
    if len(coordinates) < 2:
        return None

    etat = record.get(spec["level_field"])
    level = spec["level_map"].get(str(etat), config.DEFAULT_LEVEL)

    commune_field = spec.get("commune_field")
    return {
        "id": _first_id(record, spec["id_fields"]),
        "level": level,
        "etat": etat,
        "commune": (record.get(commune_field) or "") if commune_field else "",
        "coordinates": coordinates,
    }


async def fetch(spec: dict, bbox=None) -> list[dict]:
    """Tous les tronçons d'une source, paginés puis filtrés sur l'emprise.

    `bbox` (w, s, e, n) restreint côté client aux tronçons touchant l'emprise du
    graphe chargé ; un bbox absent laisse tout passer.
    """
    segments = []

    async with httpx.AsyncClient(timeout=config.HTTP_TIMEOUT_S) as client:
        for page in range(config.MAX_PAGES):
            response = await client.get(
                spec["url"],
                params={
                    "limit": config.PAGE_SIZE,
                    "offset": page * config.PAGE_SIZE,
                    "select": spec["select"],
                },
            )
            response.raise_for_status()
            records = response.json().get("results", [])

            for record in records:
                segment = _normalise(record, spec)
                if segment is not None:
                    segments.append(segment)

            if len(records) < config.PAGE_SIZE:
                break
        else:
            logger.warning(
                "[trafic] %s : pagination interrompue à %d pages, couverture partielle.",
                spec["url"],
                config.MAX_PAGES,
            )

    if bbox is not None:
        segments = [s for s in segments if _intersects(s["coordinates"], bbox)]

    return segments


def _intersects(coordinates, bbox) -> bool:
    """Le tronçon passe-t-il par l'emprise ? (au moins un sommet dedans)"""
    w, s, e, n = bbox
    return any(w <= lon <= e and s <= lat <= n for lon, lat in coordinates)
