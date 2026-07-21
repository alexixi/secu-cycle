"""Routage entre providers, filtrage géographique, cache et budget.

La règle centrale est le **filtrage sur l'emprise**, et non un seuil de score.
La BAN est un référentiel d'adresses : interrogée sur un lieu, elle ne rend pas
« rien » mais du bruit géographiquement absurde, et ce bruit n'est pas séparable
par le score (mesuré : « rue des lil » → 0.602 et légitime, « Gare Saint-Jean »
→ 0.620 et faux). La géographie, elle, sépare proprement — et un résultat hors
du graphe chargé est de toute façon inutilisable, puisqu'on ne sait pas y router.
"""

import logging
import re
from datetime import datetime, timedelta, timezone
from itertools import zip_longest

from sqlalchemy.exc import IntegrityError

from geocoding import config, providers
from graph import routing
from models.geocode_cache import GeocodeCache, GeocodeUsage

logger = logging.getLogger(__name__)

MAX_RESULT_DISTANCE_M = 25_000.0

_WORD_RE = re.compile(r"[^\W\d_]+", re.UNICODE)

def countries_of(communes) -> list[str]:
    """Codes pays ISO du profil, déduits du suffixe des communes.

    « Tournai, Belgium » → be. Un suffixe inconnu est ignoré ; si aucun n'est
    reconnu, on retombe sur le pays historique.
    """
    codes = []
    for commune in communes or []:
        suffix = str(commune).rsplit(",", 1)[-1].strip().lower()
        code = config.COUNTRY_SUFFIXES.get(suffix)
        if code and code not in codes:
            codes.append(code)
    return codes or [config.DEFAULT_COUNTRY]


def graph_bbox(G) -> tuple[float, float, float, float] | None:
    """Emprise (w, s, e, n) des nœuds du graphe, calculée une fois puis mémorisée."""
    cached = G.graph.get("_geocode_bbox")
    if cached is not None:
        return cached

    xs = [d["x"] for _, d in G.nodes(data=True) if "x" in d]
    ys = [d["y"] for _, d in G.nodes(data=True) if "y" in d]
    if not xs or not ys:
        return None

    bbox = (min(xs), min(ys), max(xs), max(ys))
    G.graph["_geocode_bbox"] = bbox
    return bbox


def graph_center(G) -> tuple[float, float] | None:
    """Centre de l'emprise, en (lat, lon), pour biaiser les recherches."""
    bbox = graph_bbox(G)
    if bbox is None:
        return None
    w, s, e, n = bbox
    return ((s + n) / 2, (w + e) / 2)


def _within_extent(G, result: dict) -> bool:
    """Ce résultat est-il assez proche du graphe pour être crédible ?"""
    distance = routing.snap_distance_m(G, result["lat"], result["lon"])
    return distance is not None and distance <= MAX_RESULT_DISTANCE_M


def _looks_like_address(query: str) -> bool:
    """Décide si la requête ressemble à une adresse ou à un lieu."""
    stripped = query.strip()
    if stripped[:1].isdigit():
        return True
    first = _WORD_RE.search(stripped)
    return first is not None and first.group(0).lower() in config.STREET_KEYWORDS


def sort_results(results: list[dict], query: str) -> list[dict]:
    """Adresses devant si la requête en a l'air, lieux devant sinon."""
    prefer = "address" if _looks_like_address(query) else "place"
    return sorted(results, key=lambda r: r.get("kind") != prefer)


def _interleave(*groups: list[dict]) -> list[dict]:
    """Entrelace les résultats de plusieurs providers, à tour de rôle."""
    merged = []
    for row in zip_longest(*groups):
        merged.extend(r for r in row if r is not None)
    return merged


def _lead_order(ban: list[dict], maptiler: list[dict]) -> tuple[list[dict], list[dict]]:
    """Qui mène l'entrelacement, de la BAN ou de MapTiler ?"""
    best = max((r.get("score") or 0) for r in ban) if ban else 0
    return (ban, maptiler) if best >= config.BAN_STRONG_MATCH else (maptiler, ban)


def _dedupe(results: list[dict]) -> list[dict]:
    """Écarte les doublons entre providers, sur la position arrondie (~1 m)."""
    seen = set()
    unique = []
    for result in results:
        key = (round(result["lat"], 5), round(result["lon"], 5))
        if key in seen:
            continue
        seen.add(key)
        unique.append(result)
    return unique

def _current_period() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m")


def maptiler_budget_left(db) -> bool:
    """Reste-t-il du quota MapTiler ce mois-ci ?"""
    period = _current_period()
    usage = (
        db.query(GeocodeUsage)
        .filter(GeocodeUsage.provider == "maptiler", GeocodeUsage.period == period)
        .first()
    )
    return usage is None or usage.calls < config.MAPTILER_MONTHLY_BUDGET


def _record_maptiler_call(db) -> None:
    """Incrémente le compteur mensuel. Ne doit jamais faire échouer la requête."""
    period = _current_period()
    try:
        usage = (
            db.query(GeocodeUsage)
            .filter(GeocodeUsage.provider == "maptiler", GeocodeUsage.period == period)
            .first()
        )
        if usage is None:
            db.add(GeocodeUsage(provider="maptiler", period=period, calls=1))
        else:
            usage.calls += 1
        db.commit()
    except Exception as exc:
        db.rollback()
        logger.warning("Compteur MapTiler non mis à jour : %s", exc)


def _normalize(query: str) -> str:
    return " ".join(query.lower().split())[:255]


def _cache_get(db, kind: str, key: str, profile: str) -> list[dict] | None:
    entry = (
        db.query(GeocodeCache)
        .filter(
            GeocodeCache.kind == kind,
            GeocodeCache.query == key,
            GeocodeCache.profile == profile,
        )
        .first()
    )
    if entry is None:
        return None

    age = datetime.now(timezone.utc) - entry.fetched_at.replace(tzinfo=timezone.utc)
    if age > timedelta(days=config.CACHE_TTL_DAYS):
        db.delete(entry)
        db.commit()
        return None

    return entry.results


def _cache_put(db, kind: str, key: str, profile: str, results: list[dict]) -> None:
    """Mémorise une réponse. Un échec d'écriture ne doit pas casser la recherche."""
    try:
        db.add(GeocodeCache(kind=kind, query=key, profile=profile, results=results))
        db.commit()
    except IntegrityError:
        db.rollback()
    except Exception as exc:
        db.rollback()
        logger.warning("Cache de géocodage non alimenté : %s", exc)



def search(db, G, profile: str, communes, query: str) -> list[dict]:
    """Adresses et lieux correspondant à `query`, dans l'emprise du graphe chargé."""
    query = query.strip()
    if len(query) < config.MIN_QUERY_LENGTH:
        return []

    key = _normalize(query)
    cached = _cache_get(db, "search", key, profile)
    if cached is not None:
        return cached

    countries = countries_of(communes)
    bias = graph_center(G)
    is_cross_border = len(countries) > 1
    use_ban = bool(config.BAN_COUNTRIES & set(countries))

    ban_results = []
    if use_ban:
        ban_results = [r for r in providers.ban_search(query, bias) if _within_extent(G, r)]

    maptiler_results = []
    degraded = False
    if not ban_results or is_cross_border:
        if maptiler_budget_left(db):
            try:
                _record_maptiler_call(db)
                raw = providers.maptiler_search(query, countries, bias, graph_bbox(G))
                maptiler_results = [r for r in raw if _within_extent(G, r)]
            except providers.ProviderUnavailable:
                degraded = True
        else:
            degraded = True
            logger.warning(
                "Budget MapTiler épuisé pour %s : recherche dégradée en BAN seule.",
                _current_period(),
            )

    merged = _interleave(*_lead_order(ban_results, maptiler_results))
    results = sort_results(_dedupe(merged), query)[: config.RESULT_LIMIT]

    if not degraded:
        _cache_put(db, "search", key, profile, results)
    return results


def reverse(db, G, profile: str, communes, lat: float, lon: float) -> dict | None:
    """Adresse ou lieu le plus proche du point. None si rien n'est trouvé."""
    key = f"{round(lat, config.CACHE_COORD_PRECISION)},{round(lon, config.CACHE_COORD_PRECISION)}"
    cached = _cache_get(db, "reverse", key, profile)
    if cached is not None:
        return cached[0] if cached else None

    countries = countries_of(communes)
    results = []
    degraded = False

    if config.BAN_COUNTRIES & set(countries):
        results = providers.ban_reverse(lat, lon)

    if not results:
        if maptiler_budget_left(db):
            try:
                _record_maptiler_call(db)
                results = providers.maptiler_reverse(lat, lon, countries)
            except providers.ProviderUnavailable:
                degraded = True
        else:
            degraded = True

    if not degraded:
        _cache_put(db, "reverse", key, profile, results[:1])
    return results[0] if results else None
