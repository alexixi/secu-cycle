import osmnx as ox
import networkx as nx
from graph.config import SCORE_HIGHWAY, SCORE_CYCLEWAY, ELEVATION_WEIGHT_BY_LEVEL
from graph.statistique import calculate_route_elevation, calculate_exact_travel_time, calculate_route_distance
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
    # 1. Si la donnée est renseignée dans OpenStreetMap
    if vmax and str(vmax).lower() not in ['unknown', 'none', 'nan', '']:
        if isinstance(vmax, list):
            vmax = vmax[0]
        try:
            # On extrait les chiffres (ex: "30 mph" ou "50" -> 30 ou 50)
            return int(str(vmax).split()[0])
        except (ValueError, AttributeError):
            pass

    # Les grands axes de transit restent souvent à 50 km/h
    if h_type in ['primary', 'primary_link', 'secondary', 'secondary_link']:
        return 50
    # Règle de la Ville 30 pour le reste du réseau routier standard
    elif h_type in ['residential', 'tertiary', 'tertiary_link', 'unclassified']:
        return 30
    # Zones de rencontre (priorité piéton)
    elif h_type == 'living_street':
        return 20
    # Infrastructures dédiées aux vélos ou hors route
    elif h_type in ['cycleway', 'path', 'track']:
        return 25
    # Zones piétonnes
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

    # Les rues en ville sont presque toujours éclairées
    if h_type in ['residential', 'primary', 'secondary', 'tertiary', 'living_street', 'pedestrian']:
        return 0.9
    # Les pistes cyclables urbaines le sont souvent, mais pas toujours
    elif h_type == 'cycleway':
        return 0.7
    # Les chemins de terre, forêts ou parcs sont rarement éclairés
    elif h_type in ['path', 'track', 'footway']:
        return 0.2

    return 0.5

def calculate_weights(G, alpha=0.5, beta=0.5):
    """
    Calcule les poids de sécurité, de distance et de dénivelé pour le routage.
    
    alpha : Équilibre entre l'effort physique (alpha) et la sécurité (1 - alpha).
    beta  : Équilibre entre la distance (1 - beta) et la pente (beta) dans l'effort.
    """
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
        norm_dist = (float(data['length']) - l_min) / l_range
        norm_risk = (s_max - data['safety_score']) / s_range 
        norm_elev = (data['elev_cost'] - e_min) / e_range

        norm_effort = ((1 - beta) * norm_dist) + (beta * norm_elev)
        data['hybrid_weight'] = (alpha * norm_effort) + ((1 - alpha) * norm_risk)

    return G


def get_optimal_routes(G, start_coords, end_coords, bike_type="standard", is_electric=False, cyclist_level="intermediaire", max_time_min=None, iterations=6):
    try:
        start_node = ox.distance.nearest_nodes(G, start_coords[1], start_coords[0])
        end_node = ox.distance.nearest_nodes(G, end_coords[1], end_coords[0])

        if is_electric:
            beta_elev = 0.0
        else:
            beta_elev = ELEVATION_WEIGHT_BY_LEVEL.get(cyclist_level.lower(), 0.4)
        print(beta_elev)
        # 1. FAST ROUTE
        G = calculate_weights(G, alpha=1.0, beta=beta_elev)
        route_fast = nx.shortest_path(G, start_node, end_node, weight='hybrid_weight')
        dist_fast = calculate_route_distance(G, route_fast)
        duration_fast = calculate_exact_travel_time(G, route_fast, bike_type, is_electric, cyclist_level)
        path_fast = [[G.nodes[n]['y'], G.nodes[n]['x'], G.nodes[n].get("elevation", 0.0)] for n in route_fast]
        elev_fast = calculate_route_elevation(G, route_fast)

        # 2. SAFE ROUTE
        G = calculate_weights(G, alpha=0.0, beta=beta_elev)
        route_safe = nx.shortest_path(G, start_node, end_node, weight='hybrid_weight')
        dist_safe = calculate_route_distance(G, route_safe)
        duration_safe = calculate_exact_travel_time(G, route_safe, bike_type, is_electric, cyclist_level)
        path_safe = [[G.nodes[n]['y'], G.nodes[n]['x'], G.nodes[n].get("elevation", 0.0)] for n in route_safe]
        elev_safe = calculate_route_elevation(G, route_safe)
        noeuds_sans_altitude = 0

        result = {
            "success": True,
            "routes": [
                {
                    "id": "fast",
                    "name": "Rapide",
                    "path": path_fast,
                    "distance": dist_fast,
                    "duration": duration_fast,
                    "height_difference": elev_fast
                },
                {
                    "id": "safe",
                    "name": "Sécurisé",
                    "path": path_safe,
                    "distance": dist_safe,
                    "duration": duration_safe,
                    "height_difference": elev_safe
                }
            ]
        }

        # 3. COMPROMISE ROUTE (Time Constrained)
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
                    "height_difference": elev_safe
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
                    G = calculate_weights(G, alpha=alpha_mid, beta=beta_elev)
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

                result["routes"].append({
                    "id": "compromise",
                    "name": "Compromis",
                    "path": path_best,
                    "distance": best_dist,
                    "duration": best_duration,
                    "alpha_final": best_alpha,
                    "height_difference": elev_best
                })

        return result

    except nx.NetworkXNoPath:
        return {"success": False, "error": "no_path_found"}
    except Exception as e:
        return {"success": False, "error": str(e)}