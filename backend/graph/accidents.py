"""Rattache les accidents recensés aux arêtes du graphe, et en dérive un malus."""

import math

import osmnx as ox
from sqlalchemy import select

from database import SessionLocal
from graph.config import (
    ACCIDENT_HALF_LIFE_YEARS, ACCIDENT_MALUS_K, ACCIDENT_MAX_MALUS,
    ACCIDENT_SNAP_RADIUS_M, ACCIDENT_REFERENCE_LENGTH_M,
)
from models.accident import RoadAccident


def load_accident_points(bbox=None):
    """Accidents en base, éventuellement restreints à une boîte englobante.

    Renvoie une liste de tuples (lat, lon, severity, année). Lire toute la table
    est acceptable : on parle de quelques centaines à quelques milliers de lignes
    sur l'emprise d'un profil.
    """
    db = SessionLocal()
    try:
        query = select(
            RoadAccident.latitude, RoadAccident.longitude,
            RoadAccident.severity, RoadAccident.occurred_on,
        )
        if bbox is not None:
            lon_min, lat_min, lon_max, lat_max = bbox
            query = query.where(
                RoadAccident.longitude.between(lon_min, lon_max),
                RoadAccident.latitude.between(lat_min, lat_max),
            )
        return db.execute(query).all()
    finally:
        db.close()


def _decayed_weight(severity, occurred_on, today_year):
    """Poids d'un accident : sa gravité, atténuée par son ancienneté.

    Un accident de 2019 pèse encore, mais moins qu'un accident de l'an dernier :
    la voirie change, des aménagements sont créés. La décroissance est
    exponentielle, de demi-vie `ACCIDENT_HALF_LIFE_YEARS`.
    """
    weight = float(severity or 1)
    if occurred_on is None:
        return weight
    age_years = max(0.0, today_year - occurred_on.year)
    return weight * math.exp(-age_years * math.log(2) / ACCIDENT_HALF_LIFE_YEARS)


def attach_accident_risk(G):
    """Écrit `_accident_w` et `_accident_malus` sur chaque arête du graphe.

    Les points sont accrochés à l'arête la plus proche, et rejetés au-delà de
    `ACCIDENT_SNAP_RADIUS_M` : au-delà, l'accident concerne une autre rue, et le
    rattacher salirait le score d'un segment innocent.
    """
    from datetime import date

    for _, _, data in G.edges(data=True):
        data['_accident_w'] = 0.0
        data['_accident_malus'] = 0.0
        data['_accident_n'] = 0

    try:
        points = load_accident_points(_graph_bounds(G))
    except Exception as exc:
        print(f"[Accidents] Lecture impossible, scores d'infrastructure inchangés : {exc}",
              flush=True)
        G.graph['_accidents_ready'] = False
        return G

    if not points:
        G.graph['_accidents_ready'] = True
        G.graph['_accidents_count'] = 0
        print("[Accidents] Aucun accident en base : scores d'infrastructure inchangés.",
              flush=True)
        return G

    today_year = date.today().year
    lats = [float(p[0]) for p in points]
    lons = [float(p[1]) for p in points]

    try:
        nearest = ox.distance.nearest_edges(G, X=lons, Y=lats)
    except Exception as exc:
        print(f"[Accidents] Rattachement impossible : {exc}", flush=True)
        G.graph['_accidents_ready'] = False
        return G

    by_pair = {}
    attached = 0
    for i, (u, v, k) in enumerate(nearest):
        data = G.get_edge_data(u, v, k)
        if data is None:
            continue

        if _distance_to_edge_m(G, u, v, data, lats[i], lons[i]) > ACCIDENT_SNAP_RADIUS_M:
            continue

        pair = (u, v) if u <= v else (v, u)
        weight, count = by_pair.get(pair, (0.0, 0))
        by_pair[pair] = (
            weight + _decayed_weight(points[i][2], points[i][3], today_year),
            count + 1,
        )
        attached += 1

    for (a, b), (weight, count) in by_pair.items():
        for x, y in ((a, b), (b, a)):
            edges = G.get_edge_data(x, y)
            if not edges:
                continue
            for data in edges.values():
                data['_accident_w'] = weight
                data['_accident_n'] = count

    for _, _, data in G.edges(data=True):
        weight = data.get('_accident_w', 0.0)
        if weight <= 0.0:
            continue
        length = max(float(data.get('length', 1.0)), 1.0)
        density = weight / (length / ACCIDENT_REFERENCE_LENGTH_M)
        data['_accident_malus'] = min(
            ACCIDENT_MAX_MALUS, ACCIDENT_MALUS_K * math.log1p(density)
        )

    G.graph['_accidents_ready'] = True
    G.graph['_accidents_count'] = attached
    print(
        f"[Accidents] {len(points)} accident(s) lus, {attached} rattaché(s) à moins "
        f"de {ACCIDENT_SNAP_RADIUS_M:.0f} m d'un segment.",
        flush=True,
    )
    return G


def _graph_bounds(G):
    """Boîte englobante du graphe, pour ne lire que les accidents utiles."""
    ys = [d['y'] for _, d in G.nodes(data=True)]
    xs = [d['x'] for _, d in G.nodes(data=True)]
    if not xs or not ys:
        return None
    return min(xs), min(ys), max(xs), max(ys)


def _distance_to_edge_m(G, u, v, data, lat, lon):
    """Distance (m) du point à l'arête, mesurée sur sa géométrie réelle."""
    from shapely.geometry import LineString, Point

    geom = data.get('geometry')
    if not isinstance(geom, LineString):
        geom = LineString([(G.nodes[u]['x'], G.nodes[u]['y']),
                           (G.nodes[v]['x'], G.nodes[v]['y'])])
    projected = geom.interpolate(geom.project(Point(lon, lat)))
    return float(ox.distance.great_circle(lat, lon, projected.y, projected.x))


def route_accident_stats(G, route):
    """Nombre d'accidents rattachés au trajet, et part de sa longueur épargnée."""
    total_length = 0.0
    clean_length = 0.0
    count = 0

    for i in range(len(route) - 1):
        edge_data = G.get_edge_data(route[i], route[i + 1])
        if not edge_data:
            continue
        data = edge_data[0] if isinstance(edge_data, dict) and 0 in edge_data else edge_data

        length = float(data.get('length', 0.0))
        total_length += length
        n = int(data.get('_accident_n', 0) or 0)
        count += n
        if n == 0:
            clean_length += length

    if total_length == 0:
        return {"accidents_count": 0, "pct_accident_free": 100.0}

    return {
        "accidents_count": count,
        "pct_accident_free": round(clean_length / total_length * 100, 1),
    }
