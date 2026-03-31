import math 

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

def analyser_qualite_trajet(G, route, nom_trajet="Trajet"):
    """Analyse les types de routes et vitesses empruntés par un itinéraire."""
    from routing import _parse_maxspeed
    vitesses = []
    scores = []
    
    for i in range(len(route) - 1):
        u, v = route[i], route[i + 1]
        edge_data = G.get_edge_data(u, v)
        if edge_data:
            data = edge_data[0] if isinstance(edge_data, dict) and 0 in edge_data else edge_data
            
            # On récupère la vitesse (imputée ou réelle)
            h_type = data.get('highway', 'unknown')
            if isinstance(h_type, list): h_type = h_type[0]
            vmax = _parse_maxspeed(data.get('maxspeed', None), h_type)
            
            vitesses.append(vmax)
            scores.append(data.get('safety_score', 0))

    vitesse_moyenne_axes = sum(vitesses) / len(vitesses) if vitesses else 0
    score_moyen = sum(scores) / len(scores) if scores else 0
    pct_zone30 = sum(1 for v in vitesses if v <= 30) / len(vitesses) * 100 if vitesses else 0

    print(f"\nANALYSE : {nom_trajet}")
    print(f" - Note de sécurité moyenne : {score_moyen:.2f}/10")
    print(f" - Vitesse moyenne des axes empruntés : {vitesse_moyenne_axes:.1f} km/h")
    print(f" - % du trajet en zone apaisée (<= 30 km/h) : {pct_zone30:.1f} %")

def calculate_route_elevation(G, route, window_size=7, threshold=0.15):
    """
    Calcule le dénivelé en appliquant d'abord un lissage (Moyenne Mobile)
    pour effacer le "bruit" du radar (arbres, toits, erreurs de 1m).
    """
    altitudes = []
    for node in route:
        alt = G.nodes[node].get('elevation', 0.0)
        if not math.isnan(alt):
            altitudes.append(alt)
        else:
            altitudes.append(altitudes[-1] if altitudes else 0.0)

    if len(altitudes) < 2:
        return 0.0, 0.0

    altitudes_lissees = []
    for i in range(len(altitudes)):
        debut = max(0, i - window_size // 2)
        fin = min(len(altitudes), i + window_size // 2 + 1)
        
        moyenne = sum(altitudes[debut:fin]) / (fin - debut)
        altitudes_lissees.append(moyenne)

    elevation_gain = 0.0
    elevation_loss = 0.0

    for i in range(len(altitudes_lissees) - 1):
        diff = altitudes_lissees[i+1] - altitudes_lissees[i]

        if diff > threshold:
            elevation_gain += diff
        elif diff < -threshold:
            elevation_loss += abs(diff)

    return round(elevation_gain, 1), round(elevation_loss, 1)
