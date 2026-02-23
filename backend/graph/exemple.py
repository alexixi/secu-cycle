import osmnx as ox
import networkx as nx
import time
import os

# Constantes précalculées pour éviter les recherches répétées
SCORE_HIGHWAY = {
    'cycleway': 10, 'footway': 9, 'residential': 8, 'path': 7,
    'living_street': 6, 'service': 5, 'unclassified': 4,
    'tertiary': 3, 'secondary': 2, 'primary': 1
}

SCORE_CYCLEWAY = {
    'track': 5, 'shared_busway': 4, 'lane': 3, 'shared_lane': 2, 'none': 1
}


def _get_speed_score(vmax):
    """Extrait la logique de calcul du score de vitesse pour réutilisabilité."""
    if vmax <= 20:
        return 10
    elif vmax <= 30:
        return 8
    elif vmax <= 50:
        return 4
    else:
        return 1


def _parse_maxspeed(vmax, h_type):
    """Parse la vitesse max et retourne un entier."""
    if isinstance(vmax, list):
        vmax = vmax[0]
    try:
        return int(str(vmax).split()[0])
    except (ValueError, AttributeError):
        return 25 if h_type == 'cycleway' else 30


def _get_lit_score(lit):
    """Retourne le score d'éclairage."""
    if lit == 'yes':
        return 1.0
    elif lit == 'no':
        return 0.0
    else:
        return 0.5


def calculate_weights(G, alpha=0.5):
    """
    Fusionne le calcul de safety_weight et hybrid_weight en une seule passe.
    
    alpha = 1.0 -> 100% Distance (Rapide)
    alpha = 0.0 -> 100% Sécurité (Sûr)
    
    Première passe : calcul des safety_weight et min/max
    Deuxième passe : calcul des hybrid_weight avec normalisations
    """
    
    # === PREMIÈRE PASSE : Calcul safety_weight et collection min/max ===
    s_min, s_max = float('inf'), float('-inf')
    l_min, l_max = float('inf'), float('-inf')
    
    for u, v, k, data in G.edges(keys=True, data=True):
        # Extraction et normalisation du type de route
        h_type = data.get('highway', 'unclassified')
        if isinstance(h_type, list):
            h_type = h_type[0]
        n_highway = SCORE_HIGHWAY.get(h_type, 1)

        # Extraction et normalisation du type de piste cyclable
        c_type = data.get('cycleway', 'none')
        if isinstance(c_type, list):
            c_type = c_type[0]
        n_cycleway = SCORE_CYCLEWAY.get(c_type, 1)

        # Score d'éclairage
        n_lit = _get_lit_score(data.get('lit', 'unknown'))

        # Parse de la vitesse max
        vmax = data.get('maxspeed', 30)
        vmax = _parse_maxspeed(vmax, h_type)
        n_vitesse = _get_speed_score(vmax)

        # Calcul du score de sécurité
        score = (n_highway * 0.15) + (n_cycleway * 0.2) + (n_vitesse * 0.35) + (n_lit * 0.3)

        # Calcul du weight de sécurité
        length = data.get('length', 1)
        safety_weight = length / score
        
        data['safety_weight'] = safety_weight

        # Mise à jour des min/max
        s_min = min(s_min, safety_weight)
        s_max = max(s_max, safety_weight)
        l_min = min(l_min, length)
        l_max = max(l_max, length)

    # === DEUXIÈME PASSE : Calcul hybrid_weight avec normalisations ===
    s_range = (s_max - s_min) if s_max != s_min else 1
    l_range = (l_max - l_min) if l_max != l_min else 1

    for u, v, k, data in G.edges(keys=True, data=True):
        # Normalisation de la distance (0 = court, 1 = long)
        norm_dist = (data['length'] - l_min) / l_range

        # Normalisation de la sécurité (inverse : 0 = très sûr, 1 = dangereux)
        score_brut = data['safety_weight']
        norm_risque = (s_max - score_brut) / s_range

        # Calcul du poids hybride final
        data['hybrid_weight'] = (alpha * norm_dist) + ((1 - alpha) * norm_risque)

    return G


def create_graph(filename):
    """Charge ou crée le graphe du réseau cyclable."""
    if os.path.exists(filename):
        G = ox.load_graphml(filepath=filename)
        print("Graphe chargé depuis le fichier local.")
    else:
        useful_tags = ox.settings.useful_tags_way + ['cycleway', 'lit', 'maxspeed', 'surface']
        ox.settings.useful_tags_way = list(set(useful_tags))
        G = ox.graph_from_place(
            ['Pessac, France', 'Talence, France', 'Bordeaux, France', 'Merignac, France'],
            network_type='bike'
        )
        ox.save_graphml(G, filepath=filename)
    return G


def calculate_route_distance(G, route):
    """Calcule la distance totale d'une route de manière efficace."""
    distance = 0
    for i in range(len(route) - 1):
        u, v = route[i], route[i + 1]
        # Pour les multigraphes, prendre le premier edge (généralement le plus court)
        edge_data = G.get_edge_data(u, v)
        if edge_data:
            # Pour les multigraphes, edge_data est un dict de dicts
            if isinstance(edge_data, dict) and 0 in edge_data:
                distance += edge_data[0].get('length', 0)
            else:
                distance += edge_data.get('length', 0)
    return distance


# ============ EXECUTION PRINCIPALE ============

start = time.perf_counter()

G = create_graph("victoire_campus.graphml")

end = time.perf_counter()
print(f"Temps d'exécution création : {end - start:.6f} secondes")

# Une seule passe pour calculer les deux poids
start = time.perf_counter()
calculate_weights(G, alpha=0.5)
end = time.perf_counter()
print(f"Temps d'exécution calcul des poids : {end - start:.6f} secondes")

print(f"\nNombre de nœuds: {len(G.nodes)}")
print(f"Nombre d'arêtes: {len(G.edges)}")

home_location = (44.806574, -0.5937003)
work_location = (44.8374728, -0.6163104)

home_node = ox.distance.nearest_nodes(G, home_location[1], home_location[0])
work_node = ox.distance.nearest_nodes(G, work_location[1], work_location[0])

print(f"\nNœud du domicile: {home_node}")
print(f"Nœud du travail: {work_node}")

# Itinéraire rapide (basé sur la distance)
start = time.perf_counter()
route = nx.shortest_path(G, home_node, work_node, weight='length')
end = time.perf_counter()
print(f"Temps d'exécution itinéraire rapide : {end - start:.6f} secondes")

# Itinéraire sécurisé (basé sur le poids hybride)
start = time.perf_counter()
route_safe = nx.shortest_path(G, home_node, work_node, weight='hybrid_weight')
end = time.perf_counter()
print(f"Temps d'exécution itinéraire sécurisé : {end - start:.6f} secondes")

# Calcul des distances de manière efficace
dist = calculate_route_distance(G, route)
dist_safe = calculate_route_distance(G, route_safe)

print(f"\nItinéraire trouvé!")
print(f"Nombre de nœuds itinéraire rapide: {len(route)}")
print(f"Nombre de nœuds itinéraire sécurisé: {len(route_safe)}")
print(f"Distance totale: {dist:.2f} mètres ({dist/1000:.2f} km)")
print(f"Temps de parcours : {dist/250:.2f} min")
print(f"Distance totale sécurisée: {dist_safe:.2f} mètres ({dist_safe/1000:.2f} km)")
print(f"Temps de parcours : {dist_safe/250:.2f} min")

# Visualisation
route_edges = ox.routing.route_to_gdf(G, route)
route_safe_edges = ox.routing.route_to_gdf(G, route_safe)

m = route_edges.explore(color="red", name="trajet non sécu")
route_safe_edges.explore(m=m, color="green", name="trajet sécu")

# Sauvegarde
m.save("itineraire_2026.html")

