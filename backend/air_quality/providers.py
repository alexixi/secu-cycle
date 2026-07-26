"""Accès à la source qualité de l'air (Open-Meteo / CAMS). I/O pur, sans état.

Toutes les coordonnées de la maille partent en **une** requête (Open-Meteo
accepte des listes `latitude=...,...&longitude=...,...`). Le résultat est une
liste d'objets par point, dans l'ordre des coordonnées envoyées ; pour un point
unique l'API renvoie un objet seul, qu'on enveloppe pour homogénéiser.
"""

import logging

import httpx

from air_quality import config

logger = logging.getLogger(__name__)


async def fetch(points: list[tuple[float, float]]) -> list[dict]:
    """Relève courant + prévision 24 h pour chaque point (lat, lon).

    Renvoie la liste brute des objets Open-Meteo, dans l'ordre de `points`.
    """
    if not points:
        return []

    lats = ",".join(f"{lat:.4f}" for lat, _ in points)
    lons = ",".join(f"{lon:.4f}" for _, lon in points)
    params = {
        "latitude": lats,
        "longitude": lons,
        "current": ",".join(config.CURRENT_VARS),
        "hourly": ",".join(config.HOURLY_VARS),
        "forecast_hours": config.FORECAST_HOURS,
        "timezone": "auto",
    }

    async with httpx.AsyncClient(timeout=config.HTTP_TIMEOUT_S) as client:
        response = await client.get(config.URL, params=params)
        response.raise_for_status()
        data = response.json()

    # Un seul point → objet ; plusieurs → tableau. On homogénéise en liste.
    if isinstance(data, dict):
        data = [data]
    return data


def _parse_aqi(value):
    """AQI d'une station en entier, ou None (station sans donnée : `aqi = "-"`)."""
    try:
        return int(float(value))
    except (TypeError, ValueError):
        return None


async def fetch_stations(bbox) -> list[dict]:
    """Stations WAQI dont la position tombe dans l'emprise `(w, s, e, n)`.

    Un seul appel `/map/bounds/` (latlng attendu en SO→NE : lat1,lng1,lat2,lng2).
    Jeton absent → aucune requête, liste vide (couche CAMS seule). Renvoie une
    liste normalisée `{aqi, lat, lon, uid, name, time}`, stations sans donnée
    écartées.
    """
    if not config.WAQI_TOKEN or bbox is None:
        return []

    w, s, e, n = bbox
    params = {"latlng": f"{s},{w},{n},{e}", "token": config.WAQI_TOKEN}

    async with httpx.AsyncClient(timeout=config.HTTP_TIMEOUT_S) as client:
        response = await client.get(config.WAQI_URL, params=params)
        response.raise_for_status()
        payload = response.json()

    if payload.get("status") != "ok":
        raise RuntimeError(f"WAQI a répondu : {payload.get('data') or payload.get('status')}")

    stations = []
    for entry in payload.get("data") or []:
        aqi = _parse_aqi(entry.get("aqi"))
        if aqi is None:
            continue
        info = entry.get("station") or {}
        stations.append({
            "aqi": aqi,
            "lat": entry.get("lat"),
            "lon": entry.get("lon"),
            "uid": entry.get("uid"),
            "name": info.get("name") or "",
            "time": info.get("time") or "",
        })
    return stations
