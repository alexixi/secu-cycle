import math 
from datetime import datetime
from astral import LocationInfo
from astral.sun import sun
import pytz
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
        
        # --- Stats de complétion ---
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

def extract_route_geometry(G, route_nodes):
    """
    Extrait les coordonnées exactes du trajet, y compris les courbes des routes.
    Retourne une liste de [lat, lon, elevation].
    """
    path_coords = []
    
    for i in range(len(route_nodes) - 1):
        u = route_nodes[i]
        v = route_nodes[i + 1]
        
        elev_u = G.nodes[u].get("elevation", 0.0)
        
        edge_data = G.get_edge_data(u, v)[0]
        
        if 'geometry' in edge_data:
            for lon, lat in edge_data['geometry'].coords:
                path_coords.append([lat, lon, elev_u])
        else:
            path_coords.append([G.nodes[u]['y'], G.nodes[u]['x'], elev_u])

    last_node = route_nodes[-1]
    elev_last = G.nodes[last_node].get("elevation", 0.0)
    path_coords.append([G.nodes[last_node]['y'], G.nodes[last_node]['x'], elev_last])
    
    return path_coords

def get_bordeaux_lighting_condition(check_time=None):
    """
    Renvoie l'état de la luminosité et de l'éclairage public.
    Retourne : (is_dark_outside, is_public_lighting_on)
    """
    tz = pytz.timezone('Europe/Paris')
    if check_time is None:
        check_time = datetime.now(tz)
    elif check_time.tzinfo is None:
        check_time = tz.localize(check_time)

    bordeaux = LocationInfo("Bordeaux", "France", "Europe/Paris", 44.8378, -0.5792)
    s = sun(bordeaux.observer, date=check_time.date(), tzinfo=bordeaux.timezone)
    
    is_dark_outside = check_time < s['sunrise'] or check_time > s['sunset']
    
    if not is_dark_outside:
        return False, False 

    if 1 <= check_time.hour < 5:
        return True, False 
        
    return True, True