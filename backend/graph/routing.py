import osmnx as ox
import networkx as nx
from graph.config import *
from graph.statistique import calculate_route_elevation, calculate_exact_travel_time, calculate_route_distance, get_route_safety_score, extract_route_geometry, get_bordeaux_lighting_condition
from graph.elevation import verifier_altitudes

def _get_speed_score(vmax):
    if vmax <= 20: return 10
    elif vmax <= 30: return 8
    elif vmax <= 50: return 4
    else: return 1

def _parse_maxspeed(vmax, h_type):
    """
    Parse la vitesse max si elle existe, sinon l'impute via le dictionnaire
    selon le type de voie en respectant les règles d'urbanisme.
    """
    if vmax and str(vmax).lower() not in ['unknown', 'none', 'nan', '']:
        if isinstance(vmax, list):
            vmax = vmax[0]
        try:
            return int(str(vmax).split()[0])
        except (ValueError, AttributeError):
            pass

    return DEFAULT_MAXSPEED_BY_HIGHWAY.get(h_type, 30)

def _get_lit_score(lit, h_type):
    """
    Retourne le score d'éclairage ou l'impute via le dictionnaire
    selon le type de route si la donnée est manquante.
    """
    if lit == 'yes':
        return 1.0
    elif lit == 'no':
        return 0.0

    return DEFAULT_LIT_SCORE_BY_HIGHWAY.get(h_type, 0.5)

def _compute_safety_scores(G):
    s_min, s_max = float('inf'), float('-inf')
    lighting_active = get_bordeaux_lighting_condition()
    for u, v, k, data in G.edges(keys=True, data=True):
        h_type = data.get('highway', 'unclassified')
        if isinstance(h_type, list): h_type = h_type[0]
        n_highway = SCORE_HIGHWAY.get(h_type, 1)

        c_type = data.get('cycleway', 'none')
        if isinstance(c_type, list): c_type = c_type[0]
        n_cycleway = SCORE_CYCLEWAY.get(c_type, 1)

        n_lit = _get_lit_score(data.get('lit', 'unknown'), h_type)
        vmax = _parse_maxspeed(data.get('maxspeed', 30), h_type)
        n_speed = _get_speed_score(vmax)

        if lighting_active[1] == True:
            score = (n_highway * 0.15) + (n_cycleway * 0.2) + (n_speed * 0.35) + (n_lit * 0.3)
        else:
            score = (n_highway * 0.25) + (n_cycleway * 0.3) + (n_speed * 0.45)
        data['safety_score'] = score

        s_min, s_max = min(s_min, score), max(s_max, score)
        
    return s_min, s_max

def _compute_effort_factor(G, u, v, data, beta):
    length = float(data.get('length', 1.0))
    
    try:
        if 'grade' in data:
            grade = float(data['grade'])
        else:
            elev_u = G.nodes[u].get('elevation', 0.0)
            elev_v = G.nodes[v].get('elevation', 0.0)
            elev_diff = elev_v - elev_u
            grade = elev_diff / length if length > 0 else 0.0
            
        grade_percent = max(0.0, grade) * 100
    except (TypeError, ValueError, KeyError):
        grade_percent = 0.0

    return ((grade_percent ** 2) / 30.0) * beta

def _apply_report_penalty(weight_base, report_type, alpha):
    if not report_type:
        return max(0.1, weight_base)

    if report_type == 'accident':
        return weight_base * REPORT_PENALTIES.get('accident', 20.0)
        
    elif report_type == 'danger':
        malus = 1.0 + (REPORT_PENALTIES.get('danger', 10.0) * (1.0 - alpha))
        return weight_base * malus
        
    elif report_type == 'obstacle':
        penalite_obs = REPORT_PENALTIES.get('obstacle', 8.0)
        malus = 1.0 + (penalite_obs * 0.4) + (penalite_obs * 0.6 * (1.0 - alpha))
        return weight_base * malus

    elif report_type == 'travaux':
        penalite_trav = REPORT_PENALTIES.get('travaux', 6.0)
        malus = 1.0 + (penalite_trav * 0.5) + (penalite_trav * 0.5 * (1.0 - alpha))
        return weight_base * malus
        
    return weight_base * REPORT_PENALTIES.get('default', 5.0)

def get_traffic_penalty(has_traffic: bool, alpha: float, base_penalty: float = 50, safety_factor: float = 250):
    """
    Calcule la pénalité (en mètres ressentis) à ajouter à une rue en cas de bouchon.
    
    - alpha (0.0 à 1.0) : 1.0 = Trajet Rapide, 0.0 = Trajet Sécurisé
    - base_penalty : Pénalité de temps incompressible (ralentissement physique du vélo).
    - safety_factor : Pénalité de stress/danger, qui augmente plus l'utilisateur veut être en sécurité.
    """
    if not has_traffic:
        return 0.0
        
    return base_penalty + (safety_factor * (1.0 - alpha))

def calculate_weights(G, alpha=0.5, beta=0.5, reported_edges=None, safety_penalty=15.0):
    if reported_edges is None:
        reported_edges = {}

    s_min, s_max = _compute_safety_scores(G)
    s_range = (s_max - s_min) if s_max != s_min else 1

    for u, v, k, data in G.edges(keys=True, data=True):
        length = float(data.get('length', 1.0))

        norm_risk = (s_max - data['safety_score']) / s_range 
        facteur_risque = norm_risk * safety_penalty * (1.0 - alpha)
        
        facteur_effort = _compute_effort_factor(G, u, v, data, beta)
        weight_base = length * (1.0 + facteur_risque + facteur_effort)

        has_traffic = data.get('traffic_jam', False)
        traffic_penalty = get_traffic_penalty(has_traffic, alpha)
        weight_base += traffic_penalty

        report_type = reported_edges.get((u, v)) or reported_edges.get((v, u))
        data['hybrid_weight'] = _apply_report_penalty(weight_base, report_type, alpha)

    return G

def _compute_route_data(G, start_node, end_node, alpha, beta, bike_type, is_electric, cyclist_level, reported_edges):
    """Calcule l'itinéraire avec A* et génère toutes les métriques associées."""
    
    G = calculate_weights(G, alpha=alpha, beta=beta, reported_edges=reported_edges)
    
    def dist_heuristic(u, v):
        y1, x1 = G.nodes[u]['y'], G.nodes[u]['x']
        y2, x2 = G.nodes[v]['y'], G.nodes[v]['x']
        return ox.distance.great_circle(y1, x1, y2, x2)

    route_nodes = nx.astar_path(G, start_node, end_node, heuristic=dist_heuristic, weight='hybrid_weight')
    
    return {
        "path": extract_route_geometry(G, route_nodes),
        "distance": calculate_route_distance(G, route_nodes),
        "duration": calculate_exact_travel_time(G, route_nodes, bike_type, is_electric, cyclist_level),
        "height_difference": calculate_route_elevation(G, route_nodes),
        "score": get_route_safety_score(G, route_nodes)
    }

def get_optimal_routes(G, start_coords, end_coords, bike_type="standard", is_electric=False, cyclist_level="intermediaire", max_time_min=None, iterations=6, reported_edges=None):
    if reported_edges is None:
        reported_edges = set()

    try:
        start_node = ox.distance.nearest_nodes(G, start_coords[1], start_coords[0])
        end_node = ox.distance.nearest_nodes(G, end_coords[1], end_coords[0])

        beta_elev = 0.0 if is_electric else ELEVATION_WEIGHT_BY_LEVEL.get(cyclist_level.lower(), 0.4)

        # 1. & 2. FAST & SAFE ROUTES
        fast_data = _compute_route_data(G, start_node, end_node, 1.0, beta_elev, bike_type, is_electric, cyclist_level, reported_edges)
        safe_data = _compute_route_data(G, start_node, end_node, 0.0, beta_elev, bike_type, is_electric, cyclist_level, reported_edges)

        result = {
            "success": True,
            "routes": [
                {"id": "fast", "name": "Rapide", **fast_data},
                {"id": "safe", "name": "Sécurisé", **safe_data}
            ]
        }

        # 3. COMPROMISE ROUTE
        if max_time_min is not None:
            max_time_min = float(max_time_min)
            
            if fast_data["duration"] > max_time_min:
                result["bounded_error"] = "time_limit_too_low"
                
            elif safe_data["duration"] <= max_time_min:
                result["routes"].append({"id": "compromise", "name": "Compromis", "alpha_final": 0.0, **safe_data})
                
            else:
                alpha_low, alpha_high = 0.0, 1.0
                best_data = fast_data
                best_alpha = 1.0

                for _ in range(iterations):
                    alpha_mid = (alpha_low + alpha_high) / 2.0
                    mid_data = _compute_route_data(G, start_node, end_node, alpha_mid, beta_elev, bike_type, is_electric, cyclist_level, reported_edges)

                    if mid_data["duration"] <= max_time_min:
                        best_data = mid_data
                        best_alpha = alpha_mid
                        alpha_high = alpha_mid
                    else:
                        alpha_low = alpha_mid

                result["routes"].append({"id": "compromise", "name": "Compromis", "alpha_final": best_alpha, **best_data})

        return result

    except nx.NetworkXNoPath:
        return {"success": False, "error": "no_path_found"}
    except Exception as e:
        return {"success": False, "error": str(e)}