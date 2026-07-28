"""État des vélos en libre-service : une collecte, un seul usage — la carte.

Contrairement au trafic et à la qualité de l'air, cette couche est **strictement
informative** : elle ne touche pas au graphe et ne fait jamais purger le cache
d'itinéraires. Savoir qu'une station est vide ne change pas le coût d'une rue.

La collecte est faite par la tâche de fond de `main.py`, **jamais** dans le chemin
d'une requête utilisateur : `/bikeshare/` sert `snapshot()`, qui ne fait que lire.

Deux cadences en une seule boucle, parce que les deux flux GBFS n'ont pas la même
nature : `station_status` est du temps réel (~60 s), `station_information` est
quasi statique (une station nouvelle par mois, au mieux). La boucle bat toutes les
`TICK_S` secondes et chaque système décide seul de ce qui lui est dû.

Un système est mis en sommeil s'il ne garde aucune station dans l'emprise du
graphe : Blue-bike est réveillé par son emprise sur un profil Tournai, mais sa
station la plus proche est à 21 km — un seul chargement d'informations, puis
silence jusqu'au prochain cycle complet.
"""

import asyncio
import hashlib
import logging
import time
from datetime import datetime, timezone

import httpx

from bikeshare import config, providers
from graph.extent import graph_bbox, overlaps

logger = logging.getLogger(__name__)


class _SystemState:
    """Ce que l'on sait d'un système. Survit aux pannes de son flux."""

    def __init__(self):
        self.feeds = {}                 # auto-discovery mémorisée
        self.kinds = {}                 # vehicle_type_id -> mechanical|electric|other
        self.stations = {}              # station_id -> info, filtrée sur l'emprise
        self.status = {}                # station_id -> statut
        self.status_at = None           # datetime de la dernière collecte réussie
        self.next_information_at = 0.0  # échéances, en time.monotonic()
        self.next_status_at = 0.0
        self.interval_s = config.DEFAULT_STATUS_INTERVAL_S
        self.failures = 0
        self.error = None
        self.dormant = False            # aucune station dans l'emprise

    def age_s(self, now: datetime) -> float | None:
        if self.status_at is None:
            return None
        return (now - self.status_at).total_seconds()


class _State:
    """Dernier instantané connu. Un seul par process."""

    def __init__(self):
        self.available = False
        self.features = []
        self.updated_at = None
        self.stale = False
        self.systems = []
        self.counts = {"stations": 0, "bikes": 0, "mechanical": 0,
                       "electric": 0, "docks": 0}
        self.interval_s = config.DEFAULT_STATUS_INTERVAL_S
        self.etag = None
        self.bbox = None

    def as_dict(self):
        return {
            "available": self.available,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "stale": self.stale,
            "refresh_interval_s": self.interval_s,
            "counts": dict(self.counts),
            "systems": list(self.systems),
            "geojson": {"type": "FeatureCollection", "features": self.features},
        }


_state = _State()
_systems: dict[str, _SystemState] = {}


def snapshot() -> dict:
    """Instantané courant. Lecture pure, aucun appel réseau."""
    return _state.as_dict()


def etag() -> str | None:
    """Empreinte du dernier instantané, calculée une fois par collecte."""
    return _state.etag


def systems_for(bbox) -> list[str]:
    """Systèmes dont l'emprise croise celle du graphe chargé."""
    if bbox is None:
        return []
    return [
        name
        for name, spec in config.SYSTEMS.items()
        if overlaps(bbox, spec["coverage"])
    ]


def _within(station: dict, bbox) -> bool:
    w, s, e, n = bbox
    return w <= station["lon"] <= e and s <= station["lat"] <= n


def _reset():
    """Vide l'état affiché, sans toucher aux systèmes déjà connus."""
    _state.available = False
    _state.features = []
    _state.systems = []
    _state.counts = {"stations": 0, "bikes": 0, "mechanical": 0,
                     "electric": 0, "docks": 0}
    _state.stale = False
    _state.etag = None
    _state.updated_at = datetime.now(timezone.utc)


# --- Collecte d'un système ---------------------------------------------------

async def _refresh_system(client, name: str, bbox, full: bool) -> None:
    """Collecte un système. N'échoue jamais : toute erreur est absorbée dans son
    `_SystemState`, avec un recul exponentiel sur les tentatives suivantes."""
    spec = config.SYSTEMS[name]
    state = _systems[name]
    now = time.monotonic()

    try:
        if full:
            feeds, manifest_ttl = await providers.fetch_feeds(client, spec)
            if not feeds:
                # Pas de station : service en flotte libre, ou flux incomplet.
                state.feeds = {}
                state.stations = {}
                state.status = {}
                state.dormant = True
                state.next_information_at = now + config.INFORMATION_INTERVAL_S
                logger.info("[vls] %s ne publie pas de stations : ignoré.", name)
                return

            state.feeds = feeds
            state.kinds = await providers.fetch_vehicle_kinds(client, feeds, spec)

            stations = await providers.fetch_stations(client, feeds, spec)
            kept = {
                s["station_id"]: s
                for s in stations
                if not s["virtual"] and _within(s, bbox)
            }
            state.stations = kept
            state.dormant = not kept
            state.next_information_at = now + config.INFORMATION_INTERVAL_S

            if state.dormant:
                state.status = {}
                state.failures = 0
                state.error = None
                logger.info(
                    "[vls] %s : aucune des %d stations n'est dans l'emprise, mis en sommeil.",
                    name, len(stations),
                )
                return
        else:
            manifest_ttl = None

        statuses, status_ttl = await providers.fetch_status(
            client, state.feeds, spec, state.kinds
        )
        state.status = {
            s["station_id"]: s
            for s in statuses
            if s["station_id"] in state.stations
        }
        state.status_at = datetime.now(timezone.utc)
        state.failures = 0
        state.error = None

        ttl = status_ttl or manifest_ttl or config.DEFAULT_STATUS_INTERVAL_S
        state.interval_s = min(
            max(ttl, config.MIN_STATUS_INTERVAL_S), config.MAX_STATUS_INTERVAL_S
        )
        state.next_status_at = time.monotonic() + state.interval_s

    except Exception as exc:
        state.failures += 1
        # Jamais `str(exc)` : la clé d'API vit dans l'URL, que httpx recopie dans
        # le message — et ce message est exposé dans la réponse publique.
        state.error = providers.describe_error(exc)
        backoff = min(
            config.BACKOFF_BASE_S * 2 ** (state.failures - 1), config.BACKOFF_MAX_S
        )
        state.next_status_at = time.monotonic() + backoff
        if full:
            state.next_information_at = state.next_status_at
        logger.warning("[vls] %s en échec (%s), nouvelle tentative dans %ds.",
                       name, state.error, backoff)


# --- Composition de l'instantané ---------------------------------------------

def _label(status: dict | None) -> str:
    """Une seule clé pour piloter la couleur de la pastille."""
    if status is None:
        return "unknown"
    if not status["installed"] or (not status["renting"] and not status["returning"]):
        return "closed"
    if status["bikes"] is None:
        return "unknown"
    if status["bikes"] == 0:
        return "empty"
    if status["docks"] == 0:
        return "full"
    return "ok"


def _feature(name: str, spec: dict, info: dict, status: dict | None,
             stale: bool) -> dict:
    """Une station en Feature GeoJSON. `status` à None ⇒ station affichée sans
    chiffres : le nom et la capacité restent vrais, les compteurs ne le sont plus."""
    feature_id = f"{name}:{info['station_id']}"
    reported = status["reported_at"] if status else None
    return {
        "type": "Feature",
        "id": feature_id,
        "geometry": {
            "type": "Point",
            "coordinates": [
                round(info["lon"], config.COORD_PRECISION),
                round(info["lat"], config.COORD_PRECISION),
            ],
        },
        "properties": {
            "station_id": feature_id,
            "system": name,
            "system_name": spec["name"],
            "operator": spec.get("operator", ""),
            "name": info["name"],
            "address": info["address"],
            "bikes_available": status["bikes"] if status else None,
            "bikes_mechanical": status["mechanical"] if status else None,
            "bikes_electric": status["electric"] if status else None,
            "docks_available": status["docks"] if status else None,
            "capacity": info["capacity"],
            # Défaut « en service » quand le statut manque : une station listée est
            # présumée active, on ne l'annonce pas fermée faute de donnée.
            "is_installed": status["installed"] if status else True,
            "is_renting": status["renting"] if status else True,
            "is_returning": status["returning"] if status else True,
            # Horodatage publié par l'opérateur, restitué tel quel : tous ne le
            # maintiennent pas, il informe sans piloter l'affichage.
            "last_reported": reported.isoformat() if reported else None,
            "stale": stale,
            "status": _label(status),
        },
    }


def _compose(names: list[str], now: datetime) -> None:
    """Recompose l'instantané à partir de **tous** les systèmes actifs, dus ou non.

    Un flux en panne garde ses stations affichées avec ses derniers compteurs,
    marqués périmés : la carte ne se vide pas parce qu'un portail a hoqueté.
    """
    features, summaries = [], []
    counts = {"stations": 0, "bikes": 0, "mechanical": 0, "electric": 0, "docks": 0}
    intervals, any_fresh = [], False

    for name in names:
        state = _systems[name]
        spec = config.SYSTEMS[name]
        if state.dormant or not state.stations:
            # Un système en sommeil est simplement hors sujet ici et reste muet.
            # Un système en échec, lui, doit se signaler : sans cela, un flux
            # tombé dès le premier chargement disparaîtrait sans laisser de trace.
            if state.error:
                summaries.append({
                    "id": name,
                    "name": spec["name"],
                    "operator": spec.get("operator", ""),
                    "attribution": spec.get("attribution", ""),
                    "stations": 0,
                    "updated_at": None,
                    "stale": True,
                    "error": state.error,
                })
            continue

        age = state.age_s(now)
        stale = age is None or age > config.STALE_AFTER_S
        # Au-delà, les compteurs ne signifient plus rien : on les efface plutôt
        # que d'annoncer des vélos qui n'y sont plus.
        expired = age is None or age > config.DROP_COUNTS_AFTER_S
        any_fresh = any_fresh or not stale
        intervals.append(state.interval_s)

        for station_id, info in state.stations.items():
            status = None if expired else state.status.get(station_id)
            features.append(_feature(name, spec, info, status, stale))
            counts["stations"] += 1
            if status:
                counts["bikes"] += status["bikes"] or 0
                counts["mechanical"] += status["mechanical"] or 0
                counts["electric"] += status["electric"] or 0
                counts["docks"] += status["docks"] or 0

        summaries.append({
            "id": name,
            "name": spec["name"],
            "operator": spec.get("operator", ""),
            "attribution": spec.get("attribution", ""),
            "stations": len(state.stations),
            "updated_at": state.status_at.isoformat() if state.status_at else None,
            "stale": stale,
            "error": state.error,
        })

    # Empreinte sur la donnée normalisée, indépendante de `updated_at` : un flux
    # qui republie des compteurs identiques ne doit pas forcer un retéléchargement.
    digest = hashlib.md5(usedforsecurity=False)
    for feature in features:
        p = feature["properties"]
        digest.update(
            f"{p['station_id']}|{p['bikes_available']}|{p['bikes_mechanical']}"
            f"|{p['bikes_electric']}|{p['docks_available']}|{p['status']}\n".encode()
        )

    # Affectations en bloc, sans `await` entre elles : un lecteur voit l'ancien ou
    # le nouvel instantané, jamais un mélange des deux.
    _state.features = features
    _state.systems = summaries
    _state.counts = counts
    _state.available = bool(features)
    _state.stale = bool(features) and not any_fresh
    _state.interval_s = min(intervals) if intervals else config.DEFAULT_STATUS_INTERVAL_S
    _state.etag = 'W/"' + digest.hexdigest() + '"'
    _state.updated_at = now


# --- Boucle ------------------------------------------------------------------

async def refresh(G) -> None:
    """Rafraîchit ce qui est dû et recompose l'instantané.

    `G` ne sert qu'à connaître l'emprise : ni le graphe ni le cache d'itinéraires
    ne sont touchés.
    """
    if not config.ENABLED:
        return

    bbox = graph_bbox(G)
    names = systems_for(bbox)

    if bbox != _state.bbox:
        # Changement de profil : les stations retenues l'ont été sur l'ancienne
        # emprise. Sans cette remise à zéro, une bascule Bordeaux → Tournai
        # laisserait les stations bordelaises sur la carte de Tournai.
        for name in list(_systems):
            if name not in names:
                del _systems[name]
        for state in _systems.values():
            state.dormant = False
            state.next_information_at = 0.0
            state.next_status_at = 0.0
        _state.bbox = bbox

    if not names:
        if _state.available or _state.updated_at is None:
            logger.info("[vls] aucun système pour ce profil : couche désactivée.")
        _reset()
        return

    now = time.monotonic()
    due = []
    for name in names:
        state = _systems.setdefault(name, _SystemState())
        if not state.feeds or now >= state.next_information_at:
            due.append((name, True))
        elif not state.dormant and now >= state.next_status_at:
            due.append((name, False))

    # Rien de dû : l'instantané précédent est encore le bon. Le recomposer
    # reconstruirait des milliers de dictionnaires pour un résultat identique — et
    # la boucle bat deux fois par minute.
    if not due:
        return

    async with httpx.AsyncClient(
        timeout=config.HTTP_TIMEOUT_S,
        headers={"User-Agent": config.USER_AGENT},
        follow_redirects=True,
    ) as client:
        # `return_exceptions` est la ceinture ; `_refresh_system` absorbe déjà
        # tout en interne, ce sont les bretelles.
        await asyncio.gather(
            *(_refresh_system(client, name, bbox, full) for name, full in due),
            return_exceptions=True,
        )

    _compose(names, datetime.now(timezone.utc))

    logger.info(
        "[vls] %d station(s) sur %d système(s) : %d vélos dont %d électriques%s",
        _state.counts["stations"], len(_state.systems),
        _state.counts["bikes"], _state.counts["electric"],
        " (périmé)" if _state.stale else "",
    )
