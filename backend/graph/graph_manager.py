import osmnx as ox
import os
import math
import requests
import json
import time


def load_graph_profile():
    """
    Charge le profil de graphe actif depuis le fichier de configuration JSON.

    Le fichier est désigné par la variable d'environnement GRAPH_CONFIG
    (défaut : graphs.json à la racine du backend). Le profil actif est
    désigné par GRAPH_PROFILE (défaut : la clé "default_profile" du fichier).

    Retourne un dict avec des chemins absolus :
        {"graph_file": ..., "ign_cache_file": ..., "communes": [...]}.
    Les chemins du fichier de config sont résolus relativement au dossier de
    ce fichier, pour rester stables quel que soit le répertoire courant.
    """
    default_config = os.path.join(os.path.dirname(__file__), "..", "graphs.json")
    config_path = os.path.abspath(os.getenv("GRAPH_CONFIG", default_config))

    with open(config_path, "r", encoding="utf-8") as f:
        config = json.load(f)

    name = os.getenv("GRAPH_PROFILE") or config.get("default_profile")
    profiles = config.get("profiles", {})
    if name not in profiles:
        raise RuntimeError(
            f"Profil de graphe '{name}' introuvable dans {config_path}. "
            f"Profils disponibles : {', '.join(profiles) or 'aucun'}."
        )

    profile = profiles[name]
    print(f"Profil de graphe actif : '{name}' "
          f"({len(profile['communes'])} communes, fichier : {profile['graph_file']})",
          flush=True)
    base = os.path.dirname(config_path)
    return {
        "graph_file": os.path.join(base, profile["graph_file"]),
        "ign_cache_file": os.path.join(base, profile["ign_cache_file"]),
        "communes": profile["communes"],
    }


def create_ign_data_file(filepath_graph, filepath_json):
    """Télécharge et lisse les altitudes IGN le plus rapidement possible."""
    G = ox.load_graphml(filepath_graph)
    nodes = list(G.nodes(data=True))

    ign_data = {}
    if os.path.exists(filepath_json):
        with open(filepath_json, 'r') as f:
            ign_data = json.load(f)

    chunk_size = 300
    nodes_to_fetch = [n for n in nodes if str(n[0]) not in ign_data]

    if nodes_to_fetch:
        total_chunks = (len(nodes_to_fetch) // chunk_size) + 1
        print(f"Téléchargement des altitudes ({len(nodes_to_fetch)} nœuds, {total_chunks} lots)...")

        # OPTIMISATION MAJEURE : Utilisation d'une Session pour réutiliser la connexion TCP/SSL
        session = requests.Session()
        url = "https://data.geopf.fr/altimetrie/1.0/calcul/alti/rest/elevation.json"

        for i in range(0, len(nodes_to_fetch), chunk_size):
            lot_actuel = (i // chunk_size) + 1
            print(f"-> Traitement du lot {lot_actuel}/{total_chunks}...")

            chunk = nodes_to_fetch[i:i + chunk_size]
            lons = [str(data['x']) for node_id, data in chunk]
            lats = [str(data['y']) for node_id, data in chunk]

            params = {"lon": "|".join(lons), "lat": "|".join(lats), "resource": "ign_rge_alti_wld"}

            try:
                response = session.get(url, params=params, timeout=15)
                if response.status_code == 200:
                    elevations = response.json().get("elevations", [])
                    for j, point in enumerate(elevations):
                        node_id = str(chunk[j][0])
                        z = point.get("z")

                        if z is None or z < -100:
                            ign_data[node_id] = None
                        else:
                            ign_data[node_id] = max(0.0, z)
                else:
                    print(f"   Erreur API ({response.status_code}) au lot {lot_actuel}")
            except Exception as e:
                print(f"   Erreur réseau au lot {lot_actuel} : {e}")

            # Pause réduite car la session gère mieux la charge
            time.sleep(0.1)

    print("Vérification et lissage des données manquantes...")

    for node_id in list(ign_data.keys()):
        if ign_data[node_id] == 0.0:
            ign_data[node_id] = None

    for passe in range(3):
        valeurs_corrigees = 0
        for node, data in G.nodes(data=True):
            node_id = str(node)
            if ign_data.get(node_id) is None:
                voisins = set(list(G.successors(node)) + list(G.predecessors(node)))
                altitudes_voisins = [ign_data[str(v)] for v in voisins if str(v) in ign_data and ign_data[str(v)] is not None]

                if altitudes_voisins:
                    moyenne = sum(altitudes_voisins) / len(altitudes_voisins)
                    ign_data[node_id] = round(moyenne, 2)
                    valeurs_corrigees += 1

        print(f"-> Passe de lissage {passe + 1}/3 : {valeurs_corrigees} points corrigés")
        if valeurs_corrigees == 0:
            break

    for node_id in ign_data:
        if ign_data[node_id] is None:
            ign_data[node_id] = 10.0

    with open(filepath_json, 'w') as f:
        json.dump(ign_data, f, indent=4)

    print("Succès : Fichier d'altitudes mis à jour.")


def _tag_values(data, *keys):
    """Renvoie l'ensemble des valeurs (normalisées en liste) pour des tags OSM."""
    values = set()
    for key in keys:
        v = data.get(key)
        if v is None:
            continue
        if isinstance(v, list):
            values.update(str(x).lower() for x in v)
        else:
            values.add(str(v).lower())
    return values


# Valeurs de cycleway indiquant un aménagement à contre-sens, et leur
# équivalent « dans le sens de circulation » pour le scoring de l'arête inverse.
_CONTRAFLOW_CYCLEWAY = {'opposite': 'shared_lane', 'opposite_lane': 'lane',
                        'opposite_track': 'track'}


def add_contraflow_edges(G):
    """Ajoute les arêtes inverses pour les contre-sens cyclables.

    OSMnx (network_type='bike') respecte `oneway` pour tous : une rue à sens
    unique ouverte aux vélos à contre-sens (oneway:bicycle=no, cycleway*=opposite*)
    n'a donc qu'une arête u→v. On ajoute ici l'arête v→u manquante, avec une
    géométrie inversée, marquée `contraflow=True`.
    """
    from shapely.geometry import LineString

    to_add = []
    for u, v, k, data in list(G.edges(keys=True, data=True)):
        if G.has_edge(v, u):
            continue

        oneway_bike = _tag_values(data, 'oneway:bicycle')
        if 'yes' in oneway_bike:
            continue

        cw_values = _tag_values(data, 'cycleway', 'cycleway:left',
                                'cycleway:right', 'cycleway:both')
        contraflow_cw = cw_values & set(_CONTRAFLOW_CYCLEWAY)

        allowed = ('no' in oneway_bike) or bool(contraflow_cw)
        if not allowed:
            continue

        new_data = dict(data)
        geom = data.get('geometry')
        if isinstance(geom, LineString):
            new_data['geometry'] = LineString(list(geom.coords)[::-1])
        new_data['contraflow'] = True
        new_data['oneway'] = False
        if contraflow_cw:
            new_data['cycleway'] = _CONTRAFLOW_CYCLEWAY[sorted(contraflow_cw)[0]]
        to_add.append((v, u, new_data))

    for v, u, new_data in to_add:
        G.add_edge(v, u, **new_data)

    print(f"[Contre-sens] {len(to_add)} arêtes cyclables à contre-sens ajoutées.", flush=True)
    return G


def create_graph(filename, filepath_json, communes):
    """
    Charge le graphe ou le crée s'il n'existe pas,
    puis met à jour automatiquement les données IGN.

    `communes` : liste des communes (format Nominatim "Nom, France") utilisée
    uniquement à la génération si le fichier `filename` n'existe pas encore.
    """
    if os.path.exists(filename):
        print("Chargement du graphe depuis le fichier local...")
        G = ox.load_graphml(filepath=filename)
        if not os.path.exists(filepath_json):
            print("Cache d'altitudes IGN absent : (re)génération en cours...")
            create_ign_data_file(filename, filepath_json)
    else:
        print("Création du graphe complet de la métropole en cours (cela peut prendre quelques minutes)...")

        extra_tags = [
            'cycleway', 'cycleway:left', 'cycleway:right', 'cycleway:both',
            'oneway', 'oneway:bicycle', 'bicycle', 'segregated',
            'surface', 'smoothness', 'tracktype', 'width', 'lanes',
            'lit', 'maxspeed',
        ]
        ox.settings.useful_tags_way = list(set(ox.settings.useful_tags_way + extra_tags))

        G = ox.graph_from_place(communes, network_type='bike')
        G = ox.truncate.largest_component(G, strongly=True)
        G = add_contraflow_edges(G)

        os.makedirs(os.path.dirname(os.path.abspath(filename)), exist_ok=True)
        ox.save_graphml(G, filepath=filename)
        print("Graphe téléchargé et sauvegardé avec succès.")

        print("Lancement de la mise à jour des altitudes IGN...")
        create_ign_data_file(filename, filepath_json)

    return G

def load_graph_with_ign(filepath_graph, filepath_json, communes):
    """Charge le graphe routier et y injecte le cache d'altitudes IGN."""
    G = create_graph(filepath_graph, filepath_json, communes)

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

    # Précalcule une fois les composantes de coût statiques des arêtes
    # et l'index spatial des nœuds (recherche du point d'accroche).
    from graph.routing import precompute_static_costs, precompute_nearest_node_index
    precompute_static_costs(G)
    precompute_nearest_node_index(G)

    return G

def update_graph_with_traffic(G):
    """
    Version Haute Performance (Vectorisée) pour la mise à jour du trafic.
    """
    url = "https://opendata.bordeaux-metropole.fr/api/explore/v2.1/catalog/datasets/ci_trafi_l/records"

    query = 'etat in ("EMBOUTEILLE", "DENSE")'

    params = {
        "where": query,
        "limit": 100,
        "select": "geo_shape"
    }

    try:
        response = requests.get(url, params=params, timeout=5)
        response.raise_for_status()
        records = response.json().get('results', [])
    except Exception as e:
        print(f"Erreur API Trafic : {e}")
        return G

    lons = []
    lats = []

    for record in records:
        geometry = record.get('geo_shape', {}).get('geometry', {})
        if geometry.get('type') == 'LineString':
            coords = geometry.get('coordinates', [])
            if not coords: continue

            step = max(1, len(coords) // 3)
            for i in range(0, len(coords), step):
                lons.append(coords[i][0])
                lats.append(coords[i][1])

            lons.append(coords[-1][0])
            lats.append(coords[-1][1])

    congested_nodes = set()

    if lons and lats:
        try:
            nearest_nodes = ox.distance.nearest_nodes(G, X=lons, Y=lats)
            congested_nodes = set(nearest_nodes)
        except Exception as e:
            print(f"Erreur de calcul spatial : {e}")

    segments_count = 0
    for u, v, k, data in G.edges(keys=True, data=True):
        if u in congested_nodes or v in congested_nodes:
            data['traffic_jam'] = True
            segments_count += 1
        else:
            data['traffic_jam'] = False

    print(f"[Trafic] Mise à jour : {len(records)} zones reçues, {segments_count} segments impactés.", flush=True)
    return G
