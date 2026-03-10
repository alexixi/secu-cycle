import osmnx as ox
import networkx as nx
from config import SCORE_HIGHWAY, SCORE_CYCLEWAY, VITESSE_M_MIN

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
    # Zones piétonnes (les vélos y roulent au pas)
    elif h_type in ['footway', 'pedestrian']:
        return 10
    
    # Valeur par défaut de sécurité
    return 30

def _get_lit_score(lit, h_type):
    """
    Retourne le score d'éclairage ou l'impute de manière probabiliste
    selon le type de route si la donnée est manquante.
    """
    # 1. Donnée explicite
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
    
    # Doute raisonnable
    return 0.5

def calculate_weights(G, alpha=0.5):
    """Calcule les poids de sécurité et hybrides pour le routage."""
    s_min, s_max = float('inf'), float('-inf')
    l_min, l_max = float('inf'), float('-inf')
    
    # Passe 1 : Calculs de base
    for u, v, k, data in G.edges(keys=True, data=True):
        h_type = data.get('highway', 'unclassified')
        if isinstance(h_type, list): h_type = h_type[0]
        n_highway = SCORE_HIGHWAY.get(h_type, 1)

        c_type = data.get('cycleway', 'none')
        if isinstance(c_type, list): c_type = c_type[0]
        n_cycleway = SCORE_CYCLEWAY.get(c_type, 1)

        n_lit = _get_lit_score(data.get('lit', 'unknown'), h_type)
        vmax = _parse_maxspeed(data.get('maxspeed', 30), h_type)
        n_vitesse = _get_speed_score(vmax)

        score = (n_highway * 0.15) + (n_cycleway * 0.2) + (n_vitesse * 0.35) + (n_lit * 0.3)
        length = float(data.get('length', 1))
        
        # On stocke le score pur pour information
        data['safety_score'] = score
        
        s_min, s_max = min(s_min, score), max(s_max, score)
        l_min, l_max = min(l_min, length), max(l_max, length)

    # Passe 2 : Normalisation et poids hybride
    s_range = (s_max - s_min) if s_max != s_min else 1
    l_range = (l_max - l_min) if l_max != l_min else 1

    for u, v, k, data in G.edges(keys=True, data=True):
        norm_dist = (float(data['length']) - l_min) / l_range
        # Inverse le score : 0 = très sûr (score max), 1 = dangereux (score min)
        norm_risque = (s_max - data['safety_score']) / s_range
        
        data['hybrid_weight'] = (alpha * norm_dist) + ((1 - alpha) * norm_risque)

    return G

def calculate_route_distance(G, route):
    """Calcule la distance réelle d'un itinéraire."""
    distance = 0
    for i in range(len(route) - 1):
        u, v = route[i], route[i + 1]
        edge_data = G.get_edge_data(u, v)
        if edge_data:
            if isinstance(edge_data, dict) and 0 in edge_data:
                distance += float(edge_data[0].get('length', 0))
            else:
                distance += float(edge_data.get('length', 0))
    return distance

def get_routes_from_coords(G, start_coords, end_coords):
    """
    Généralise le calcul d'itinéraires à partir de coordonnées GPS.
    
    :param G: Le graphe OSMnx pondéré
    :param start_coords: Tuple (latitude, longitude) du départ
    :param end_coords: Tuple (latitude, longitude) de l'arrivée
    :return: Dictionnaire contenant les chemins et les distances
    """
    try:
        start_node = ox.distance.nearest_nodes(G, start_coords[1], start_coords[0])
        end_node = ox.distance.nearest_nodes(G, end_coords[1], end_coords[0])

        # 1. Calcul du trajet Rapide
        route_fast = nx.shortest_path(G, start_node, end_node, weight='length')
        dist_fast = calculate_route_distance(G, route_fast)

        # 2. Calcul du trajet Sécurisé
        route_safe = nx.shortest_path(G, start_node, end_node, weight='hybrid_weight')
        dist_safe = calculate_route_distance(G, route_safe)

        return {
            "success": True,
            "fast_route": {
                "path": route_fast,
                "distance": dist_fast
            },
            "safe_route": {
                "path": route_safe,
                "distance": dist_safe
            }
        }
        
    except nx.NetworkXNoPath:
        return {"success": False, "error": "Aucun chemin trouvé entre ces deux points."}
    except Exception as e:
        return {"success": False, "error": str(e)}


def find_time_bounded_safe_path(G, start_coords, end_coords, temps_max_min, iterations=6):
    """
    Trouve le trajet le plus sécurisé respectant une limite de temps stricte
    en utilisant une recherche dichotomique sur le paramètre Alpha.
    """
    start_node = ox.distance.nearest_nodes(G, start_coords[1], start_coords[0])
    end_node = ox.distance.nearest_nodes(G, end_coords[1], end_coords[0])
    
    # 1. Vérification de faisabilité (Trajet le plus rapide, Alpha = 1.0)
    G = calculate_weights(G, alpha=1.0)
    try:
        route_fast = nx.shortest_path(G, start_node, end_node, weight='hybrid_weight')
    except nx.NetworkXNoPath:
        return {"success": False, "error": "Aucun chemin possible entre ces points."}
        
    dist_fast = calculate_route_distance(G, route_fast)
    temps_fast = dist_fast / VITESSE_M_MIN
    
    if temps_fast > temps_max_min:
        return {"success": False, "error": f"Impossible. Le trajet le plus rapide prend déjà {temps_fast:.1f} min."}

    # 2. Le trajet le plus sûr (Alpha = 0.0) passe-t-il la limite ?
    G = calculate_weights(G, alpha=0.0)
    route_safe = nx.shortest_path(G, start_node, end_node, weight='hybrid_weight')
    dist_safe = calculate_route_distance(G, route_safe)
    temps_safe = dist_safe / VITESSE_M_MIN
    
    if temps_safe <= temps_max_min:
        return {
            "success": True, 
            "path": route_safe, 
            "temps": temps_safe, 
            "alpha_final": 0.0,
            "message": "Le trajet le plus sûr respecte déjà la contrainte."
        }

    # 3. Recherche Dichotomique pour trouver le meilleur compromis
    alpha_low = 0.0  # Zone trop lente (mais très sûre)
    alpha_high = 1.0 # Zone respectant le temps (mais dangereuse)
    
    best_path = route_fast
    best_temps = temps_fast
    best_alpha = 1.0

    for _ in range(iterations):
        alpha_mid = (alpha_low + alpha_high) / 2.0
        
        G = calculate_weights(G, alpha=alpha_mid)
        route_mid = nx.shortest_path(G, start_node, end_node, weight='hybrid_weight')
        dist_mid = calculate_route_distance(G, route_mid)
        temps_mid = dist_mid / VITESSE_M_MIN

        if temps_mid <= temps_max_min:
            # Succès : on respecte le temps. On sauvegarde et on essaie d'être encore plus sûr (baisser alpha)
            best_path = route_mid
            best_temps = temps_mid
            best_alpha = alpha_mid
            alpha_high = alpha_mid 
        else:
            # Échec : trajet trop long. Il faut prioriser la vitesse (augmenter alpha)
            alpha_low = alpha_mid

    return {
        "success": True, 
        "path": best_path, 
        "temps": best_temps, 
        "alpha_final": best_alpha,
        "message": f"Compromis trouvé avec un profil à {100 - (best_alpha*100):.0f}% axé sur la sécurité."
    }