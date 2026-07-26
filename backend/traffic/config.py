"""Réglages de la couche trafic : sources, cadence, vocabulaire.

Les pénalités de coût appliquées à un tronçon embouteillé ne sont **pas** ici :
ce sont des réglages de routage, elles restent dans `graph/config.py`
(`TRAFFIC_BASE_PENALTY`, `TRAFFIC_SAFETY_FACTOR`).
"""

HTTP_TIMEOUT_S = 10.0

# Cadence de collecte en secondes.
REFRESH_INTERVAL_S = 300

# Pagination de l'API : les jeux vont de ~500 (Strasbourg) à ~2 860 (Rennes)
# tronçons, servis par pages de 100. 40 pages laissent une marge confortable.
PAGE_SIZE = 100
MAX_PAGES = 40

# Registre des sources de trafic. Toutes exposent la même API Opendatasoft
# `explore/v2.1`, ne diffèrent que par le jeu, le champ d'état et son vocabulaire.
# Une source n'est interrogée que si son emprise (`coverage`, en (w, s, e, n))
# croise celle du graphe chargé — la sélection est géographique, jamais nationale.
#
# level_map traduit l'état publié vers l'échelle unique green/orange/red/gray,
# via `str(record[level_field])` (Bordeaux : états en majuscules ; Strasbourg :
# entier 0-3 ; Rennes : enum DATEX II). Un état absent du mapping retombe sur gray.
PROVIDERS = {
    "bordeaux-metropole": {
        "url": "https://opendata.bordeaux-metropole.fr/api/explore/v2.1"
               "/catalog/datasets/ci_trafi_l/records",
        "select": "gml_id,gid,etat,commune,geo_shape",
        "coverage": (-0.78, 44.71, -0.45, 44.95),
        "level_field": "etat",
        "level_map": {"FLUIDE": "green", "DENSE": "orange", "EMBOUTEILLE": "red", "INCONNU": "gray"},
        "id_fields": ("gml_id", "gid"),
        "commune_field": "commune",
    },
    "strasbourg-sirac": {
        "url": "https://eurometrostrasbourg.opendatasoft.com/api/explore/v2.1"
               "/catalog/datasets/sirac_flux_trafic/records",
        "select": "ident,name,etat,geo_shape",
        "coverage": (7.62, 48.47, 7.85, 48.69),
        "level_field": "etat",
        "level_map": {"0": "gray", "1": "green", "2": "orange", "3": "red"},
        "id_fields": ("ident", "name"),
        "commune_field": None,
        # Le jeu SIRAC contient aussi les arcs vélo (name préfixé « cycl ») : hors sujet ici.
        "exclude_prefix_field": "name",
        "exclude_prefix": "cycl",
    },
    "rennes-metropole": {
        "url": "https://data.rennesmetropole.fr/api/explore/v2.1"
               "/catalog/datasets/etat-du-trafic-en-temps-reel/records",
        "select": "gml_id,trafficstatus,denomination,geo_shape",
        "coverage": (-1.84, 47.99, -1.52, 48.21),
        "level_field": "trafficstatus",
        "level_map": {"freeFlow": "green", "heavy": "orange", "congested": "red",
                      "impossible": "red", "unknown": "gray"},
        "id_fields": ("gml_id",),
        "commune_field": None,
    },
    "nantes-metropole": {
        "url": "https://data.nantesmetropole.fr/api/explore/v2.1"
               "/catalog/datasets/244400404_fluidite-axes-routiers-nantes-metropole/records",
        "select": "cha_id,cha_lib,etat_trafic,geo_shape",
        "coverage": (-1.77, 47.11, -1.40, 47.35),
        "level_field": "etat_trafic",
        "level_map": {"Fluide": "green", "Dense": "orange", "Saturé": "red",
                      "Bloqué": "red", "Indéterminé": "gray"},
        "id_fields": ("cha_id",),
        "commune_field": None,
    },
}

# Poids du malus de routage selon la sévérité
CONGESTION_WEIGHT = {
    "red": 1.0,
    "orange": 0.4,
}
CONGESTED_LEVELS = frozenset(level for level, w in CONGESTION_WEIGHT.items() if w > 0)

DEFAULT_LEVEL = "gray"
