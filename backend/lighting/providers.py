"""Récupération des points lumineux d'éclairage public, par source.

Chaque provider renvoie des lignes déjà normalisées vers le schéma de
`models.street_lamp.StreetLamp` : `{source, source_ref, latitude, longitude,
tags}`, coordonnées en WGS84.

Deux familles de sources :
- **OSM** (`OsmStreetLampProvider`) : les nœuds `highway=street_lamp`, universels,
  interrogés via Overpass sur l'emprise du profil.
- **OpenDataSoft** (`OdsLightingProvider`) : les jeux « points lumineux » publiés
  par certaines métropoles, tous derrière la même API Explore v2.1 ; un provider
  générique, paramétré par le registre `config.ODS_LIGHTING_DATASETS`.
"""

import time

import httpx
import osmnx as ox
import pandas as pd
from osmnx._errors import InsufficientResponseError
from shapely.geometry import Point
from shapely.prepared import prep

from lighting import config


class LightingSourceError(RuntimeError):
    """La source amont est indisponible ou a répondu quelque chose d'inattendu."""


def _zone_filter(zones):
    """Prédicat « ce point est-il dans l'emprise du profil ? » (polygones communes)."""
    prepared = [prep(zone) for zone in zones]

    def inside(lon, lat):
        point = Point(lon, lat)
        return any(zone.contains(point) for zone in prepared)

    return inside


def _bounds(zones):
    """Boîte englobante (lon_min, lat_min, lon_max, lat_max) de toutes les zones."""
    xs_min, ys_min, xs_max, ys_max = zip(*(zone.bounds for zone in zones))
    return min(xs_min), min(ys_min), max(xs_max), max(ys_max)


class OsmStreetLampProvider:
    """Lampadaires OSM (`highway=street_lamp`), valables pour tous les profils."""

    source = "osm"
    label = "OpenStreetMap (highway=street_lamp)"

    _NON_TAG_COLUMNS = {"geometry", "nodes", "ways", "members"}

    def fetch(self, communes, zones):
        """Renvoie `(lignes, zones_couvertes)`.

        Contrairement aux sources Opendatasoft, interrogées d'un bloc, celle-ci
        va chercher zone par zone : elle rend donc aussi la liste de celles qui
        ont répondu, pour que `sync()` sache quelles emprises sa purge peut
        toucher sans risque.
        """
        gdf, covered = self._features(zones)
        if gdf is None or gdf.empty:
            print("[sync-lighting] OSM : aucun lampadaire retourné.", flush=True)
            return [], covered

        inside = _zone_filter(zones)
        rows = {}
        for (osm_type, osm_id), feature in gdf.iterrows():
            geom = feature.geometry
            if geom is None or geom.is_empty:
                continue
            point = geom if geom.geom_type == "Point" else geom.representative_point()
            lon, lat = float(point.x), float(point.y)
            if not inside(lon, lat):
                continue
            rows[int(osm_id)] = {
                "source": self.source,
                "source_ref": str(int(osm_id)),
                "latitude": lat,
                "longitude": lon,
                "tags": self._clean_tags(feature),
            }
        print(f"[sync-lighting] OSM : {len(rows)} lampadaire(s) retenu(s).", flush=True)
        return list(rows.values()), covered

    def _features(self, zones):
        """Interroge Overpass zone contiguë par zone contiguë, avec backoff.

        On interroge les polygones de `profile_zones` plutôt que la liste de
        communes : `features_from_place` les unirait en une MultiPolygon, dont
        osmnx ne retient que l'enveloppe convexe
        (`utils_geo._consolidate_subdivide_geometry`). Sur un profil
        multi-métropoles, cette enveloppe couvre des dizaines de milliers de
        kilomètres carrés inutiles, qu'osmnx redécoupe en autant de
        sous-requêtes — jusqu'à se faire couper par l'instance publique, avec un
        ConnectTimeoutError qui fait croire à tort à une panne réseau.

        Une zone sans aucun lampadaire n'est pas une erreur : Overpass lève
        `InsufficientResponseError`, qu'on absorbe.

        Une zone qui échoue malgré ses tentatives n'interrompt pas la collecte :
        elle est laissée de côté et exclue des zones rendues, pour que la purge
        l'épargne. Sur une emprise à quinze métropoles, tout abandonner à la
        première zone muette reviendrait à ne plus jamais réussir une synchro.
        """
        parts = []
        covered = []
        for rang, zone in enumerate(zones, start=1):
            try:
                part = self._features_for_zone(zone, rang, len(zones))
            except LightingSourceError as exc:
                print(f"[sync-lighting] OSM zone {rang}/{len(zones)} abandonnée : "
                      f"{exc}. Ses lampadaires sont conservés en l'état.", flush=True)
                continue
            covered.append(tuple(zone.bounds))
            if part is not None and not part.empty:
                parts.append(part)

        if not covered:
            raise LightingSourceError(
                "Aucune zone n'a pu être interrogée sur Overpass."
            )
        return (pd.concat(parts) if parts else None), covered

    def _features_for_zone(self, zone, rang, total):
        for attempt in range(1, config.MAX_RETRIES + 1):
            try:
                return ox.features_from_polygon(zone, {"highway": "street_lamp"})
            except InsufficientResponseError:
                print(f"[sync-lighting] OSM zone {rang}/{total} : aucun lampadaire.",
                      flush=True)
                return None
            except Exception as exc:
                print(f"[sync-lighting] OSM zone {rang}/{total}, tentative "
                      f"{attempt}/{config.MAX_RETRIES} échouée : {exc}", flush=True)
                if attempt == config.MAX_RETRIES:
                    raise LightingSourceError(f"Overpass indisponible : {exc}") from exc
                time.sleep(15 * attempt)

    def _clean_tags(self, feature):
        tags = {}
        for key, value in feature.items():
            if key in self._NON_TAG_COLUMNS:
                continue
            try:
                if pd.isna(value):
                    continue
            except (TypeError, ValueError):
                pass
            tags[key] = value
        return tags


class OdsLightingProvider:
    """Points lumineux d'un portail OpenDataSoft (API Explore v2.1).

    Paramétré par une entrée de `config.ODS_LIGHTING_DATASETS`. On récupère tout
    le jeu en un appel via l'endpoint `exports/geojson`, restreint côté serveur à
    la boîte englobante du profil (`in_bbox`), puis on filtre finement sur les
    polygones de communes.
    """

    def __init__(self, cfg):
        self.cfg = cfg
        self.source = cfg["source"]
        self.label = cfg["label"]

    def fetch(self, communes, zones):
        lon_min, lat_min, lon_max, lat_max = _bounds(zones)
        inside = _zone_filter(zones)

        url = (f"{self.cfg['base_url']}/api/explore/v2.1/catalog/"
               f"datasets/{self.cfg['dataset_id']}/exports/geojson")
        params = {
            "where": (f"in_bbox({self.cfg['geo_field']}, "
                      f"{lat_min}, {lon_min}, {lat_max}, {lon_max})"),
        }

        try:
            with httpx.Client(timeout=config.HTTP_TIMEOUT_S, follow_redirects=True) as client:
                response = client.get(url, params=params)
                response.raise_for_status()
                payload = response.json()
        except Exception as exc:
            raise LightingSourceError(
                f"Interrogation de {self.label} impossible : {exc}"
            ) from exc

        rows = {}
        for feature in payload.get("features", []):
            geom = feature.get("geometry") or {}
            coords = geom.get("coordinates")
            if geom.get("type") != "Point" or not coords or len(coords) < 2:
                continue
            lon, lat = float(coords[0]), float(coords[1])
            if not inside(lon, lat):
                continue
            props = feature.get("properties", {}) or {}
            ref = self._source_ref(props, lon, lat)
            rows[ref] = {
                "source": self.source,
                "source_ref": ref,
                "latitude": lat,
                "longitude": lon,
                "tags": props,
            }
        print(f"[sync-lighting] {self.label} : {len(rows)} point(s) retenu(s).", flush=True)
        return list(rows.values())

    def _source_ref(self, props, lon, lat):
        """Identifiant stable du point, tiré d'un champ métier ou, à défaut, des coords."""
        for field in self.cfg.get("id_fields", ()):
            value = props.get(field)
            if value not in (None, ""):
                return str(value)[:64]
        return f"{lat:.6f},{lon:.6f}"


def ods_providers_for(communes):
    """Providers OpenDataSoft dont une commune déclencheuse figure dans le profil."""
    names = " ".join(communes).lower()
    return [
        OdsLightingProvider(cfg)
        for cfg in config.ODS_LIGHTING_DATASETS
        if any(city in names for city in cfg.get("cities", ()))
    ]
