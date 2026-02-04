import osmnx as ox
import networkx as nx

G = ox.graph_from_place(['Pessac, France', 'Talence, France', 'Bordeaux, France'], network_type='bike')

print(f"Number of nodes: {len(G.nodes)}")
print(f"Number of edges: {len(G.edges)}")

home_location = (44.830858626764766, -0.5726974683052055)
work_location = (44.80576134635285, -0.6048652333649405)

home_node = ox.distance.nearest_nodes(G, home_location[1], home_location[0])
work_node = ox.distance.nearest_nodes(G, work_location[1], work_location[0])

print(f"\nNœud du domicile: {home_node}")
print(f"Nœud du travail: {work_node}")

def calculer_penalite(attributes):
    penalite = 1.0
    highway_type = attributes.get('highway', '')
    highway_type = highway_type[0] if isinstance(highway_type, list) else highway_type
    highway_type = highway_type.replace('_link', '').lower()

    if highway_type == 'cycleway':
        penalite *= 0.6
    elif highway_type in ['footway', 'path', 'pedestrian']:
        penalite *= 0.8
    elif highway_type in ['residential', 'living_street']:
        penalite *= 1.0
    elif highway_type == 'tertiary':
        penalite *= 1.3
    elif highway_type == 'secondary':
        penalite *= 1.5
    elif highway_type == 'primary':
        penalite *= 2
    elif highway_type in ['step', 'trunk']:
        penalite *= 5
    elif highway_type == 'motorway':
        penalite *= 10
    else:
        penalite *= 1.3

    surface = attributes.get('surface', 'paved')
    surface = surface[0] if isinstance(surface, list) else surface
    surface = surface.lower()

    if surface in ['paved', 'asphalt', 'concrete', 'concrete:plates', 'paving_stones', 'bricks']:
        penalite *= 1.0
    elif surface in ['cobblestone', 'sett', 'metal', 'concrete:lanes', 'wood', 'grass_paver', 'wood']:
        penalite *= 1.2
    elif surface in ['unhewn_cobblestone']:
        penalite *= 1.5
    elif surface in ['compacted', 'fine_gravel', 'unpaved', 'dirt', 'gravel']:
        penalite *= 2

    return penalite

for u, v, k, data in G.edges(keys=True, data=True):
    penalite = calculer_penalite(data)
    data['weight'] = data.get('length', 1) * penalite


route = nx.shortest_path(G, home_node, work_node, weight='length')
route_length = nx.shortest_path_length(G, home_node, work_node, weight='length')
route_safe = nx.shortest_path(G, home_node, work_node, weight='weight')
route_safe_length = nx.shortest_path_length(G, home_node, work_node, weight='weight')

print(f"\nItinéraire trouvé!")
print(f"Nombre de nœuds dans l'itinéraire: {len(route)}")
print(f"Nombre de nœuds dans l'itinéraire sécurisé: {len(route_safe)}")
print(f"Distance totale: {route_length:.2f} mètres ({route_length/1000:.2f} km)")
print(f"Distance totale sécurisée: {route_safe_length:.2f} mètres ({route_safe_length/1000:.2f} km)")

fig_combined, ax_combined = ox.plot_graph_routes(G, [route, route_safe], route_colors=['red', 'green'], route_linewidths=6, node_size=0, bgcolor='white')