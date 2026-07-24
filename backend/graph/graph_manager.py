import osmnx as ox
import os
import math
import requests
import json
import time


def backend_dir():
    """Racine du backend, à laquelle les chemins de graphes sont relatifs."""
    return os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))


def profile_paths(name):
    """Chemins absolus des fichiers d'un profil, dérivés de son nom.

    La convention `graphs/<nom>.graphml` est celle que suppose déjà
    `make regen-graph`, et que respectent les profils historiques.
    """
    if not name or "/" in name or "\\" in name or ".." in name or name.startswith("."):
        raise ValueError(f"Nom de profil invalide : {name!r}")
    base = backend_dir()
    return {
        "graph_file": os.path.join(base, "graphs", f"{name}.graphml"),
        "ign_cache_file": os.path.join(base, "graphs", f"{name}.ign.json"),
    }


def load_graph_profile():
    """
    Charge le profil de graphe actif, lu en base.

    Les profils sont administrés depuis le dashboard : **la base fait autorité**.
    Le profil marqué par défaut l'emporte, si bien qu'un profil activé depuis le
    dashboard le reste après un redémarrage.

    `GRAPH_PROFILE` n'est plus qu'un filet d'amorçage : elle désigne le profil à
    charger tant qu'aucun n'est marqué par défaut (cas qui ne devrait pas se
    produire, la migration en installant un).

    Retourne un dict avec des chemins absolus :
        {"name": ..., "graph_file": ..., "ign_cache_file": ..., "communes": [...]}.
    """
    from database import SessionLocal
    from models.graph_profile import GraphProfile

    db = SessionLocal()
    try:
        profile = db.query(GraphProfile).filter(GraphProfile.is_default.is_(True)).first()

        if profile is None:
            name = os.getenv("GRAPH_PROFILE")
            if name:
                profile = db.query(GraphProfile).filter(GraphProfile.name == name).first()
                if profile is None:
                    raise RuntimeError(
                        f"GRAPH_PROFILE désigne le profil '{name}', absent de la base."
                    )
            else:
                raise RuntimeError(
                    "Aucun profil de graphe en base. Créez-en un depuis le dashboard "
                    "d'administration, ou vérifiez que les migrations sont appliquées."
                )

        result = {
            "name": profile.name,
            **profile_paths(profile.name),
            "communes": list(profile.communes or []),
            "night_extinction": (profile.night_extinction_start, profile.night_extinction_end),
        }
    finally:
        db.close()

    print(f"Profil de graphe actif : '{result['name']}' "
          f"({len(result['communes'])} communes, fichier : {result['graph_file']})",
          flush=True)
    return result


def create_ign_data_file(filepath_graph, filepath_json, on_progress=None):
    """Télécharge et lisse les altitudes IGN le plus rapidement possible.

    `on_progress(step, done, total)` est appelé au fil des lots, pour alimenter
    la barre de progression du dashboard. `total` vaut None quand l'étape n'est
    pas mesurable.
    """
    def progress(step, done=None, total=None):
        if on_progress is not None:
            on_progress(step, done, total)

    progress("Lecture du graphe")
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
            progress("Altitudes IGN", lot_actuel, total_chunks)

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
    progress("Lissage des altitudes")

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


def _bike_network_filters():
    """Filtres Overpass : réseau cyclable + footways autorisés aux vélos.

    Le filtre `network_type='bike'` d'OSMnx exclut TOUS les `highway=footway`
    (liste d'exclusion : ...|escalator|footway|motor|...|steps). Or beaucoup de
    chemins piétons sont explicitement ouverts aux vélos (`bicycle=yes`,
    `designated`, ...) et constituent des raccourcis légitimes. On les réintègre
    via un second filtre. OSMnx accepte une liste de filtres et fusionne les
    résultats, ce qui laisse le filtre `bike` d'origine intact (oneway respecté,
    gestion des contre-sens inchangée).
    """
    try:
        from osmnx._overpass import _get_network_filter
        bike_filter = _get_network_filter('bike')
    except Exception:
        # Repli : copie du filtre 'bike' d'OSMnx 2.1 (default_access développé).
        bike_filter = (
            '["highway"]["area"!~"yes"]["access"!~"private"]'
            '["highway"!~"abandoned|bus_guideway|construction|corridor|elevator|'
            'escalator|footway|motor|no|planned|platform|proposed|raceway|razed|'
            'rest_area|services|steps"]'
            '["bicycle"!~"no"]["service"!~"private"]'
        )
    footway_bike_filter = (
        '["highway"="footway"]'
        '["bicycle"~"yes|designated|permissive|destination"]'
    )
    return [bike_filter, footway_bike_filter]


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


MIN_COMPONENT_NODES = 500


def contiguous_zones(communes):
    """Regroupe les communes en zones d'un seul tenant, et renvoie leurs polygones.

    Indispensable : osmnx n'envoie à Overpass qu'**une seule** partie d'un
    MultiPolygon (`_make_overpass_polygon_coord_strs` en renvoie une seule
    chaîne). Passer d'un coup des communes non limitrophes ferait donc
    silencieusement disparaître toutes les zones sauf une — vérifié : un profil
    « Antoing + Leuze-en-Hainaut » ne téléchargeait que Leuze.

    On interroge donc Overpass une fois par zone contiguë, avec un polygone
    simple à chaque fois. Découper commune par commune ne conviendrait pas : les
    routes traversant une frontière communale seraient coupées, créant des
    ruptures artificielles à l'intérieur d'une même agglomération.
    """
    from shapely.ops import unary_union

    gdf = ox.geocode_to_gdf(communes)
    merged = unary_union(list(gdf.geometry))
    zones = list(merged.geoms) if merged.geom_type == "MultiPolygon" else [merged]

    print(f"[Graphe] {len(communes)} commune(s) réparties en {len(zones)} zone(s) contiguë(s).",
          flush=True)
    return zones


def keep_strong_components(G, min_nodes=MIN_COMPONENT_NODES):
    """Conserve toutes les composantes fortement connexes d'au moins `min_nodes` nœuds.

    On ne garde pas que la plus grande : un profil peut couvrir plusieurs zones
    sans continuité routière entre elles (Bordeaux et Tournai, par exemple).
    Un trajet demandé d'une zone à l'autre échoue proprement — `get_optimal_routes`
    renvoie « Aucun itinéraire trouvé » —, ce qui est le comportement attendu.

    La connexité *forte* reste exigée à l'intérieur de chaque composante : elle
    élimine les nœuds où l'on peut entrer sans pouvoir ressortir (impasses en
    sens unique), dans lesquels un itinéraire pourrait sinon s'engager.

    Si aucune composante n'atteint le seuil, on garde la plus grande : mieux vaut
    un petit graphe qu'un graphe vide (cas d'une commune minuscule).
    """
    import networkx as nx

    components = [c for c in nx.strongly_connected_components(G) if len(c) >= min_nodes]

    if not components:
        largest = max(nx.strongly_connected_components(G), key=len, default=set())
        if not largest:
            return G
        components = [largest]

    kept = set().union(*components)
    removed = G.number_of_nodes() - len(kept)
    print(
        f"[Graphe] {len(components)} zone(s) conservée(s), "
        f"{len(kept)} nœuds ; {removed} nœuds isolés écartés.",
        flush=True,
    )
    return G.subgraph(kept).copy()


def create_graph(filename, filepath_json, communes, on_progress=None):
    """
    Charge le graphe ou le crée s'il n'existe pas,
    puis met à jour automatiquement les données IGN.

    `communes` : liste des communes (format Nominatim "Nom, France") utilisée
    uniquement à la génération si le fichier `filename` n'existe pas encore.

    `on_progress(step, done, total)` : facultatif, alimente la barre de
    progression du dashboard. `total` est None pour les étapes non mesurables
    (l'appel Overpass est un bloc opaque, on ne peut qu'annoncer qu'il tourne).
    """
    def progress(step, done=None, total=None):
        if on_progress is not None:
            on_progress(step, done, total)

    if os.path.exists(filename):
        print("Chargement du graphe depuis le fichier local...")
        progress("Lecture du graphe")
        G = ox.load_graphml(filepath=filename)
        if not os.path.exists(filepath_json):
            print("Cache d'altitudes IGN absent : (re)génération en cours...")
            create_ign_data_file(filename, filepath_json, on_progress)
    else:
        print("Création du graphe complet de la métropole en cours (cela peut prendre quelques minutes)...")

        extra_tags = [
            'cycleway', 'cycleway:left', 'cycleway:right', 'cycleway:both',
            'oneway', 'oneway:bicycle', 'bicycle', 'segregated',
            'surface', 'smoothness', 'tracktype', 'width', 'lanes',
            'lit', 'lit:conditional', 'maxspeed',
        ]
        ox.settings.useful_tags_way = list(set(ox.settings.useful_tags_way + extra_tags))

        import networkx as nx

        zones = contiguous_zones(communes)
        graphs = []
        for i, zone in enumerate(zones, start=1):
            progress("Téléchargement OpenStreetMap", i - 1, len(zones))
            print(f"[Graphe] Téléchargement de la zone {i}/{len(zones)}...", flush=True)
            graphs.append(ox.graph_from_polygon(
                zone, network_type='bike', custom_filter=_bike_network_filters()))

        G = graphs[0] if len(graphs) == 1 else nx.compose_all(graphs)
        G = keep_strong_components(G)

        progress("Ajout des contre-sens cyclables")
        G = add_contraflow_edges(G)

        progress("Enregistrement du graphe")
        os.makedirs(os.path.dirname(os.path.abspath(filename)), exist_ok=True)
        ox.save_graphml(G, filepath=filename)
        print("Graphe téléchargé et sauvegardé avec succès.")

        print("Lancement de la mise à jour des altitudes IGN...")
        create_ign_data_file(filename, filepath_json, on_progress)

    return G

def load_graph_with_ign(filepath_graph, filepath_json, communes, night_extinction=None):
    """Charge le graphe routier et y injecte le cache d'altitudes IGN.

    `night_extinction` = (start_h, end_h) du profil actif, posé sur `G.graph`
    pour que le routage l'utilise comme fenêtre d'extinction de repli.
    """
    G = create_graph(filepath_graph, filepath_json, communes)
    G.graph['_extinction_window'] = night_extinction

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

    from graph.accidents import attach_accident_risk
    attach_accident_risk(G)

    # Inférence d'éclairage à partir des lampadaires (table street_lamps), pour
    # densifier le tag OSM `lit` là où il manque. Doit précéder le précalcul des
    # coûts statiques, qui en dépend.
    from graph.lighting import attach_lighting
    attach_lighting(G)

    # Précalcule une fois les composantes de coût statiques des arêtes
    # et l'index spatial des nœuds (recherche du point d'accroche).
    from graph.routing import precompute_static_costs, precompute_nearest_node_index
    precompute_static_costs(G)
    precompute_nearest_node_index(G)

    return G

