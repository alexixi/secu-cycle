import math
from graph.config import SPEED_BY_INFRASTRUCTURE, DEFAULT_SPEED, BIKE_TYPE_INDEX, LEVEL_MULTIPLIER

def calculer_statistiques_osm(G):
    """
    Calcule le pourcentage de complétion des données brutes d'OpenStreetMap
    et la répartition des types de routes (highway).
    """
    total_edges = 0
    compteur_lit = 0
    compteur_maxspeed = 0
    compteur_surface = 0

    highway_counts = {}

    for u, v, k, data in G.edges(keys=True, data=True):
        total_edges += 1

        if 'lit' in data and data['lit'] not in ['unknown', 'none', '']:
            compteur_lit += 1
            
        if 'maxspeed' in data and data['maxspeed'] not in ['unknown', 'none', '']:
            compteur_maxspeed += 1
            
        if 'surface' in data:
            compteur_surface += 1

        h_type = data.get('highway', 'unknown')
        if isinstance(h_type, list):
            h_type = h_type[0]
            
        highway_counts[h_type] = highway_counts.get(h_type, 0) + 1

    pct_lit = (compteur_lit / total_edges) * 100 if total_edges > 0 else 0
    pct_maxspeed = (compteur_maxspeed / total_edges) * 100 if total_edges > 0 else 0
    pct_surface = (compteur_surface / total_edges) * 100 if total_edges > 0 else 0

    print("\n" + "="*50)
    print("STATISTIQUES DES DONNÉES BRUTES OSM")
    print("="*50)
    print(f"Nombre total de segments : {total_edges}")
    print(f"Vitesse (maxspeed) renseignée : {compteur_maxspeed} ({pct_maxspeed:.1f}%)")
    print(f"Éclairage (lit) renseigné     : {compteur_lit} ({pct_lit:.1f}%)")
    print(f"Surface renseignée           : {compteur_surface} ({pct_surface:.1f}%)\n")
    
    print("RÉPARTITION DES TYPES DE ROUTES (HIGHWAY)")
    print("-" * 50)
    
    highways_tries = sorted(highway_counts.items(), key=lambda x: x[1], reverse=True)
    
    for h_type, count in highways_tries:
        pct = (count / total_edges) * 100
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


def calculate_exact_travel_time(G, route_nodes, bike_type, is_electric, cyclist_level):
    total_time_min = 0.0
    
    idx = 1 if is_electric else BIKE_TYPE_INDEX.get(bike_type.lower(), 0)
    multiplier = 1.0 if is_electric else LEVEL_MULTIPLIER.get(cyclist_level.lower(), 1.0)
    for i in range(len(route_nodes) - 1):
        u, v = route_nodes[i], route_nodes[i + 1]
        edge_data = G.get_edge_data(u, v)
        
        if edge_data:
            data = edge_data[0] if 0 in edge_data else edge_data
            
            length_m = float(data.get('length', 1.0))
            cycleway = data.get("cycleway", "none")
            if isinstance(cycleway, list):
                cycleway = cycleway[0]
                
            speeds = SPEED_BY_INFRASTRUCTURE.get(cycleway, DEFAULT_SPEED)
            speed_kmh = speeds[idx] * multiplier
            speed_m_min = (speed_kmh * 1000) / 60
            
            total_time_min += (length_m / speed_m_min)

    return total_time_min

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
    return distance/1000

def get_route_safety_score(G, route):
    """Calcule et renvoie la note de sécurité moyenne d'un itinéraire (sur 10)."""
    scores = []
    
    for i in range(len(route) - 1):
        u, v = route[i], route[i + 1]
        edge_data = G.get_edge_data(u, v)
        
        if edge_data:
            data = edge_data[0] if isinstance(edge_data, dict) and 0 in edge_data else edge_data
            
            score_brut = float(data.get('safety_score', 0.0))
            scores.append(score_brut)

    if not scores:
        return 0.0

    score_moyen = sum(scores) / len(scores)
    
    return round(score_moyen, 2)

def calculate_infra_stats(G, route):
    total_length = 0.0
    cyclable_length = 0.0
    low_speed_length = 0.0
    lit_length = 0.0

    CYCLABLE_CYCLEWAYS = {'track', 'separate', 'lane', 'shared_busway'}
    CYCLABLE_HIGHWAYS = {'cycleway', 'path'}

    for i in range(len(route) - 1):
        u, v = route[i], route[i + 1]
        edge_data = G.get_edge_data(u, v)
        if not edge_data:
            continue
        data = edge_data[0] if 0 in edge_data else edge_data

        length = float(data.get('length', 0.0))
        total_length += length

        cycleway = data.get('cycleway', 'none')
        if isinstance(cycleway, list):
            cycleway = cycleway[0]
        h_type = data.get('highway', 'unclassified')
        if isinstance(h_type, list):
            h_type = h_type[0]

        if cycleway in CYCLABLE_CYCLEWAYS or h_type in CYCLABLE_HIGHWAYS:
            cyclable_length += length

        try:
            vmax_raw = data.get('maxspeed', None)
            if vmax_raw and str(vmax_raw).lower() not in ('unknown', 'none', 'nan', ''):
                if isinstance(vmax_raw, list):
                    vmax_raw = vmax_raw[0]
                vmax = int(str(vmax_raw).split()[0])
            elif h_type in ('primary', 'primary_link', 'secondary', 'secondary_link'):
                vmax = 50
            else:
                vmax = 30
            if vmax <= 30:
                low_speed_length += length
        except (ValueError, AttributeError):
            low_speed_length += length

        lit = data.get('lit', 'unknown')
        if lit == 'yes':
            lit_length += length
        elif lit not in ('no',) and h_type in ('residential', 'primary', 'secondary', 'tertiary', 'living_street', 'cycleway'):
            lit_length += length * 0.85

    if total_length == 0:
        return {"pct_cyclable": 0.0, "pct_low_speed": 0.0, "pct_lit": 0.0}

    return {
        "pct_cyclable": round(cyclable_length / total_length * 100, 1),
        "pct_low_speed": round(low_speed_length / total_length * 100, 1),
        "pct_lit": round(lit_length / total_length * 100, 1),
    }