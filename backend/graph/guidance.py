import math
import threading
from collections import OrderedDict, namedtuple
from typing import Optional

from shapely.geometry import Point, LineString
from shapely.ops import substring

from graph.statistique import extract_route_geometry

SNAP_RADIUS_M = 30.0
OFF_ROUTE_THRESHOLD_M = 50.0
MANEUVER_TRIGGER_M = 15.0

M_PER_DEG_LAT = 110540.0
M_PER_DEG_LON = 111320.0
WINDOW_BACK_M = 30.0
WINDOW_FWD_M = 40.0
START_END_GRACE_M = 120.0
_ROUTE_LINE_CACHE_SIZE = 64


def haversine(lat1, lon1, lat2, lon2) -> float:
    R = 6_371_000
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlambda/2)**2
    return 2 * R * math.asin(math.sqrt(a))


def get_bearing(lat1, lon1, lat2, lon2) -> float:
    dl = math.radians(lon2 - lon1)
    x = math.cos(math.radians(lat2)) * math.sin(dl)
    y = (math.cos(math.radians(lat1)) * math.sin(math.radians(lat2))
         - math.sin(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.cos(dl))
    return (math.degrees(math.atan2(x, y)) + 360) % 360


def get_turn_type(bearing_before: float, bearing_after: float) -> str:
    delta = (bearing_after - bearing_before + 360) % 360
    if delta < 20 or delta > 340:   return "continue"
    if 20 <= delta < 70:            return "slight_right"
    if 70 <= delta < 110:           return "turn_right"
    if 110 <= delta < 170:          return "sharp_right"
    if 170 <= delta < 190:          return "u_turn"
    if 190 <= delta < 250:          return "sharp_left"
    if 250 <= delta < 290:          return "turn_left"
    return "slight_left"


def _get_street_name(G, route_nodes: list, i: int) -> Optional[str]:
    if i >= len(route_nodes) - 1:
        return None
    u, v = route_nodes[i], route_nodes[i + 1]
    edges = G.get_edge_data(u, v)
    if not edges:
        return None
    data = edges.get(0, next(iter(edges.values())))
    return data.get('name') or data.get('ref')


def _bearing_between(G, route_nodes: list, i: int, j: int) -> float:
    a = G.nodes[route_nodes[i]]
    b = G.nodes[route_nodes[j]]
    return get_bearing(a['y'], a['x'], b['y'], b['x'])


def _bearing_after(G, route_nodes: list, i: int) -> Optional[float]:
    if i >= len(route_nodes) - 1:
        return None
    return _bearing_between(G, route_nodes, i, i + 1)


def _detect_roundabout(G, route_nodes: list, i: int) -> Optional[tuple]:
    """
    Si on entre dans un rond-point à l'indice i,
    retourne (numéro de sortie, indice du nœud de sortie).
    """
    n = len(route_nodes)
    if i >= n - 1:
        return None

    u, v = route_nodes[i], route_nodes[i + 1]
    edges = G.get_edge_data(u, v)
    if not edges:
        return None

    edge_data = edges.get(0, next(iter(edges.values())))
    if edge_data.get('junction') != 'roundabout':
        return None

    exit_count = 0
    j = i + 1
    while j < n:
        u2, v2 = route_nodes[j - 1], route_nodes[j]
        e2 = G.get_edge_data(u2, v2)
        e2_data = e2.get(0, next(iter(e2.values()))) if e2 else {}

        if e2_data.get('junction') != 'roundabout':
            return (exit_count, j)

        node_edges = list(G.edges(v2, data=True))
        exits_here = sum(
            1 for _, w, d in node_edges
            if d.get('junction') != 'roundabout' and w not in route_nodes[i:j + 1]
        )
        if exits_here > 0:
            exit_count += 1

        j += 1

    return None


def _classify_turn(G, route_nodes: list, i: int) -> Optional[dict]:
    prev_name = _get_street_name(G, route_nodes, i - 1)
    next_name = _get_street_name(G, route_nodes, i)

    bearing_in  = _bearing_between(G, route_nodes, i - 1, i)
    bearing_out = _bearing_between(G, route_nodes, i, i + 1)
    delta = (bearing_out - bearing_in + 360) % 360

    if prev_name and next_name and prev_name == next_name and (delta < 25 or delta > 335):
        return None
    if delta < 15 or delta > 345:
        return None

    node = G.nodes[route_nodes[i]]
    return {
        "node_id": route_nodes[i],
        "lat": node['y'],
        "lon": node['x'],
        "turn_type": get_turn_type(bearing_in, bearing_out),
        "street_name": next_name,
        "bearing_after": bearing_out,
        "exit_number": None,
    }


def build_maneuvers(route_nodes: list, G) -> list[dict]:
    maneuvers = []
    n = len(route_nodes)
    i = 0

    while i < n:
        node_id = route_nodes[i]
        node = G.nodes[node_id]

        roundabout = _detect_roundabout(G, route_nodes, i)
        if roundabout is not None:
            exit_number, exit_idx = roundabout
            maneuvers.append({
                "node_id": node_id,
                "lat": node['y'],
                "lon": node['x'],
                "turn_type": "roundabout",
                "street_name": _get_street_name(G, route_nodes, exit_idx),
                "bearing_after": _bearing_after(G, route_nodes, exit_idx),
                "exit_number": exit_number,
            })
            i = exit_idx
            continue

        if i == 0:
            b_after = _bearing_after(G, route_nodes, 0)
            maneuvers.append({
                "node_id": node_id,
                "lat": node['y'],
                "lon": node['x'],
                "turn_type": "depart",
                "street_name": _get_street_name(G, route_nodes, 0),
                "bearing_after": b_after,
                "exit_number": None,
            })
        elif i == n - 1:
            maneuvers.append({
                "node_id": node_id,
                "lat": node['y'],
                "lon": node['x'],
                "turn_type": "arrive",
                "street_name": None,
                "bearing_after": None,
                "exit_number": None,
            })
        else:
            turn = _classify_turn(G, route_nodes, i)
            if turn is not None:
                maneuvers.append(turn)

        i += 1

    return maneuvers


RouteLine = namedtuple("RouteLine", ["line", "lat0", "lon0", "coslat0", "length_m", "exact"])


def _to_xy(lat, lon, rl: RouteLine):
    """(lat, lon) -> (X, Y) en mètres dans le repère équirectangulaire local."""
    x = (lon - rl.lon0) * M_PER_DEG_LON * rl.coslat0
    y = (lat - rl.lat0) * M_PER_DEG_LAT
    return x, y


def _to_latlon(x, y, rl: RouteLine):
    """(X, Y) mètres -> (lat, lon), inverse exact de _to_xy."""
    lat = rl.lat0 + y / M_PER_DEG_LAT
    lon = rl.lon0 + x / (M_PER_DEG_LON * rl.coslat0)
    return lat, lon


def _line_from_coords(coords, exact: bool) -> Optional[RouteLine]:
    """Construit une RouteLine (repère métrique local) depuis une liste de
    sommets `[lat, lon, ...]`. Retourne None si la géométrie dégénère
    (< 2 points distincts)."""
    if not coords or len(coords) < 2:
        return None
    lat0, lon0 = coords[0][0], coords[0][1]
    coslat0 = math.cos(math.radians(lat0)) or 1e-9
    ref = RouteLine(None, lat0, lon0, coslat0, 0.0, exact)

    xy = []
    for c in coords:
        p = _to_xy(c[0], c[1], ref)
        if not xy or p != xy[-1]:
            xy.append(p)
    if len(xy) < 2:
        return None

    line = LineString(xy)
    return RouteLine(line, lat0, lon0, coslat0, line.length, exact)


def _build_route_line(route_nodes: list, G) -> Optional[RouteLine]:
    """Reconstruit la polyligne depuis route_nodes (repli, sans les stubs).

    Réutilise `extract_route_geometry` (la même géométrie que le `path` affiché).
    Retourne None si la géométrie est inconstructible ou dégénère."""
    try:
        coords = extract_route_geometry(G, route_nodes)
    except (KeyError, TypeError, IndexError):
        return None
    return _line_from_coords(coords, exact=False)


def _path_coords(path):
    """Normalise le `path` transmis par le client en liste de (lat, lon).
    Retourne None si un élément est inexploitable."""
    out = []
    for p in path or []:
        try:
            out.append((float(p[0]), float(p[1])))
        except (TypeError, ValueError, IndexError):
            return None
    return out


class _RouteLineCache:
    """Cache LRU thread-safe des polylignes de trajet, clé = tuple(route_nodes).

    Sans deepcopy (les RouteLine sont immuables) et **jamais clé-é sur G** : les
    coordonnées des nœuds ne changent pas quand `main.py` remplace le graphe
    toutes les 5 min pour le trafic, donc la géométrie reste valide."""

    def __init__(self, maxsize):
        self._maxsize = maxsize
        self._store = OrderedDict()
        self._lock = threading.Lock()

    def _put(self, key, rl):
        with self._lock:
            self._store[key] = rl
            self._store.move_to_end(key)
            while len(self._store) > self._maxsize:
                self._store.popitem(last=False)

    def get(self, route_nodes: list, G, path=None) -> Optional[RouteLine]:
        key = tuple(route_nodes)
        with self._lock:
            cached = self._store[key] if key in self._store else _MISSING
            if cached is not _MISSING:
                self._store.move_to_end(key)

        already_exact = (cached is not _MISSING and cached is not None
                         and cached.exact)
        if path is not None and not already_exact:
            rl = _line_from_coords(_path_coords(path), exact=True)
            if rl is not None:
                self._put(key, rl)
                return rl

        if cached is not _MISSING:
            return cached
        rl = _build_route_line(route_nodes, G)
        self._put(key, rl)
        return rl


_MISSING = object()
_route_line_cache = _RouteLineCache(_ROUTE_LINE_CACHE_SIZE)


def _get_route_line(route_nodes: list, G, path=None) -> Optional[RouteLine]:
    return _route_line_cache.get(route_nodes, G, path)


def _project_on_line(rl: RouteLine, lat, lon, lo=None, hi=None):
    """Projette (lat, lon) sur la polyligne, ou sur la sous-ligne [lo, hi]
    (mètres) si fournie. Retourne (snapped_lat, snapped_lon, dist_m, d_along_m),
    où d_along_m est mesuré le long de la polyligne COMPLÈTE."""
    px, py = _to_xy(lat, lon, rl)
    pt = Point(px, py)
    line, L = rl.line, rl.length_m

    if lo is not None and hi is not None:
        a = max(0.0, min(lo, hi))
        b = min(L, max(lo, hi))
        seg = substring(line, a, b) if b - a > 1e-6 else None
        if seg is None or seg.geom_type != 'LineString' or seg.length <= 0:
            base = line.interpolate(a)
            slat, slon = _to_latlon(base.x, base.y, rl)
            return slat, slon, pt.distance(base), a
        d_along = a + seg.project(pt)
    else:
        d_along = line.project(pt)

    d_along = max(0.0, min(d_along, L))
    snapped = line.interpolate(d_along)
    slat, slon = _to_latlon(snapped.x, snapped.y, rl)
    return slat, slon, pt.distance(snapped), d_along


def _progress_window(rl: RouteLine, maneuvers: list, step_idx: int):
    """Fenêtre [lo, hi] (mètres le long de la ligne) couvrant le tronçon courant.

    Bornée par le maneuver précédent (déjà franchi) et le maneuver visé, élargie
    des marges. Restreindre la recherche au tronçon courant garantit une
    progression monotone et évite d'accrocher le mauvais brin sur les
    allers-retours / rues empruntées deux fois."""
    n = len(maneuvers)
    if n == 0:
        return None, None
    step_idx = max(0, min(step_idx, n - 1))

    def d_of(i):
        if i < 0:
            return 0.0
        if i >= n:
            return rl.length_m
        m = maneuvers[i]
        return _project_on_line(rl, m['lat'], m['lon'])[3]

    lo = min(d_of(step_idx - 1), d_of(step_idx))
    hi = max(d_of(step_idx - 1), d_of(step_idx))
    if hi - lo < 1.0:
        hi = max(hi, d_of(step_idx + 1))
    return lo - WINDOW_BACK_M, hi + WINDOW_FWD_M


def _snap_position(user_lat, user_lon, route_nodes: list, maneuvers: list,
                   step_idx: int, G, path=None):
    """Recale la position sur la polyligne. Retourne (lat, lon, dist_m).

    Cherche d'abord dans la fenêtre du tronçon courant ; si la position en sort
    (saut GPS, avance), ré-acquiert sur la polyligne complète."""
    rl = _get_route_line(route_nodes, G, path)
    if rl is None:
        idx, dist = snap_to_route(user_lat, user_lon, route_nodes, G)
        node = G.nodes[route_nodes[idx]]
        return node['y'], node['x'], dist

    lo, hi = _progress_window(rl, maneuvers, step_idx)
    slat, slon, dist, _ = _project_on_line(rl, user_lat, user_lon, lo, hi)
    if dist > OFF_ROUTE_THRESHOLD_M:
        slat, slon, dist, _ = _project_on_line(rl, user_lat, user_lon)
    return slat, slon, dist


def snap_to_route(user_lat, user_lon, route_nodes: list, G) -> tuple[int, float]:
    """Accroche au nœud du trajet le plus proche. Repli quand la polyligne n'est
    pas constructible (voir `_snap_position` pour la voie principale)."""
    best_idx, best_dist = 0, float('inf')
    for i, node_id in enumerate(route_nodes):
        node = G.nodes[node_id]
        d = haversine(user_lat, user_lon, node['y'], node['x'])
        if d < best_dist:
            best_dist, best_idx = d, i
    return best_idx, best_dist


def navigation_update(
    user_lat: float,
    user_lon: float,
    route_nodes: list,
    maneuvers: list,
    current_step_idx: int,
    G,
    path=None,
) -> dict:
    if not route_nodes or not maneuvers:
        return {
            "status": "off_route",
            "snap_distance_m": 0.0,
            "snapped_lat": user_lat,
            "snapped_lon": user_lon,
            "current_step_idx": current_step_idx,
            "distance_to_next_m": None,
            "current_maneuver": None,
            "next_maneuver": None,
            "recalculate": True,
        }

    n_man = len(maneuvers)
    current_step_idx = max(0, min(current_step_idx, n_man - 1))

    snapped_lat, snapped_lon, snap_dist = _snap_position(
        user_lat, user_lon, route_nodes, maneuvers, current_step_idx, G, path
    )

    threshold = OFF_ROUTE_THRESHOLD_M
    if current_step_idx == 0 or current_step_idx == n_man - 1:
        threshold += START_END_GRACE_M

    if snap_dist > threshold:
        return {
            "status": "off_route",
            "snap_distance_m": round(snap_dist, 1),
            "snapped_lat": snapped_lat,
            "snapped_lon": snapped_lon,
            "current_step_idx": current_step_idx,
            "distance_to_next_m": None,
            "current_maneuver": None,
            "next_maneuver": None,
            "recalculate": True,
        }

    while current_step_idx < n_man - 1:
        m = maneuvers[current_step_idx]
        d = haversine(user_lat, user_lon, m['lat'], m['lon'])
        if d < MANEUVER_TRIGGER_M:
            current_step_idx += 1
        else:
            break

    current_maneuver = maneuvers[current_step_idx]
    dist_to_next = haversine(user_lat, user_lon, current_maneuver['lat'], current_maneuver['lon'])

    if current_step_idx == n_man - 1 and dist_to_next < MANEUVER_TRIGGER_M:
        return {
            "status": "arrived",
            "snap_distance_m": round(snap_dist, 1),
            "snapped_lat": snapped_lat,
            "snapped_lon": snapped_lon,
            "current_step_idx": current_step_idx,
            "distance_to_next_m": 0,
            "current_maneuver": current_maneuver,
            "next_maneuver": None,
            "recalculate": False,
        }

    next_maneuver = maneuvers[current_step_idx + 1] if current_step_idx + 1 < n_man else None

    return {
        "status": "on_route",
        "snap_distance_m": round(snap_dist, 1),
        "snapped_lat": snapped_lat,
        "snapped_lon": snapped_lon,
        "current_step_idx": current_step_idx,
        "distance_to_next_m": round(dist_to_next),
        "current_maneuver": current_maneuver,
        "next_maneuver": next_maneuver,
        "recalculate": False,
    }
