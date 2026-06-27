import osmnx as ox
import networkx as nx
import numpy as np
from sklearn.neighbors import BallTree
from graph.config import *
from graph.statistique import calculate_route_elevation, calculate_exact_travel_time, calculate_route_distance, get_route_safety_score, extract_route_geometry, get_bordeaux_lighting_condition, calculate_infra_stats
from graph.route_cache import route_cache

def _get_speed_score(vmax):
    if vmax <= 20: return 10
    elif vmax <= 30: return 8
    elif vmax <= 50: return 3
    else: return 1

def _parse_maxspeed(vmax, h_type):
    if vmax and str(vmax).lower() not in ['unknown', 'none', 'nan', '']:
        if isinstance(vmax, list): vmax = vmax[0]
        try: return int(str(vmax).split()[0])
        except: pass
    return 30

def _get_lit_score(lit, h_type):
    if lit == 'yes': return 10.0
    elif lit == 'no': return 0.0
    return 7.0

def _first(value, default=None):
    """Normalise un tag OSM potentiellement sous forme de liste."""
    if isinstance(value, list):
        return value[0] if value else default
    return value if value is not None else default

def _edge_roughness(data):
    """Rugosité [0, 1] d'un segment, dérivée de surface / smoothness / tracktype.

    On retient le signal le plus pessimiste disponible ; en l'absence de toute
    information, on renvoie DEFAULT_ROUGHNESS (prudence légère).
    """
    signals = []
    surface = _first(data.get('surface'))
    if surface is not None and surface in SURFACE_ROUGHNESS:
        signals.append(SURFACE_ROUGHNESS[surface])
    smooth = _first(data.get('smoothness'))
    if smooth is not None and smooth in SMOOTHNESS_ROUGHNESS:
        signals.append(SMOOTHNESS_ROUGHNESS[smooth])
    track = _first(data.get('tracktype'))
    if track is not None and track in TRACKTYPE_ROUGHNESS:
        signals.append(TRACKTYPE_ROUGHNESS[track])
    return max(signals) if signals else DEFAULT_ROUGHNESS

def _edge_quality(data):
    """Source unique de vérité du scoring d'un segment.

    Renvoie (score_on, score_off, roughness), tous bike-indépendants :
    - score_on  : score de sécurité [0, 10] avec prise en compte de l'éclairage
    - score_off : score de sécurité [0, 10] sans composante éclairage
    - roughness : rugosité du revêtement [0, 1]
    """
    h_type = _first(data.get('highway'), 'unclassified')
    n_highway = SCORE_HIGHWAY.get(h_type, 1)

    c_type = _first(data.get('cycleway'), 'none')

    vmax = _parse_maxspeed(data.get('maxspeed', 30), h_type)
    n_speed = _get_speed_score(vmax)

    if h_type == 'cycleway' or c_type in ['track', 'separate']:
        n_highway, n_cycleway, n_speed = 10.0, 10.0, 10.0
    elif c_type in ['lane', 'shared_busway', 'opposite_lane', 'opposite_track']:
        n_cycleway = 7.0
        if n_speed < 8.0: n_speed = 8.0
    elif c_type == 'none' and vmax <= 30 and h_type in ['residential', 'living_street', 'pedestrian']:
        n_cycleway = 6.0
    else:
        n_cycleway = SCORE_CYCLEWAY.get(c_type, 1)

    bicycle = _first(data.get('bicycle'))
    if bicycle == 'designated':
        n_cycleway = min(10.0, n_cycleway + BICYCLE_DESIGNATED_BONUS)
    elif bicycle == 'dismount':
        n_cycleway = max(0.0, n_cycleway - BICYCLE_DISMOUNT_PENALTY)

    if _first(data.get('segregated')) == 'yes':
        n_cycleway = min(10.0, n_cycleway + SEGREGATED_BONUS)

    width = _parse_float(_first(data.get('width')))
    if width is not None and width < NARROW_WIDTH_M:
        n_highway = max(0.0, n_highway - NARROW_WIDTH_PENALTY)

    lanes = _parse_float(_first(data.get('lanes')))
    if lanes is not None and lanes >= MULTILANE_LANES and n_cycleway < 7.0:
        n_speed = max(0.0, n_speed - MULTILANE_PENALTY)

    if data.get('contraflow'):
        n_cycleway = max(0.0, n_cycleway - CONTRAFLOW_PENALTY)

    n_lit = _get_lit_score(_first(data.get('lit'), 'unknown'), h_type)

    score_on = (n_highway * 0.20) + (n_cycleway * 0.30) + (n_speed * 0.35) + (n_lit * 0.15)
    score_off = (n_highway * 0.25) + (n_cycleway * 0.30) + (n_speed * 0.45)
    return score_on, score_off, _edge_roughness(data)

def _parse_float(value):
    """Parse robuste d'un tag numérique OSM ('3.5 m', '2', etc.)."""
    if value is None:
        return None
    try:
        return float(str(value).split()[0].replace(',', '.'))
    except (ValueError, IndexError):
        return None

def _apply_report_penalty(weight_base, report_type, alpha):
    if not report_type: return max(0.1, weight_base)
    penalite = REPORT_PENALTIES.get(report_type, 2.0)
    if report_type == 'accident': return weight_base * penalite
    return weight_base * (1.0 + (penalite * (1.0 - alpha)))

def precompute_static_costs(G):
    """Pré-calcul des coûts statiques pour chaque arête du graphe, en fonction de la sécurité et de l'effort."""
    min_on = min_off = float('inf')
    max_on = max_off = float('-inf')
    lighting_on = get_bordeaux_lighting_condition()[1]

    for u, v, k, data in G.edges(keys=True, data=True):
        score_on, score_off, roughness = _edge_quality(data)
        data['_s_on'], data['_s_off'] = score_on, score_off
        data['_roughness'] = roughness
        min_on, max_on = min(min_on, score_on), max(max_on, score_on)
        min_off, max_off = min(min_off, score_off), max(max_off, score_off)

        # Terme de pente (sans le facteur beta, appliqué au routage).
        length = float(data.get('length', 1.0))
        try:
            if 'grade' in data:
                grade = float(data['grade'])
            else:
                elev_diff = G.nodes[v].get('elevation', 0) - G.nodes[u].get('elevation', 0)
                grade = elev_diff / length if length > 0 else 0
            grade_pct = max(0.0, grade) * 100
        except Exception:
            grade_pct = 0.0
        data['_length_f'] = length
        data['_grade_term'] = (grade_pct ** 2) / ELEVATION_DIVISOR

    range_on = (max_on - min_on) if max_on != min_on else 1
    range_off = (max_off - min_off) if max_off != min_off else 1

    for u, v, k, data in G.edges(keys=True, data=True):
        nr_on = (max_on - data['_s_on']) / range_on
        nr_off = (max_off - data['_s_off']) / range_off
        data['_risk_on'] = (nr_on ** 2) * DEFAULT_SAFETY_PENALTY
        data['_risk_off'] = (nr_off ** 2) * DEFAULT_SAFETY_PENALTY
        data['safety_score'] = data['_s_on'] if lighting_on else data['_s_off']

    G.graph['_static_costs_ready'] = True
    return G

def precompute_nearest_node_index(G):
    """Pré-calcul de l'index spatial pour la recherche des nœuds les plus proches."""
    node_ids = np.array(list(G.nodes))
    coords = np.array([[G.nodes[n]['y'], G.nodes[n]['x']] for n in node_ids], dtype=float)
    tree = BallTree(np.deg2rad(coords), metric='haversine')

    G.graph['_node_ids'] = node_ids
    G.graph['_node_tree'] = tree
    G.graph['_node_index_ready'] = True
    return G


def _nearest_nodes(G, lons, lats):
    """Renvoie la liste des nœuds les plus proches via l'index précalculé."""
    import numpy as np
    pts = np.deg2rad(np.column_stack([lats, lons]))
    _, pos = G.graph['_node_tree'].query(pts, k=1)
    return [int(n) for n in G.graph['_node_ids'][pos[:, 0]]]


def _make_weight(alpha, beta, surface_sens, reported_edges, lighting_on):
    """Renvoie une fonction de poids pour l'algorithme A*.

    alpha       : curseur rapidité (1) ↔ sécurité (0)
    beta        : poids de l'effort (pente), dépend du niveau / type de vélo
    surface_sens: sensibilité au revêtement, dépend du type de vélo
    """
    one_minus = 1.0 - alpha
    risk_key = '_risk_on' if lighting_on else '_risk_off'

    def _edge_cost(d):
        comfort = d.get('_roughness', DEFAULT_ROUGHNESS) * surface_sens
        base = d['_length_f'] * (1.0 + d[risk_key] * one_minus + d['_grade_term'] * beta + comfort)
        if d.get('traffic_jam', False):
            base += TRAFFIC_BASE_PENALTY + (TRAFFIC_SAFETY_FACTOR * one_minus)
        return base

    def weight(u, v, d):
        report_type = reported_edges.get((u, v)) or reported_edges.get((v, u))
        if '_length_f' in d:
            return _apply_report_penalty(_edge_cost(d), report_type, alpha)
        best = None
        for dd in d.values():
            c = _apply_report_penalty(_edge_cost(dd), report_type, alpha)
            if best is None or c < best:
                best = c
        return best

    return weight


def _astar_nodes(G, start_node, end_node, alpha, beta, surface_sens, reported_edges, lighting_on):
    w = _make_weight(alpha, beta, surface_sens, reported_edges, lighting_on)

    def dist_heuristic(u, v):
        return ox.distance.great_circle(G.nodes[u]['y'], G.nodes[u]['x'], G.nodes[v]['y'], G.nodes[v]['x'])

    return nx.astar_path(G, start_node, end_node, heuristic=dist_heuristic, weight=w)


def _full_route_data(G, route_nodes, bike_type, is_electric, cyclist_level):
    return {
        "nodes": route_nodes,
        "path": extract_route_geometry(G, route_nodes),
        "distance": calculate_route_distance(G, route_nodes),
        "duration": calculate_exact_travel_time(G, route_nodes, bike_type, is_electric, cyclist_level),
        "height_difference": calculate_route_elevation(G, route_nodes),
        "score": get_route_safety_score(G, route_nodes, bike_type, is_electric),
        "infra_stats": calculate_infra_stats(G, route_nodes)
    }


def get_optimal_routes(G, start_coords, end_coords, bike_type="standard", is_electric=False, cyclist_level="intermediaire", max_time_min=None, iterations=6, reported_edges=None):
    if reported_edges is None: reported_edges = {}
    try:
        if not G.graph.get('_static_costs_ready'):
            precompute_static_costs(G)
        lighting_on = get_bordeaux_lighting_condition()[1]

        cache_key = (
            round(start_coords[0], 5), round(start_coords[1], 5),
            round(end_coords[0], 5), round(end_coords[1], 5),
            bike_type, bool(is_electric), cyclist_level,
            max_time_min, int(iterations), lighting_on,
        )
        cached = route_cache.get(cache_key)
        if cached is not None:
            return cached

        if not G.graph.get('_node_index_ready'):
            precompute_nearest_node_index(G)
        start_node, end_node = _nearest_nodes(
            G, [start_coords[1], end_coords[1]], [start_coords[0], end_coords[0]])
        beta_elev = 0.0 if is_electric else ELEVATION_WEIGHT_BY_LEVEL.get(cyclist_level.lower(), 0.7)
        surface_sens = (ELECTRIC_SURFACE_SENSITIVITY if is_electric
                        else BIKE_SURFACE_SENSITIVITY.get(bike_type.lower(), DEFAULT_SURFACE_SENSITIVITY))

        fast_nodes = _astar_nodes(G, start_node, end_node, 1.0, beta_elev, surface_sens, reported_edges, lighting_on)
        safe_nodes = _astar_nodes(G, start_node, end_node, 0.0, beta_elev, surface_sens, reported_edges, lighting_on)
        fast_data = _full_route_data(G, fast_nodes, bike_type, is_electric, cyclist_level)
        safe_data = _full_route_data(G, safe_nodes, bike_type, is_electric, cyclist_level)

        res = {"success": True, "routes": [{"id": "fast", "name": "Rapide", **fast_data}, {"id": "safe", "name": "Sécurisé", **safe_data}]}

        if max_time_min and safe_data["duration"] > float(max_time_min):
            iterations = max(1, min(int(iterations), 10))
            a_low, a_high = 0.0, 1.0
            best_nodes = fast_nodes
            for _ in range(iterations):
                a_mid = (a_low + a_high) / 2
                mid_nodes = _astar_nodes(G, start_node, end_node, a_mid, beta_elev, surface_sens, reported_edges, lighting_on)
                mid_dur = calculate_exact_travel_time(G, mid_nodes, bike_type, is_electric, cyclist_level)
                if mid_dur <= float(max_time_min):
                    best_nodes, a_high = mid_nodes, a_mid
                else:
                    a_low = a_mid
            best_data = _full_route_data(G, best_nodes, bike_type, is_electric, cyclist_level)
            res["routes"].append({"id": "compromise", "name": "Compromis", "alpha_final": a_high, **best_data})
        route_cache.set(cache_key, res)
        return res
    except Exception as e: return {"success": False, "error": str(e)}
