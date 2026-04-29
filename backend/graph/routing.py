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
    
    # Étape 1 : Obtenir les notes sur 10 (ex: Voie verte = 10, Boulevard = 1)
    s_min, s_max = _compute_safety_scores(G)

    for u, v, k, data in G.edges(keys=True, data=True):
        length = float(data.get('length', 1.0))
        score_secu = data.get('safety_score', s_max)
        
        # ---------------------------------------------------------
        # 1. CALCUL DES COMPOSANTS DU COÛT
        # ---------------------------------------------------------
        
        # LE DANGER : On inverse la note. 
        # Une rue notée 10/10 a un niveau de danger de 1.
        # Une rue notée 1/10 a un niveau de danger de 10.
        niveau_danger = (11.0 - score_secu) 
        cout_danger = length * niveau_danger
        
        # LA DISTANCE : Le coût de base brut
        cout_distance = length
        
        # L'EFFORT : Plus la pente est forte, plus ça coûte cher
        grade_pct = 0.0
        try:
            if 'grade' in data: 
                grade_pct = float(data['grade']) * 100
            else:
                elev_diff = G.nodes[v].get('elevation', 0) - G.nodes[u].get('elevation', 0)
                grade_pct = (elev_diff / length) * 100 if length > 0 else 0.0
        except: pass
        
        niveau_effort = max(0.0, grade_pct)
        cout_effort = length * niveau_effort
        
        weight_base = (alpha * cout_distance) + ((1.0 - alpha) * cout_danger) + (beta * cout_effort)
        has_traffic = data.get('traffic_jam', False)
        if has_traffic:
            weight_base += (50.0 * (1.0 - alpha)) 

        report_type = reported_edges.get((u, v)) or reported_edges.get((v, u))
        if report_type:
            if report_type == 'accident':
                weight_base += 5000.0 # Coût énorme, on bloque la rue
            else:
                weight_base += 500.0  # Coût moyen pour des travaux/danger

        # On sauvegarde le coût abstrait final
        data['hybrid_weight'] = weight_base

    return G

def _compute_route_data(G, start_node, end_node, alpha, beta, bike_type, is_electric, cyclist_level, reported_edges):
    G = calculate_weights(G, alpha=alpha, beta=beta, reported_edges=reported_edges)
    def dist_heuristic(u, v):
        return ox.distance.great_circle(G.nodes[u]['y'], G.nodes[u]['x'], G.nodes[v]['y'], G.nodes[v]['x'])
    
    route_nodes = nx.astar_path(G, start_node, end_node, heuristic=dist_heuristic, weight='hybrid_weight')
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
        start_node = ox.distance.nearest_nodes(G, start_coords[1], start_coords[0])
        end_node = ox.distance.nearest_nodes(G, end_coords[1], end_coords[0])
        beta_elev = 0.0 if is_electric else ELEVATION_WEIGHT_BY_LEVEL.get(cyclist_level.lower(), 0.7)

        fast_data = _compute_route_data(G, start_node, end_node, 1.0, beta_elev, bike_type, is_electric, cyclist_level, reported_edges)
        safe_data = _compute_route_data(G, start_node, end_node, 0.0, beta_elev, bike_type, is_electric, cyclist_level, reported_edges)

        res = {"success": True, "routes": [{"id": "fast", "name": "Rapide", **fast_data}, {"id": "safe", "name": "Sécurisé", **safe_data}]}

        if max_time_min and safe_data["duration"] > float(max_time_min):
            a_low, a_high = 0.0, 1.0
            best_data = fast_data
            for _ in range(iterations):
                a_mid = (a_low + a_high) / 2
                mid_data = _compute_route_data(G, start_node, end_node, a_mid, beta_elev, bike_type, is_electric, cyclist_level, reported_edges)
                if mid_data["duration"] <= float(max_time_min):
                    best_data, a_high = mid_data, a_mid
                else: a_low = a_mid
            res["routes"].append({"id": "compromise", "name": "Compromis", "alpha_final": a_high, **best_data})
        return res
    except Exception as e: return {"success": False, "error": str(e)}