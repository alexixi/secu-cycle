"""Accès aux sources de trafic. Entrées/sorties pures, aucun état conservé.

Un provider renvoie une liste de tronçons normalisés :

    {"id": str, "level": str, "etat": str, "commune": str, "coordinates": [[lon, lat], ...]}

Charge au service d'en faire une couche d'affichage et un ensemble d'arêtes
pénalisées.
"""

import logging

import httpx

from traffic import config

logger = logging.getLogger(__name__)


def _level_of(etat: str) -> str:
    return config.LEVEL_BY_ETAT.get((etat or "").upper(), config.DEFAULT_LEVEL)


def _normalise(record: dict) -> dict | None:
    """Un enregistrement `ci_trafi_l` → tronçon normalisé, ou None s'il est inexploitable."""
    geometry = (record.get("geo_shape") or {}).get("geometry") or {}
    if geometry.get("type") != "LineString":
        return None

    coordinates = geometry.get("coordinates") or []
    if len(coordinates) < 2:
        return None

    etat = record.get("etat") or "INCONNU"
    return {
        "id": record.get("gml_id") or str(record.get("gid")),
        "level": _level_of(etat),
        "etat": etat,
        "commune": record.get("commune") or "",
        "coordinates": coordinates,
    }


async def bordeaux_segments(bbox=None) -> list[dict]:
    """Tous les tronçons publiés par Bordeaux Métropole, paginés.

    `bbox` (w, s, e, n) filtre côté client sur l'emprise du graphe chargé : le
    jeu couvre 17 communes de la métropole, un profil plus étroit n'a que faire
    du reste. Un bbox absent laisse tout passer.
    """
    segments = []

    async with httpx.AsyncClient(timeout=config.HTTP_TIMEOUT_S) as client:
        for page in range(config.MAX_PAGES):
            response = await client.get(
                config.BORDEAUX_METROPOLE_URL,
                params={
                    "limit": config.PAGE_SIZE,
                    "offset": page * config.PAGE_SIZE,
                    "select": "gml_id,gid,etat,commune,geo_shape",
                },
            )
            response.raise_for_status()
            records = response.json().get("results", [])

            for record in records:
                segment = _normalise(record)
                if segment is not None:
                    segments.append(segment)

            if len(records) < config.PAGE_SIZE:
                break
        else:
            logger.warning(
                "[trafic] pagination interrompue à %d pages : le jeu de données "
                "est plus gros que prévu, la couverture est partielle.",
                config.MAX_PAGES,
            )

    if bbox is not None:
        segments = [s for s in segments if _intersects(s["coordinates"], bbox)]

    return segments


def _intersects(coordinates, bbox) -> bool:
    """Le tronçon passe-t-il par l'emprise ? (au moins un sommet dedans)"""
    w, s, e, n = bbox
    return any(w <= lon <= e and s <= lat <= n for lon, lat in coordinates)
