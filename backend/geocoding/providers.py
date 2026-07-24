"""Clients des sources de géocodage, normalisés vers un format unique.

Chaque provider expose `search(...)` et, quand il sait le faire, `reverse(...)`,
et rend une liste de dictionnaires de la forme attendue par les clients :

    {id, lat, lon, display_name, name, city, postcode, kind, provider}

`kind` vaut "address" ou "place" : il sert au tri (cf. `service.sort_results`).
Un provider injoignable rend une liste vide — jamais une exception : une
recherche d'adresse dégradée vaut mieux qu'un formulaire cassé.
"""

import logging
from urllib.parse import quote

import httpx

from geocoding import config

logger = logging.getLogger(__name__)


class ProviderUnavailable(Exception):
    """Le provider n'a pas pu être interrogé (mal configuré, pas juste muet)."""

_client = httpx.Client(
    timeout=config.HTTP_TIMEOUT_S,
    headers={"User-Agent": "secu-cycle/1.0 (+https://secu-cycle.fr)"},
)

def _from_ban(feature: dict) -> dict | None:
    """Normalise une feature GeoJSON de la BAN. None si elle est inexploitable."""
    try:
        props = feature["properties"]
        lon, lat = feature["geometry"]["coordinates"][:2]
    except (KeyError, TypeError, ValueError):
        return None

    return {
        "id": props.get("id"),
        "lat": lat,
        "lon": lon,
        "display_name": props.get("label"),
        "name": props.get("name"),
        "city": props.get("city"),
        "postcode": props.get("postcode"),
        "kind": "address",
        "provider": "ban",
        "score": props.get("score"),
    }


def ban_search(query: str, bias: tuple[float, float] | None) -> list[dict]:
    """Adresses françaises correspondant à `query`, biaisées vers `bias`."""
    params = {
        "q": query,
        "limit": str(config.RESULT_LIMIT),
        "autocomplete": "1",
    }
    if bias is not None:
        params["lat"], params["lon"] = f"{bias[0]:.5f}", f"{bias[1]:.5f}"

    return _fetch_ban(config.BAN_SEARCH_URL, params)


def ban_reverse(lat: float, lon: float) -> list[dict]:
    """Adresse française la plus proche du point."""
    return _fetch_ban(config.BAN_REVERSE_URL, {"lat": str(lat), "lon": str(lon), "limit": "1"})


def _fetch_ban(url: str, params: dict) -> list[dict]:
    try:
        response = _client.get(url, params=params)
        response.raise_for_status()
        features = response.json().get("features") or []
    except (httpx.HTTPError, ValueError) as exc:
        logger.warning("BAN injoignable (%s) : %s", url, exc)
        return []

    return [r for r in (_from_ban(f) for f in features) if r is not None]


def _context_value(feature: dict, prefix: str) -> str | None:
    """Valeur du parent de type `prefix` dans la hiérarchie d'une feature.

    MapTiler place la commune et le code postal dans `context`, sous forme
    d'entrées dont l'`id` est préfixé par leur type ("postal_code.12", …).
    """
    for parent in feature.get("context") or []:
        if str(parent.get("id", "")).split(".")[0] == prefix:
            return parent.get("text")
    return None


def _from_maptiler(feature: dict) -> dict | None:
    """Normalise une feature GeoJSON de MapTiler. None si elle est inexploitable."""
    center = feature.get("center") or (feature.get("geometry") or {}).get("coordinates")
    try:
        lon, lat = center[:2]
    except (TypeError, ValueError):
        return None

    place_types = feature.get("place_type") or []
    is_address = bool({"address", "road", "street"} & set(place_types))

    return {
        "id": feature.get("id"),
        "lat": lat,
        "lon": lon,
        "display_name": feature.get("place_name") or feature.get("text"),
        "name": feature.get("text"),
        "city": _context_value(feature, "municipality") or _context_value(feature, "place"),
        "postcode": _context_value(feature, "postal_code"),
        "kind": "address" if is_address else "place",
        "provider": "maptiler",
        "score": feature.get("relevance"),
    }


def maptiler_search(
    query: str,
    countries: list[str],
    bias: tuple[float, float] | None,
    bbox: tuple[float, float, float, float] | None,
) -> list[dict]:
    """Adresses **et lieux** correspondant à `query`, restreints à `countries`.

    C'est ce qui rattrape ce que la BAN ne sait pas faire : « ENSEIRB-MATMECA »
    ou « CHU Pellegrin » sont des POI, absents d'un référentiel d'adresses.
    """
    key = config.maptiler_key()
    if key is None:
        logger.warning("MAPTILER_KEY absente : géocodage hors BAN indisponible.")
        raise ProviderUnavailable("MAPTILER_KEY absente")

    params = {
        "key": key,
        "autocomplete": "true",
        "limit": str(config.RESULT_LIMIT),
        "language": "fr",
        "types": "address,road,poi,municipality",
    }
    if countries:
        params["country"] = ",".join(countries)
    if bias is not None:
        params["proximity"] = f"{bias[1]:.5f},{bias[0]:.5f}"
    if bbox is not None:
        params["bbox"] = ",".join(f"{v:.5f}" for v in bbox)

    return _fetch_maptiler(query, params)


def maptiler_reverse(lat: float, lon: float, countries: list[str]) -> list[dict]:
    """Lieu ou adresse le plus proche du point."""
    key = config.maptiler_key()
    if key is None:
        raise ProviderUnavailable("MAPTILER_KEY absente")

    params = {"key": key, "limit": "1", "language": "fr"}
    if countries:
        params["country"] = ",".join(countries)

    return _fetch_maptiler(f"{lon},{lat}", params)


def _fetch_maptiler(query: str, params: dict) -> list[dict]:
    url = config.MAPTILER_GEOCODE_URL.format(query=quote(query, safe=","))
    try:
        response = _client.get(url, params=params)
        response.raise_for_status()
        features = response.json().get("features") or []
    except (httpx.HTTPError, ValueError) as exc:
        logger.warning("MapTiler injoignable : %s", exc)
        return []

    return [r for r in (_from_maptiler(f) for f in features) if r is not None]
