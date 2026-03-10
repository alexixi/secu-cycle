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