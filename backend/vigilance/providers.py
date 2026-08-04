"""Accès aux sources de vigilance officielle. I/O pur, sans état.

Chaque fonction renvoie une liste d'alertes **déjà normalisées** :

    {area, level, key, label, phenomenon, at, until, source}

`at` et `until` sont des horodatages ISO conscients du fuseau (UTC ou décalage
explicite), contrairement aux séries d'Open-Meteo qui sont en heure locale naïve.
La conversion vers l'heure locale de la zone est faite à la fusion, dans
`weather.service`, là où l'on connaît `utc_offset_seconds`.

Les alertes vertes sont écartées dès ici : « vert » signifie « rien à signaler »,
ce n'est pas une alerte et ça n'a rien à faire dans une liste d'alertes.
"""

import logging
from datetime import datetime, timezone

import httpx

from vigilance import config

logger = logging.getLogger(__name__)


def _client() -> httpx.AsyncClient:
    return httpx.AsyncClient(
        timeout=config.HTTP_TIMEOUT_S,
        headers={"User-Agent": config.USER_AGENT},
    )


def _parse_dt(value):
    """Horodatage ISO conscient du fuseau, ou None."""
    if not value:
        return None
    try:
        parsed = datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    except (TypeError, ValueError):
        return None
    return parsed if parsed.tzinfo else parsed.replace(tzinfo=timezone.utc)


async def fetch_meteofrance(spec: dict, departments: list[str]) -> list[dict]:
    """Vigilance Météo-France pour les départements demandés.

    Une seule requête pour tous les départements : le miroir expose l'API
    Opendatasoft `explore/v2.1`, exactement celle des quatre sources de trafic.

    Le jeu contient les échéances J et J+1 avec, pour les orages, une chronologie
    découpée en sous-périodes. On garde tout : c'est justement ce découpage qui
    permet de dire « orages à partir de 1 h » plutôt qu'« orages demain ».
    """
    if not departments:
        return []

    quoted = ",".join(f'"{code}"' for code in departments)
    params = {
        "where": f"domain_id in ({quoted})",
        "limit": 100,
        "select": "domain_id,echeance,phenomenon,color,begin_time,end_time,product_datetime",
    }

    async with _client() as client:
        response = await client.get(spec["url"], params=params)
        response.raise_for_status()
        payload = response.json()

    alerts = []
    for record in payload.get("results") or []:
        level = config.level_for_color(record.get("color"))
        if level is None:
            continue  # vert, ou couleur inconnue
        phenomenon = str(record.get("phenomenon") or "").strip().lower()
        label_fr = config.MF_PHENOMENON_LABELS.get(phenomenon, phenomenon.capitalize())
        alerts.append({
            "area": str(record.get("domain_id")),
            "level": level,
            "key": config.MF_PHENOMENON_KEYS.get(phenomenon, "unknown"),
            "label": config.label_for(level, label_fr),
            "phenomenon": label_fr,
            "at": _parse_dt(record.get("begin_time")),
            "until": _parse_dt(record.get("end_time")),
            "source": spec["attribution"],
        })
    return alerts


async def fetch_meteoalarm(spec: dict) -> list[dict]:
    """Avertissements officiels relayés par MeteoAlarm, au format CAP.

    Le flux contient des entrées **expirées** — il ne se purge pas de lui-même.
    On filtre donc sur la fenêtre de validité, sans quoi on afficherait comme
    actuelle une vigilance levée depuis plusieurs jours.

    Une même alerte est publiée en quatre langues ; on ne garde que la version
    francophone, sinon chaque avertissement apparaîtrait quatre fois.
    """
    async with _client() as client:
        response = await client.get(spec["url"])
        response.raise_for_status()
        payload = response.json()

    now = datetime.now(timezone.utc)
    language = spec.get("language", "fr-BE")
    alerts = []

    for entry in payload.get("warnings") or []:
        for info in (entry.get("alert") or {}).get("info") or []:
            if info.get("language") != language:
                continue

            params = {p.get("valueName"): p.get("value")
                      for p in info.get("parameter") or []}
            level = config.level_for_awareness(params.get("awareness_level"))
            if level is None:
                continue

            onset = _parse_dt(info.get("onset") or info.get("effective"))
            expires = _parse_dt(info.get("expires"))
            if expires is not None and expires < now:
                continue  # déjà levée

            key, phenomenon = config.phenomenon_for_awareness(params.get("awareness_type"))
            for area in info.get("area") or []:
                for geocode in area.get("geocode") or []:
                    if geocode.get("valueName") != "EMMA_ID":
                        continue
                    alerts.append({
                        "area": geocode.get("value"),
                        "level": level,
                        "key": key,
                        "label": config.label_for(level, phenomenon),
                        "phenomenon": phenomenon,
                        "at": onset,
                        "until": expires,
                        "source": spec["attribution"],
                    })
    return alerts


async def resolve_area(lat: float, lon: float) -> tuple[str, str] | None:
    """(pays ISO minuscule, code administratif) du point, ou None.

    Nominatim répond uniformément pour les deux pays via `ISO3166-2-lvl6` :
    « FR-33 » pour la Gironde — qui est exactement le `domain_id` du jeu
    Météo-France — et « BE-WHT » pour le Hainaut, converti ensuite en zone
    MeteoAlarm. Un seul résolveur pour deux sources.

    Appelée une fois par zone du graphe et mise en cache par l'appelant :
    l'usage reste très inférieur à celui du géocodage des communes du profil.
    """
    params = {
        "format": "jsonv2",
        "lat": f"{lat:.5f}",
        "lon": f"{lon:.5f}",
        "zoom": config.NOMINATIM_ZOOM,
        "accept-language": "fr",
    }

    async with _client() as client:
        response = await client.get(config.NOMINATIM_URL, params=params)
        response.raise_for_status()
        address = (response.json() or {}).get("address") or {}

    iso = address.get("ISO3166-2-lvl6")
    country = str(address.get("country_code") or "").lower()

    if not iso:
        logger.warning("[vigilance] pas de code ISO niveau 6 pour (%.4f, %.4f).", lat, lon)
        return None

    if country == "fr":
        # « FR-33 » -> « 33 ». Les départements corses (« FR-2A ») et les codes
        # à trois caractères d'outre-mer passent tels quels : le jeu Météo-France
        # utilise la même notation.
        return "fr", iso.split("-", 1)[1]

    if country == "be":
        emma = config.BE_ISO_TO_EMMA.get(iso)
        if not emma:
            logger.warning("[vigilance] province belge non cartographiée : %s.", iso)
            return None
        return "be", emma

    logger.info("[vigilance] pays sans source de vigilance : %s.", country or "?")
    return None
