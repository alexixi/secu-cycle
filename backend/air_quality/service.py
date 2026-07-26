"""État de la qualité de l'air : une collecte, deux usages.

Le même instantané sert la carte (maille GeoJSON colorée par l'EAQI) et le calcul
d'itinéraire (`routing_intensity()`, la modulation temporelle du malus
d'exposition). La collecte est faite par la tâche de fond de `main.py`, **jamais**
dans le chemin d'une requête utilisateur : `/air-quality/` sert `snapshot()`, qui
ne fait que lire.

Honnêteté sur la résolution : la maille CAMS fait ~11 km. Elle dit le niveau
régional et son évolution horaire, pas le contraste d'une rue à l'autre. Le
gradient fin est porté par l'exposition par arête, côté graphe. En cas de panne
de la source, le dernier instantané reste affiché (`stale`) mais l'intensité de
routage retombe à 0 : on ne fait pas dévier un trajet sur une donnée qu'on n'a
plus.
"""

import asyncio
import logging
import math
from datetime import datetime, timezone

from air_quality import config, providers
from graph.extent import graph_bbox

logger = logging.getLogger(__name__)


class _State:
    """Dernier instantané connu. Un seul par process."""

    def __init__(self):
        self.available = False
        self.features = []
        self.updated_at = None
        self.stale = False
        self.aqi_mean = None
        self.band = None
        self.label = None
        self.dominant = None
        self.forecast = []
        self.intensity = 0.0
        self.stations = []

    def as_dict(self):
        return {
            "available": self.available,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "stale": self.stale,
            "refresh_interval_s": config.REFRESH_INTERVAL_S,
            "attribution": config.ATTRIBUTION,
            "resolution_km": 11,
            "summary": {
                "aqi": self.aqi_mean,
                "band": self.band,
                "label": self.label,
                "dominant": self.dominant,
            },
            "forecast": list(self.forecast),
            "geojson": {"type": "FeatureCollection", "features": self.features},
            # Capteurs sol WAQI : calque distinct, échelle AQI US, mesures réelles.
            "stations": {"type": "FeatureCollection", "features": self.stations},
            "stations_attribution": config.ATTRIBUTION_WAQI,
        }


_state = _State()
_intensity_key = None


def snapshot() -> dict:
    """Instantané courant. Lecture pure, aucun appel réseau."""
    return _state.as_dict()


def routing_intensity() -> float:
    """Modulation temporelle du malus d'exposition ∈ [0, 1]. Lecture pure.

    0 quand l'air est bon (le cas courant) ou quand la source est indisponible :
    le terme d'air disparaît alors entièrement du coût des arêtes.
    """
    return _state.intensity


def grid_points(bbox) -> list[tuple[float, float]]:
    """Centres de cellules CAMS couvrant l'emprise, alignés sur le pas 0,1°.

    Plafonné à `MAX_GRID_POINTS` : au-delà, on tronque (couverture partielle,
    signalée) plutôt que de bombarder la source pour un profil démesuré.
    """
    if bbox is None:
        return []
    w, s, e, n = bbox
    step = config.GRID_STEP_DEG

    def centers(lo, hi):
        start = math.floor(lo / step)
        end = math.ceil(hi / step)
        return [round((start + i) * step, 4) for i in range(end - start + 1)]

    lons = centers(w, e)
    lats = centers(s, n)
    points = [(lat, lon) for lat in lats for lon in lons]

    if len(points) > config.MAX_GRID_POINTS:
        logger.warning(
            "[air] emprise trop large (%d cellules) : tronquée à %d, couverture partielle.",
            len(points), config.MAX_GRID_POINTS,
        )
        points = points[:config.MAX_GRID_POINTS]
    return points


def _dominant(current: dict) -> str | None:
    """Polluant dominant : sous-indice EAQI le plus élevé (le max fait l'indice)."""
    best = None
    for key, label in config.POLLUTANT_SUBINDICES.items():
        value = current.get(key)
        if value is None:
            continue
        if best is None or value > best[0]:
            best = (value, label)
    return best[1] if best else None


def _cell_feature(lat, lon, aqi, band, label, dominant) -> dict:
    """Polygon de 0,1° centré sur le point : la maille, visible, qui dit d'elle-même
    que ce n'est pas de la donnée rue."""
    h = config.GRID_STEP_DEG / 2
    ring = [
        [lon - h, lat - h], [lon + h, lat - h],
        [lon + h, lat + h], [lon - h, lat + h],
        [lon - h, lat - h],
    ]
    return {
        "type": "Feature",
        "geometry": {"type": "Polygon", "coordinates": [ring]},
        "properties": {
            "aqi": aqi,
            "band": band,
            "label": label,
            "dominant": dominant,
        },
    }


def _station_feature(s: dict) -> dict:
    """Point GeoJSON d'une station WAQI : la pastille cliquable, mesure réelle."""
    key, label, color = config.us_band_for(s["aqi"])
    return {
        "type": "Feature",
        "geometry": {"type": "Point", "coordinates": [s["lon"], s["lat"]]},
        "properties": {
            "aqi": s["aqi"],
            "us_band": key,
            "label": label,
            "color": color,
            "name": s["name"],
            "time": s["time"],
        },
    }


def _forecast(entry: dict) -> list[dict]:
    """Prévision EAQI échantillonnée du point le plus central."""
    hourly = entry.get("hourly") or {}
    times = hourly.get("time") or []
    values = hourly.get("european_aqi") or []
    out = []
    for i in range(0, min(len(times), len(values)), config.FORECAST_STEP):
        aqi = values[i]
        if aqi is None:
            continue
        band, label = config.band_for(aqi)
        out.append({"time": times[i], "aqi": aqi, "band": band, "label": label})
    return out


def _central_entry(points, raw):
    """Objet Open-Meteo du point le plus proche du centre de l'emprise."""
    if not points:
        return None
    clat = sum(lat for lat, _ in points) / len(points)
    clon = sum(lon for _, lon in points) / len(points)
    best_i, best_d = 0, math.inf
    for i, (lat, lon) in enumerate(points):
        d = (lat - clat) ** 2 + (lon - clon) ** 2
        if d < best_d:
            best_i, best_d = i, d
    return raw[best_i] if best_i < len(raw) else None


def _mark_stale_neutral(G):
    """Panne source : on garde l'affichage, mais l'intensité de routage retombe
    à 0. Renvoie True si le routage doit changer (l'air pesait jusqu'ici)."""
    global _intensity_key
    _state.stale = True
    _state.intensity = 0.0
    G.graph['_air_intensity'] = 0.0
    changed = _intensity_key not in (None, 0.0)
    _intensity_key = 0.0
    logger.warning("[air] source indisponible : dernier état conservé, routage neutre.")
    return changed


def _apply_cams(points, raw_result):
    """Applique le résultat CAMS à l'état. Renvoie l'intensité EAQI, ou None si la
    collecte a échoué ou ne renvoie rien (l'affichage cellules est alors conservé
    tel quel, marqué périmé par l'appelant)."""
    if isinstance(raw_result, Exception):
        logger.warning("[air] échec CAMS : %s", raw_result)
        return None
    if not points:
        return None

    features, aqis = [], []
    for (lat, lon), entry in zip(points, raw_result):
        current = (entry or {}).get("current") or {}
        aqi = current.get("european_aqi")
        if aqi is None:
            continue
        band, label = config.band_for(aqi)
        features.append(_cell_feature(lat, lon, aqi, band, label, _dominant(current)))
        aqis.append(aqi)

    if not aqis:
        return None

    aqi_mean = sum(aqis) / len(aqis)
    band, label = config.band_for(aqi_mean)
    central = _central_entry(points, raw_result)

    _state.features = features
    _state.aqi_mean = round(aqi_mean)
    _state.band = band
    _state.label = label
    _state.dominant = _dominant((central or {}).get("current") or {})
    _state.forecast = _forecast(central) if central else []
    return config.intensity_for(aqi_mean)


def _apply_stations(stations_result):
    """Applique le résultat WAQI à l'état. Renvoie l'intensité de la pire station,
    ou None si échec ou aucune station (le calque est alors conservé tel quel)."""
    if isinstance(stations_result, Exception):
        logger.warning("[air] échec stations WAQI : %s", stations_result)
        return None
    if not stations_result:
        return None

    _state.stations = [_station_feature(s) for s in stations_result]
    worst = max(s["aqi"] for s in stations_result)
    return config.station_intensity_for(worst)


async def refresh(G) -> bool:
    """Collecte la qualité de l'air (CAMS + stations WAQI) et met à jour l'état.

    Les deux sources sont interrogées en parallèle et indépendantes : l'une peut
    échouer sans l'autre. L'intensité de routage est le **max** des deux — « le
    pire du modèle et du capteur » — pour qu'un pic mesuré par une station fasse
    réagir les itinéraires même quand CAMS reste calme.

    Renvoie True si l'intensité (arrondie) a changé — le seul cas où le cache
    d'itinéraires doit être vidé.
    """
    global _intensity_key

    bbox = graph_bbox(G)
    points = grid_points(bbox)

    raw_result, stations_result = await asyncio.gather(
        providers.fetch(points),
        providers.fetch_stations(bbox),
        return_exceptions=True,
    )

    cams_intensity = _apply_cams(points, raw_result)
    station_intensity = _apply_stations(stations_result)

    # Rien de frais des deux côtés : on conserve le dernier affichage, routage
    # neutre (on ne fait pas dévier un trajet sur une donnée qu'on n'a plus).
    if cams_intensity is None and station_intensity is None:
        return _mark_stale_neutral(G)

    intensity = max(cams_intensity or 0.0, station_intensity or 0.0)

    _state.available = True
    # `stale` reflète la fraîcheur du résumé (piloté par CAMS) affiché dans le badge.
    _state.stale = cams_intensity is None
    _state.intensity = intensity
    _state.updated_at = datetime.now(timezone.utc)
    G.graph['_air_intensity'] = intensity

    key = round(intensity, 1)
    changed = key != _intensity_key
    _intensity_key = key

    logger.info(
        "[air] EAQI %s (int %.2f) + %d stations (pire int %.2f) → routage %.2f%s",
        _state.aqi_mean, cams_intensity or 0.0, len(_state.stations),
        station_intensity or 0.0, intensity, "" if changed else " (inchangé)",
    )
    return changed
