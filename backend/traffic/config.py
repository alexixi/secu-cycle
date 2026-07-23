"""Réglages de la couche trafic : sources, cadence, vocabulaire.

Les pénalités de coût appliquées à un tronçon embouteillé ne sont **pas** ici :
ce sont des réglages de routage, elles restent dans `graph/config.py`
(`TRAFFIC_BASE_PENALTY`, `TRAFFIC_SAFETY_FACTOR`).
"""

BORDEAUX_METROPOLE_URL = (
    "https://opendata.bordeaux-metropole.fr/api/explore/v2.1"
    "/catalog/datasets/ci_trafi_l/records"
)

HTTP_TIMEOUT_S = 10.0

# Cadence de collecte en secondes.
REFRESH_INTERVAL_S = 300

# Pagination de l'API : le jeu compte ~687 tronçons, servis par pages de 100.
PAGE_SIZE = 100
MAX_PAGES = 40

# Emprise réellement couverte par chaque source, en (w, s, e, n). Une source
# n'est interrogée que si son emprise croise celle du graphe chargé.
PROVIDER_COVERAGE = {
    "bordeaux-metropole": (-0.78, 44.71, -0.45, 44.95),
}

# États publiés par la source, traduits sur une échelle unique.
LEVEL_BY_ETAT = {
    "EMBOUTEILLE": "red",
    "DENSE": "orange",
    "FLUIDE": "green",
    "INCONNU": "gray",
}

# Poids du malus de routage selon la sévérité
CONGESTION_WEIGHT = {
    "red": 1.0,
    "orange": 0.4,
}
CONGESTED_LEVELS = frozenset(level for level, w in CONGESTION_WEIGHT.items() if w > 0)

DEFAULT_LEVEL = "gray"

# Types de voie où le cycliste est physiquement séparé de la circulation
SEPARATED_HIGHWAYS = frozenset({"cycleway", "footway", "path", "pedestrian", "steps", "bridleway"})
SEPARATED_CYCLEWAY_TAGS = frozenset({"track", "separate"})
