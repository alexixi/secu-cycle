import osmnx as ox
import os
import math
import requests
import json

def create_graph(filename):
    """
    Loads the graph and injects elevation data.
    """
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
    
def load_graph_with_ign(filepath_graph, filepath_json):
    """Charge le graphe routier et y injecte le cache d'altitudes IGN."""
    G = create_graph(filepath_graph)
    
    with open(filepath_json, 'r') as f:
        ign_data = json.load(f)

    for node, data in G.nodes(data=True):
        node_id_str = str(node) 
        
        if node_id_str in ign_data and ign_data[node_id_str] is not None:
            data['elevation'] = float(ign_data[node_id_str])
        else:
            neighbors = list(G.successors(node)) + list(G.predecessors(node))
            elevations = [G.nodes[v].get('elevation') for v in neighbors if 'elevation' in G.nodes[v]]
            
            if elevations:
                data['elevation'] = sum(elevations) / len(elevations)
            else:
                data['elevation'] = 15.0 

    G = ox.elevation.add_edge_grades(G, add_absolute=True)
    
    return G