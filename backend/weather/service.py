"""État météo : une collecte, quatre usages.

Le même instantané sert le bandeau de carte (température, vent, condition), la
promesse « pluie dans 15 minutes » (nowcast au pas de 15 min), l'avertissement de
trajet (grêle, orage, verglas, rafales) et l'équipement à emporter. La collecte
est faite par la tâche de fond de `main.py`, **jamais** dans le chemin d'une
requête utilisateur : `/weather/` sert `snapshot()`, qui ne fait que lire.

Honnêteté sur la résolution : le relevé reste **ponctuel**. Les points sont
placés par densité de réseau (cf. `graph.extent.sample_points`) et le lecteur se
voit servir le plus proche de lui, ce qui ramène l'écart médian de 10,2 à 2,4 km
sur le profil de production — mais une cellule convective fait 5 à 15 km, et rien
ici ne prétend dire où tombe l'averse. C'est pourquoi les libellés disent
« Risque d'orage » et jamais « Orage sur votre trajet » : ce qu'on sait dire,
c'est **quand** et à quel niveau, jamais **où** exactement.

Tout est raisonné **par point**, et la zone (cf. `graph.extent.graph_zones`) ne
sert plus qu'à deux choses : situer une emprise pour les fronts, et indexer les
vigilances officielles, qui sont départementales et ne se subdivisent pas. Un
profil multi-villes n'a pas un temps mais plusieurs ; le résumé global est celui
du point le plus dense de la zone principale, jamais une moyenne — moyenner
Bordeaux et Tournai ne décrirait ni l'une ni l'autre.

Dégradation, en deux paliers : au-delà de `STALE_AFTER_S` l'instantané est marqué
périmé et le front grise son badge, mais tout reste affiché ; au-delà de
`DROP_ALERTS_AFTER_S`, les alertes, l'équipement et la suggestion de départ sont
effacés. Une vigilance orage de trois heures d'âge n'est plus une vigilance.

La météo n'entre **pas** dans le coût de routage : `refresh()` ne renvoie rien et
ne purge jamais le cache d'itinéraires. Le vent agit sur la durée *affichée*
seulement (cf. `graph.statistique.wind_adjusted_travel_time`), et les alertes
informent sans jamais faire dévier un trajet.
"""

import hashlib
import logging
from datetime import datetime, timedelta, timezone

from i18n import DEFAULT_LOCALE
from graph.extent import contains, distance_km, graph_zones, sample_points
from vigilance import service as vigilance_service
from weather import config, providers

logger = logging.getLogger(__name__)

# Correspondance entre les noms de variables d'Open-Meteo et ceux du projet. Les
# fronts ne voient jamais les noms de la source : le jour où l'on change de
# fournisseur, ce dictionnaire est le seul endroit à toucher.
_FIELDS = {
    "temperature_2m": "temperature",
    "apparent_temperature": "apparent_temperature",
    "precipitation": "precipitation",
    "precipitation_probability": "precipitation_probability",
    "weather_code": "weather_code",
    "wind_speed_10m": "wind_speed",
    "wind_direction_10m": "wind_direction",
    "wind_gusts_10m": "wind_gusts",
    "is_day": "is_day",
}


class _State:
    """Dernier instantané connu. Un seul par process."""

    def __init__(self):
        self.available = False
        self.updated_at = None
        self.stale = False
        # Un état complet par point de mesure, indexé comme `sample_points(G)`.
        self.points = []
        # Emprises des zones, indexées comme `graph_zones(G)`. Elles ne portent
        # plus de relevé : elles servent aux fronts à situer ce qu'ils regardent.
        self.bboxes = []
        # Nombres au moment de la collecte. Garde-fous : entre `app.state.G = None`
        # et le refresh du nouveau profil, un lecteur pourrait se voir servir la
        # météo de Bordeaux sur un trajet tournaisien.
        self.zone_count = 0
        self.point_count = 0
        self.etag = None

    def as_dict(self):
        expired = _alerts_expired()
        points = [_public_point(point, expired) for point in self.points]
        main = points[0] if points else None
        return {
            "available": self.available,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "stale": self.stale or _is_stale(),
            "refresh_interval_s": config.REFRESH_INTERVAL_S,
            "attribution": config.ATTRIBUTION,
            # Le résumé global est celui du point le plus dense de la zone
            # principale. Moyenner deux villes distantes de 600 km ne décrirait le
            # temps d'aucune des deux.
            "summary": main["summary"] if main else None,
            "hourly": main["hourly"] if main else [],
            "minutely_15": main["minutely_15"] if main else [],
            # Les points portent la résolution ; les zones, l'emprise. Un front
            # choisit le point le plus proche de ce qu'il regarde.
            "points": points,
            "zones": [_public_zone(index, bbox, points)
                      for index, bbox in enumerate(self.bboxes)],
        }


_state = _State()


def snapshot() -> dict:
    """Instantané courant. Lecture pure, aucun appel réseau."""
    return _state.as_dict()


def etag(locale: str = DEFAULT_LOCALE) -> str | None:
    """Empreinte de la réponse *telle qu'elle sera servie maintenant*.

    L'empreinte de collecte ne suffit pas : à données constantes, le payload
    change avec l'heure — `stale` bascule, les alertes se périment, et
    `departure_hint` recompte ses délais depuis l'instant présent. Une empreinte
    figée à la collecte ferait répondre 304 à un client qui garderait alors des
    délais périmés, ce qui est précisément le défaut qu'on corrige.

    Le créneau est celui du nowcast : dans un même quart d'heure, rien de ce qui
    dépend de l'heure ne bouge, et l'ETag continue d'épargner un téléchargement.
    """
    if _state.etag is None:
        return None
    now = datetime.now(timezone.utc)
    bucket = now.replace(
        minute=(now.minute // config.MINUTELY_STEP_MIN) * config.MINUTELY_STEP_MIN,
        second=0, microsecond=0,
    )
    return f'W/"{_state.etag}-{int(bucket.timestamp())}-{locale}"'


# --- Fraîcheur ---------------------------------------------------------------
# Calculée à la lecture et non figée à la collecte : l'instantané vieillit entre
# deux cycles, et un front qui interroge quatre heures après une panne doit voir
# les alertes disparaître sans qu'un refresh ait eu à s'exécuter entre-temps.


def _age_s() -> float | None:
    if _state.updated_at is None:
        return None
    return (datetime.now(timezone.utc) - _state.updated_at).total_seconds()


def _is_stale() -> bool:
    age = _age_s()
    return age is not None and age > config.STALE_AFTER_S


def _alerts_expired() -> bool:
    age = _age_s()
    return age is None or age > config.DROP_ALERTS_AFTER_S


# --- Normalisation des relevés ----------------------------------------------


def _reading(values: dict, at=None) -> dict:
    """Relevé normalisé : noms du projet, `is_day` booléen, condition résolue."""
    out = {}
    for api_key, name in _FIELDS.items():
        value = values.get(api_key)
        if value is not None:
            out[name] = value
    if "is_day" in out:
        out["is_day"] = bool(out["is_day"])
    condition, label = config.condition_for(out.get("weather_code"))
    out["condition"] = condition
    out["label"] = label
    if at is not None:
        out["time"] = at
    return out


def _series(block: dict, wanted: list[str], limit: int) -> list[dict]:
    """Série normalisée à partir d'un bloc `hourly` / `minutely_15`.

    Open-Meteo renvoie des colonnes parallèles (`{"time": [...], "precipitation":
    [...]}`), qu'on transpose en lignes — bien plus simple à consommer pour les
    fronts, et c'est la forme que le contrat d'API expose.
    """
    times = (block or {}).get("time") or []
    rows = []
    for i in range(min(len(times), limit)):
        values = {}
        for api_key in wanted:
            column = block.get(api_key)
            if column is not None and i < len(column):
                values[api_key] = column[i]
        row = _reading(values, at=times[i])
        row["alert_level"] = config.alert_level_of(config.alerts_for(
            row.get("weather_code"), row.get("precipitation"),
            row.get("temperature"), row.get("wind_gusts"), row.get("wind_speed"),
        ))
        rows.append(row)
    return rows




# --- Dérivations -------------------------------------------------------------


def _local_now(utc_offset_seconds) -> datetime:
    """Heure murale de la zone, en `datetime` naïf.

    `timezone=auto` fait renvoyer par Open-Meteo des horodatages locaux **naïfs**
    (« 2026-07-31T10:30 », sans décalage). Les comparer directement à
    `datetime.now(timezone.utc)` donnerait une à deux heures d'erreur selon la
    saison. On ramène donc l'instant présent dans le même référentiel — l'heure
    murale de la zone — avant toute comparaison.
    """
    offset = utc_offset_seconds or 0
    return (datetime.now(timezone.utc) + timedelta(seconds=offset)).replace(tzinfo=None)


def _first_live_index(series: list[dict], step: int, now_local: datetime) -> int:
    """Index du créneau **en cours**, les précédents étant écoulés.

    Open-Meteo cale `minutely_15` sur les quarts d'heure ronds : une collecte à
    10h44 renvoie une série qui commence à 10h30, déjà quatorze minutes derrière.
    S'ajoute l'âge de l'instantané au moment de la lecture. Sans ce recalage, tous
    les délais annoncés sont en avance de 0 à 25 minutes — et c'est justement le
    message sur lequel l'utilisateur agit.
    """
    for i, row in enumerate(series):
        raw = row.get("time")
        if not raw:
            continue
        try:
            start = datetime.fromisoformat(raw)
        except ValueError:
            continue
        if start + timedelta(minutes=step) > now_local:
            return i
    return len(series)


def departure_hint(minutely, hourly, utc_offset_seconds=0) -> dict | None:
    """« Partez à 8h20 » : prochain créneau sec assez long pour valoir le détour.

    Calculé **à la lecture** (cf. `_summary`) et non à la collecte : entre les
    deux il s'écoule jusqu'à `REFRESH_INTERVAL_S`, et un délai figé à la collecte
    vieillit avec l'instantané sans que rien ne le signale.

    Les délais sont mesurés depuis l'instant présent, pas depuis le début de la
    série — voir `_first_live_index` pour la raison.

    Une seule série est consultée, jamais un mélange des deux : le nowcast est
    calé sur le quart d'heure, l'horaire sur l'heure ronde. `resolution_min` dit
    laquelle a servi — le front ne doit annoncer « 8h20 » que sur un vrai nowcast,
    et ne doit plus rien annoncer du tout passé ce pas de temps.
    """
    if minutely:
        series, step = minutely, config.MINUTELY_STEP_MIN
    elif hourly:
        series, step = hourly, config.HOURLY_STEP_MIN
    else:
        return None

    now_local = _local_now(utc_offset_seconds)
    start = _first_live_index(series, step, now_local)
    series = series[start:]
    # Série entièrement écoulée : l'instantané est trop vieux pour dire quoi que
    # ce soit du présent. Mieux vaut ne rien dire.
    if not series:
        return None

    limit = min(len(series), config.DEPARTURE_HORIZON_MIN // step + 1)
    dry = [config.dry_step(series[i].get("precipitation")) for i in range(limit)]
    if not dry:
        return None

    def delay_min(index: int) -> int:
        """Minutes d'ici au début du créneau `index`, jamais négatives.

        Le créneau 0 est en cours : son début est derrière nous, d'où le plancher
        à zéro plutôt qu'un délai négatif.
        """
        try:
            start_at = datetime.fromisoformat(series[index]["time"])
        except (KeyError, TypeError, ValueError):
            return index * step
        return max(0, int((start_at - now_local).total_seconds() // 60))

    hint = {
        "wet_now": not dry[0],
        "dry_in_min": None,
        "dry_from": None,
        "dry_window_min": None,
        "worsens_in_min": None,
        "resolution_min": step,
    }

    if dry[0]:
        # On est au sec : la seule chose utile à dire est quand ça se gâte.
        run = 0
        while run < len(dry) and dry[run]:
            run += 1
        hint["dry_in_min"] = 0
        hint["dry_from"] = series[0].get("time")
        hint["dry_window_min"] = run * step
        if run < len(dry):
            hint["worsens_in_min"] = delay_min(run)
        return hint

    # Il pleut : on cherche la première fenêtre sèche assez longue. Les fenêtres
    # trop courtes sont sautées, pas retenues faute de mieux — annoncer « partez
    # dans 15 min » pour une accalmie de 15 min ferait sortir sous l'averse
    # suivante.
    i = 1
    while i < len(dry):
        if not dry[i]:
            i += 1
            continue
        run = 0
        while i + run < len(dry) and dry[i + run]:
            run += 1
        if run * step >= config.DRY_WINDOW_MIN:
            hint["dry_in_min"] = delay_min(i)
            hint["dry_from"] = series[i].get("time")
            hint["dry_window_min"] = run * step
            return hint
        i += run
    return hint


def _summary_alerts(current: dict, hourly: list[dict]) -> list[dict]:
    """Alertes du moment, complétées par celles à venir dans la prévision.

    Un phénomène n'est retenu qu'une fois, à sa **première** occurrence : une
    vigilance orage annoncée pour 17 h n'a pas à être répétée pour 18, 19 et 20 h.
    """
    alerts = config.alerts_for(
        current.get("weather_code"), current.get("precipitation"),
        current.get("temperature"), current.get("wind_gusts"), current.get("wind_speed"),
    )
    seen = {alert["key"] for alert in alerts}

    for row in hourly[:config.ALERT_HORIZON_H]:
        for alert in config.alerts_for(
            row.get("weather_code"), row.get("precipitation"),
            row.get("temperature"), row.get("wind_gusts"), row.get("wind_speed"),
            at=row.get("time"),
        ):
            if alert["key"] in seen:
                continue
            seen.add(alert["key"])
            alerts.append(alert)

    alerts.sort(key=lambda alert: config.ALERT_ORDER.get(alert["level"], 0), reverse=True)
    return alerts


def _point_state(lat: float, lon: float, zone_index: int,
                 entry: dict, minutely_ok: bool) -> dict:
    """État complet d'un point de mesure à partir de son objet Open-Meteo."""
    current = _reading((entry or {}).get("current") or {})
    hourly = _series((entry or {}).get("hourly"), config.ZONE_HOURLY_VARS,
                     config.FORECAST_HOURS)
    # Hors couverture ICON-D2 / AROME, Open-Meteo interpole `minutely_15` depuis
    # l'horaire sans le signaler. Mieux vaut une série vide qu'un faux nowcast :
    # le front dégrade alors son texte en « pluie annoncée vers 8 h ».
    minutely = _series((entry or {}).get("minutely_15"), config.ZONE_MINUTELY_VARS,
                       config.FORECAST_MINUTELY_15) if minutely_ok else []

    alerts = _summary_alerts(current, hourly)
    return {
        "lat": lat,
        "lon": lon,
        # La zone reste l'échelle de la vigilance officielle : un bulletin
        # Météo-France est départemental, il ne se subdivise pas par point.
        "zone_index": zone_index,
        "timezone": (entry or {}).get("timezone"),
        "utc_offset_seconds": (entry or {}).get("utc_offset_seconds"),
        "current": current,
        "hourly": hourly,
        "minutely_15": minutely,
        "alerts": alerts,
        "alert_level": config.alert_level_of(alerts),
        "equipment": config.equipment_for(current, hourly),
        # `departure_hint` n'est **pas** stocké ici : il dépend de l'heure qu'il
        # est, pas de l'heure de collecte, et se calcule donc dans `_summary`.
    }


def _official_alerts(index: int, point: dict) -> list[dict]:
    """Vigilances officielles de la zone du point, mises à l'heure locale.

    Les alertes de `vigilance/` portent des horodatages conscients du fuseau
    (UTC ou décalage explicite) ; les séries d'Open-Meteo, elles, sont en heure
    locale naïve, et les fronts se contentent d'y découper « HH:MM ». Servir les
    unes à côté des autres sans conversion afficherait l'orage de 3 h du matin
    comme prévu à 1 h. On ramène donc tout à l'heure locale de la zone, en
    utilisant l'`utc_offset_seconds` que la source météo a résolu pour ce point.
    """
    offset = point.get("utc_offset_seconds")
    if offset is None:
        offset = 0
    local = timezone(timedelta(seconds=offset))

    def _local_iso(value):
        if value is None:
            return None
        return value.astimezone(local).strftime("%Y-%m-%dT%H:%M")

    out = []
    for alert in vigilance_service.alerts_for_index(index, _state.zone_count):
        out.append({
            "level": alert["level"],
            "key": alert["key"],
            "label": alert["label"],
            "value": alert["phenomenon"],
            "at": _local_iso(alert["at"]),
            "until": _local_iso(alert["until"]),
            "official": True,
            "source": alert["source"],
        })
    return out


def _merge_alerts(derived: list[dict], official: list[dict]) -> list[dict]:
    """Alertes officielles et dérivées, triées par sévérité puis par autorité.

    Les deux se complètent : l'officiel porte l'autorité et la portée, nos
    seuils portent le chiffre local (« rafales à 41 km/h ») qu'une vigilance
    départementale ne donne pas. On ne déduplique donc pas par phénomène — voir
    « Vigilance orange — Orages » *et* « Rafales · 68 km/h » est plus informatif
    que l'un des deux seul.

    À sévérité égale, l'officiel passe devant : c'est lui qui fait foi.
    """
    merged = list(official) + list(derived)
    merged.sort(
        key=lambda a: (config.ALERT_ORDER.get(a["level"], 0), 1 if a.get("official") else 0),
        reverse=True,
    )
    return merged


def _summary(point: dict, expired: bool) -> dict:
    """Résumé public d'un point. `expired` efface ce qui a une date de péremption."""
    current = point["current"]
    alerts = [] if expired else _merge_alerts(
        point["alerts"], _official_alerts(point["zone_index"], point))
    level = config.alert_level_of(alerts) if alerts else config.ALERT_NONE
    return {
        "temperature": current.get("temperature"),
        "apparent_temperature": current.get("apparent_temperature"),
        "precipitation": current.get("precipitation"),
        "weather_code": current.get("weather_code"),
        "condition": current.get("condition"),
        "label": current.get("label"),
        "is_day": current.get("is_day"),
        "wind": {
            "speed": current.get("wind_speed"),
            "direction": current.get("wind_direction"),
            "cardinal": config.cardinal(current.get("wind_direction")),
            "gusts": current.get("wind_gusts"),
        },
        "alert_level": level,
        "alert_label": config.ALERT_LABELS[level],
        "alerts": alerts,
        "equipment": [] if expired else point["equipment"],
        # Recalculé à chaque lecture : les délais qu'il porte se comptent depuis
        # maintenant, et un instantané peut avoir jusqu'à `REFRESH_INTERVAL_S`
        # quand il arrive au client.
        "departure_hint": None if expired else departure_hint(
            point["minutely_15"], point["hourly"], point.get("utc_offset_seconds"),
        ),
    }


def _public_point(point: dict, expired: bool) -> dict:
    return {
        "lat": point["lat"],
        "lon": point["lon"],
        "zone_index": point["zone_index"],
        "timezone": point.get("timezone"),
        "utc_offset_seconds": point.get("utc_offset_seconds"),
        "summary": _summary(point, expired),
        "hourly": point["hourly"],
        "minutely_15": point["minutely_15"],
    }


def _public_zone(index: int, bbox, points: list[dict]) -> dict:
    """Emprise d'une zone, décrite par son point le plus dense.

    Rigoureusement ce que `zones[]` valait avant l'échantillonnage : les points
    étant triés par zone puis par densité, le premier de la zone est celui qui la
    représente le mieux. Sert de repli aux clients qui ne lisent pas `points[]`.
    """
    main = next((p for p in points if p["zone_index"] == index), None)
    return {
        "bbox": list(bbox),
        "timezone": main["timezone"] if main else None,
        "utc_offset_seconds": main["utc_offset_seconds"] if main else None,
        "summary": main["summary"] if main else None,
        "hourly": main["hourly"] if main else [],
        "minutely_15": main["minutely_15"] if main else [],
    }


# --- Lecture par le routage --------------------------------------------------


def conditions_at(G, lat: float, lon: float) -> dict | None:
    """Conditions du point de mesure le plus proche, prêtes à être servies.

    Le point le plus proche et non le centre de la zone : c'est toute la raison
    d'être de l'échantillonnage. Sur Bordeaux + Tournai, l'écart médian entre le
    départ d'un trajet et le relevé qui le décrit passe de 10,2 à 2,4 km.

    Renvoie None si la couche est indisponible, si l'instantané a dépassé
    `DROP_ALERTS_AFTER_S`, ou si le profil a été rechargé depuis la collecte —
    l'indexation serait fausse, et servir la météo de Bordeaux sur un trajet
    tournaisien est pire que ne rien servir.
    """
    if not _state.available or _alerts_expired() or not _state.points:
        return None
    zones = graph_zones(G)
    if not zones or len(zones) != _state.zone_count:
        return None

    point = min(_state.points,
                key=lambda p: distance_km((lat, lon), (p["lat"], p["lon"])))
    payload = _summary(point, expired=False)
    payload["zone_index"] = point["zone_index"]
    payload["stale"] = _state.stale or _is_stale()
    payload["minutely_15"] = point["minutely_15"]
    return payload


def wind_at(G, lat: float, lon: float) -> tuple[float, float] | None:
    """(vitesse km/h, direction d'où vient le vent en degrés) au point, ou None.

    None dès que l'instantané est périmé : un vent d'il y a une heure appliqué à
    une durée affichée est un mensonge, et le principe posé par la couche qualité
    de l'air — « on ne fait pas dévier un trajet sur une donnée qu'on n'a plus » —
    vaut aussi pour l'affichage.
    """
    if _state.stale or _is_stale():
        return None
    conditions = conditions_at(G, lat, lon)
    if not conditions:
        return None
    wind = conditions.get("wind") or {}
    speed, direction = wind.get("speed"), wind.get("direction")
    if speed is None or direction is None:
        return None
    return float(speed), float(direction)


# --- Collecte ----------------------------------------------------------------


def _build_points(points, minutely_flags, raw) -> list[dict] | None:
    """États par point de mesure, ou None si la réponse est incomplète.

    Tout ou rien : un point manquant décalerait toute la suite de la liste par
    rapport à `sample_points(G)`, et on servirait le relevé d'un point pour un
    autre — jusqu'à celui de Bordeaux pour Tournai.
    """
    if not points:
        return None

    states = []
    for index, (lat, lon, zone_index) in enumerate(points):
        entry = raw[index] if index < len(raw) else None
        if not entry:
            continue
        states.append(_point_state(lat, lon, zone_index, entry, minutely_flags[index]))
    return states if len(states) == len(points) else None


def _digest(point_states) -> str:
    """Empreinte de la donnée collectée, indépendante d'`updated_at` : une source
    qui republie des valeurs identiques ne doit pas forcer un retéléchargement.

    Ne couvre que ce qui vient de la collecte. La part du payload qui dépend de
    l'heure de lecture — `stale`, l'expiration des alertes, `departure_hint` — est
    prise en compte par `etag()`, qui y adjoint le créneau courant.
    """
    digest = hashlib.md5(usedforsecurity=False)
    # Le nombre de points d'abord : un changement de profil peut laisser les
    # vigilances et les codes temps identiques, et passerait sinon inaperçu.
    digest.update(f"{len(point_states)}\n".encode())
    for point in point_states:
        digest.update(
            f"{point['alert_level']}|{len(point['minutely_15'])}"
            f"|{(point['current'] or {}).get('weather_code')}\n".encode()
        )
    return digest.hexdigest()


def _mark_stale():
    """Panne de la source : on garde le dernier affichage, marqué périmé."""
    _state.stale = True
    logger.warning("[weather] source indisponible : dernier état conservé.")


async def refresh(G) -> None:
    """Collecte la météo et met à jour l'état.

    Ne renvoie rien, contrairement au trafic et à la qualité de l'air : la météo
    n'entre pas dans le coût de routage, il n'y a donc jamais de cache
    d'itinéraires à purger.

    Une seule requête sortante, portant tous les points de mesure. En cas
    d'échec, le dernier instantané est conservé et marqué périmé.
    """
    if not config.ENABLED:
        return

    zones = graph_zones(G)
    if not zones:
        return
    points = sample_points(G, config.MAX_SAMPLE_POINTS, config.SAMPLE_MIN_SPACING_KM)
    if not points:
        return

    # Profil rechargé : le vieil état décrit d'autres villes. On le vide avant de
    # collecter, pour qu'un échec partiel ne puisse pas mélanger deux profils.
    if len(zones) != _state.zone_count or len(points) != _state.point_count:
        _state.points = []
        _state.bboxes = []
        _state.available = False
        # Une fois par profil, pas à chaque cycle : le coût du quota doit être
        # lisible le jour où l'emprise s'étend à une région entière.
        logger.info(
            "[weather] %d points de mesure sur %d zone(s) → ≈ %d appels/jour "
            "(plafond gratuit %d)",
            len(points), len(zones), config.daily_calls(len(points)),
            config.FREE_DAILY_CALLS,
        )

    coordinates = [(lat, lon) for lat, lon, _ in points]
    minutely_flags = [
        contains(config.MINUTELY_COVERAGE, lat, lon) for lat, lon in coordinates
    ]

    try:
        raw = await providers.fetch_points(coordinates, minutely_flags)
    except Exception as exc:
        logger.warning("[weather] échec des séries de points : %s", exc)
        _mark_stale()
        return

    point_states = _build_points(points, minutely_flags, raw)
    if point_states is None:
        _mark_stale()
        return

    # Affectations en bloc, sans `await` entre elles : un lecteur voit l'ancien ou
    # le nouvel instantané, jamais un mélange des deux.
    _state.points = point_states
    _state.bboxes = list(zones)
    _state.zone_count = len(zones)
    _state.point_count = len(points)
    _state.available = bool(_state.points)
    _state.stale = False
    _state.updated_at = datetime.now(timezone.utc)
    _state.etag = _digest(_state.points)

    main = _state.points[0] if _state.points else {}
    logger.info(
        "[weather] %s sur %d point(s) → vigilance %s",
        (main.get("current") or {}).get("label", "?"),
        len(points), main.get("alert_level", config.ALERT_NONE),
    )
