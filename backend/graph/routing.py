import osmnx as ox
import networkx as nx
<<<<<<< HEAD
from graph.config import SCORE_HIGHWAY, SCORE_CYCLEWAY, ELEVATION_WEIGHT_BY_LEVEL, REPORT_PENALTIES
from graph.statistique import calculate_route_elevation, calculate_exact_travel_time, calculate_route_distance, get_route_safety_score, calculate_infra_stats
=======
from graph.config import *
from graph.statistique import calculate_route_elevation, calculate_exact_travel_time, calculate_route_distance, get_route_safety_score, extract_route_geometry, get_bordeaux_lighting_condition, calculate_infra_stats
>>>>>>> branche-joan
from graph.elevation import verifier_altitudes

def _get_speed_score(vmax):
    if vmax <= 20: return 10
    elif vmax <= 30: return 8
    elif vmax <= 50: return 4
    else: return 1

def _parse_maxspeed(vmax, h_type):
    """
    Parse la vitesse max si elle existe, sinon l'impute selon le type de voie
    en respectant les règles d'urbanisme de Bordeaux Métropole (Ville 30).
    """
    if vmax and str(vmax).lower() not in ['unknown', 'none', 'nan', '']:
        if isinstance(vmax, list):
            vmax = vmax[0]
        try:
            return int(str(vmax).split()[0])
        except (ValueError, AttributeError):
            pass

    if h_type in ['primary', 'primary_link', 'secondary', 'secondary_link']:
        return 50
    elif h_type in ['residential', 'tertiary', 'tertiary_link', 'unclassified']:
        return 30
    elif h_type == 'living_street':
        return 20
    elif h_type in ['cycleway', 'path', 'track']:
        return 25
    elif h_type in ['footway', 'pedestrian']:
        return 10

    return 30

def _get_lit_score(lit, h_type):
    """
    Retourne le score d'éclairage ou l'impute de manière probabiliste
    selon le type de route si la donnée est manquante.
    """
    if lit == 'yes':
        return 1.0
    elif lit == 'no':
        return 0.0

    if h_type in ['residential', 'primary', 'secondary', 'tertiary', 'living_street', 'pedestrian']:
        return 0.9
    elif h_type == 'cycleway':
        return 0.7
    elif h_type in ['path', 'track', 'footway']:
        return 0.2

    return 0.5

def get_traffic_penalty(has_traffic: bool, alpha: float, base_penalty: float = 50, safety_factor: float = 250):
    """
    Calcule la pénalité à ajouter à une rue en cas de bouchon.
    alpha (0.0 à 1.0) : 1.0 = Trajet Rapide, 0.0 = Trajet Sécurisé.
    """
    if not has_traffic:
        return 0.0
    return base_penalty + (safety_factor * (1.0 - alpha))

def calculate_weights(G, alpha=0.5, beta=0.5, reported_edges=None):
    """
    Calcule les poids de sécurité, de distance et de dénivelé pour le routage.

    alpha : Équilibre entre l'effort physique (alpha) et la sécurité (1 - alpha).
    beta  : Équilibre entre la distance (1 - beta) et la pente (beta) dans l'effort.
    reported_edges : Set contenant les arêtes (u, v) signalées par les utilisateurs.
    """
    if reported_edges is None:
        reported_edges = {}

    s_min, s_max = float('inf'), float('-inf')
    l_min, l_max = float('inf'), float('-inf')
    e_min, e_max = float('inf'), float('-inf')

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

        score = (n_highway * 0.15) + (n_cycleway * 0.2) + (n_speed * 0.35) + (n_lit * 0.3)
        data['safety_score'] = score

        length = float(data.get('length', 1.0))

        try:
            if 'grade' in data:
                grade = float(data['grade'])
            else:
                elev_diff = float(data.get('elevation_diff', 0.0))
                grade = elev_diff / length if length > 0 else 0.0

            positive_grade = max(0.0, grade)
            grade_percent = positive_grade * 100
            elev_cost = length * (grade_percent ** 2)
        except (TypeError, ValueError):
            elev_cost = 0.0

        data['elev_cost'] = elev_cost

        s_min, s_max = min(s_min, score), max(s_max, score)
        l_min, l_max = min(l_min, length), max(l_max, length)
        e_min, e_max = min(e_min, elev_cost), max(e_max, elev_cost)

    s_range = (s_max - s_min) if s_max != s_min else 1
    l_range = (l_max - l_min) if l_max != l_min else 1
    e_range = (e_max - e_min) if e_max != e_min else 1

    for u, v, k, data in G.edges(keys=True, data=True):
        norm_risk = (s_max - data['safety_score']) / s_range
        norm_dist = (float(data['length']) - l_min) / l_range
        norm_elev = (data['elev_cost'] - e_min) / e_range

        norm_effort = ((1 - beta) * norm_dist) + (beta * norm_elev)
        base_weight = (alpha * norm_effort) + ((1 - alpha) * norm_risk)

        has_traffic = data.get('traffic_jam', False)
        base_weight += get_traffic_penalty(has_traffic, alpha)

        report_type = reported_edges.get((u, v)) or reported_edges.get((v, u))

        if report_type:
            if report_type == 'accident':
                data['hybrid_weight'] = base_weight + REPORT_PENALTIES['accident']
            elif report_type == 'danger':
                malus = REPORT_PENALTIES['danger'] * (1.0 - alpha)
                data['hybrid_weight'] = base_weight + malus
            elif report_type == 'obstacle':
                malus = REPORT_PENALTIES['obstacle'] * (1.0 - alpha)
                data['hybrid_weight'] = base_weight + malus
            elif report_type == 'travaux':
                malus = (REPORT_PENALTIES['travaux'] * 0.5) + (REPORT_PENALTIES['travaux'] * 0.5 * (1.0 - alpha))
                data['hybrid_weight'] = base_weight + malus
            else:
                data['hybrid_weight'] = base_weight + REPORT_PENALTIES.get('default', 5.0)
        else:
            data['hybrid_weight'] = max(0.001, base_weight)

    return G

def _compute_route_data(G, start_node, end_node, alpha, beta, bike_type, is_electric, cyclist_level, reported_edges):
    """Calcule l'itinéraire avec A* et génère toutes les métriques associées."""
    
    G = calculate_weights(G, alpha=alpha, beta=beta, reported_edges=reported_edges)
    
    def dist_heuristic(u, v):
        y1, x1 = G.nodes[u]['y'], G.nodes[u]['x']
        y2, x2 = G.nodes[v]['y'], G.nodes[v]['x']
        return ox.distance.great_circle(y1, x1, y2, x2)

    route_nodes = nx.astar_path(G, start_node, end_node, heuristic=dist_heuristic, weight='hybrid_weight')
    
    infra_stat = calculate_infra_stats(G, route_nodes)
    return {
        "nodes": route_nodes, 
        "path": extract_route_geometry(G, route_nodes),
        "distance": calculate_route_distance(G, route_nodes),
        "duration": calculate_exact_travel_time(G, route_nodes, bike_type, is_electric, cyclist_level),
        "height_difference": calculate_route_elevation(G, route_nodes),
        "score": get_route_safety_score(G, route_nodes),
        "infra_stats": infra_stat
    }

def get_optimal_routes(G, start_coords, end_coords, bike_type="standard", is_electric=False, cyclist_level="intermediaire", max_time_min=None, iterations=6, reported_edges=None):
    if reported_edges is None:
        reported_edges = set()

    try:
        start_node = ox.distance.nearest_nodes(G, start_coords[1], start_coords[0])
        end_node = ox.distance.nearest_nodes(G, end_coords[1], end_coords[0])

        if is_electric:
            beta_elev = 0.0
        else:
            beta_elev = ELEVATION_WEIGHT_BY_LEVEL.get(cyclist_level.lower(), 0.4)

        G = calculate_weights(G, alpha=1.0, beta=beta_elev, reported_edges=reported_edges)
        route_fast = nx.shortest_path(G, start_node, end_node, weight='hybrid_weight')
        dist_fast = calculate_route_distance(G, route_fast)
        duration_fast = calculate_exact_travel_time(G, route_fast, bike_type, is_electric, cyclist_level)
        path_fast = [[G.nodes[n]['y'], G.nodes[n]['x'], G.nodes[n].get("elevation", 0.0)] for n in route_fast]
        elev_fast = calculate_route_elevation(G, route_fast)
        fast_score = get_route_safety_score(G, route_fast)
        infra_fast = calculate_infra_stats(G, route_fast)

        G = calculate_weights(G, alpha=0.0, beta=beta_elev, reported_edges=reported_edges)
        route_safe = nx.shortest_path(G, start_node, end_node, weight='hybrid_weight')
        dist_safe = calculate_route_distance(G, route_safe)
        duration_safe = calculate_exact_travel_time(G, route_safe, bike_type, is_electric, cyclist_level)
        path_safe = [[G.nodes[n]['y'], G.nodes[n]['x'], G.nodes[n].get("elevation", 0.0)] for n in route_safe]
        elev_safe = calculate_route_elevation(G, route_safe)
        safe_score = get_route_safety_score(G, route_safe)
        infra_safe = calculate_infra_stats(G, route_safe)

        result = {
            "success": True,
            "routes": [
                {
                    "id": "fast",
                    "name": "Rapide",
                    "path": path_fast,
                    "distance": dist_fast,
                    "duration": duration_fast,
                    "height_difference": elev_fast,
                    "score": fast_score,
                    "infra_stats": infra_fast
                },
                {
                    "id": "safe",
                    "name": "Sécurisé",
                    "path": path_safe,
                    "distance": dist_safe,
                    "duration": duration_safe,
                    "height_difference": elev_safe,
                    "score": safe_score,
                    "infra_stats": infra_safe
                }
            ]
        }

        if max_time_min is not None:
            max_time_min = float(max_time_min)

            if duration_fast > max_time_min:
                result["bounded_error"] = "time_limit_too_low"

            elif duration_safe <= max_time_min:
                result["routes"].append({
                    "id": "compromise",
                    "name": "Compromis",
                    "path": path_safe,
                    "distance": dist_safe,
                    "duration": duration_safe,
                    "alpha_final": 0.0,
                    "height_difference": elev_safe,
                    "score": safe_score,
                    "infra_stats": infra_safe
                })

            else:
                alpha_low = 0.0
                alpha_high = 1.0
                best_route = route_fast
                best_duration = duration_fast
                best_dist = dist_fast
                best_alpha = 1.0

                for _ in range(iterations):
                    alpha_mid = (alpha_low + alpha_high) / 2.0
                    G = calculate_weights(G, alpha=alpha_mid, beta=beta_elev, reported_edges=reported_edges)
                    route_mid = nx.shortest_path(G, start_node, end_node, weight='hybrid_weight')

                    dist_mid = calculate_route_distance(G, route_mid)
                    duration_mid = calculate_exact_travel_time(G, route_mid, bike_type, is_electric, cyclist_level)

                    if duration_mid <= max_time_min:
                        best_route = route_mid
                        best_duration = duration_mid
                        best_dist = dist_mid
                        best_alpha = alpha_mid
                        alpha_high = alpha_mid
                    else:
                        alpha_low = alpha_mid

                path_best = [[G.nodes[n]['y'], G.nodes[n]['x'], G.nodes[n].get("elevation", 0.0)] for n in best_route]
                elev_best = calculate_route_elevation(G, best_route)
                best_score = get_route_safety_score(G, best_route)
                infra_best = calculate_infra_stats(G, best_route)

                result["routes"].append({
                    "id": "compromise",
                    "name": "Compromis",
                    "path": path_best,
                    "distance": best_dist,
                    "duration": best_duration,
                    "alpha_final": best_alpha,
                    "height_difference": elev_best,
                    "score": best_score,
                    "infra_stats": infra_best
                })

        return result

    except nx.NetworkXNoPath:
        return {"success": False, "error": "no_path_found"}
    except Exception as e:
        return {"success": False, "error": str(e)}
