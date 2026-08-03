"""Réglages de la vigilance météo officielle : sources, cadence, vocabulaire.

Deux sources **indépendantes**, une par pays, sur le modèle du registre de
`traffic/config.py` : chacune a son emprise, n'est interrogée que si celle-ci
croise une zone du graphe, et peut échouer sans entraîner l'autre.

Différence de nature avec les alertes de `weather/` : celles-ci sont *dérivées*
par nous à partir de seuils numériques, celles-là sont *officielles* et validées
par un institut météorologique national. Les deux se complètent — l'officiel
apporte l'autorité et la portée (un département entier, plusieurs heures à
l'avance), nos seuils apportent le chiffre local (« rafales à 41 km/h ») que la
vigilance départementale ne donne pas. C'est pourquoi seules les alertes de ce
module ont le droit d'employer le vocabulaire officiel (« vigilance orange »).

Aucune clé d'API : les deux sources sont publiques.
"""

HTTP_TIMEOUT_S = 12.0

# Météo-France publie sa vigilance deux fois par jour (vers 6 h et 16 h) et à
# chaque changement de situation ; MeteoAlarm relaie au fil de l'eau. 30 minutes
# suffisent largement, et c'est six fois moins d'appels que la couche météo.
REFRESH_INTERVAL_S = 1800

# Au-delà, l'instantané est marqué périmé. Une vigilance vieille de six heures a
# pu être levée sans qu'on le sache : mieux vaut ne plus l'afficher comme un fait.
STALE_AFTER_S = 3 * 3600

# --- Registre des sources ----------------------------------------------------
# `coverage` en (w, s, e, n), comme partout ailleurs dans le projet. National ici,
# contrairement au trafic qui est métropolitain — mais la règle est la même : une
# source n'est interrogée que si son emprise croise une zone du graphe chargé.
PROVIDERS = {
    "meteo-france": {
        "kind": "opendatasoft",
        "country": "fr",
        # Miroir Opendatasoft du flux Vigilance. Même API `explore/v2.1` que les
        # quatre sources de trafic : aucun client à écrire.
        #
        # L'API native de Météo-France (public-api.meteofrance.fr/public/DPVigilance)
        # sert la même donnée sans intermédiaire, mais exige un jeton créé sur leur
        # portail. Le miroir évite cette clé, au prix d'une dépendance à un tiers
        # qui republie — c'est le compromis retenu, et il se renverse en changeant
        # ce bloc si le miroir devait décrocher.
        "url": "https://public.opendatasoft.com/api/explore/v2.1"
               "/catalog/datasets/weatherref-france-vigilance-meteo-departement/records",
        "coverage": (-5.3, 41.2, 9.7, 51.2),
        "attribution": "Météo-France",
    },
    "irm-meteoalarm": {
        "kind": "meteoalarm",
        "country": "be",
        # MeteoAlarm (EUMETNET) relaie les avertissements officiels de l'IRM au
        # format CAP, en français. Le portail open data de l'IRM
        # (opendata.meteo.be) ne publie pas les avertissements, et l'API de leur
        # application mobile n'est ni documentée ni stable : elle est écartée.
        "url": "https://feeds.meteoalarm.org/api/v1/warnings/feeds-belgium",
        "coverage": (2.5, 49.4, 6.5, 51.6),
        "language": "fr-BE",
        "attribution": "IRM, via MeteoAlarm (EUMETNET)",
    },
}

USER_AGENT = "SecuCycle/1.0 (+https://secu-cycle.fr)"

# --- Résolution géographique -------------------------------------------------
# Ni le miroir Opendatasoft ni le flux CAP ne portent de géométrie : il faut
# résoudre nous-mêmes le centre d'une zone du graphe vers un code administratif.
# Nominatim répond de façon uniforme pour les deux pays via `ISO3166-2-lvl6`
# (FR-33 pour la Gironde, BE-WHT pour le Hainaut), ce qui évite d'avoir deux
# résolveurs. Un à trois appels par chargement de graphe, mis en cache ensuite —
# très en deçà de ce que fait déjà le géocodage des communes du profil.
NOMINATIM_URL = "https://nominatim.openstreetmap.org/reverse"
NOMINATIM_ZOOM = 8  # niveau « département / province »

# Découpage réel de MeteoAlarm pour la Belgique, relevé sur le flux : dix zones,
# qui ne suivent pas NUTS. Les trois entités du Brabant (flamand, wallon,
# Bruxelles) y sont fusionnées sous BE004, et « La Côte » (BE801) est une zone
# littorale à part, qu'un centre de zone urbaine ne peut pas atteindre.
BE_ISO_TO_EMMA = {
    "BE-VAN": "BE21",   # Anvers
    "BE-VLI": "BE22",   # Limbourg
    "BE-VOV": "BE23",   # Flandre orientale
    "BE-VWV": "BE25",   # Flandre occidentale
    "BE-VBR": "BE004",  # Brabant flamand  -> Brabant
    "BE-WBR": "BE004",  # Brabant wallon   -> Brabant
    "BE-BRU": "BE004",  # Bruxelles        -> Brabant
    "BE-WHT": "BE32",   # Hainaut
    "BE-WLG": "BE33",   # Liège
    "BE-WLX": "BE34",   # Luxembourg
    "BE-WNA": "BE35",   # Namur
}

# --- Échelles de sévérité ----------------------------------------------------
# Les deux sources partagent la même échelle à quatre niveaux, qui correspond
# déjà à `weather.config.ALERT_ORDER`. Le vert n'est pas une alerte : il dit
# « rien à signaler » et n'a rien à faire dans la liste.
COLOR_LEVEL = {
    "vert": None,
    "jaune": "watch",
    "orange": "warning",
    "rouge": "severe",
}

# `awareness_level` de MeteoAlarm : « 2; yellow; Moderate ». On lit le rang.
METEOALARM_LEVEL = {
    "1": None,
    "2": "watch",
    "3": "warning",
    "4": "severe",
}

COLOR_LABELS = {
    "watch": "jaune",
    "warning": "orange",
    "severe": "rouge",
}

# --- Phénomènes --------------------------------------------------------------
# Ramenés autant que possible aux clés déjà utilisées par `weather.config`, pour
# que les fronts choisissent la même icône qu'une alerte dérivée du même danger.
MF_PHENOMENON_KEYS = {
    "vent": "gust",
    "pluie": "heavy_rain",
    "pluie-inondation": "heavy_rain",
    "orages": "thunderstorm",
    "inondation": "flood",
    "neige / verglas": "ice",
    "canicule": "heat",
    "grand-froid": "cold",
    "avalanches": "avalanche",
    "vagues-submersion": "coastal",
}

# `awareness_type` de MeteoAlarm : « 5; high-temperature ». On lit le rang.
METEOALARM_TYPE_KEYS = {
    "1": ("gust", "Vent"),
    "2": ("ice", "Neige-verglas"),
    "3": ("thunderstorm", "Orages"),
    "4": ("fog", "Brouillard"),
    "5": ("heat", "Vague de chaleur"),
    "6": ("cold", "Grand froid"),
    "7": ("coastal", "Phénomène côtier"),
    "8": ("fire", "Feux de forêt"),
    "9": ("avalanche", "Avalanches"),
    "10": ("heavy_rain", "Pluie"),
    "11": ("flood", "Inondation"),
    "12": ("flood", "Pluie-inondation"),
}

# Libellés français des phénomènes Météo-France, pour composer un intitulé
# homogène avec le côté belge (« Vigilance orange — Orages »).
MF_PHENOMENON_LABELS = {
    "vent": "Vent violent",
    "pluie": "Pluie-inondation",
    "pluie-inondation": "Pluie-inondation",
    "orages": "Orages",
    "inondation": "Inondation",
    "neige / verglas": "Neige-verglas",
    "canicule": "Canicule",
    "grand-froid": "Grand froid",
    "avalanches": "Avalanches",
    "vagues-submersion": "Vagues-submersion",
}


def level_for_color(color) -> str | None:
    """Niveau interne d'une couleur Météo-France, ou None si vert/inconnu."""
    return COLOR_LEVEL.get(str(color or "").strip().lower())


def _rank(value) -> str:
    """Rang d'un champ MeteoAlarm « 2; yellow; Moderate » -> « 2 »."""
    return str(value or "").split(";", 1)[0].strip()


def level_for_awareness(awareness_level) -> str | None:
    """Niveau interne d'un `awareness_level` MeteoAlarm, ou None si vert."""
    return METEOALARM_LEVEL.get(_rank(awareness_level))


def phenomenon_for_awareness(awareness_type) -> tuple[str, str]:
    """(clé de danger, libellé français) d'un `awareness_type` MeteoAlarm."""
    return METEOALARM_TYPE_KEYS.get(_rank(awareness_type), ("unknown", "Phénomène"))


def label_for(level: str, phenomenon_label: str) -> str:
    """« Vigilance orange — Orages ». Réservé aux alertes officielles : nos
    seuils dérivés n'ont pas l'autorité pour employer ce vocabulaire."""
    color = COLOR_LABELS.get(level)
    if not color:
        return phenomenon_label
    return f"Vigilance {color} — {phenomenon_label}"
