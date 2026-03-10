import time
import osmnx as ox
from graph_manager import create_graph
from routing import get_optimal_routes
from statistique import calculer_statistiques_osm, analyser_qualite_trajet

def main():    
    print("\nChargement de la carte en cours...")
    G = create_graph("victoire_campus.graphml")
    
    home_location = (44.80675179469633, -0.6049172894710938)  # Campus
    work_location = (44.831248775946655, -0.5725108299552651) # Victoire
    limite_temps = 20 # minutes

    calculer_statistiques_osm(G)

    print(f"\nRecherche des itinéraires (Contrainte : {limite_temps} min max)...")
    start = time.perf_counter()
    
    resultats = get_optimal_routes(G, home_location, work_location, temps_max_min=limite_temps, iterations=30)
    
    end = time.perf_counter()
    print(f"Calculs terminés en {end - start:.2f} secondes !\n")

    if not resultats.get("success"):
        print(f"Erreur : {resultats.get('error')}")
        return

    fast = resultats["fast_route"]
    safe = resultats["safe_route"]
    bounded = resultats.get("bounded_route")

    print("--- RÉSULTATS ---")
    print(f"Trajet Rapide   : {fast['distance']:.0f} m | {fast['temps']:.1f} min")
    print(f"Trajet Sécurisé : {safe['distance']:.0f} m | {safe['temps']:.1f} min")
    
    if bounded:
        print(f"Trajet Compromis: {bounded['distance']:.0f} m | {bounded['temps']:.1f} min (Alpha optimal : {bounded.get('alpha_final', 0):.2f})")
    else:
        print(f"Compromis impossible : {resultats.get('bounded_error')}")

    m = ox.routing.route_to_gdf(G, fast['path']).explore(color="red", name="Rapide", style_kwds={'weight': 5})
    
    ox.routing.route_to_gdf(G, safe['path']).explore(m=m, color="green", name="Sécurisé", style_kwds={'weight': 5})
    
    if bounded and bounded['path'] != fast['path'] and bounded['path'] != safe['path']:
        ox.routing.route_to_gdf(G, bounded['path']).explore(m=m, color="blue", name="Compromis (Contrainte Temps)", style_kwds={'weight': 5, 'opacity': 0.8})

    nom_fichier = "itineraire_2026.html"
    m.save(nom_fichier)
    print(f"Carte sauvegardée sous '{nom_fichier}'. Ouvre-le dans ton navigateur !")

    analyser_qualite_trajet(G, fast['path'], nom_trajet="Trajet rapide")
    analyser_qualite_trajet(G, safe['path'], nom_trajet="Trajet sécurisé")
    analyser_qualite_trajet(G, bounded['path'], nom_trajet="Trajet limite de temps")

if __name__ == "__main__":
    main()