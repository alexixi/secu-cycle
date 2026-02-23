import osmnx as ox
import networkx as nx
import time
import os

def get_safety_weight(G):
    score_highway = {
        'cycleway': 10, 'footway': 9, 'residential': 8, 'path': 7,
        'living_street': 6, 'service': 5, 'unclassified': 4,
        'tertiary': 3, 'secondary': 2, 'primary': 1
    }
    
    score_cycleway = {
        'track': 5, 'shared_busway': 4, 'lane': 3, 'shared_lane': 2, 'none': 1
    }

    for u, v, k, data in G.edges(keys=True, data=True):
        h_type = data.get('highway', 'unclassified')
        if isinstance(h_type, list): 
            h_type = h_type[0]
        n_highway = score_highway.get(h_type, 1)

        c_type = data.get('cycleway', 'none')
        if isinstance(c_type, list): 
            c_type = c_type[0]
        n_cycleway = score_cycleway.get(c_type, 1)

        lit = data.get('lit', 'unknown')
        if lit == 'yes': 
            n_lit = 1
        elif lit == 'no': 
            n_lit = 0
        else: 
            n_lit = 0.5

        vmax = data.get('maxspeed', 30)
        if isinstance(vmax, list): 
            vmax = vmax[0]
        try:
            vmax = int(str(vmax).split()[0])
        except ValueError:
            if h_type == 'cycleway':
                vmax = 25
            else:
                vmax = 30

        if vmax <= 20: 
            n_vitesse = 10
        elif vmax <= 30: 
            n_vitesse = 8
        elif vmax <= 50: 
            n_vitesse = 4
        else: 
            n_vitesse = 1

        score = (n_highway * 0.15) + (n_cycleway * 0.2) + (n_vitesse * 0.35) + (n_lit * 0.3)

        dist = data.get('length', 1)
        data['safety_weight'] = dist / score
    return G

def create_graph(filename):
    if os.path.exists(filename):
        G = ox.load_graphml(filepath=filename)
        print("Graphe chargé depuis le fichier local.")
    else:
        useful_tags = ox.settings.useful_tags_way + ['cycleway', 'lit', 'maxspeed', 'surface']
        ox.settings.useful_tags_way = list(set(useful_tags))
        G = ox.graph_from_place(['Pessac, France', 'Talence, France', 'Bordeaux, France'], network_type='bike')
        ox.save_graphml(G, filepath=filename)
    return G


def appliquer_poids_hybride_robuste(G, alpha=0.5):
    """
    alpha = 1.0 -> 100% Distance (Rapide)
    alpha = 0.0 -> 100% Sécurité (Sûr)
    """
    # 1. On extrait les scores pour trouver le min et le max
    edges_df = ox.graph_to_gdfs(G, nodes=False)
    
    # On s'assure que c'est bien du numérique
    scores = edges_df['safety_weight']
    lengths = edges_df['length']
    
    s_min, s_max = scores.min(), scores.max()
    l_min, l_max = lengths.min(), lengths.max()

    # Empêcher la division par zéro si tous les scores sont identiques
    s_range = (s_max - s_min) if s_max != s_min else 1
    l_range = (l_max - l_min) if l_max != l_min else 1

    for u, v, k, data in G.edges(keys=True, data=True):
        # Normalisation de la distance (0 = court, 1 = long)
        norm_dist = (float(data['length']) - l_min) / l_range
        
        # Normalisation de la sécurité (On veut minimiser le RISQUE)
        # On inverse : 0 = très sûr (score max), 1 = dangereux (score min)
        score_brut = float(data.get('safety_weight', s_min))
        norm_risque = (s_max - score_brut) / s_range
        
        # Calcul du poids hybride final
        data['hybrid_weight'] = (alpha * norm_dist) + ((1 - alpha) * norm_risque)

    return G

start = time.perf_counter()

G = create_graph("victoire_campus.graphml") 

end = time.perf_counter()

print(f"Temps d'exécution création : {end - start:.6f} secondes")

get_safety_weight(G)
appliquer_poids_hybride_robuste(G, 0)

print(f"Number of nodes: {len(G.nodes)}")
print(f"Number of edges: {len(G.edges)}")

home_location = (44.83115759887497, -0.5725748628662581)
work_location = (44.80658815503044, -0.6048716889793526)

home_node = ox.distance.nearest_nodes(G, home_location[1], home_location[0])
work_node = ox.distance.nearest_nodes(G, work_location[1], work_location[0])

print(f"\nNœud du domicile: {home_node}")
print(f"Nœud du travail: {work_node}")

start = time.perf_counter()
route = nx.shortest_path(G, home_node, work_node, weight='length')
end = time.perf_counter()

print(f"Temps d'exécution itineraire : {end - start:.6f} secondes")

route_safe = nx.shortest_path(G, home_node, work_node, weight='hybrid_weight')

dist = ox.routing.route_to_gdf(G, route)['length'].sum()
dist_safe = ox.routing.route_to_gdf(G, route_safe)['length'].sum()




print(f"\nItinéraire trouvé!")
print(f"Nombre de nœuds dans l'itinéraire: {len(route)}")
print(f"Nombre de nœuds dans l'itinéraire sécurisé: {len(route_safe)}")
print(f"Distance totale: {dist:.2f} mètres ({dist/1000:.2f} km)")
print(f"Temps de parcours : {dist/250:.2f} min")
print(f"Distance totale sécurisée: {dist_safe:.2f} mètres ({dist_safe/1000:.2f} km)")
print(f"Temps de parcours : {dist_safe/250:.2f} min")

nodes, edges = ox.graph_to_gdfs(G)

route_edges = ox.routing.route_to_gdf(G, route)
route_safe_edges = ox.routing.route_to_gdf(G, route_safe)

m = route_edges.explore(color="red", name="trajet non sécu")

route_safe_edges.explore(m=m, color="green", name="trajet sécu")

# 5. Sauvegarde
m.save("itineraire_2026.html")

