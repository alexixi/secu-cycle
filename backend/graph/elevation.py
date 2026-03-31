import osmnx as ox
import math
import requests
import json
import time
import os

def verifier_altitudes(fichier_graphe):
    print(f"1. Chargement du graphe '{fichier_graphe}'...")
    G = ox.load_graphml(fichier_graphe)
    
    total_noeuds = len(G.nodes)
    noeuds_valides = 0
    noeuds_sans_altitude = 0
    altitudes = []

    
    for noeud, data in G.nodes(data=True):
        if 'elevation' in data and not math.isnan(data['elevation']):
            noeuds_valides += 1
            altitudes.append(data['elevation'])
        else:
            noeuds_sans_altitude += 1

    print("================ RAPPORT D'ALTITUDE ================")
    print(f"Nombre total de nœuds examinés : {total_noeuds}")
    print(f"Nœuds AVEC altitude valide     : {noeuds_valides} ({(noeuds_valides/total_noeuds)*100:.1f}%)")
    print(f"Nœuds SANS altitude            : {noeuds_sans_altitude}")
    
    if altitudes:
        alt_max = max(altitudes)
        alt_min = min(altitudes)
        alt_moy = sum(altitudes) / len(altitudes)
        print("----------------------------------------------------")
        print(f"Point le plus haut   : {alt_max:.1f} mètres")
        print(f"Point le plus bas    : {alt_min:.1f} mètres")
        print(f"Altitude moyenne     : {alt_moy:.1f} mètres")
    print("====================================================")

    if noeuds_sans_altitude > 0:
        print("\n Echec")
    else:
        print("\n SUCCÈS")


def create_ign_data_file(filepath_graph, filepath_json):
    G = ox.load_graphml(filepath_graph)
    nodes = list(G.nodes(data=True))
    
    ign_data = {}
    if os.path.exists(filepath_json):
        with open(filepath_json, 'r') as f:
            ign_data = json.load(f)

    chunk_size = 300
    nodes_to_fetch = [n for n in nodes if str(n[0]) not in ign_data]
    
    if not nodes_to_fetch:
        print("Cache IGN à jour.")
        return

    print(f"Téléchargement des altitudes ({len(nodes_to_fetch)} nœuds)...")
    
    for i in range(0, len(nodes_to_fetch), chunk_size):
        chunk = nodes_to_fetch[i:i + chunk_size]
        
        lons = [str(data['x']) for node_id, data in chunk]
        lats = [str(data['y']) for node_id, data in chunk]
        
        url = "https://data.geopf.fr/altimetrie/1.0/calcul/alti/rest/elevation.json"
        params = {"lon": "|".join(lons), "lat": "|".join(lats), "resource": "ign_rge_alti_wld"}
        
        try:
            response = requests.get(url, params=params, timeout=15)
            if response.status_code == 200:
                elevations = response.json().get("elevations", [])
                for j, point in enumerate(elevations):
                    node_id = str(chunk[j][0])
                    ign_data[node_id] = max(0.0, point.get("z", 0.0))
            else:
                print(f"Erreur API ({response.status_code}) au chunk {i}")
        except Exception as e:
            print(f"Erreur réseau : {e}")
            
        time.sleep(0.5)

    with open(filepath_json, 'w') as f:
        json.dump(ign_data, f, indent=4)
        
    print("Succès")

if __name__ == "__main__":
    FICHIER_CARTE = "victoire_campus.graphml"
    FICHIER_TIF = "bordeaux_elevation.tif"
    create_ign_data_file("victoire_campus.graphml", "ign_bordeaux_cache.json")
    verifier_altitudes(FICHIER_CARTE, FICHIER_TIF)

