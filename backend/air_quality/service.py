"""État de la qualité de l'air : une collecte, deux usages.

Le même instantané sert la carte (maille GeoJSON colorée par l'EAQI) et le calcul
d'itinéraire (`G.graph['_air_zone_intensity']`, la modulation temporelle du malus
d'exposition, lue par zone). La collecte est faite par la tâche de fond de
`main.py`, **jamais** dans le chemin d'une requête utilisateur : `/air-quality/`
sert `snapshot()`, qui ne fait que lire.

Honnêteté sur la résolution : la maille CAMS fait ~11 km. Elle dit le niveau
régional et son évolution horaire, pas le contraste d'une rue à l'autre. Le
gradient fin est porté par l'exposition par arête, côté graphe. En cas de panne
de la source, le dernier instantané reste affiché (`stale`) mais l'intensité de
routage retombe à 0 : on ne fait pas dévier un trajet sur une donnée qu'on n'a
plus.

Tout est raisonné **par zone** (cf. `graph.extent.graph_zones`) : un profil
multi-villes n'a pas une qualité de l'air mais plusieurs, et une moyenne entre
Bordeaux et Tournai ne décrit ni l'une ni l'autre. Chaque zone a son résumé, sa
prévision et son intensité de routage ; le routage applique celle de la zone d'où
part le trajet.
"""

import asyncio
import logging
import math
from datetime import datetime, timezone

from air_quality import config, providers
from graph.extent import contains, graph_zones
from i18n import DEFAULT_LOCALE, t

logger = logging.getLogger(__name__)

# Un degré de latitude, en kilomètres : de quoi annoncer au client la taille
# réelle de la maille servie, qui n'est plus forcément le pas natif.
KM_PER_DEGREE = 111


class _State:
    """Dernier instantané connu. Un seul par process."""

    def __init__(self):
        self.available = False
        self.features = []
        self.updated_at = None
        self.stale = False
        self.aqi_mean = None
        self.band = None
        self.dominant = None
        self.forecast = []
        self.intensity = 0.0
        self.stations = []
        # Côté de la maille servie. Le pas natif vaut ~11 km ; il s'élargit si le
        # profil couvre trop de terrain pour le budget de points.
        self.resolution_km = round(config.GRID_STEP_DEG * KM_PER_DEGREE)
        # Un résumé par zone du profil ; le résumé global n'en reste que la
        # moyenne, conservée pour les clients qui ne lisent pas `zones`.
        self.zones = []

    def as_dict(self, locale=DEFAULT_LOCALE):
        bande = lambda cle: t(f"air.band.{cle}", locale) if cle else None
        polluant = lambda cle: t(f"air.pollutant.{cle}", locale) if cle else None
        return {
            "available": self.available,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "stale": self.stale,
            "refresh_interval_s": config.REFRESH_INTERVAL_S,
            "attribution": config.ATTRIBUTION,
            "resolution_km": self.resolution_km,
            "summary": {
                "aqi": self.aqi_mean,
                "band": self.band,
                "label": bande(self.band),
                "dominant": polluant(self.dominant),
            },
            "forecast": [{**e, "label": bande(e["band"])} for e in self.forecast],
            "zones": [
                {
                    "bbox": list(zone["bbox"]),
                    "summary": {
                        "aqi": zone["aqi"],
                        "band": zone["band"],
                        "label": bande(zone["band"]),
                        "dominant": polluant(zone["dominant"]),
                    },
                    "forecast": [{**e, "label": bande(e["band"])} for e in zone["forecast"]],
                }
                for zone in self.zones
            ],
            "geojson": {"type": "FeatureCollection", "features": [
                {**f, "properties": {**f["properties"],
                                     "label": bande(f["properties"]["band"]),
                                     "dominant": polluant(f["properties"]["dominant"])}}
                for f in self.features
            ]},
            # Capteurs sol WAQI : calque distinct, échelle AQI US, mesures réelles.
            "stations": {"type": "FeatureCollection", "features": [
                {**f, "properties": {**f["properties"],
                                     "label": t(f"air.us_band.{f['properties']['us_band']}", locale)}}
                for f in self.stations
            ]},
            "stations_attribution": config.ATTRIBUTION_WAQI,
        }


_state = _State()
_intensity_key = None


def snapshot(locale: str = DEFAULT_LOCALE) -> dict:
    """Instantané courant, rendu dans `locale`. Lecture pure, aucun appel réseau."""
    return _state.as_dict(locale)


def _mesh(zones, step) -> tuple[list[tuple[float, float]], list[int]]:
    """Cellules d'une grille de pas `step` couvrant toutes les zones.

    La grille est alignée sur les multiples de `step` depuis le méridien et
    l'équateur, donc commune à toutes les zones : deux zones qui se recoupent
    tombent exactement sur les mêmes cellules, et le dédoublonnage suffit.
    """
    points, zone_index, seen = [], [], set()
    for index, (w, s, e, n) in enumerate(zones):
        for iy in range(math.floor(s / step), math.ceil(n / step) + 1):
            for ix in range(math.floor(w / step), math.ceil(e / step) + 1):
                point = (round(iy * step, 4), round(ix * step, 4))
                if point in seen:
                    continue
                seen.add(point)
                points.append(point)
                zone_index.append(index)
    return points, zone_index


def grid_points(zones) -> tuple[list[tuple[float, float]], list[int], float]:
    """Centres des cellules couvrant les zones, et le pas de la maille retenue.

    Renvoie les points, l'index de la zone dont chacun relève, et le pas — le
    tracé de la cellule en dépend, une maille élargie doit être dessinée élargie.

    Une grille par zone, et non une grille sur l'enveloppe : sur « Bordeaux +
    Tournai », l'enveloppe fait des milliers de cellules dont presque aucune n'est
    couverte.

    Quand la maille native dépasse `MAX_GRID_POINTS`, on **élargit le pas** (un
    multiple entier de 0,1°) jusqu'à tenir dans le budget, au lieu de retirer des
    cellules. Retirer des cellules laisse des trous, et un trou sur la carte ne se
    lit pas comme « moins de résolution » mais comme « pas de donnée » : sur
    « Bordeaux + Tournai », l'échantillonnage à pas régulier tombait sur une
    colonne de la grille sur deux. Une maille grossière est honnête ; une maille
    trouée est illisible.
    """
    if not zones:
        return [], [], config.GRID_STEP_DEG

    factor = 1
    step = config.GRID_STEP_DEG
    points, zone_index = _mesh(zones, step)

    while len(points) > config.MAX_GRID_POINTS:
        wider_step = round(config.GRID_STEP_DEG * (factor + 1), 4)
        wider, wider_index = _mesh(zones, wider_step)
        if len(wider) >= len(points):
            logger.warning(
                "[air] %d cellules pour %d zone(s) au pas %.1f° : au-delà du "
                "budget de %d, sans pouvoir élargir davantage.",
                len(points), len(zones), step, config.MAX_GRID_POINTS,
            )
            break
        factor += 1
        step, points, zone_index = wider_step, wider, wider_index

    if factor > 1:
        logger.info(
            "[air] maille élargie à %.1f° (%d cellules pour %d zone(s)) : le pas "
            "natif dépassait le budget de %d points.",
            step, len(points), len(zones), config.MAX_GRID_POINTS,
        )
    return points, zone_index, step


def _dominant(current: dict) -> str | None:
    """Polluant dominant : sous-indice EAQI le plus élevé (le max fait l'indice)."""
    best = None
    for key in config.POLLUTANT_SUBINDICES:
        value = current.get(key)
        if value is None:
            continue
        if best is None or value > best[0]:
            best = (value, key)
    return best[1] if best else None


def _cell_feature(lat, lon, step, aqi, band, dominant) -> dict:
    """Polygon d'un pas de maille centré sur le point : la maille, visible, qui dit
    d'elle-même que ce n'est pas de la donnée rue.

    Le côté suit le pas réellement échantillonné, pas le pas natif : sur une
    maille élargie, des carrés de 0,1° laisseraient entre eux des bandes vides qui
    se liraient comme une absence de donnée.
    """
    h = step / 2
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
            "dominant": dominant,
        },
    }


def _station_feature(s: dict) -> dict:
    """Point GeoJSON d'une station WAQI : la pastille cliquable, mesure réelle."""
    key, color = config.us_band_for(s["aqi"])
    return {
        "type": "Feature",
        "geometry": {"type": "Point", "coordinates": [s["lon"], s["lat"]]},
        "properties": {
            "aqi": s["aqi"],
            "us_band": key,
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
        out.append({"time": times[i], "aqi": aqi, "band": config.band_for(aqi)})
    return out


def _central_entry(points, raw, members):
    """Objet Open-Meteo du point le plus central parmi `members` (indices)."""
    if not members:
        return None
    clat = sum(points[i][0] for i in members) / len(members)
    clon = sum(points[i][1] for i in members) / len(members)
    best_i, best_d = members[0], math.inf
    for i in members:
        lat, lon = points[i]
        d = (lat - clat) ** 2 + (lon - clon) ** 2
        if d < best_d:
            best_i, best_d = i, d
    return raw[best_i] if best_i < len(raw) else None


def _mark_stale_neutral(G, zones):
    """Panne source : on garde l'affichage, mais l'intensité de routage retombe
    à 0, sur toutes les zones. Renvoie True si le routage doit changer (l'air
    pesait jusqu'ici)."""
    global _intensity_key
    _state.stale = True
    _state.intensity = 0.0
    for zone in _state.zones:
        zone["intensity"] = 0.0

    key = (0.0,) * len(zones)
    G.graph['_air_intensity'] = 0.0
    G.graph['_air_zone_intensity'] = list(key)
    changed = _intensity_key is not None and _intensity_key != key
    _intensity_key = key
    logger.warning("[air] source indisponible : dernier état conservé, routage neutre.")
    return changed


def _apply_cams(zones, points, zone_index, step, raw_result):
    """Applique le résultat CAMS à l'état. Renvoie la liste des intensités EAQI
    **par zone**, ou None si la collecte a échoué ou ne renvoie rien (l'affichage
    cellules est alors conservé tel quel, marqué périmé par l'appelant)."""
    if isinstance(raw_result, Exception):
        logger.warning("[air] échec CAMS : %s", raw_result)
        return None
    if not points:
        return None

    features = []
    aqis_by_zone = [[] for _ in zones]
    members_by_zone = [[] for _ in zones]
    for i, ((lat, lon), index) in enumerate(zip(points, zone_index)):
        members_by_zone[index].append(i)
        entry = raw_result[i] if i < len(raw_result) else None
        current = (entry or {}).get("current") or {}
        aqi = current.get("european_aqi")
        if aqi is None:
            continue
        features.append(
            _cell_feature(lat, lon, step, aqi, config.band_for(aqi), _dominant(current))
        )
        aqis_by_zone[index].append(aqi)

    all_aqis = [aqi for group in aqis_by_zone for aqi in group]
    if not all_aqis:
        return None

    zone_states, intensities = [], []
    for index, zone in enumerate(zones):
        aqis = aqis_by_zone[index]
        mean = sum(aqis) / len(aqis) if aqis else None
        band = config.band_for(mean) if mean is not None else None
        central = _central_entry(points, raw_result, members_by_zone[index])
        intensity = config.intensity_for(mean)
        zone_states.append({
            "bbox": zone,
            "aqi": round(mean) if mean is not None else None,
            "band": band,
            "dominant": _dominant((central or {}).get("current") or {}),
            "forecast": _forecast(central) if central else [],
            "intensity": intensity,
        })
        intensities.append(intensity)

    aqi_mean = sum(all_aqis) / len(all_aqis)
    band = config.band_for(aqi_mean)
    main = zone_states[0] if zone_states else {}

    _state.features = features
    _state.resolution_km = round(step * KM_PER_DEGREE)
    _state.zones = zone_states
    _state.aqi_mean = round(aqi_mean)
    _state.band = band
    # Résumé global : l'indice est bien la moyenne de la maille, mais le polluant
    # dominant et la prévision sont ceux de la zone principale — entrelacer les
    # prévisions de deux villes éloignées ne voudrait rien dire.
    _state.dominant = main.get("dominant")
    _state.forecast = main.get("forecast") or []
    return intensities


def _apply_stations(zones, stations_result):
    """Applique le résultat WAQI à l'état. Renvoie, **par zone**, l'intensité de
    sa pire station, ou None si échec ou aucune station (le calque est alors
    conservé tel quel)."""
    if isinstance(stations_result, Exception):
        logger.warning("[air] échec stations WAQI : %s", stations_result)
        return None
    if not stations_result:
        return None

    _state.stations = [_station_feature(s) for s in stations_result]

    worst = [None] * len(zones)
    for station in stations_result:
        for index, zone in enumerate(zones):
            if not contains(zone, station["lat"], station["lon"]):
                continue
            if worst[index] is None or station["aqi"] > worst[index]:
                worst[index] = station["aqi"]
    return [config.station_intensity_for(aqi) for aqi in worst]


async def refresh(G) -> bool:
    """Collecte la qualité de l'air (CAMS + stations WAQI) et met à jour l'état.

    Les deux sources sont interrogées en parallèle et indépendantes : l'une peut
    échouer sans l'autre. L'intensité de routage d'une zone est le **max** des
    deux — « le pire du modèle et du capteur » — pour qu'un pic mesuré par une
    station fasse réagir les itinéraires même quand CAMS reste calme.

    L'intensité est écrite **par zone** sur `G.graph['_air_zone_intensity']`,
    alignée sur `graph_zones(G)` : un pic à Tournai ne doit pas pénaliser un
    trajet bordelais. `_air_intensity` reste le max de toutes, comme repli.

    Renvoie True si l'une des intensités (arrondies) a changé — le seul cas où le
    cache d'itinéraires doit être vidé.
    """
    global _intensity_key

    zones = graph_zones(G)
    points, zone_index, step = grid_points(zones)

    raw_result, stations_result = await asyncio.gather(
        providers.fetch(points),
        providers.fetch_stations(zones),
        return_exceptions=True,
    )

    cams = _apply_cams(zones, points, zone_index, step, raw_result)
    stations = _apply_stations(zones, stations_result)

    # Rien de frais des deux côtés : on conserve le dernier affichage, routage
    # neutre (on ne fait pas dévier un trajet sur une donnée qu'on n'a plus).
    if cams is None and stations is None:
        return _mark_stale_neutral(G, zones)

    neutral = [0.0] * len(zones)
    per_zone = [max(c, s) for c, s in zip(cams or neutral, stations or neutral)]

    # `_state.zones` vient de CAMS ; si seules les stations ont répondu, il date
    # du cycle précédent et n'est réutilisable que s'il décrit les mêmes zones.
    if len(_state.zones) == len(per_zone):
        for zone_state, value in zip(_state.zones, per_zone):
            zone_state["intensity"] = value

    intensity = max(per_zone, default=0.0)

    _state.available = True
    # `stale` reflète la fraîcheur du résumé (piloté par CAMS) affiché dans le badge.
    _state.stale = cams is None
    _state.intensity = intensity
    _state.updated_at = datetime.now(timezone.utc)
    G.graph['_air_intensity'] = intensity
    G.graph['_air_zone_intensity'] = per_zone

    key = tuple(round(value, 1) for value in per_zone)
    changed = key != _intensity_key
    _intensity_key = key

    logger.info(
        "[air] EAQI %s sur %d zone(s) + %d stations → routage %s%s",
        _state.aqi_mean, len(zones), len(_state.stations),
        ", ".join(f"{value:.2f}" for value in per_zone) or "0.00",
        "" if changed else " (inchangé)",
    )
    return changed
