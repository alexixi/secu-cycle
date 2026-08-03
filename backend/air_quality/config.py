"""Réglages de la couche qualité de l'air : source, cadence, barème.

La source est Open-Meteo, qui redistribue le CAMS (Copernicus Atmosphere
Monitoring Service). Maille 0,1° ≈ 11 km : le CAMS dit *quand* l'air est mauvais,
il ne dit pas *où*, à l'échelle de la rue. Le gradient rue-par-rue vient du
réseau routier (cf. `AIR_EXPOSURE_BY_HIGHWAY` dans `graph/config.py`), pas d'ici.

Les pénalités de coût appliquées au routage ne sont **pas** ici : ce sont des
réglages de graphe, elles restent dans `graph/config.py` (`AIR_BASE_PENALTY`,
`AIR_SAFETY_FACTOR`, `AIR_EXPOSURE_BY_HIGHWAY`).
"""

import math
import os

URL = "https://air-quality-api.open-meteo.com/v1/air-quality"
HTTP_TIMEOUT_S = 10.0

# Cadence de collecte. Le CAMS est horaire ; 900 s = 96 appels/jour, très loin
# des 10 000/jour de la formule gratuite (non commerciale).
REFRESH_INTERVAL_S = 900

# Maille réelle du CAMS européen, et pas le plus fin qu'on échantillonne. L'API
# recale de toute façon chaque coordonnée sur le nœud CAMS le plus proche.
GRID_STEP_DEG = 0.1
# Garde-fou si un profil couvre une très grande emprise : longueur d'URL, taille
# de réponse et latence.
#
# Ce n'est **pas** une limite de quota, mais pas pour la raison qu'on lisait ici :
# Open-Meteo pondère par point, pas par requête (`poids = (jours/14) ×
# (variables/10) × points`, cf. `weather/config.py`). 150 points × 96 cycles × 7
# variables restent sous le plafond gratuit grâce au facteur temporel, pas parce
# qu'une requête multi-points compterait pour une.
#
# Le dépassement **ne coupe jamais des cellules** : la maille entière s'élargit
# d'un multiple du pas (cf. `service.grid_points`) jusqu'à tenir dans le budget.
# Une couverture trouée serait pire qu'une couverture grossière : sur la carte,
# elle se lit comme une absence de donnée, pas comme une résolution moindre.
# 150 laisse deux métropoles au pas natif de 0,1°.
MAX_GRID_POINTS = 150

# Sous-indices EAQI par polluant. Le polluant dominant est celui dont le
# sous-indice égale l'indice global (l'EAQI est le max des sous-indices). L'ordre
# fixe la priorité d'affichage en cas d'égalité.
POLLUTANT_SUBINDICES = {
    "european_aqi_pm2_5": "Particules fines (PM2.5)",
    "european_aqi_pm10": "Particules (PM10)",
    "european_aqi_nitrogen_dioxide": "Dioxyde d'azote (NO₂)",
    "european_aqi_ozone": "Ozone (O₃)",
    "european_aqi_sulphur_dioxide": "Dioxyde de soufre (SO₂)",
}
CURRENT_VARS = ["european_aqi", *POLLUTANT_SUBINDICES.keys()]

HOURLY_VARS = ["european_aqi"]
FORECAST_HOURS = 24
# Pas d'échantillonnage de la prévision servie au front (toutes les 3 h).
FORECAST_STEP = 3

# Barème officiel EEA (borne supérieure incluse), valable France et Belgique.
EAQI_BANDS = [
    (20, "good", "Bon"),
    (40, "fair", "Moyen"),
    (60, "moderate", "Dégradé"),
    (80, "poor", "Mauvais"),
    (100, "very_poor", "Très mauvais"),
    (math.inf, "extreme", "Extrêmement mauvais"),
]

# Modulation temporelle du malus de routage : en deçà de START (« Dégradé »),
# aucun malus ; au-delà de FULL (« Très mauvais »), malus plein.
INTENSITY_START = 40.0
INTENSITY_FULL = 80.0

ATTRIBUTION = "CAMS ENSEMBLE / Open-Meteo"


# --- Stations sol (WAQI / World Air Quality Index) ---------------------------
# Second signal, complémentaire de CAMS : des mesures réelles, sans latence de
# modèle. Là où le modèle lisse ou retarde un panache (feu de forêt), une station
# sous le vent le mesure. WAQI publie en AQI US (EPA), pas en indice européen : on
# garde son échelle native, on ne convertit pas (l'appel groupé ne donne que
# l'AQI, pas les concentrations brutes — toute conversion serait fausse).
WAQI_URL = "https://api.waqi.info/map/bounds/"
# Jeton d'API, jamais commité. Absent => stations désactivées, la couche reste en
# CAMS seul (dégradation gracieuse).
WAQI_TOKEN = os.getenv("WAQI_TOKEN", "").strip()
ATTRIBUTION_WAQI = "World Air Quality Index Project (waqi.info)"

# Barème AQI US (EPA), borne supérieure incluse, avec couleurs officielles.
US_AQI_BANDS = [
    (50, "good", "Bon", "#00e400"),
    (100, "moderate", "Moyen", "#ffff00"),
    (150, "usg", "Mauvais pour sensibles", "#ff7e00"),
    (200, "unhealthy", "Mauvais", "#ff0000"),
    (300, "very_unhealthy", "Très mauvais", "#8f3f97"),
    (math.inf, "hazardous", "Dangereux", "#7e0023"),
]

# Modulation de routage à partir d'une station : le cycliste est un usager à
# l'effort (ventilation élevée), d'où un seuil prudent. En deçà de START, aucun
# malus ; au-delà de FULL, malus plein.
STATION_INTENSITY_START_US = 100.0
STATION_INTENSITY_FULL_US = 200.0


def band_for(aqi):
    """(clé, libellé) de la bande EAQI d'un indice."""
    for upper, key, label in EAQI_BANDS:
        if aqi <= upper:
            return key, label
    return EAQI_BANDS[-1][1], EAQI_BANDS[-1][2]


def us_band_for(aqi):
    """(clé, libellé, couleur) de la bande AQI US d'un indice de station."""
    for upper, key, label, color in US_AQI_BANDS:
        if aqi <= upper:
            return key, label, color
    last = US_AQI_BANDS[-1]
    return last[1], last[2], last[3]


def intensity_for(aqi_mean):
    """Intensité de modulation ∈ [0, 1] à partir de l'indice moyen de l'emprise."""
    if aqi_mean is None:
        return 0.0
    span = INTENSITY_FULL - INTENSITY_START
    return max(0.0, min(1.0, (aqi_mean - INTENSITY_START) / span))


def station_intensity_for(aqi):
    """Intensité de modulation ∈ [0, 1] à partir de l'AQI US d'une station.

    Normalisée [0, 1] par ses propres seuils, donc directement comparable à
    `intensity_for` (EAQI) : le routage prend le max des deux.
    """
    if aqi is None:
        return 0.0
    span = STATION_INTENSITY_FULL_US - STATION_INTENSITY_START_US
    return max(0.0, min(1.0, (aqi - STATION_INTENSITY_START_US) / span))
