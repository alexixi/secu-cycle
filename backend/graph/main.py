import time
import osmnx as ox
from graph_manager import create_graph
from routing import calculate_weights, get_routes_from_coords
from config import VITESSE_M_MIN

def main():
    print("--- Démarrage de l'analyse réseau ---")
    G = create_graph("victoire_campus.graphml")
    
    G = calculate_weights(G, alpha=0)

    home_location = (44.80660548319982, -0.6049046483120086) # Campus
    work_location = (44.83118685447089, -0.5725666164697867) # Victoire

    print("\nCalcul des itinéraires en cours...")

    resultats = get_routes_from_coords(G, home_location, work_location)

    if not resultats["success"]:
        print(f"Erreur : {resultats['error']}")
        return

    # Extraction des données renvoyées par la fonction
    route_fast = resultats["fast_route"]["path"]
    dist_fast = resultats["fast_route"]["distance"]
    
    route_safe = resultats["safe_route"]["path"]
    dist_safe = resultats["safe_route"]["distance"]

    # --- AFFICHAGE CONSOLE ---
    print(f"\nRAPIDE   : {dist_fast/1000:.2f} km | Temps : {dist_fast/VITESSE_M_MIN:.2f} min")
    print(f"SÉCURISÉ : {dist_safe/1000:.2f} km | Temps : {dist_safe/VITESSE_M_MIN:.2f} min")

    # --- VISUALISATION ---
    route_edges = ox.routing.route_to_gdf(G, route_fast)
    route_safe_edges = ox.routing.route_to_gdf(G, route_safe)

    m = route_edges.explore(color="red", name="Trajet Rapide")
    route_safe_edges.explore(m=m, color="green", name="Trajet Sécurisé")
    
    m.save("itineraire_2026.html")
    print("Carte mise à jour : itineraire_2026.html")

if __name__ == "__main__":
    main()