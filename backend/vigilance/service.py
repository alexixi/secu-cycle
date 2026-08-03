"""État de la vigilance officielle : deux sources indépendantes, une par pays.

Chaque zone du graphe est résolue une fois vers un code administratif (département
français ou zone MeteoAlarm belge), puis les alertes de ce code lui sont
rattachées. Une source n'est interrogée que si son emprise croise une zone du
graphe — même règle que le trafic, la qualité de l'air et les vélos en libre-service.

Ce module ne sert **pas** d'endpoint : ses alertes sont fusionnées dans le résumé
météo (`weather.service`), là où l'utilisateur les attend. Les garder séparées
côté code permet en revanche à chaque source d'échouer seule, et à la cadence de
suivre celle de la publication (deux fois par jour) plutôt que celle de la météo.

Dégradation : une source en panne laisse ses dernières alertes en place jusqu'à
`STALE_AFTER_S`, après quoi elles disparaissent. Une vigilance vieille de six
heures a pu être levée sans qu'on le sache — l'afficher comme un fait serait pire
que de ne rien afficher.
"""

import asyncio
import logging
from datetime import datetime, timezone

from graph.extent import graph_zones, overlaps_any, zone_center
from vigilance import config, providers

logger = logging.getLogger(__name__)


class _State:
    """Dernier instantané connu. Un seul par process."""

    def __init__(self):
        self.updated_at = None
        # Alertes par code administratif : {"33": [...], "BE32": [...]}.
        self.by_area = {}
        # Code administratif de chaque zone du graphe, aligné sur `graph_zones`.
        self.zone_areas = []
        self.zone_count = 0
        self.sources = {}


_state = _State()

# Résolution géographique mise en cache : les codes administratifs ne changent
# pas, il serait absurde d'interroger Nominatim à chaque cycle.
_area_cache: dict[tuple[float, float], tuple[str, str] | None] = {}


def _age_s() -> float | None:
    if _state.updated_at is None:
        return None
    return (datetime.now(timezone.utc) - _state.updated_at).total_seconds()


def is_stale() -> bool:
    age = _age_s()
    return age is None or age > config.STALE_AFTER_S


async def _area_of(lat: float, lon: float):
    key = (round(lat, 3), round(lon, 3))
    if key in _area_cache:
        return _area_cache[key]
    try:
        resolved = await providers.resolve_area(lat, lon)
    except Exception as exc:
        # Pas de mise en cache d'un échec réseau : le prochain cycle réessaiera.
        logger.warning("[vigilance] résolution géographique impossible : %s", exc)
        return None
    _area_cache[key] = resolved
    return resolved


def alerts_for_index(index: int, zone_count: int) -> list[dict]:
    """Alertes officielles d'une zone, désignée par son rang dans `graph_zones`.

    `zone_count` est le nombre de zones vu par l'appelant : s'il diffère du
    nôtre, c'est qu'un profil a été rechargé entre les deux collectes et que les
    index ne désignent plus les mêmes villes. On préfère alors ne rien servir
    plutôt que d'attribuer une vigilance girondine à un trajet tournaisien.

    Prendre l'index plutôt que le graphe évite d'avoir à faire descendre `G`
    jusque dans la sérialisation du snapshot météo.
    """
    if is_stale():
        return []
    if zone_count != _state.zone_count:
        return []
    if index is None or index >= len(_state.zone_areas):
        return []

    area = _state.zone_areas[index]
    if not area:
        return []

    now = datetime.now(timezone.utc)
    live = []
    for alert in _state.by_area.get(area, []):
        # La chronologie Météo-France découpe la journée en sous-périodes : on ne
        # garde que celles qui courent ou qui arrivent, jamais celles qui sont
        # passées.
        if alert["until"] is not None and alert["until"] < now:
            continue
        live.append(alert)

    live.sort(key=lambda a: (a["at"] or now))
    return live


def alerts_at(G, lat: float, lon: float) -> list[dict]:
    """Alertes officielles en vigueur sur la zone où tombe le point."""
    zones = graph_zones(G)
    if not zones:
        return []

    from graph.extent import zone_of
    return alerts_for_index(zone_of(G, lat, lon), len(zones))


def snapshot() -> dict:
    """État des sources, pour le diagnostic. Aucune donnée d'alerte ici."""
    return {
        "updated_at": _state.updated_at.isoformat() if _state.updated_at else None,
        "stale": is_stale(),
        "refresh_interval_s": config.REFRESH_INTERVAL_S,
        "sources": dict(_state.sources),
        "areas": list(_state.zone_areas),
    }


async def refresh(G) -> None:
    """Collecte la vigilance officielle et met à jour l'état.

    Les deux sources partent en parallèle et sont indépendantes : une panne de
    MeteoAlarm ne prive pas les zones françaises de leur vigilance.
    """
    zones = graph_zones(G)
    if not zones:
        return

    # Code administratif de chaque zone, résolu une fois puis mis en cache.
    zone_areas = []
    for bbox in zones:
        lat, lon = zone_center(bbox)
        resolved = await _area_of(lat, lon)
        zone_areas.append(resolved[1] if resolved else None)

    # Une source n'est interrogée que si son emprise croise une zone du graphe,
    # et seulement si au moins une zone a été résolue dans son pays.
    tasks, names = [], []
    for name, spec in config.PROVIDERS.items():
        if not overlaps_any(zones, spec["coverage"]):
            continue

        if spec["kind"] == "opendatasoft":
            departments = sorted({
                area for area, bbox in zip(zone_areas, zones)
                if area and _resolved_country(area) == spec["country"]
            })
            if not departments:
                continue
            tasks.append(providers.fetch_meteofrance(spec, departments))
        elif spec["kind"] == "meteoalarm":
            if not any(area and _resolved_country(area) == spec["country"]
                       for area in zone_areas):
                continue
            tasks.append(providers.fetch_meteoalarm(spec))
        else:
            continue
        names.append(name)

    if not tasks:
        # Aucune source compétente : on vide plutôt que de garder l'état d'un
        # profil précédent, qui décrirait d'autres villes.
        _state.by_area = {}
        _state.zone_areas = zone_areas
        _state.zone_count = len(zones)
        _state.updated_at = datetime.now(timezone.utc)
        _state.sources = {}
        return

    results = await asyncio.gather(*tasks, return_exceptions=True)

    by_area, sources = {}, {}
    any_success = False
    for name, result in zip(names, results):
        if isinstance(result, Exception):
            logger.warning("[vigilance] échec de %s : %s", name, result)
            sources[name] = {"available": False, "error": str(result), "alerts": 0}
            continue
        any_success = True
        for alert in result:
            by_area.setdefault(alert["area"], []).append(alert)
        sources[name] = {
            "available": True,
            "error": None,
            "alerts": len(result),
            "attribution": config.PROVIDERS[name]["attribution"],
        }

    if not any_success:
        # Toutes en échec : on conserve le dernier état, qui vieillira jusqu'à
        # `STALE_AFTER_S` puis cessera d'être servi par `alerts_at`.
        _state.sources = sources
        logger.warning("[vigilance] aucune source disponible, dernier état conservé.")
        return

    # Affectations en bloc, sans `await` entre elles.
    _state.by_area = by_area
    _state.zone_areas = zone_areas
    _state.zone_count = len(zones)
    _state.sources = sources
    _state.updated_at = datetime.now(timezone.utc)

    total = sum(len(v) for v in by_area.values())
    logger.info(
        "[vigilance] %d alerte(s) sur %s pour %d zone(s) : %s",
        total, ", ".join(names) or "aucune source", len(zones),
        ", ".join(f"{a}={len(v)}" for a, v in by_area.items()) or "rien à signaler",
    )


def _resolved_country(area: str) -> str:
    """Pays d'un code administratif : les zones MeteoAlarm belges commencent par
    « BE », les départements français sont purement numériques (ou 2A/2B)."""
    return "be" if str(area).upper().startswith("BE") else "fr"
