import osmnx as ox
import networkx as nx
from graph.config import *
from graph.statistique import calculate_route_elevation, calculate_exact_travel_time, calculate_route_distance, get_route_safety_score, extract_route_geometry, get_bordeaux_lighting_condition, calculate_infra_stats

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

def _compute_safety_scores(G):
    s_min, s_max = float('inf'), float('-inf')
    lighting_active = get_bordeaux_lighting_condition()

    for u, v, k, data in G.edges(keys=True, data=True):
        h_type = data.get('highway', 'unclassified')
        if isinstance(h_type, list): h_type = h_type[0]
        n_highway = SCORE_HIGHWAY.get(h_type, 1)

        c_type = data.get('cycleway', 'none')
        if isinstance(c_type, list): c_type = c_type[0]

        vmax = _parse_maxspeed(data.get('maxspeed', 30), h_type)
        n_speed = _get_speed_score(vmax)

        if h_type == 'cycleway' or c_type in ['track', 'separate']:
            n_highway, n_cycleway, n_speed = 10.0, 10.0, 10.0
        elif c_type in ['lane', 'shared_busway']:
            n_cycleway = 7.0
            if n_speed < 8.0: n_speed = 8.0
        elif c_type == 'none' and vmax <= 30 and h_type in ['residential', 'living_street', 'pedestrian']:
            n_cycleway = 6.0
        else:
            n_cycleway = SCORE_CYCLEWAY.get(c_type, 1)

        n_lit = _get_lit_score(data.get('lit', 'unknown'), h_type)

        if lighting_active[1]:
            score = (n_highway * 0.20) + (n_cycleway * 0.30) + (n_speed * 0.35) + (n_lit * 0.15)
        else:
            score = (n_highway * 0.25) + (n_cycleway * 0.30) + (n_speed * 0.45)

        data['safety_score'] = score
        s_min, s_max = min(s_min, score), max(s_max, score)

    return s_min, s_max

def _compute_effort_factor(G, u, v, data, beta):
    length = float(data.get('length', 1.0))
    try:
        if 'grade' in data: grade = float(data['grade'])
        else:
            elev_diff = G.nodes[v].get('elevation', 0) - G.nodes[u].get('elevation', 0)
            grade = elev_diff / length if length > 0 else 0
        grade_pct = max(0.0, grade) * 100
    except: grade_pct = 0.0
    return ((grade_pct ** 2) / ELEVATION_DIVISOR) * beta

def _apply_report_penalty(weight_base, report_type, alpha):
    if not report_type: return max(0.1, weight_base)
    penalite = REPORT_PENALTIES.get(report_type, 2.0)
    if report_type == 'accident': return weight_base * penalite
    return weight_base * (1.0 + (penalite * (1.0 - alpha)))

def get_traffic_penalty(has_traffic, alpha):
    if not has_traffic: return 0.0
    return TRAFFIC_BASE_PENALTY + (TRAFFIC_SAFETY_FACTOR * (1.0 - alpha))

def calculate_weights(G, alpha=0.5, beta=0.5, reported_edges=None):
    if reported_edges is None: reported_edges = {}
    s_min, s_max = _compute_safety_scores(G)
    s_range = (s_max - s_min) if s_max != s_min else 1

    for u, v, k, data in G.edges(keys=True, data=True):
        length = float(data.get('length', 1.0))
        norm_risk = (s_max - data['safety_score']) / s_range

        facteur_risque = (norm_risk ** 2) * DEFAULT_SAFETY_PENALTY * (1.0 - alpha)
        facteur_effort = _compute_effort_factor(G, u, v, data, beta)

        weight_base = length * (1.0 + facteur_risque + facteur_effort)
        weight_base += get_traffic_penalty(data.get('traffic_jam', False), alpha)

        report_type = reported_edges.get((u, v)) or reported_edges.get((v, u))
        data['hybrid_weight'] = _apply_report_penalty(weight_base, report_type, alpha)
    return G

def precompute_static_costs(G):
    """
    Précalcule UNE FOIS, par arête, les composantes de coût indépendantes de la
    requête (score de sécurité, risque normalisé, terme de pente) et les stocke
    sur l'arête. Évite de réitérer sur tout le graphe à chaque calcul d'itinéraire.

    Deux variantes de sécurité selon l'éclairage public (cf. _compute_safety_scores) :
    `_risk_on` (éclairage actif, terme `lit`) et `_risk_off` (sans `lit`).
    Le choix se fait au moment de la requête via get_bordeaux_lighting_condition()[1].
    Idempotent (marqueur G.graph['_static_costs_ready']).
    """
    min_on = min_off = float('inf')
    max_on = max_off = float('-inf')

    for u, v, k, data in G.edges(keys=True, data=True):
        h_type = data.get('highway', 'unclassified')
        if isinstance(h_type, list): h_type = h_type[0]
        n_highway = SCORE_HIGHWAY.get(h_type, 1)

        c_type = data.get('cycleway', 'none')
        if isinstance(c_type, list): c_type = c_type[0]

        vmax = _parse_maxspeed(data.get('maxspeed', 30), h_type)
        n_speed = _get_speed_score(vmax)

        if h_type == 'cycleway' or c_type in ['track', 'separate']:
            n_highway, n_cycleway, n_speed = 10.0, 10.0, 10.0
        elif c_type in ['lane', 'shared_busway']:
            n_cycleway = 7.0
            if n_speed < 8.0: n_speed = 8.0
        elif c_type == 'none' and vmax <= 30 and h_type in ['residential', 'living_street', 'pedestrian']:
            n_cycleway = 6.0
        else:
            n_cycleway = SCORE_CYCLEWAY.get(c_type, 1)

        n_lit = _get_lit_score(data.get('lit', 'unknown'), h_type)

        score_on = (n_highway * 0.20) + (n_cycleway * 0.30) + (n_speed * 0.35) + (n_lit * 0.15)
        score_off = (n_highway * 0.25) + (n_cycleway * 0.30) + (n_speed * 0.45)
        data['_s_on'], data['_s_off'] = score_on, score_off
        min_on, max_on = min(min_on, score_on), max(max_on, score_on)
        min_off, max_off = min(min_off, score_off), max(max_off, score_off)

        # Terme de pente (réplique _compute_effort_factor sans le facteur beta).
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

    G.graph['_static_costs_ready'] = True
    return G


def _make_weight(alpha, beta, reported_edges, lighting_on):
    """
    Fabrique le callback de poids passé à nx.astar_path : calcule le coût d'une
    arête À LA VOLÉE (uniquement pour les arêtes explorées), à partir des
    composantes précalculées. Formule strictement identique à calculate_weights.
    """
    one_minus = 1.0 - alpha
    risk_key = '_risk_on' if lighting_on else '_risk_off'

    def _edge_cost(d):
        base = d['_length_f'] * (1.0 + d[risk_key] * one_minus + d['_grade_term'] * beta)
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


def _astar_nodes(G, start_node, end_node, alpha, beta, reported_edges, lighting_on):
    w = _make_weight(alpha, beta, reported_edges, lighting_on)

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
        "score": get_route_safety_score(G, route_nodes),
        "infra_stats": calculate_infra_stats(G, route_nodes)
    }


def get_optimal_routes(G, start_coords, end_coords, bike_type="standard", is_electric=False, cyclist_level="intermediaire", max_time_min=None, iterations=6, reported_edges=None):
    if reported_edges is None: reported_edges = {}
    try:
        if not G.graph.get('_static_costs_ready'):
            precompute_static_costs(G)
        lighting_on = get_bordeaux_lighting_condition()[1]

        snap = ox.distance.nearest_nodes(
            G, [start_coords[1], end_coords[1]], [start_coords[0], end_coords[0]])
        start_node, end_node = snap[0], snap[1]
        beta_elev = 0.0 if is_electric else ELEVATION_WEIGHT_BY_LEVEL.get(cyclist_level.lower(), 0.7)

        fast_nodes = _astar_nodes(G, start_node, end_node, 1.0, beta_elev, reported_edges, lighting_on)
        safe_nodes = _astar_nodes(G, start_node, end_node, 0.0, beta_elev, reported_edges, lighting_on)
        fast_data = _full_route_data(G, fast_nodes, bike_type, is_electric, cyclist_level)
        safe_data = _full_route_data(G, safe_nodes, bike_type, is_electric, cyclist_level)

        res = {"success": True, "routes": [{"id": "fast", "name": "Rapide", **fast_data}, {"id": "safe", "name": "Sécurisé", **safe_data}]}

        if max_time_min and safe_data["duration"] > float(max_time_min):
            iterations = max(1, min(int(iterations), 10))
            a_low, a_high = 0.0, 1.0
            best_nodes = fast_nodes
            for _ in range(iterations):
                a_mid = (a_low + a_high) / 2
                mid_nodes = _astar_nodes(G, start_node, end_node, a_mid, beta_elev, reported_edges, lighting_on)
                mid_dur = calculate_exact_travel_time(G, mid_nodes, bike_type, is_electric, cyclist_level)
                if mid_dur <= float(max_time_min):
                    best_nodes, a_high = mid_nodes, a_mid
                else:
                    a_low = a_mid
            best_data = _full_route_data(G, best_nodes, bike_type, is_electric, cyclist_level)
            res["routes"].append({"id": "compromise", "name": "Compromis", "alpha_final": a_high, **best_data})
        return res
    except Exception as e: return {"success": False, "error": str(e)}
