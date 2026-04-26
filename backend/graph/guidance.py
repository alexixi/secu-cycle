import math
from typing import Optional

SNAP_RADIUS_M = 30.0
OFF_ROUTE_THRESHOLD_M = 50.0
MANEUVER_TRIGGER_M = 15.0


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
            exit_count += 1
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


def snap_to_route(user_lat, user_lon, route_nodes: list, G) -> tuple[int, float]:
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
    G
) -> dict:
    snap_idx, snap_dist = snap_to_route(user_lat, user_lon, route_nodes, G)
    snapped_node = G.nodes[route_nodes[snap_idx]]

    if snap_dist > OFF_ROUTE_THRESHOLD_M:
        return {
            "status": "off_route",
            "snap_distance_m": round(snap_dist, 1),
            "snapped_lat": snapped_node['y'],
            "snapped_lon": snapped_node['x'],
            "current_step_idx": current_step_idx,
            "distance_to_next_m": None,
            "current_maneuver": None,
            "next_maneuver": None,
            "recalculate": True,
        }

    while current_step_idx < len(maneuvers) - 1:
        m = maneuvers[current_step_idx]
        d = haversine(user_lat, user_lon, m['lat'], m['lon'])
        if d < MANEUVER_TRIGGER_M:
            current_step_idx += 1
        else:
            break

    current_maneuver = maneuvers[current_step_idx]
    dist_to_next = haversine(user_lat, user_lon, current_maneuver['lat'], current_maneuver['lon'])
    next_maneuver = maneuvers[current_step_idx + 1] if current_step_idx + 1 < len(maneuvers) else None

    return {
        "status": "on_route",
        "snap_distance_m": round(snap_dist, 1),
        "snapped_lat": snapped_node['y'],
        "snapped_lon": snapped_node['x'],
        "current_step_idx": current_step_idx,
        "distance_to_next_m": round(dist_to_next),
        "current_maneuver": current_maneuver,
        "next_maneuver": next_maneuver,
        "recalculate": False,
    }