"""Réglages de la couche météo : source, cadence, barèmes d'alerte, équipement.

La source est Open-Meteo (`/v1/forecast`), qui agrège les modèles nationaux — DWD
ICON-D2 et Météo-France AROME sur notre emprise, NOAA GFS en repli. C'est déjà le
redistributeur utilisé pour la qualité de l'air (`air_quality/config.py`), avec
les mêmes conventions d'appel et le même quota.

Trois horizons, trois usages :
  - `current`      : ce qu'affiche le bandeau de carte ;
  - `minutely_15`  : la promesse « pluie dans 15 minutes » ;
  - `hourly`       : l'équipement à emporter et le décalage d'heure de départ.

Les trois sont collectés sur les mêmes points de mesure, en une seule requête.

Les constantes qui touchent au **calcul de trajet** ne sont pas ici : le vent et
les ponts verglaçants sont des réglages de graphe et vivent dans `graph/config.py`
(`WIND_HEADWIND_SPEED_FACTOR`, `BRIDGE_MIN_LENGTH_M`, `ICE_BRIDGE_TEMP_C`), à côté
de ceux de la qualité de l'air et du trafic.
"""

import math
import os

URL = os.getenv("OPEN_METEO_URL", "").strip() or "https://api.open-meteo.com/v1/forecast"
# L'offre gratuite d'Open-Meteo ne demande aucune clé. Celle-ci n'existe que pour
# le jour où l'usage cesserait d'être non commercial, ou pour pointer vers une
# instance auto-hébergée : absente, rien ne change.
API_KEY = os.getenv("OPEN_METEO_API_KEY", "").strip()
# Interrupteur d'exploitation : à 0, aucune requête ne sort et `/weather/` répond
# `available: false`. Même mécanique que `BIKESHARE_ENABLED`.
ENABLED = os.getenv("WEATHER_ENABLED", "1").strip().lower() not in {"0", "false", "no"}

HTTP_TIMEOUT_S = 10.0
USER_AGENT = "SecuCycle/1.0 (+https://secu-cycle.fr)"

# Cadence de collecte. AROME et ICON-D2 ne sortent qu'une fois par heure : plus
# vite ne ferait apparaître aucune donnée nouvelle. L'intervalle sert surtout à
# garder `current` honnête (« il pleut maintenant »), recalculé en continu côté
# source.
#
# La série `minutely_15` est horodatée en absolu sur 2 h : un instantané vieux de
# 15 minutes contient toujours le créneau « maintenant + 15 min », il suffit de
# choisir le bon élément. 900 s tient donc la promesse des 30 minutes.
#
# 900 et non 600 : c'est ce que coûte le passage de deux points de mesure à
# vingt-quatre (voir plus bas). L'échange est favorable — un relevé vieux de
# 15 minutes à 2,4 km décrit mieux le temps qu'il fait qu'un relevé vieux de
# 10 minutes à 10,2 km — et 900 s reste la moitié de `STALE_AFTER_S`, donc deux
# cycles manqués avant que le bandeau ne s'atténue.
REFRESH_INTERVAL_S = 900

# --- Points de mesure --------------------------------------------------------
# On n'interroge pas le centre des zones mais des points placés par densité de
# nœuds (cf. `graph.extent.sample_points`). Le centre d'une boîte englobante
# n'est ni le centre de gravité du réseau ni un endroit où l'on roule : sur
# Bordeaux + Tournai il laissait le nœud médian à 10,2 km de son point de mesure,
# et 21,3 km au p95 — l'ordre de grandeur d'une cellule orageuse. Le placement
# par densité ramène ces chiffres à 2,4 et 4,7 km.
#
# Deux bornes, aucun réglage par profil : le nombre de points s'en déduit (trois
# pour Bruxelles, six pour Paris, vingt-quatre pour Bordeaux + Tournai).
MAX_SAMPLE_POINTS = 24
# En dessous de cet écart, deux points décrivent la même averse. La maille native
# d'AROME fait 1,3 km, mais la corrélation spatiale des précipitations est bien
# plus large : un point de plus n'apprendrait rien et coûterait du quota.
SAMPLE_MIN_SPACING_KM = 4.0

FORECAST_HOURS = 12
FORECAST_MINUTELY_15 = 8  # 8 pas de 15 min = 2 h

# Variables demandées à la source.
CURRENT_VARS = [
    "temperature_2m", "apparent_temperature", "precipitation", "weather_code",
    "wind_speed_10m", "wind_direction_10m", "wind_gusts_10m", "is_day",
]
ZONE_HOURLY_VARS = [
    "temperature_2m", "apparent_temperature", "precipitation",
    "precipitation_probability", "weather_code",
    "wind_speed_10m", "wind_direction_10m", "wind_gusts_10m", "is_day",
]
# `precipitation_probability` n'existe **pas** en `minutely_15` (vérifié sur les
# pages modèle DWD et Météo-France d'Open-Meteo) : le nowcast est en millimètres,
# jamais en pourcentage. Le champ étant absent du payload par construction, aucun
# front ne pourra afficher « 70 % de pluie dans 15 min ».
ZONE_MINUTELY_VARS = [
    "precipitation", "weather_code", "wind_speed_10m", "wind_gusts_10m",
]


# --- Quota -------------------------------------------------------------------
# Open-Meteo pondère ses appels : `poids = (jours / 14) × (variables / 10) × points`.
# La formule n'est pas publiée sur la page de tarification ; elle vient d'une
# discussion du dépôt où le mainteneur valide le calcul d'un utilisateur, et
# l'API ne renvoie aucun en-tête de quota permettant de la vérifier.
#
# Le facteur temporel est le point douteux : un plancher de 14 jours est affirmé
# ici et là, ce qui vaudrait 1 pour nos 12 heures d'échéance, contre 0,036 en
# lecture strictement fractionnaire. On dimensionne sur la lecture pessimiste,
# et `MAX_SAMPLE_POINTS` s'en déduit : 10 000 / (96 cycles × 2,1) ≈ 49 points
# possibles, dont on ne prend que la moitié.
FREE_DAILY_CALLS = 10_000
_VARS_WEIGHT = (len(CURRENT_VARS) + len(ZONE_HOURLY_VARS) + len(ZONE_MINUTELY_VARS)) / 10


def daily_calls(n_points: int) -> int:
    """Appels/jour consommés par `n_points`, en lecture pessimiste du barème."""
    return round(86400 / REFRESH_INTERVAL_S * n_points * _VARS_WEIGHT)

# Emprise où `minutely_15` est un vrai produit 15 minutes (ICON-D2 ∪ AROME).
# Hors de là, Open-Meteo **interpole depuis l'horaire sans le signaler** : aucun
# champ de la réponse ne le dit. On préfère ne pas servir de nowcast plutôt que
# d'en servir un faux — la France et la Belgique sont couvertes, un profil futur
# hors Europe centrale ne le serait pas. (w, s, e, n)
MINUTELY_COVERAGE = (-6.0, 41.0, 20.0, 56.0)

# Au-delà, le bandeau est atténué côté front : trois cycles manqués.
STALE_AFTER_S = 1800
# Au-delà, on garde la température et le vent mais on efface les alertes,
# l'équipement et la suggestion de départ. Une vigilance orage de trois heures
# d'âge n'est plus une vigilance, c'est une archive.
DROP_ALERTS_AFTER_S = 3 * 3600

ATTRIBUTION = "Open-Meteo (DWD ICON-D2, Météo-France AROME, NOAA GFS)"


# --- Codes temps OMM ---------------------------------------------------------
# La clé est stable et partagée par les deux fronts (choix d'icône, de couleur) ;
# le libellé est la seule formulation française du projet, écrite une fois ici
# pour que le web et le mobile ne puissent pas diverger.
WMO_CODES: dict[int, str] = {
    0: "clear",
    1: "mainly_clear",
    2: "partly_cloudy",
    3: "overcast",
    45: "fog",
    48: "rime_fog",
    51: "drizzle_light",
    53: "drizzle",
    55: "drizzle_dense",
    56: "freezing_drizzle_light",
    57: "freezing_drizzle",
    61: "rain_slight",
    63: "rain",
    65: "rain_heavy",
    66: "freezing_rain_light",
    67: "freezing_rain",
    71: "snow_slight",
    73: "snow",
    75: "snow_heavy",
    77: "snow_grains",
    80: "showers_slight",
    81: "showers",
    82: "showers_violent",
    85: "snow_showers_slight",
    86: "snow_showers",
    95: "thunderstorm",
    96: "thunderstorm_hail",
    99: "thunderstorm_hail_heavy",
}

UNKNOWN_CONDITION = "unknown"

HAIL_CODES = frozenset({96, 99})
STORM_CODES = frozenset({95, 96, 99})
FREEZING_CODES = frozenset({56, 57, 66, 67})
SNOW_CODES = frozenset({71, 73, 75, 77, 85, 86})
FOG_CODES = frozenset({45, 48})


def condition_for(code) -> str:
    """Clé stable de condition, pour un code OMM. Le mot vit au catalogue."""
    try:
        return WMO_CODES[int(code)]
    except (TypeError, ValueError, KeyError):
        return UNKNOWN_CONDITION


# --- Barème de vigilance -----------------------------------------------------
# Quatre niveaux ordonnés. Volontairement plus sobres que les couleurs officielles
# de Météo-France : nous n'échantillonnons qu'un point par agglomération, donc pas
# la précision pour prétendre reproduire une vigilance départementale, et emprunter
# son vocabulaire donnerait à nos seuils une autorité qu'ils n'ont pas.
ALERT_NONE = "none"
ALERT_ORDER = {ALERT_NONE: 0, "watch": 1, "warning": 2, "severe": 3}

# Rafales, en km/h. À vélo, c'est la rafale qui déséquilibre, pas le vent moyen.
GUST_WATCH_KMH = 40.0
GUST_WARNING_KMH = 60.0
GUST_SEVERE_KMH = 80.0

# Précipitations cumulées sur l'heure, en mm.
RAIN_WATCH_MM = 2.5
RAIN_WARNING_MM = 7.0

# Températures, en °C. 3 °C parce que l'air d'une station à 2 m peut être positif
# quand la chaussée est déjà à zéro — et un tablier de pont, exposé sur ses deux
# faces sans le couplage thermique au sol, gèle une à deux heures plus tôt encore
# (cf. `ICE_BRIDGE_TEMP_C` dans `graph/config.py`).
FREEZE_WATCH_C = 3.0
FREEZE_WARNING_C = 0.0

# Jusqu'où on va chercher une alerte à venir dans la prévision horaire. Six heures
# couvrent la journée de vélo qui vient ; au-delà, annoncer un orage relève de la
# météo générale, pas de la sécurité d'un trajet.
ALERT_HORIZON_H = 6



# Provenance de nos propres alertes. Elles sont dérivées de seuils numériques, pas
# validées par un institut : elles ne portent donc jamais le mot « vigilance »,
# réservé aux alertes du module `vigilance/` (cf. `vigilance.config.label_for`).
DERIVED_SOURCE = "Sécu'Cycle (seuils)"


def _hazard(level: str, key: str, value, at=None) -> dict:
    return {
        "level": level,
        "key": key,
        "value": value,
        "at": at,
        "official": False,
        "source": DERIVED_SOURCE,
    }


def alerts_for(code, precipitation, temperature, gusts, wind_speed=None, at=None) -> list[dict]:
    """Alertes d'un relevé, triées par sévérité décroissante.

    Chaque alerte : `{level, key, label, value, at}`. `at` est l'horodatage local
    de l'échéance concernée, `None` pour « maintenant » — c'est ce qui permet au
    front d'écrire « orage prévu vers 17 h » plutôt qu'un « orage » sans date.

    **Les seuils portent sur la valeur numérique, jamais sur le code temps.** Sur
    le modèle mixé `best_match`, `weather_code = 61` (« pluie faible ») et
    `precipitation = 0.0` coexistent régulièrement. Le code ne sert donc qu'aux
    phénomènes qu'aucune variable ne porte : grêle, orage, verglaçant, brouillard.
    Inverser cette règle produit des alertes fantômes à chaque cycle.
    """
    out = []
    try:
        code = int(code)
    except (TypeError, ValueError):
        code = None

    # Phénomènes lus dans le code temps : aucune variable numérique ne les porte.
    if code in HAIL_CODES:
        out.append(_hazard("severe" if code == 99 else "warning", "hail", code, at))
    elif code in STORM_CODES:
        out.append(_hazard("warning", "thunderstorm", code, at))
    if code in FREEZING_CODES:
        # Pluie ou bruine verglaçante : le pire cas à vélo, deux roues sans
        # adhérence de secours. Jamais en deçà de « danger ».
        out.append(_hazard("severe", "ice", code, at))
    if code in SNOW_CODES:
        out.append(_hazard("warning", "snow", code, at))
    if code in FOG_CODES:
        out.append(_hazard("watch", "fog", code, at))

    # Phénomènes lus dans les variables numériques.
    if gusts is not None:
        if gusts >= GUST_SEVERE_KMH:
            out.append(_hazard("severe", "gust", round(gusts), at))
        elif gusts >= GUST_WARNING_KMH:
            out.append(_hazard("warning", "gust", round(gusts), at))
        elif gusts >= GUST_WATCH_KMH:
            out.append(_hazard("watch", "gust", round(gusts), at))

    if precipitation is not None:
        if precipitation >= RAIN_WARNING_MM:
            out.append(_hazard("warning", "heavy_rain", round(precipitation, 1), at))
        elif precipitation >= RAIN_WATCH_MM:
            out.append(_hazard("watch", "rain", round(precipitation, 1), at))

    if temperature is not None and code not in FREEZING_CODES:
        # Le verglas annoncé par le code prime : inutile de doubler l'alerte.
        if temperature <= FREEZE_WARNING_C:
            out.append(_hazard("warning", "freezing", round(temperature, 1), at))
        elif temperature <= FREEZE_WATCH_C:
            out.append(_hazard("watch", "cold", round(temperature, 1), at))

    out.sort(key=lambda alert: ALERT_ORDER.get(alert["level"], 0), reverse=True)
    return out


def alert_level_of(alerts) -> str:
    """Niveau maximal d'une liste d'alertes ; `'none'` si elle est vide."""
    level = ALERT_NONE
    for alert in alerts or []:
        if ALERT_ORDER.get(alert["level"], 0) > ALERT_ORDER[level]:
            level = alert["level"]
    return level


# --- Conseils d'équipement ---------------------------------------------------
# Dérivés ici, donc identiques sur le web et le mobile, et formulés une seule
# fois. Le champ `reason` reprend le chiffre déclencheur (« Rafales à 41 km/h ») :
# les fronts l'affichent tel quel, sans avoir à re-formuler ni à diverger.

# Fenêtre de prévision consultée pour l'équipement : on s'habille pour le trajet
# qui vient, pas pour la journée.
EQUIPMENT_HORIZON_H = 3

WET_NOW_MM = 0.1          # au-delà, il pleut vraiment
WET_SOON_MM = 0.5         # cumul sur la fenêtre
WET_SOON_PROBABILITY = 50  # %
GLOVES_MAX_C = 7.0
WARM_LAYER_MAX_C = 3.0
WINDBREAKER_WIND_KMH = 25.0
WINDBREAKER_GUST_KMH = 40.0


def _advice(key: str, reason_key: str, **params) -> dict:
    """Conseil d'équipement, en clés : le rendu appartient à la sérialisation.

    `equipment_for` tourne dans la boucle de collecte, toutes les 900 s, et son
    résultat est mis en cache — il ne peut donc porter aucun mot déjà rendu.
    """
    return {"key": key, "reason_key": reason_key, "reason_params": params}


def equipment_for(current: dict, hourly: list[dict]) -> list[dict]:
    """Conseils d'équipement : `[{key, label, reason}]`. Fonction pure, sans I/O.

    `current` et `hourly` sont les relevés déjà normalisés par le service (clés
    `temperature`, `precipitation`, `wind_gusts`…), pas les objets bruts de la
    source.
    """
    window = list(hourly or [])[:EQUIPMENT_HORIZON_H]
    current = current or {}
    out = []

    def _worst(key, default=None):
        values = [row.get(key) for row in window if row.get(key) is not None]
        return max(values) if values else default

    def _coldest(key, default=None):
        values = [row.get(key) for row in window if row.get(key) is not None]
        value = min(values) if values else None
        now = current.get(key)
        if now is not None:
            value = now if value is None else min(value, now)
        return default if value is None else value

    precip_now = current.get("precipitation") or 0.0
    precip_soon = sum(row.get("precipitation") or 0.0 for row in window)
    proba_soon = _worst("precipitation_probability", 0) or 0

    if precip_now >= WET_NOW_MM:
        raison = ("rain_now", {"mm": f"{precip_now:.1f}"})
    elif precip_soon >= WET_SOON_MM:
        raison = ("rain_soon", {"mm": f"{precip_soon:.1f}", "hours": EQUIPMENT_HORIZON_H})
    elif proba_soon >= WET_SOON_PROBABILITY:
        raison = ("rain_probability", {"percent": proba_soon})
    else:
        raison = None

    if raison:
        out.append(_advice("rain_jacket", raison[0], **raison[1]))
        # Chaussée mouillée : le garde-boue sert autant après l'averse que pendant.
        if precip_now:
            out.append(_advice("mudguards", "wet_road"))
        else:
            out.append(_advice("mudguards", raison[0], **raison[1]))

    felt = _coldest("apparent_temperature")
    if felt is None:
        felt = _coldest("temperature")
    if felt is not None:
        if felt <= WARM_LAYER_MAX_C:
            out.append(_advice("warm_layer", "felt_temperature", degrees=f"{felt:.0f}"))
        if felt <= GLOVES_MAX_C:
            # Les mains prennent le vent relatif de plein fouet : elles refroidissent
            # bien avant le reste du corps, qui produit de la chaleur en pédalant.
            out.append(_advice("gloves", "felt_temperature", degrees=f"{felt:.0f}"))

    gusts = _worst("wind_gusts", current.get("wind_gusts"))
    wind = _worst("wind_speed", current.get("wind_speed"))
    if (gusts or 0) >= WINDBREAKER_GUST_KMH:
        out.append(_advice("windbreaker", "gusts", speed=f"{gusts:.0f}"))
    elif (wind or 0) >= WINDBREAKER_WIND_KMH:
        out.append(_advice("windbreaker", "wind", speed=f"{wind:.0f}"))

    dark = current.get("is_day") is False or any(row.get("is_day") is False for row in window)
    foggy = condition_for(current.get("weather_code")) in {"fog", "rime_fog"}
    if dark or foggy:
        out.append(_advice("lights", "fog" if foggy and not dark else "night"))

    return out


# --- Décalage de l'heure de départ -------------------------------------------
# En deçà de ce cumul sur un pas, on considère le créneau sec : un dixième de
# millimètre sur un quart d'heure, c'est une bruine qui ne mouille pas.
DRY_STEP_MM = 0.2
# Un créneau plus court ne vaut pas la peine d'être annoncé : le temps d'enfiler
# une veste et de sortir le vélo, il est passé.
DRY_WINDOW_MIN = 30
# Horizon de recherche. Au-delà, ce n'est plus « décaler son départ », c'est
# renoncer — et ce n'est pas à nous de le suggérer.
DEPARTURE_HORIZON_MIN = 120
MINUTELY_STEP_MIN = 15
HOURLY_STEP_MIN = 60


def dry_step(precipitation) -> bool:
    """Ce pas de prévision est-il sec ?"""
    return (precipitation or 0.0) < DRY_STEP_MM


# Codes temps où il tombe quelque chose, quand la variable numérique ne l'a pas
# encore vu (une averse qui commence met un cycle à apparaître en millimètres).
WET_CODES = frozenset(
    {51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82}
    | SNOW_CODES | STORM_CODES
)


def is_wet(reading: dict) -> bool:
    """Pleuvait-il au moment de ce relevé ?

    Sert au badge « Rouleur sous la pluie ». On accepte les deux signaux — la
    valeur numérique et le code temps — contrairement à `alerts_for` qui écarte
    le code : ici une fausse détection n'alerte personne à tort, elle attribue au
    plus un badge un peu généreusement, alors qu'en manquer une prive le cycliste
    d'un mérite qu'il a bel et bien gagné sous l'averse.
    """
    if not reading:
        return False
    if (reading.get("precipitation") or 0.0) >= WET_NOW_MM:
        return True
    try:
        return int(reading.get("weather_code")) in WET_CODES
    except (TypeError, ValueError):
        return False


def cardinal(degrees) -> str | None:
    """Point cardinal français (16 secteurs) d'une direction en degrés.

    Calculé ici pour que le web et le mobile ne le refassent pas deux fois, avec
    deux tables d'abréviations différentes.
    """
    if degrees is None:
        return None
    # Clés internationales : « SSO » est la forme française de « SSW », elle vit
    # au catalogue. Renvoyer la clé garde la réponse neutre en langue.
    names = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
             "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"]
    try:
        index = int(math.floor((float(degrees) % 360) / 22.5 + 0.5)) % 16
    except (TypeError, ValueError):
        return None
    return names[index]
