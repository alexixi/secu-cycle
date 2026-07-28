"""Accès aux flux GBFS. Entrées/sorties pures, aucun état conservé.

Le standard a beaucoup bougé : les flux en production parlent v1, v2 ou v3, et les
écarts portent précisément sur les champs dont la carte a besoin. Toute la
compatibilité vit ici, dans les helpers du haut de fichier — les fonctions de
collecte, en dessous, ne voient plus qu'un vocabulaire unique.

Les six divergences traitées, avec un exemple réel de chaque :

    manifeste     v3 `data.feeds` (Bordeaux)  /  v1-v2 `data.<langue>.feeds` (Vélib')
    nom           chaîne (Vélib')             /  tableau localisé (Bordeaux)
    identifiant   entier 213688169 (Vélib')   /  chaîne "1" (Bordeaux)
    drapeaux      0 / 1 (Vélib')              /  true / false (Bordeaux)
    horodatage    epoch 1785078320 (Vélib')   /  ISO 8601 (Bordeaux)
    ventilation   `num_bikes_available_types` /  `vehicle_types_available` + types

Sortie normalisée, en trois formes :

    feeds    {"station_information": url, "station_status": url, ...}
    station  {"station_id", "name", "lat", "lon", "capacity", "address", "virtual"}
    statut   {"station_id", "bikes", "mechanical", "electric", "docks",
              "installed", "renting", "returning", "reported_at"}
"""

import logging
from datetime import datetime, timezone

import httpx

from bikeshare import config

logger = logging.getLogger(__name__)

# Flux indispensables : sans eux, le système ne décrit pas des stations (flotte
# libre) et n'a rien à faire sur cette couche.
REQUIRED_FEEDS = ("station_information", "station_status")


# --- Compatibilité v1 / v2 / v3 ---------------------------------------------

def _unwrap(data, key, lang=None):
    """Valeur de `key` dans `data`, en dépliant l'éventuel niveau de langue.

    v3 : `{"feeds": [...]}` — direct.
    v1/v2 : `{"en": {"feeds": [...]}, "fr": {...}}` — on prend `lang`, sinon fr,
    sinon en, sinon la première entrée qui porte la clé.

    La spec ne prévoit ce niveau que dans `gbfs.json`, mais quelques flux le
    reproduisent ailleurs : la défense ne coûte rien.
    """
    if not isinstance(data, dict):
        return None
    if key in data:
        return data[key]
    for candidate in (lang, "fr", "en"):
        nested = data.get(candidate) if candidate else None
        if isinstance(nested, dict) and key in nested:
            return nested[key]
    for nested in data.values():
        if isinstance(nested, dict) and key in nested:
            return nested[key]
    return None


def _text(value, lang=None) -> str:
    """Chaîne (v1/v2) ou tableau localisé `[{"text", "language"}]` (v3) → chaîne."""
    if isinstance(value, str):
        return value.strip()
    if isinstance(value, list):
        entries = [e for e in value if isinstance(e, dict) and e.get("text")]
        if not entries:
            return ""
        for candidate in (lang, "fr", "en"):
            if not candidate:
                continue
            for entry in entries:
                if str(entry.get("language") or "").lower() == candidate:
                    return str(entry["text"]).strip()
        return str(entries[0]["text"]).strip()
    return ""


def _flag(value, default=True) -> bool:
    """Drapeau booléen (v3) ou entier 0/1 (v1/v2). Absent ⇒ `default`.

    Le défaut est `True` : une station listée est présumée en service. Un
    `if raw.get("is_installed")` naïf traiterait l'absence du champ comme une
    fermeture et viderait la carte des flux qui ne le publient pas.
    """
    if value is None:
        return default
    if isinstance(value, str):
        return value.strip().lower() not in {"", "0", "false", "no"}
    return bool(value)


def _moment(value) -> datetime | None:
    """Horodatage ISO 8601 (v3) ou epoch en secondes (v1/v2) → datetime UTC."""
    if value is None or isinstance(value, bool):
        return None
    if isinstance(value, (int, float)):
        try:
            return datetime.fromtimestamp(value, timezone.utc)
        except (OverflowError, OSError, ValueError):
            return None
    if isinstance(value, str):
        raw = value.strip()
        if not raw:
            return None
        if raw.isdigit():
            return _moment(int(raw))
        try:
            parsed = datetime.fromisoformat(raw.replace("Z", "+00:00"))
        except ValueError:
            return None
        return parsed if parsed.tzinfo else parsed.replace(tzinfo=timezone.utc)
    return None


def _int(value) -> int | None:
    """Entier, ou None si la valeur est absente ou inexploitable."""
    if value is None or isinstance(value, bool):
        return None
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def _identifier(value) -> str:
    """Identifiant de station en chaîne, quel que soit son type d'origine.

    Vélib' le publie en entier, Bordeaux en chaîne. C'est la clé de jointure entre
    `station_information` et `station_status` : normalisé d'un seul côté, la
    jointure ne trouve rien et toutes les stations s'affichent sans compteurs.
    """
    if value is None or isinstance(value, bool):
        return ""
    return str(value).strip()


def _with_params(url: str, params: dict | None) -> str:
    """URL avec `params` fusionnés à la query existante.

    `client.get(url, params=...)` sur une URL portant déjà une query a un
    comportement variable selon les versions de httpx ; `copy_merge_params` est
    l'API publique qui fait exactement ce qu'on veut.
    """
    if not params:
        return url
    return str(httpx.URL(url).copy_merge_params(params))


def describe_error(exc: Exception) -> str:
    """Message d'erreur sûr, destiné à être exposé dans la réponse publique.

    `str(HTTPStatusError)` contient l'URL complète — donc la clé d'API des flux
    qui en portent une. On ne restitue que le type et, s'il existe, le code HTTP.
    """
    status = getattr(getattr(exc, "response", None), "status_code", None)
    if status is not None:
        return f"{type(exc).__name__} (HTTP {status})"
    return type(exc).__name__


def _guess_kind(type_id: str) -> str | None:
    """Repli quand `vehicle_types.json` est indisponible : le type est deviné à
    partir de son identifiant, qui est conventionnel chez la plupart des
    opérateurs. Approximatif et assumé — jamais utilisé si le flux répond."""
    slug = type_id.strip().lower()
    if slug in config.ELECTRIC_KEYS or "elec" in slug or "ebike" in slug:
        return "electric"
    if slug in config.MECHANICAL_KEYS:
        return "mechanical"
    return None


def _split(raw: dict, kinds: dict[str, str]) -> tuple[int | None, int | None]:
    """(mécaniques, électriques) d'une station, ou (None, None) sans ventilation.

    Deux chemins, dans l'ordre : la forme v1/v2 (`num_bikes_available_types`,
    liste de dictionnaires à une clé) puis la forme v3 (`vehicle_types_available`,
    résolue via `vehicle_types.json`).
    """
    mechanical = electric = None

    def add(kind, count):
        nonlocal mechanical, electric
        if kind == "mechanical":
            mechanical = (mechanical or 0) + count
        elif kind == "electric":
            electric = (electric or 0) + count

    typed = raw.get("num_bikes_available_types")
    if typed is not None:
        for entry in (typed if isinstance(typed, list) else [typed]):
            if not isinstance(entry, dict):
                continue
            for key, value in entry.items():
                count = _int(value)
                if count is None:
                    continue
                slug = str(key).strip().lower()
                if slug in config.MECHANICAL_KEYS:
                    add("mechanical", count)
                elif slug in config.ELECTRIC_KEYS:
                    add("electric", count)
        if mechanical is not None or electric is not None:
            return mechanical, electric

    available = raw.get("vehicle_types_available")
    if isinstance(available, list):
        for entry in available:
            if not isinstance(entry, dict):
                continue
            count = _int(entry.get("count"))
            if count is None:
                continue
            type_id = _identifier(entry.get("vehicle_type_id"))
            kind = kinds.get(type_id) or (_guess_kind(type_id) if not kinds else None)
            add(kind, count)
        if mechanical is not None or electric is not None:
            return mechanical, electric

    return None, None


# --- Collecte ----------------------------------------------------------------

async def _get_json(client: httpx.AsyncClient, url: str, params=None) -> dict:
    # `api.cyclocity.fr` (Lyon, Nantes) ferme les connexions qu'il garde en
    # réserve sans prévenir : environ un appel sur huit part sur une connexion
    # déjà morte et lève `RemoteProtocolError` avant même d'avoir été émis.
    # Comme le client est mutualisé entre systèmes, un même tick peut y perdre
    # deux réseaux et les envoyer en recul exponentiel — deux minutes de
    # compteurs figés pour une connexion recyclée.
    #
    # Un GET n'a pas d'effet de bord et la requête n'a jamais atteint le serveur :
    # la rejouer est sûr, et la seconde tentative repart sur une connexion neuve.
    # Une seule reprise, sur cette erreur précise : au-delà, l'échec est réel et
    # c'est au recul exponentiel de jouer son rôle.
    for ultime in (False, True):
        try:
            response = await client.get(_with_params(url, params))
            break
        except httpx.RemoteProtocolError:
            if ultime:
                raise
    response.raise_for_status()
    return response.json()


async def fetch_feeds(client, spec: dict) -> tuple[dict[str, str], int | None]:
    """URLs des flux d'un système, par nom, et `ttl` du manifeste.

    Renvoie `({}, ttl)` si le système ne publie pas de stations : c'est un service
    en flotte libre, l'appelant le désactive.
    """
    document = await _get_json(client, spec["discovery_url"], spec.get("params"))
    feeds = _unwrap(document.get("data"), "feeds", spec.get("lang")) or []

    urls = {
        str(feed["name"]): str(feed["url"])
        for feed in feeds
        if isinstance(feed, dict) and feed.get("name") and feed.get("url")
    }
    if any(name not in urls for name in REQUIRED_FEEDS):
        return {}, _int(document.get("ttl"))
    return urls, _int(document.get("ttl"))


async def fetch_vehicle_kinds(client, feeds: dict, spec: dict) -> dict[str, str]:
    """{vehicle_type_id: "mechanical" | "electric" | "other"}.

    La classification vient **exclusivement** de `propulsion_type` : Bordeaux
    nomme « Vélo électrique » son type `classic`, qui est mécanique. Le nom ment,
    la propulsion non.

    Flux absent ou en échec ⇒ `{}` : la ventilation retombera sur l'heuristique de
    `_split`, ce n'est pas une raison de faire échouer tout le système.
    """
    url = feeds.get("vehicle_types")
    if not url:
        return {}

    try:
        document = await _get_json(client, url, spec.get("params"))
    except Exception as exc:
        logger.info("[vls] types de véhicules indisponibles : %s", describe_error(exc))
        return {}

    kinds = {}
    for entry in _unwrap(document.get("data"), "vehicle_types", spec.get("lang")) or []:
        if not isinstance(entry, dict):
            continue
        type_id = _identifier(entry.get("vehicle_type_id"))
        if not type_id:
            continue
        form = str(entry.get("form_factor") or "").strip().lower()
        if form and form not in config.BIKE_FORM_FACTORS:
            kinds[type_id] = "other"
            continue
        propulsion = str(entry.get("propulsion_type") or "").strip().lower()
        kinds[type_id] = "mechanical" if propulsion == "human" else "electric"
    return kinds


async def fetch_stations(client, feeds: dict, spec: dict) -> list[dict]:
    """Informations de stations, normalisées. Une station sans position est écartée."""
    document = await _get_json(client, feeds["station_information"], spec.get("params"))
    lang = spec.get("lang")

    stations = []
    for raw in _unwrap(document.get("data"), "stations", lang) or []:
        if not isinstance(raw, dict):
            continue
        station_id = _identifier(raw.get("station_id"))
        if not station_id:
            continue
        try:
            lat = float(raw["lat"])
            lon = float(raw["lon"])
        except (KeyError, TypeError, ValueError):
            continue

        stations.append({
            "station_id": station_id,
            "name": _text(raw.get("name"), lang),
            "lat": lat,
            "lon": lon,
            "capacity": _int(raw.get("capacity")),
            "address": _text(raw.get("address"), lang),
            # Une station virtuelle n'a pas de bornette : `capacity` et
            # `num_docks_available` n'y ont pas le sens qu'affiche la popup.
            "virtual": _flag(raw.get("is_virtual_station"), default=False),
        })
    return stations


async def fetch_status(client, feeds: dict, spec: dict,
                       kinds: dict[str, str]) -> tuple[list[dict], int | None]:
    """Statuts de stations, normalisés, et `ttl` du flux."""
    document = await _get_json(client, feeds["station_status"], spec.get("params"))

    statuses = []
    for raw in _unwrap(document.get("data"), "stations", spec.get("lang")) or []:
        if not isinstance(raw, dict):
            continue
        station_id = _identifier(raw.get("station_id"))
        if not station_id:
            continue

        # v3 d'abord : `num_vehicles_available` est le champ courant, la forme v2
        # `num_bikes_available` n'est plus qu'un repli.
        bikes = _int(raw.get("num_vehicles_available"))
        if bikes is None:
            bikes = _int(raw.get("num_bikes_available"))

        mechanical, electric = _split(raw, kinds)
        # Ventilation supérieure au total : les deux viennent du même objet,
        # l'incohérence est côté producteur — on fait confiance au détail. Une
        # somme inférieure est en revanche normale (types non classés).
        if bikes is not None and mechanical is not None and electric is not None:
            bikes = max(bikes, mechanical + electric)

        statuses.append({
            "station_id": station_id,
            "bikes": bikes,
            "mechanical": mechanical,
            "electric": electric,
            "docks": _int(raw.get("num_docks_available")),
            "installed": _flag(raw.get("is_installed")),
            "renting": _flag(raw.get("is_renting")),
            "returning": _flag(raw.get("is_returning")),
            "reported_at": _moment(raw.get("last_reported")),
        })

    return statuses, _int(document.get("ttl"))
