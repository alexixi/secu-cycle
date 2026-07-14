import osmnx as ox
import networkx as nx
import numpy as np
from sklearn.neighbors import BallTree
from shapely.geometry import Point, LineString
from shapely.ops import substring
from graph.config import *
from graph.statistique import calculate_route_elevation, calculate_exact_travel_time, calculate_route_distance, get_route_safety_score, extract_route_geometry, get_bordeaux_lighting_condition, calculate_infra_stats
from graph.route_cache import route_cache

def _get_speed_score(vmax):
    if vmax <= 20: return 10
    elif vmax <= 30: return 8
    elif vmax <= 50: return 3
    else: return 1

def _parse_maxspeed(vmax, h_type):
    if vmax and str(vmax).lower() not in ['unknown', 'none', 'nan', '']:
        if isinstance(vmax, list): vmax = vmax[0]
        try: return int(str(vmax).split()[0])
        except: pass
    return 30

def _get_lit_score(lit, h_type):
    if lit == 'yes': return 10.0
    elif lit == 'no': return 0.0
    return 7.0

def _first(value, default=None):
    """Normalise un tag OSM potentiellement sous forme de liste."""
    if isinstance(value, list):
        return value[0] if value else default
    return value if value is not None else default

def _edge_roughness(data):
    """Rugosité [0, 1] d'un segment, dérivée de surface / smoothness / tracktype.

    On retient le signal le plus pessimiste disponible ; en l'absence de toute
    information, on renvoie DEFAULT_ROUGHNESS (prudence légère).
    """
    signals = []
    surface = _first(data.get('surface'))
    if surface is not None and surface in SURFACE_ROUGHNESS:
        signals.append(SURFACE_ROUGHNESS[surface])
    smooth = _first(data.get('smoothness'))
    if smooth is not None and smooth in SMOOTHNESS_ROUGHNESS:
        signals.append(SMOOTHNESS_ROUGHNESS[smooth])
    track = _first(data.get('tracktype'))
    if track is not None and track in TRACKTYPE_ROUGHNESS:
        signals.append(TRACKTYPE_ROUGHNESS[track])
    return max(signals) if signals else DEFAULT_ROUGHNESS

def _edge_quality(data):
    """Source unique de vérité du scoring d'un segment.

    Renvoie (score_on, score_off, roughness), tous bike-indépendants :
    - score_on  : score de sécurité [0, 10] avec prise en compte de l'éclairage
    - score_off : score de sécurité [0, 10] sans composante éclairage
    - roughness : rugosité du revêtement [0, 1]
    """
    h_type = _first(data.get('highway'), 'unclassified')
    n_highway = SCORE_HIGHWAY.get(h_type, 1)

    c_type = _first(data.get('cycleway'), 'none')

    vmax = _parse_maxspeed(data.get('maxspeed', 30), h_type)
    n_speed = _get_speed_score(vmax)

    if h_type == 'cycleway' or c_type in ['track', 'separate']:
        n_highway, n_cycleway, n_speed = 10.0, 10.0, 10.0
    elif c_type in ['lane', 'shared_busway', 'opposite_lane', 'opposite_track']:
        n_cycleway = 7.0
        if n_speed < 8.0: n_speed = 8.0
    elif c_type == 'none' and vmax <= 30 and h_type in ['residential', 'living_street', 'pedestrian']:
        n_cycleway = 6.0
    else:
        n_cycleway = SCORE_CYCLEWAY.get(c_type, 1)

    bicycle = _first(data.get('bicycle'))
    if bicycle == 'designated':
        n_cycleway = min(10.0, n_cycleway + BICYCLE_DESIGNATED_BONUS)
    elif bicycle == 'dismount':
        n_cycleway = max(0.0, n_cycleway - BICYCLE_DISMOUNT_PENALTY)

    if _first(data.get('segregated')) == 'yes':
        n_cycleway = min(10.0, n_cycleway + SEGREGATED_BONUS)

    width = _parse_float(_first(data.get('width')))
    if width is not None and width < NARROW_WIDTH_M:
        n_highway = max(0.0, n_highway - NARROW_WIDTH_PENALTY)

    lanes = _parse_float(_first(data.get('lanes')))
    if lanes is not None and lanes >= MULTILANE_LANES and n_cycleway < 7.0:
        n_speed = max(0.0, n_speed - MULTILANE_PENALTY)

    if data.get('contraflow'):
        n_cycleway = max(0.0, n_cycleway - CONTRAFLOW_PENALTY)

    n_lit = _get_lit_score(_first(data.get('lit'), 'unknown'), h_type)

    score_on = (n_highway * 0.20) + (n_cycleway * 0.30) + (n_speed * 0.35) + (n_lit * 0.15)
    score_off = (n_highway * 0.25) + (n_cycleway * 0.30) + (n_speed * 0.45)
    return score_on, score_off, _edge_roughness(data)

def _parse_float(value):
    """Parse robuste d'un tag numérique OSM ('3.5 m', '2', etc.)."""
    if value is None:
        return None
    try:
        return float(str(value).split()[0].replace(',', '.'))
    except (ValueError, IndexError):
        return None

def _apply_report_penalty(weight_base, report_type, alpha):
    if not report_type: return max(0.1, weight_base)
    penalite = REPORT_PENALTIES.get(report_type, 2.0)
    if report_type == 'accident': return weight_base * penalite
    return weight_base * (1.0 + (penalite * (1.0 - alpha)))

def precompute_static_costs(G):
    """Pré-calcul des coûts statiques pour chaque arête du graphe, en fonction de la sécurité et de l'effort."""
    min_on = min_off = float('inf')
    max_on = max_off = float('-inf')
    lighting_on = get_bordeaux_lighting_condition()[1]

    for u, v, k, data in G.edges(keys=True, data=True):
        score_on, score_off, roughness = _edge_quality(data)
        data['_s_on'], data['_s_off'] = score_on, score_off
        data['_roughness'] = roughness

        h_type = _first(data.get('highway'), 'unclassified')
        is_shared_footway = (h_type in PEDESTRIAN_SHARED_HIGHWAYS
                             and _first(data.get('bicycle')) != 'designated')
        data['_footway'] = 1.0 if is_shared_footway else 0.0
        min_on, max_on = min(min_on, score_on), max(max_on, score_on)
        min_off, max_off = min(min_off, score_off), max(max_off, score_off)

        # Terme de pente (sans le facteur beta, appliqué au routage).
        length = float(data.get('length', 1.0))
        try:
            if 'grade' in data:
                grade = float(data['grade'])
            else:
                elev_diff = G.nodes[v].get('elevation', 0) - G.nodes[u].get('elevation', 0)
                grade = elev_diff / length if length > 0 else 0
            grade_pct = max(0.0, grade) * 100
        except Exception:
            grade_pct = 0.0
        data['_length_f'] = length
        data['_grade_term'] = (grade_pct ** 2) / ELEVATION_DIVISOR

    range_on = (max_on - min_on) if max_on != min_on else 1
    range_off = (max_off - min_off) if max_off != min_off else 1

    for u, v, k, data in G.edges(keys=True, data=True):
        nr_on = (max_on - data['_s_on']) / range_on
        nr_off = (max_off - data['_s_off']) / range_off
        data['_risk_on'] = (nr_on ** 2) * DEFAULT_SAFETY_PENALTY
        data['_risk_off'] = (nr_off ** 2) * DEFAULT_SAFETY_PENALTY
        data['safety_score'] = data['_s_on'] if lighting_on else data['_s_off']

    G.graph['_static_costs_ready'] = True
    return G

def precompute_nearest_node_index(G):
    """Pré-calcul de l'index spatial pour la recherche des nœuds les plus proches."""
    node_ids = np.array(list(G.nodes))
    coords = np.array([[G.nodes[n]['y'], G.nodes[n]['x']] for n in node_ids], dtype=float)
    tree = BallTree(np.deg2rad(coords), metric='haversine')

    G.graph['_node_ids'] = node_ids
    G.graph['_node_tree'] = tree
    G.graph['_node_index_ready'] = True
    return G


def snap_distance_m(G, lat, lon):
    """Distance (m) du point au nœud le plus proche du graphe. None si graphe vide.

    Sert à répondre « ce point est-il dans la zone couverte ? » sans calculer
    d'itinéraire : on compare le résultat à MAX_SNAP_DISTANCE_M.
    """
    if not G.graph.get('_node_index_ready'):
        precompute_nearest_node_index(G)

    node_ids = G.graph['_node_ids']
    if len(node_ids) == 0:
        return None

    _, pos = G.graph['_node_tree'].query(np.deg2rad([[lat, lon]]), k=1)
    node = G.nodes[int(node_ids[pos[0][0]])]
    return float(ox.distance.great_circle(lat, lon, node['y'], node['x']))


def _nearest_nodes(G, lons, lats):
    """Renvoie la liste des nœuds les plus proches via l'index précalculé."""
    import numpy as np
    pts = np.deg2rad(np.column_stack([lats, lons]))
    _, pos = G.graph['_node_tree'].query(pts, k=1)
    return [int(n) for n in G.graph['_node_ids'][pos[:, 0]]]


def _make_weight(alpha, beta, surface_sens, footway_avoid, reported_edges, lighting_on):
    """Renvoie une fonction de poids pour l'algorithme A*.

    alpha        : curseur rapidité (1) ↔ sécurité (0)
    beta         : poids de l'effort (pente), dépend du niveau / type de vélo
    surface_sens : sensibilité au revêtement, dépend du type de vélo
    footway_avoid: aversion aux chemins piétons partagés, dépend du type de vélo
    """
    one_minus = 1.0 - alpha
    risk_key = '_risk_on' if lighting_on else '_risk_off'

    def _edge_cost(d):
        comfort = d.get('_roughness', DEFAULT_ROUGHNESS) * surface_sens
        footway = d.get('_footway', 0.0) * footway_avoid
        base = d['_length_f'] * (1.0 + d[risk_key] * one_minus + d['_grade_term'] * beta + comfort + footway)
        if d.get('traffic_jam', False):
            base += TRAFFIC_BASE_PENALTY + (TRAFFIC_SAFETY_FACTOR * one_minus)
        return base

    def weight(u, v, d):
        report_type = reported_edges.get((u, v)) or reported_edges.get((v, u))
        if '_length_f' in d:
            return _apply_report_penalty(_edge_cost(d), report_type, alpha)
        best = None
        for dd in d.values():
            c = _apply_report_penalty(_edge_cost(dd), report_type, alpha)
            if best is None or c < best:
                best = c
        return best

    return weight


def _astar_nodes(G, start_node, end_node, alpha, beta, surface_sens, footway_avoid, reported_edges, lighting_on):
    w = _make_weight(alpha, beta, surface_sens, footway_avoid, reported_edges, lighting_on)

    def dist_heuristic(u, v):
        return ox.distance.great_circle(G.nodes[u]['y'], G.nodes[u]['x'], G.nodes[v]['y'], G.nodes[v]['x'])

    return nx.astar_path(G, start_node, end_node, heuristic=dist_heuristic, weight=w)


def _full_route_data(G, route_nodes, bike_type, is_electric, cyclist_level):
    return {
        "nodes": route_nodes,
        "path": extract_route_geometry(G, route_nodes),
        "distance": calculate_route_distance(G, route_nodes),
        "duration": calculate_exact_travel_time(G, route_nodes, bike_type, is_electric, cyclist_level),
        "height_difference": calculate_route_elevation(G, route_nodes),
        "score": get_route_safety_score(G, route_nodes, bike_type, is_electric),
        "infra_stats": calculate_infra_stats(G, route_nodes)
    }


def _edge_geometry(G, u, v, data):
    """Géométrie (LineString, orientée u→v) d'une arête, reconstruite depuis les
    nœuds si le tag `geometry` est absent (arête droite)."""
    geom = data.get('geometry')
    if isinstance(geom, LineString):
        return geom
    return LineString([(G.nodes[u]['x'], G.nodes[u]['y']),
                       (G.nodes[v]['x'], G.nodes[v]['y'])])


def _project_to_nearest_edge(G, lat, lon, k_nodes=12):
    """Projette (lat, lon) sur l'arête la plus proche du réseau.

    Contrairement à l'accroche « nœud » (qui colle le point à l'intersection la
    plus proche, souvent des dizaines de mètres avant/après ou sur une autre
    rue), on projette le point sur le segment de route le plus proche. On
    réutilise le BallTree des nœuds pour restreindre la recherche aux arêtes
    incidentes aux nœuds voisins, ce qui évite de reconstruire un index d'arêtes
    à chaque requête.
    """
    node_ids = G.graph['_node_ids']
    tree = G.graph['_node_tree']
    k = int(min(k_nodes, len(node_ids)))
    _, pos = tree.query(np.deg2rad([[lat, lon]]), k=k)
    cand_nodes = [int(node_ids[p]) for p in pos[0]]

    pt = Point(lon, lat)
    seen = set()
    best = None
    for n in cand_nodes:
        if not G.has_node(n):
            continue
        incident = list(G.out_edges(n, keys=True)) + list(G.in_edges(n, keys=True))
        for (u, v, k_) in incident:
            if (u, v, k_) in seen:
                continue
            seen.add((u, v, k_))
            data = G.get_edge_data(u, v, k_)
            if data is None:
                continue
            geom = _edge_geometry(G, u, v, data)
            gl = geom.length
            if gl <= 0:
                continue
            d_along = min(max(geom.project(pt), 0.0), gl)
            proj = geom.interpolate(d_along)
            dist_m = ox.distance.great_circle(lat, lon, proj.y, proj.x)
            if best is None or dist_m < best['dist_m']:
                best = {
                    'u': u, 'v': v, 'k': k_,
                    'geom': geom, 'geom_len': gl, 'd_along': d_along,
                    'frac': min(max(d_along / gl, 0.0), 1.0),
                    'edge_len_m': float(data.get('length') or dist_m or 1.0),
                    'dist_m': dist_m,
                }
    return best


def _stub(G, snap, role, which):
    """Tronçon d'accroche entre le point projeté P et un nœud d'accès (u ou v).

    Renvoie {node, stub_len (m), coords}. `coords` est une liste [lat, lon, elev]
    orientée dans le sens de parcours : P→node pour un départ, node→P pour une
    arrivée.
    """
    geom, d_along, gl = snap['geom'], snap['d_along'], snap['geom_len']
    frac, elen = snap['frac'], snap['edge_len_m']
    if which == 'u':
        node = snap['u']
        seg = substring(geom, 0.0, d_along)      # u → P
        stub_len = elen * frac
        coords = list(seg.coords) if seg.geom_type == 'LineString' else [(seg.x, seg.y)]
        if role == 'start':
            coords = coords[::-1]                 # P → u
    else:
        node = snap['v']
        seg = substring(geom, d_along, gl)        # P → v
        stub_len = elen * (1.0 - frac)
        coords = list(seg.coords) if seg.geom_type == 'LineString' else [(seg.x, seg.y)]
        if role == 'end':
            coords = coords[::-1]                 # v → P
    elev = G.nodes[node].get('elevation', 0.0)
    latlon = [[c[1], c[0], elev] for c in coords]
    if not latlon:
        latlon = [[G.nodes[node]['y'], G.nodes[node]['x'], elev]]
    return {'node': node, 'stub_len': stub_len, 'coords': latlon}


def _endpoint_candidates(G, snap, role):
    """Les deux nœuds d'accès possibles (extrémités de l'arête projetée)."""
    cands, seen = [], set()
    for which in ('u', 'v'):
        node = snap['u'] if which == 'u' else snap['v']
        if node in seen:
            continue
        seen.add(node)
        cands.append(_stub(G, snap, role, which))
    return cands


def _stitch_geometry(start_coords, start_c, path_coords, end_c, end_coords):
    """Assemble la géométrie finale : pin de départ → point projeté → tronçon
    d'accroche → trajet A* → tronçon d'accroche → point projeté → pin d'arrivée.
    Le trajet démarre et se termine ainsi exactement aux points demandés."""
    sc, ec = start_c['coords'], end_c['coords']
    geom = [[start_coords[0], start_coords[1], sc[0][2]]]
    geom.extend(sc[:-1] if len(sc) > 1 else [])   # P → (node exclu, déjà dans path)
    geom.extend(path_coords)
    geom.extend(ec[1:] if len(ec) > 1 else [])    # (node exclu) → P
    geom.append([end_coords[0], end_coords[1], ec[-1][2]])
    return geom


def _route_with_stubs(G, route_nodes, start_c, end_c, start_coords, end_coords, bike_type, is_electric, cyclist_level):
    """Données complètes d'un itinéraire, géométrie recousue aux vrais points de
    départ/arrivée et distance/durée ajustées des tronçons d'accroche.

    `nodes` reste la liste des vrais nœuds du graphe : maneuvers, navigation
    (snap live) et statistiques continuent de fonctionner à l'identique."""
    data = _full_route_data(G, route_nodes, bike_type, is_electric, cyclist_level)
    data['path'] = _stitch_geometry(start_coords, start_c, data['path'], end_c, end_coords)
    stub_km = (start_c['stub_len'] + end_c['stub_len']) / 1000.0
    if stub_km > 0:
        if data['distance'] > 0 and data['duration'] > 0:
            speed_km_per_min = data['distance'] / data['duration']
            if speed_km_per_min > 0:
                data['duration'] += stub_km / speed_km_per_min
        data['distance'] += stub_km
    return data


def _direct_edge_route(G, snap, start_coords, end_coords, bike_type, is_electric, cyclist_level):
    """Cas où départ et arrivée tombent sur la même arête : on trace le segment
    direct entre les deux points projetés, sans détour par une intersection."""
    geom, gl, elen = snap['geom'], snap['geom_len'], snap['edge_len_m']
    ds = min(max(geom.project(Point(start_coords[1], start_coords[0])), 0.0), gl)
    de = min(max(geom.project(Point(end_coords[1], end_coords[0])), 0.0), gl)
    lo, hi = (ds, de) if ds <= de else (de, ds)
    seg = substring(geom, lo, hi)
    coords = list(seg.coords) if seg.geom_type == 'LineString' else [(seg.x, seg.y)]
    if ds > de:
        coords = coords[::-1]                     # orienté départ → arrivée

    u, v = snap['u'], snap['v']
    first_node, last_node = (u, v) if ds <= de else (v, u)
    elev_first = G.nodes[first_node].get('elevation', 0.0)
    elev_last = G.nodes[last_node].get('elevation', 0.0)

    path = [[start_coords[0], start_coords[1], elev_first]]
    path += [[c[1], c[0], elev_first] for c in coords]
    path.append([end_coords[0], end_coords[1], elev_last])

    frac_seg = abs(de - ds) / gl if gl > 0 else 0.0
    full_dur = calculate_exact_travel_time(G, [u, v], bike_type, is_electric, cyclist_level)
    return {
        "nodes": [first_node, last_node],
        "path": path,
        "distance": elen * frac_seg / 1000.0,
        "duration": full_dur * frac_seg,
        "height_difference": calculate_route_elevation(G, [first_node, last_node]),
        "score": get_route_safety_score(G, [u, v], bike_type, is_electric),
        "infra_stats": calculate_infra_stats(G, [u, v]),
    }


def get_optimal_routes(G, start_coords, end_coords, bike_type="standard", is_electric=False, cyclist_level="intermediaire", max_time_min=None, iterations=6, reported_edges=None):
    if reported_edges is None: reported_edges = {}
    try:
        if not G.graph.get('_static_costs_ready'):
            precompute_static_costs(G)
        lighting_on = get_bordeaux_lighting_condition()[1]

        cache_key = (
            round(start_coords[0], 5), round(start_coords[1], 5),
            round(end_coords[0], 5), round(end_coords[1], 5),
            bike_type, bool(is_electric), cyclist_level,
            max_time_min, int(iterations), lighting_on,
        )
        cached = route_cache.get(cache_key)
        if cached is not None:
            return cached

        if not G.graph.get('_node_index_ready'):
            precompute_nearest_node_index(G)

        beta_elev = 0.0 if is_electric else ELEVATION_WEIGHT_BY_LEVEL.get(cyclist_level.lower(), 0.7)
        surface_sens = (ELECTRIC_SURFACE_SENSITIVITY if is_electric
                        else BIKE_SURFACE_SENSITIVITY.get(bike_type.lower(), DEFAULT_SURFACE_SENSITIVITY))
        footway_avoid = (ELECTRIC_FOOTWAY_AVOIDANCE if is_electric
                         else BIKE_FOOTWAY_AVOIDANCE.get(bike_type.lower(), DEFAULT_FOOTWAY_AVOIDANCE))

        # Accroche sur l'ARÊTE la plus proche (et non le nœud) : le trajet part
        # exactement du point projeté sur la route, pas d'une intersection voisine.
        snap_s = _project_to_nearest_edge(G, start_coords[0], start_coords[1])
        snap_e = _project_to_nearest_edge(G, end_coords[0], end_coords[1])
        if snap_s is None or snap_e is None:
            return {"success": False, "error": "Impossible d'accrocher le départ ou l'arrivée au réseau cyclable."}

        # L'accroche réussit à n'importe quelle distance : sans ce seuil, un point
        # hors du graphe chargé donnerait un itinéraire partant de très loin.
        if snap_s['dist_m'] > MAX_SNAP_DISTANCE_M or snap_e['dist_m'] > MAX_SNAP_DISTANCE_M:
            which = "Le départ" if snap_s['dist_m'] > MAX_SNAP_DISTANCE_M else "L'arrivée"
            return {
                "success": False,
                "error_code": "OUT_OF_ZONE",
                "error": f"{which} est en dehors de la zone couverte par Sécu-Cycle.",
            }

        # Départ et arrivée sur la même arête : segment direct (pas d'aller-retour
        # jusqu'à une intersection).
        if frozenset((snap_s['u'], snap_s['v'])) == frozenset((snap_e['u'], snap_e['v'])):
            direct = _direct_edge_route(G, snap_s, start_coords, end_coords, bike_type, is_electric, cyclist_level)
            res = {"success": True, "routes": [
                {"id": "fast", "name": "Rapide", **direct},
                {"id": "safe", "name": "Sécurisé", **direct},
            ]}
            route_cache.set(cache_key, res)
            return res

        start_cands = _endpoint_candidates(G, snap_s, 'start')
        end_cands = _endpoint_candidates(G, snap_e, 'end')

        def _heur(a, b):
            return ox.distance.great_circle(G.nodes[a]['y'], G.nodes[a]['x'], G.nodes[b]['y'], G.nodes[b]['x'])

        # Choix du bon point d'accès (bon côté de la rue) : on minimise le coût
        # total « tronçon d'accroche + trajet » sur le profil rapide.
        w_fast = _make_weight(1.0, beta_elev, surface_sens, footway_avoid, reported_edges, lighting_on)
        best_combo = None
        for sc in start_cands:
            for ec in end_cands:
                try:
                    path = nx.astar_path(G, sc['node'], ec['node'], heuristic=_heur, weight=w_fast)
                except nx.NetworkXNoPath:
                    continue
                cost = sum(w_fast(path[i], path[i + 1], G[path[i]][path[i + 1]])
                           for i in range(len(path) - 1))
                total = sc['stub_len'] + cost + ec['stub_len']
                if best_combo is None or total < best_combo['total']:
                    best_combo = {'total': total, 'sc': sc, 'ec': ec, 'fast_nodes': path}

        if best_combo is None:
            return {"success": False, "error": "Aucun itinéraire trouvé entre le départ et l'arrivée."}

        start_c, end_c = best_combo['sc'], best_combo['ec']
        start_node, end_node = start_c['node'], end_c['node']

        fast_nodes = best_combo['fast_nodes']
        safe_nodes = _astar_nodes(G, start_node, end_node, 0.0, beta_elev, surface_sens, footway_avoid, reported_edges, lighting_on)
        fast_data = _route_with_stubs(G, fast_nodes, start_c, end_c, start_coords, end_coords, bike_type, is_electric, cyclist_level)
        safe_data = _route_with_stubs(G, safe_nodes, start_c, end_c, start_coords, end_coords, bike_type, is_electric, cyclist_level)

        res = {"success": True, "routes": [{"id": "fast", "name": "Rapide", **fast_data}, {"id": "safe", "name": "Sécurisé", **safe_data}]}

        if max_time_min and safe_data["duration"] > float(max_time_min):
            iterations = max(1, min(int(iterations), 10))
            a_low, a_high = 0.0, 1.0
            best_nodes = fast_nodes
            for _ in range(iterations):
                a_mid = (a_low + a_high) / 2
                mid_nodes = _astar_nodes(G, start_node, end_node, a_mid, beta_elev, surface_sens, footway_avoid, reported_edges, lighting_on)
                mid_dur = calculate_exact_travel_time(G, mid_nodes, bike_type, is_electric, cyclist_level)
                if mid_dur <= float(max_time_min):
                    best_nodes, a_high = mid_nodes, a_mid
                else:
                    a_low = a_mid
            best_data = _route_with_stubs(G, best_nodes, start_c, end_c, start_coords, end_coords, bike_type, is_electric, cyclist_level)
            res["routes"].append({"id": "compromise", "name": "Compromis", "alpha_final": a_high, **best_data})
        route_cache.set(cache_key, res)
        return res
    except Exception as e: return {"success": False, "error": str(e)}
