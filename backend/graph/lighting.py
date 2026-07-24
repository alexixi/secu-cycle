"""Déduit l'éclairage des arêtes du graphe à partir de deux signaux spatiaux.

1. **Les lampadaires** (`street_lamps`, alimentée par `lighting.sync`) : chaque
   point lumineux influence *toutes* les arêtes situées dans son rayon, et non la
   seule plus proche — une lampe en bord de chaussée éclaire aussi la piste
   cyclable qui la longe. On écrit `_lamp_count` et `_lamp_lit`.
2. **Les voies déjà tagguées `lit=yes` dans OSM** : leur éclairage se propage aux
   aménagements séparés qui les longent (piste, chemin, trottoir), dans une
   petite zone. On écrit `_lit_spill`.

`_lit_inferred = _lamp_lit or _lit_spill` est le drapeau consommé par le scoring
(`routing._edge_quality`), les statistiques (`statistique.calculate_infra_stats`)
et la couche carte. Ces inférences ne s'appliquent qu'aux arêtes dont le tag OSM
`lit` est **inconnu** : un `lit=yes`/`lit=no` explicite fait toujours autorité.

Ce module porte aussi le rattachement des arêtes à leur commune
(`attach_communes`) et la résolution des fenêtres d'extinction
(`resolve_extinction_windows`) : l'extinction nocturne est décidée commune par
commune, et le routage a besoin de savoir, pour chaque arête, quel horaire
s'applique.
"""

import math

import numpy as np
import osmnx as ox
from shapely import STRtree, points as shapely_points
from shapely.geometry import LineString, Point, box, shape
from sqlalchemy import select

from database import SessionLocal
from graph.accidents import _graph_bounds
from graph.config import (
    LIT_SPILL_MIN_COVERAGE, LIT_SPILL_RADIUS_M, LIT_SPILL_SAMPLE_STEP_M,
    LIT_SPILL_TARGET_HIGHWAYS, NIGHT_EXTINCTION_WINDOW,
    STREETLAMP_LIT_MIN_PER_100M, STREETLAMP_SNAP_RADIUS_M,
)
from models.commune_lighting import CommuneLighting
from models.graph_profile import CommuneGeometry
from models.street_lamp import StreetLamp

# Nombre maximal de points d'échantillonnage par arête (borne le coût sur les
# très longues voies).
_MAX_SAMPLES = 30

_M_PER_DEG_LAT = 111320.0


def load_street_lamp_points(bbox=None):
    """Points lumineux en base, éventuellement restreints à une boîte englobante.

    Renvoie une liste de tuples (lat, lon).
    """
    db = SessionLocal()
    try:
        query = select(StreetLamp.latitude, StreetLamp.longitude)
        if bbox is not None:
            lon_min, lat_min, lon_max, lat_max = bbox
            query = query.where(
                StreetLamp.longitude.between(lon_min, lon_max),
                StreetLamp.latitude.between(lat_min, lat_max),
            )
        return db.execute(query).all()
    finally:
        db.close()


def _tag(data, key):
    """Valeur d'un tag OSM, normalisée quand elle arrive sous forme de liste."""
    value = data.get(key)
    if isinstance(value, list):
        return value[0] if value else None
    return value


def _edge_line(G, u, v, data):
    """Géométrie d'une arête : son tracé réel, ou le segment droit entre nœuds."""
    geom = data.get('geometry')
    if isinstance(geom, LineString):
        return geom
    return LineString([(G.nodes[u]['x'], G.nodes[u]['y']),
                       (G.nodes[v]['x'], G.nodes[v]['y'])])


def _deg_box(lat, lon, radius_m):
    """Boîte en degrés autour d'un point — **préfiltre** seulement.

    Les degrés de longitude rétrécissent avec la latitude ; on élargit donc en
    conséquence pour que la boîte reste un sur-ensemble du disque réel. La
    distance vraie est toujours revérifiée en mètres ensuite.
    """
    d_lat = radius_m / _M_PER_DEG_LAT
    d_lon = radius_m / (_M_PER_DEG_LAT * max(math.cos(math.radians(lat)), 0.01))
    return box(lon - d_lon, lat - d_lat, lon + d_lon, lat + d_lat)


def _point_to_geom_m(geom, lat, lon):
    """Distance (m) d'un point à une géométrie, mesurée sur son tracé réel."""
    projected = geom.interpolate(geom.project(Point(lon, lat)))
    return float(ox.distance.great_circle(lat, lon, projected.y, projected.x))


def _geom_length_m(geom):
    coords = list(geom.coords)
    total = 0.0
    for (x1, y1), (x2, y2) in zip(coords, coords[1:]):
        total += float(ox.distance.great_circle(y1, x1, y2, x2))
    return total


def _sample_points(geom, step_m):
    """Points (lat, lon) régulièrement répartis le long d'une arête."""
    length_m = _geom_length_m(geom)
    count = int(length_m // step_m) + 1
    count = max(2, min(count, _MAX_SAMPLES))
    points = []
    for i in range(count):
        p = geom.interpolate(i / (count - 1), normalized=True)
        points.append((p.y, p.x))
    return points


def _mark_pair(G, u, v, attr, value):
    """Pose un attribut sur les deux sens d'une même voie."""
    for x, y in ((u, v), (v, u)):
        edges = G.get_edge_data(x, y)
        if not edges:
            continue
        for data in edges.values():
            data[attr] = value


def _attach_lamps(G, points, geoms, edge_keys, tree):
    """Passe A : chaque lampadaire influence toutes les arêtes de son rayon."""
    lats = [float(p[0]) for p in points]
    lons = [float(p[1]) for p in points]

    boxes = np.empty(len(points), dtype=object)
    for i, (lat, lon) in enumerate(zip(lats, lons)):
        boxes[i] = _deg_box(lat, lon, STREETLAMP_SNAP_RADIUS_M)

    # STRtree.query sur un tableau renvoie les paires (indice d'entrée, indice d'arête).
    pairs = tree.query(boxes)

    by_pair = {}
    seen = set()
    attached = 0
    for lamp_i, edge_i in zip(pairs[0], pairs[1]):
        lamp_i, edge_i = int(lamp_i), int(edge_i)
        if _point_to_geom_m(geoms[edge_i], lats[lamp_i], lons[lamp_i]) > STREETLAMP_SNAP_RADIUS_M:
            continue
        u, v, _ = edge_keys[edge_i]
        pair = (u, v) if u <= v else (v, u)
        # Un même lampadaire ne compte qu'une fois par voie, même si celle-ci est
        # représentée par plusieurs arêtes parallèles (sens inverse, contre-sens).
        if (lamp_i, pair) in seen:
            continue
        seen.add((lamp_i, pair))
        by_pair[pair] = by_pair.get(pair, 0) + 1
        attached += 1

    lit_edges = 0
    for (u, v), count in by_pair.items():
        for x, y in ((u, v), (v, u)):
            edges = G.get_edge_data(x, y)
            if not edges:
                continue
            for data in edges.values():
                data['_lamp_count'] = count
                length = max(float(data.get('length', 1.0)), 1.0)
                density = count / (length / 100.0)  # lampadaires pour 100 m
                if density >= STREETLAMP_LIT_MIN_PER_100M:
                    data['_lamp_lit'] = True
                    lit_edges += 1
    return attached, lit_edges


def _spread_from_lit_ways(G, geoms, edge_keys, edge_data):
    """Passe B : une voie `lit=yes` éclaire les aménagements qui la longent.

    Critère de **couverture** et non de distance minimale : deux arêtes qui se
    touchent à un carrefour sont à distance nulle, or une rue perpendiculaire
    n'est pas éclairée par le boulevard qu'elle croise. On exige donc qu'une part
    substantielle de la voie candidate coure le long d'une voie éclairée.
    """
    lit_indexes = [i for i, d in enumerate(edge_data) if _tag(d, 'lit') == 'yes']
    if not lit_indexes:
        return 0

    lit_geoms = [geoms[i] for i in lit_indexes]
    lit_tree = STRtree(lit_geoms)

    spilled = 0
    for i, data in enumerate(edge_data):
        if _tag(data, 'lit') in ('yes', 'no'):
            continue
        if _tag(data, 'highway') not in LIT_SPILL_TARGET_HIGHWAYS:
            continue

        geom = geoms[i]
        min_x, min_y, max_x, max_y = geom.bounds
        d_lat = LIT_SPILL_RADIUS_M / _M_PER_DEG_LAT
        d_lon = LIT_SPILL_RADIUS_M / (
            _M_PER_DEG_LAT * max(math.cos(math.radians(max_y)), 0.01))
        around = box(min_x - d_lon, min_y - d_lat, max_x + d_lon, max_y + d_lat)
        if len(lit_tree.query(around)) == 0:
            continue

        samples = _sample_points(geom, LIT_SPILL_SAMPLE_STEP_M)
        covered = 0
        for lat, lon in samples:
            probe = _deg_box(lat, lon, LIT_SPILL_RADIUS_M)
            for ci in lit_tree.query(probe):
                if _point_to_geom_m(lit_geoms[int(ci)], lat, lon) <= LIT_SPILL_RADIUS_M:
                    covered += 1
                    break

        if covered / len(samples) >= LIT_SPILL_MIN_COVERAGE:
            u, v, _ = edge_keys[i]
            _mark_pair(G, u, v, '_lit_spill', True)
            spilled += 1

    return spilled


def attach_lighting(G):
    """Écrit `_lamp_count`, `_lamp_lit`, `_lit_spill` et `_lit_inferred` sur les arêtes."""
    for _, _, data in G.edges(data=True):
        data['_lamp_count'] = 0
        data['_lamp_lit'] = False
        data['_lit_spill'] = False
        data['_lit_inferred'] = False

    geoms, edge_keys, edge_data = [], [], []
    for u, v, k, data in G.edges(keys=True, data=True):
        geoms.append(_edge_line(G, u, v, data))
        edge_keys.append((u, v, k))
        edge_data.append(data)

    if not geoms:
        G.graph['_lighting_ready'] = True
        G.graph['_lamps_count'] = 0
        return G

    tree = STRtree(geoms)

    try:
        points = load_street_lamp_points(_graph_bounds(G))
    except Exception as exc:
        print(f"[Éclairage] Lecture des lampadaires impossible : {exc}", flush=True)
        points = []

    attached = lamp_lit_edges = 0
    if points:
        try:
            attached, lamp_lit_edges = _attach_lamps(G, points, geoms, edge_keys, tree)
        except Exception as exc:
            print(f"[Éclairage] Rattachement des lampadaires impossible : {exc}", flush=True)

    try:
        spilled = _spread_from_lit_ways(G, geoms, edge_keys, edge_data)
    except Exception as exc:
        print(f"[Éclairage] Propagation depuis les voies éclairées impossible : {exc}",
              flush=True)
        spilled = 0

    for _, _, data in G.edges(data=True):
        data['_lit_inferred'] = bool(data.get('_lamp_lit') or data.get('_lit_spill'))

    G.graph['_lighting_ready'] = True
    G.graph['_lamps_count'] = attached
    # Le tracé des rues éclairées dépend de ces inférences : on invalide son cache.
    G.graph.pop('_lit_geojson', None)
    print(
        f"[Éclairage] {len(points)} lampadaire(s) lus, {attached} rattachement(s) à moins "
        f"de {STREETLAMP_SNAP_RADIUS_M:.0f} m ; {lamp_lit_edges} sens d'arête éclairé(s) "
        f"par les lampadaires, {spilled} voie(s) séparée(s) éclairée(s) par propagation "
        f"depuis une voie `lit=yes`.",
        flush=True,
    )
    return G


def _cached_commune_shapes(communes):
    """Contours des communes, **depuis le cache uniquement**.

    Renvoie `(noms, polygones)` alignés. Le chargement du graphe ne doit jamais
    dépendre de Nominatim (une seconde par commune, et un échec réseau bloquerait
    le démarrage) : une commune absente du cache est simplement ignorée, ses
    arêtes retomberont sur la fenêtre par défaut. Le cache est peuplé par
    `graph.communes.validate` au moment où l'admin saisit la commune.
    """
    if not communes:
        return [], []

    db = SessionLocal()
    try:
        rows = (
            db.query(CommuneGeometry.name, CommuneGeometry.geojson)
            .filter(CommuneGeometry.name.in_(list(communes)))
            .all()
        )
    finally:
        db.close()

    by_name = {name: geojson for name, geojson in rows}

    names, shapes = [], []
    for name in communes:
        geojson = by_name.get(name)
        if geojson is None:
            continue
        try:
            geometry = shape(geojson)
        except Exception as exc:
            print(f"[Éclairage] Contour illisible pour « {name} » : {exc}", flush=True)
            continue
        names.append(name)
        shapes.append(geometry)
    return names, shapes


def attach_communes(G, communes):
    """Pose `_commune_idx` sur chaque arête : son indice dans `G.graph['_communes']`.

    `-1` quand l'arête ne tombe dans aucun contour connu (bordure d'emprise,
    commune absente du cache) — l'indexation négative de Python fait alors
    naturellement tomber `resolve_extinction_windows` sur la fenêtre par défaut,
    placée en dernier.

    On situe une arête par le **point médian de ses deux nœuds** : reconstruire
    sa géométrie complète ne changerait pas la commune retenue, sauf pour les
    rares voies à cheval sur une limite communale.
    """
    for _, _, data in G.edges(data=True):
        data['_commune_idx'] = -1

    names, shapes = _cached_commune_shapes(communes)
    G.graph['_communes'] = names
    if not names:
        missing = len(communes or [])
        if missing:
            print(
                f"[Éclairage] Aucun contour en cache pour les {missing} commune(s) du "
                f"profil : horaires d'extinction par défaut partout.",
                flush=True,
            )
        return G

    tree = STRtree(shapes)

    edge_refs, xs, ys = [], [], []
    for u, v, k, data in G.edges(keys=True, data=True):
        try:
            x = (float(G.nodes[u]['x']) + float(G.nodes[v]['x'])) / 2.0
            y = (float(G.nodes[u]['y']) + float(G.nodes[v]['y'])) / 2.0
        except (KeyError, TypeError, ValueError):
            continue
        edge_refs.append(data)
        xs.append(x)
        ys.append(y)

    if not edge_refs:
        return G

    # `shapely.points` construit le tableau d'un bloc : sur un graphe
    # métropolitain (plusieurs centaines de milliers d'arêtes), instancier
    # autant d'objets Point un à un coûterait bien plus cher en temps et en RAM.
    midpoints = shapely_points(np.asarray(xs, dtype=float), np.asarray(ys, dtype=float))

    # `predicate='intersects'` fait le test exact dans shapely (pas seulement la
    # boîte englobante) ; une arête sur une limite peut ressortir deux fois, on
    # garde la première commune rencontrée.
    edge_idx, commune_idx = tree.query(midpoints, predicate='intersects')
    matched = 0
    for ei, ci in zip(edge_idx, commune_idx):
        data = edge_refs[int(ei)]
        if data['_commune_idx'] == -1:
            data['_commune_idx'] = int(ci)
            matched += 1

    print(
        f"[Éclairage] {matched}/{len(edge_refs)} arête(s) rattachée(s) à l'une des "
        f"{len(names)} commune(s) du profil.",
        flush=True,
    )
    return G


def _norm_window(window):
    """Fenêtre `(start_h, end_h)` exploitable, ou None si elle n'est pas renseignée."""
    if not window:
        return None
    start, end = window[0], window[1]
    if start is None or end is None:
        return None
    return (int(start), int(end))


def resolve_extinction_windows(G, profile_window=None):
    """Construit `G.graph['_ext_windows']` : une fenêtre d'extinction par commune.

    Cascade, du plus précis au plus général : horaire de la commune → fenêtre par
    défaut du profil → `NIGHT_EXTINCTION_WINDOW`. La valeur par défaut est placée
    **en dernier** pour que l'indice `-1` des arêtes non rattachées tombe dessus.

    Ne dépend que de la base et de `_commune_idx` déjà posé : rejouable à chaud
    après une édition dans l'admin, sans refaire la jointure spatiale ni
    recharger le graphe.
    """
    if profile_window is None:
        profile_window = G.graph.get('_extinction_window')
    default = _norm_window(profile_window) or NIGHT_EXTINCTION_WINDOW

    communes = list(G.graph.get('_communes') or [])

    by_commune = {}
    if communes:
        db = SessionLocal()
        try:
            rows = (
                db.query(
                    CommuneLighting.commune,
                    CommuneLighting.night_extinction_start,
                    CommuneLighting.night_extinction_end,
                )
                .filter(CommuneLighting.commune.in_(communes))
                .all()
            )
            by_commune = {name: (start, end) for name, start, end in rows}
        except Exception as exc:
            print(f"[Éclairage] Horaires par commune illisibles : {exc}", flush=True)
        finally:
            db.close()

    windows = [_norm_window(by_commune.get(name)) or default for name in communes]
    windows.append(default)

    G.graph['_ext_windows'] = windows

    specific = sum(1 for name in communes if _norm_window(by_commune.get(name)))
    print(
        f"[Éclairage] Horaires d'extinction : {specific} commune(s) avec un horaire "
        f"propre, {len(communes) - specific} sur le défaut {default}.",
        flush=True,
    )
    return G


def _edge_lit_source(data):
    """« osm » si la voie porte `lit=yes`, « inferred » si l'éclairage est déduit
    (lampadaires ou propagation), None sinon (voie non éclairée ou inconnue)."""
    lit = _tag(data, 'lit')
    if lit == 'yes':
        return 'osm'
    if lit != 'no' and data.get('_lit_inferred'):
        return 'inferred'
    return None


def lit_roads_geojson(G):
    """FeatureCollection des voies éclairées (LineString), mémoïsé sur `G`.

    Sert la sous-couche « Rues éclairées » de la carte : chaque segment porté
    par `lit=yes` (OSM) ou réputé éclairé (lampadaires proches, ou propagation
    depuis une voie éclairée qu'il longe). Les deux sens sont fusionnés.
    """
    cached = G.graph.get('_lit_geojson')
    if cached is not None:
        return cached

    seen = set()
    features = []
    for u, v, data in G.edges(data=True):
        source = _edge_lit_source(data)
        if source is None:
            continue
        pair = (u, v) if u <= v else (v, u)
        if pair in seen:
            continue
        seen.add(pair)

        geom = data.get('geometry')
        if geom is not None and hasattr(geom, 'coords'):
            coords = [[float(x), float(y)] for x, y in geom.coords]
        else:
            coords = [
                [float(G.nodes[u]['x']), float(G.nodes[u]['y'])],
                [float(G.nodes[v]['x']), float(G.nodes[v]['y'])],
            ]
        features.append({
            "type": "Feature",
            "geometry": {"type": "LineString", "coordinates": coords},
            "properties": {"lit_source": source},
        })

    fc = {"type": "FeatureCollection", "features": features}
    G.graph['_lit_geojson'] = fc
    return fc
