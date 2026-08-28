"""Géocode les communes d'un profil et met leurs contours en cache.

Les communes sont des chaînes Nominatim libres ("Bordeaux, France"), passées
telles quelles à osmnx. Les géocoder sert à deux choses : valider une commune
au moment où l'admin l'ajoute (plutôt que de découvrir la faute de frappe après
plusieurs minutes de génération ratée), et dessiner l'emprise du profil.

Nominatim tolère environ une requête par seconde : le cache en base est ce qui
rend l'affichage d'un profil de 43 communes praticable.
"""

import json

import osmnx as ox
from shapely.geometry import mapping, shape
from shapely.ops import unary_union

from models.graph_profile import CommuneGeometry


class CommuneNotFound(Exception):
    """Nominatim ne connaît pas cette commune.

    Porte la clé de traduction et ses paramètres à côté du message. Le
    géocodage tourne aussi hors requête — chargement d'emprise, journaux — où il
    n'y a pas de locale à appliquer : le message reste français pour les traces,
    et c'est le routeur qui rend la clé dans la langue de l'appelant.
    """

    def __init__(self, message: str, key: str, **params):
        super().__init__(message)
        self.key = key
        self.params = params


def _geocode(name: str) -> dict:
    """Contour GeoJSON d'une commune, interrogé auprès de Nominatim."""
    try:
        gdf = ox.geocode_to_gdf(name)
    except Exception as exc:
        raise CommuneNotFound(
            f"Commune introuvable : « {name} » ({exc}).",
            "error.commune.not_found_reason", name=name, reason=str(exc),
        ) from exc

    if gdf.empty:
        raise CommuneNotFound(
            f"Commune introuvable : « {name} ».",
            "error.commune.not_found", name=name,
        )

    return json.loads(json.dumps(mapping(gdf.geometry.iloc[0])))


def geometry_of(db, name: str) -> dict:
    """Contour d'une commune, depuis le cache ou Nominatim. Lève `CommuneNotFound`.

    Bloquant : appeler via `asyncio.to_thread`.
    """
    cached = db.query(CommuneGeometry).filter(CommuneGeometry.name == name).first()
    if cached is not None:
        return cached.geojson

    geojson = _geocode(name)

    db.add(CommuneGeometry(name=name, geojson=geojson))
    db.commit()
    return geojson


def validate(db, names) -> None:
    """Vérifie que chaque commune existe, en peuplant le cache au passage.

    Lève `CommuneNotFound` à la première inconnue. Bloquant.
    """
    for name in names:
        geometry_of(db, name)


def is_contiguous(db, names) -> bool | None:
    """Les communes forment-elles un seul bloc d'un seul tenant ?

    C'est un garde-fou : `create_graph` termine par
    `ox.truncate.largest_component(strongly=True)`, qui ne garde que la plus
    grande composante connexe. Deux communes non limitrophes donnent deux
    composantes disjointes, et **la plus petite est silencieusement perdue**.
    Mieux vaut prévenir l'admin avant plusieurs minutes de génération.

    Renvoie None si une géométrie manque du cache : cette fonction ne géocode
    pas (elle est appelée par des endpoints de lecture, qui doivent rester
    rapides).
    """
    if len(names) < 2:
        return True

    geometries = []
    for name in names:
        cached = db.query(CommuneGeometry).filter(CommuneGeometry.name == name).first()
        if cached is None:
            return None
        geometries.append(shape(cached.geojson))

    merged = unary_union(geometries)
    return merged.geom_type != "MultiPolygon"


def extent(db, names) -> dict:
    """Emprise d'un profil, en GeoJSON FeatureCollection. Bloquant.

    Une commune que Nominatim ne connaît plus est ignorée plutôt que de faire
    échouer toute la carte : mieux vaut une emprise partielle que pas de carte.
    """
    features = []
    for name in names:
        try:
            geometry = geometry_of(db, name)
        except CommuneNotFound as exc:
            print(f"[communes] {exc}", flush=True)
            continue
        features.append({
            "type": "Feature",
            "geometry": geometry,
            "properties": {"name": name},
        })
    return {"type": "FeatureCollection", "features": features}
