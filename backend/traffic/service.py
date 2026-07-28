"""État du trafic : une collecte, deux usages.

Le même instantané sert la carte (couche GeoJSON) et le calcul d'itinéraire
(drapeau `traffic_jam` sur les arêtes). C'est le point de l'harmonisation :
avant, deux sources différentes alimentaient chacune un seul des deux, si bien
que l'utilisateur voyait des points sans rapport avec ce que le calcul évitait.

La collecte est faite par la tâche de fond de `main.py`, **jamais** dans le
chemin d'une requête utilisateur : `/traffic/` sert `snapshot()`, qui ne fait
que lire.
"""

import asyncio
import logging
import math
from datetime import datetime, timezone

import numpy as np

from graph import routing
from graph.extent import graph_bbox, overlaps
from traffic import config, providers

logger = logging.getLogger(__name__)

# Distance (m) au-delà de laquelle un point du tronçon n'est plus rattaché à un
# nœud du graphe : sans ce garde-fou, un tronçon hors emprise s'accrocherait au
# nœud le plus proche, aussi loin soit-il.
MAX_MATCH_DISTANCE_M = 50.0

# Pas d'échantillonnage le long d'un tronçon. Le rattachement exige que les
# **deux** extrémités d'une arête soient reconnues congestionnées ; il faut donc
# semer assez de points pour ne pas rater de nœud intermédiaire.
SAMPLE_STEP_M = 20.0

EARTH_RADIUS_M = 6_371_000.0


class _State:
    """Dernier instantané connu. Un seul par process."""

    def __init__(self):
        self.available = False
        self.features = []
        self.updated_at = None
        self.stale = False
        self.providers = []
        self.congested_edges = 0
        self.segments = 0

    def as_dict(self):
        return {
            "available": self.available,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "stale": self.stale,
            "providers": list(self.providers),
            "refresh_interval_s": config.REFRESH_INTERVAL_S,
            "counts": {"segments": self.segments, "congested_edges": self.congested_edges},
            "geojson": {"type": "FeatureCollection", "features": self.features},
        }


_state = _State()
_congested_key = None


def snapshot() -> dict:
    """Instantané courant. Lecture pure, aucun appel réseau."""
    return _state.as_dict()


def providers_for(bbox) -> list[str]:
    """Sources dont l'emprise croise celle du graphe chargé.

    Le critère est géographique : une source de portée métropolitaine ne doit
    pas être interrogée pour un graphe situé à l'autre bout du pays, même s'ils
    partagent un code pays.
    """
    if bbox is None:
        return []
    return [
        name
        for name, spec in config.PROVIDERS.items()
        if overlaps(bbox, spec["coverage"])
    ]


def _densify(coordinates):
    """Sème des points intermédiaires pour qu'aucun trou ne dépasse SAMPLE_STEP_M."""
    points = []
    for (lon1, lat1), (lon2, lat2) in zip(coordinates, coordinates[1:]):
        points.append((lon1, lat1))
        span = _distance_m(lon1, lat1, lon2, lat2)
        for i in range(1, int(span // SAMPLE_STEP_M)):
            t = i * SAMPLE_STEP_M / span
            points.append((lon1 + (lon2 - lon1) * t, lat1 + (lat2 - lat1) * t))
    points.append(tuple(coordinates[-1]))
    return points


def _distance_m(lon1, lat1, lon2, lat2):
    mean_lat = math.radians((lat1 + lat2) / 2)
    dx = math.radians(lon2 - lon1) * math.cos(mean_lat)
    dy = math.radians(lat2 - lat1)
    return math.hypot(dx, dy) * EARTH_RADIUS_M


def _congested_nodes(G, segments):
    """Nœuds du graphe congestionnés, chacun associé à son poids de sévérité.

    Un même nœud peut être atteint par plusieurs tronçons ; on retient le plus
    sévère (poids le plus élevé).
    """
    points, weights = [], []
    for segment in segments:
        weight = config.CONGESTION_WEIGHT.get(segment["level"], 0.0)
        if weight > 0:
            sampled = _densify(segment["coordinates"])
            points.extend(sampled)
            weights.extend([weight] * len(sampled))

    if not points:
        return {}

    if not G.graph.get("_node_index_ready"):
        routing.precompute_nearest_node_index(G)

    coords = np.deg2rad([[lat, lon] for lon, lat in points])
    distances, positions = G.graph["_node_tree"].query(coords, k=1)

    node_ids = G.graph["_node_ids"]
    limit = MAX_MATCH_DISTANCE_M / EARTH_RADIUS_M
    node_weight = {}
    for pos, dist, weight in zip(positions, distances, weights):
        if dist[0] > limit:
            continue
        node = int(node_ids[pos[0]])
        if weight > node_weight.get(node, 0.0):
            node_weight[node] = weight
    return node_weight


def _apply_to_graph(G, segments):
    """Pose `traffic_factor` (et `traffic_jam`) sur les arêtes.

    Une arête n'est pénalisée que si ses deux extrémités sont congestionnées et
    qu'elle n'est pas séparée de la chaussée. Son facteur est le plus faible des
    deux extrémités : un segment à cheval sur du rouge et de l'orange est traité
    comme de l'orange, par prudence. Renvoie (nb d'arêtes, empreinte).
    """
    congested = _congested_nodes(G, segments)

    marked = set()
    for u, v, k, data in G.edges(keys=True, data=True):
        wu, wv = congested.get(u, 0.0), congested.get(v, 0.0)
        factor = min(wu, wv) if (wu and wv and not routing.is_separated_from_traffic(data)) else 0.0
        data["traffic_factor"] = factor
        data["traffic_jam"] = factor > 0.0
        if factor:
            marked.add((u, v, k, factor))

    return len(marked), frozenset(marked)


def _feature(segment):
    return {
        "type": "Feature",
        "id": segment["id"],
        "geometry": {"type": "LineString", "coordinates": segment["coordinates"]},
        "properties": {
            "level": segment["level"],
            "etat": segment["etat"],
            "commune": segment["commune"],
        },
    }


async def refresh(G) -> bool:
    """Collecte le trafic et l'applique au graphe.

    Renvoie True si l'ensemble des arêtes congestionnées a changé — c'est le
    seul cas où le cache d'itinéraires doit être vidé. Sans ce test, il l'était
    toutes les 5 minutes, y compris quand rien ne bougeait.
    """
    global _congested_key

    bbox = graph_bbox(G)
    names = providers_for(bbox)
    if not names:
        if _state.available or _state.updated_at is None:
            logger.info("[trafic] aucune source pour ce profil : couche désactivée.")
        _state.available = False
        _state.features = []
        _state.providers = []
        _state.segments = 0
        _state.congested_edges = 0
        _state.updated_at = datetime.now(timezone.utc)
        return False

    results = await asyncio.gather(
        *(providers.fetch(config.PROVIDERS[name], bbox) for name in names),
        return_exceptions=True,
    )

    segments, ok_providers = [], []
    for name, result in zip(names, results):
        if isinstance(result, Exception):
            logger.warning("[trafic] %s en échec : %s", name, result)
        else:
            segments.extend(result)
            ok_providers.append(name)

    if not ok_providers:
        _state.stale = True
        logger.warning("[trafic] toutes les sources en échec, dernier état conservé.")
        return False

    edge_count, key = _apply_to_graph(G, segments)

    _state.available = bool(segments)
    _state.features = [_feature(s) for s in segments]
    _state.providers = ok_providers
    _state.segments = len(segments)
    _state.congested_edges = edge_count
    _state.updated_at = datetime.now(timezone.utc)
    _state.stale = False

    changed = key != _congested_key
    _congested_key = key

    logger.info(
        "[trafic] %d tronçons, dont %d congestionnés → %d arêtes pénalisées%s",
        len(segments),
        sum(1 for s in segments if s["level"] in config.CONGESTED_LEVELS),
        edge_count,
        "" if changed else " (inchangé)",
    )
    return changed
