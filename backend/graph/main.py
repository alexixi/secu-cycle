import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import time
import osmnx as ox
from graph_manager import create_graph
from routing import get_optimal_routes, calculate_route_distance
from statistique import calculer_statistiques_osm, analyser_qualite_trajet
from config import VITESSE_M_MIN

def main():    
    print("\nChargement de la carte en cours...")
    G = create_graph("victoire_campus.graphml")
    
    home_location = (44.80362218172566, -0.6139417029663329)  # Campus
    work_location = (44.83091552476591, -0.5731479976089593) # Victoire

    limite_temps = 50 # minutes

    calculer_statistiques_osm(G)

    print(f"\nRecherche des itinéraires (Contrainte : {limite_temps} min max)...")
    start = time.perf_counter()
    
    resultats = get_optimal_routes(G, home_location, work_location, temps_max_min=limite_temps)
    
    end = time.perf_counter()
    print(f"Calculs terminés en {end - start:.2f} secondes !\n")

    if isinstance(resultats, dict) and "error" in resultats:
        print(f"Erreur : {resultats['error']}")
        return

    # Ajout de list() pour convertir les tableaux NumPy en listes natives Python
    fast_coords = resultats["routes"][0]["path"]
    fast = list(ox.distance.nearest_nodes(G, [p[1] for p in fast_coords], [p[0] for p in fast_coords]))
    
    safe_coords = resultats["routes"][1]["path"]
    safe = list(ox.distance.nearest_nodes(G, [p[1] for p in safe_coords], [p[0] for p in safe_coords]))
    
    bounded = None
    if resultats.get("bounded_route"):
        bounded_coords = resultats["bounded_route"]["path"]
        bounded = list(ox.distance.nearest_nodes(G, [p[1] for p in bounded_coords], [p[0] for p in bounded_coords]))

    print("--- RÉSULTATS ---")
    print(f"Trajet Rapide   : {resultats["routes"][0]["distance"]:.3f} km | {resultats["routes"][0]["duration"]:.1f} min")
    print(f"Trajet Sécurisé : {resultats["routes"][1]["distance"]:.3f} km | {resultats["routes"][1]["duration"]:.1f} min")
    
    if bounded != None:
        print(f"Trajet Compromis: {resultats["bounded_route"]["distance"]:.3f} km | {resultats["bounded_route"]["duration"]:.1f} min")
    else:
        print("Compromis impossible ou non pertinent.")

    m = ox.routing.route_to_gdf(G, fast).explore(color="red", name="Rapide", style_kwds={'weight': 5})
    
    ox.routing.route_to_gdf(G, safe).explore(m=m, color="green", name="Sécurisé", style_kwds={'weight': 5})
    
    # Avec des listes natives, cette condition fonctionne parfaitement
    if bounded and bounded != fast and bounded != safe:
        ox.routing.route_to_gdf(G, bounded).explore(m=m, color="blue", name="Compromis (Contrainte Temps)", style_kwds={'weight': 5, 'opacity': 0.8})

    nom_fichier = "itineraire_2026.html"
    m.save(nom_fichier)
    print(f"Carte sauvegardée sous '{nom_fichier}'")

    if fast: analyser_qualite_trajet(G, fast, nom_trajet="Trajet rapide")
    if safe: analyser_qualite_trajet(G, safe, nom_trajet="Trajet sécurisé")
    if bounded: analyser_qualite_trajet(G, bounded, nom_trajet="Trajet limite de temps")

if __name__ == "__main__":
    main()
