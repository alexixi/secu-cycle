import osmnx as ox
import os

def create_graph(filename):
    """Charge ou crée le graphe du réseau cyclable."""
    if os.path.exists(filename):
        G = ox.load_graphml(filepath=filename)
        print("Graphe chargé depuis le fichier local.")
    else:
        useful_tags = ox.settings.useful_tags_way + ['cycleway', 'lit', 'maxspeed', 'surface']
        ox.settings.useful_tags_way = list(set(useful_tags))
        G = ox.graph_from_place(
            ['Pessac, France', 'Talence, France', 'Bordeaux, France'],
            network_type='bike'
        )
        G = ox.truncate.largest_component(G, strongly=True)
        ox.save_graphml(G, filepath=filename)
    return G

def calculer_statistiques_osm(G):
    """
    Calcule le pourcentage de complétion des données brutes d'OpenStreetMap
    et la répartition des types de routes (highway).
    """
    total_edges = 0
    compteur_lit = 0
    compteur_maxspeed = 0
    compteur_surface = 0
    
    # Dictionnaire pour stocker le comptage de chaque type de route
    highway_counts = {}

    for u, v, k, data in G.edges(keys=True, data=True):
        total_edges += 1
        
        # --- Stats de complétion ---
        if 'lit' in data and data['lit'] not in ['unknown', 'none', '']:
            compteur_lit += 1
            
        if 'maxspeed' in data and data['maxspeed'] not in ['unknown', 'none', '']:
            compteur_maxspeed += 1
            
        if 'surface' in data:
            compteur_surface += 1

        # --- NOUVEAU : Comptage des types de routes ---
        h_type = data.get('highway', 'unknown')
        # OSMnx renvoie parfois une liste si plusieurs tags fusionnent
        if isinstance(h_type, list):
            h_type = h_type[0]
            
        # On ajoute +1 au compteur de ce type de route
        highway_counts[h_type] = highway_counts.get(h_type, 0) + 1

    # Calcul des pourcentages globaux
    pct_lit = (compteur_lit / total_edges) * 100 if total_edges > 0 else 0
    pct_maxspeed = (compteur_maxspeed / total_edges) * 100 if total_edges > 0 else 0
    pct_surface = (compteur_surface / total_edges) * 100 if total_edges > 0 else 0

    # --- AFFICHAGE ---
    print("\n" + "="*50)
    print("STATISTIQUES DES DONNÉES BRUTES OSM")
    print("="*50)
    print(f"Nombre total de segments : {total_edges}")
    print(f"Vitesse (maxspeed) renseignée : {compteur_maxspeed} ({pct_maxspeed:.1f}%)")
    print(f"Éclairage (lit) renseigné     : {compteur_lit} ({pct_lit:.1f}%)")
    print(f"Surface renseignée           : {compteur_surface} ({pct_surface:.1f}%)\n")
    
    print("RÉPARTITION DES TYPES DE ROUTES (HIGHWAY)")
    print("-" * 50)
    
    # On trie le dictionnaire par valeur décroissante pour un bel affichage
    highways_tries = sorted(highway_counts.items(), key=lambda x: x[1], reverse=True)
    
    for h_type, count in highways_tries:
        pct = (count / total_edges) * 100
        # Le <15 permet d'aligner le texte proprement sur 15 caractères
        print(f" - {h_type:<15} : {count:>5} segments ({pct:.1f}%)")
        
    print("="*50 + "\n")
    
    return {
        "total": total_edges,
        "pct_lit": pct_lit,
        "pct_maxspeed": pct_maxspeed,
        "highway_counts": highway_counts
    }