"""Réglages du géocodage : sources, vocabulaire, quotas."""

import os

BAN_SEARCH_URL = "https://api-adresse.data.gouv.fr/search/"
BAN_REVERSE_URL = "https://api-adresse.data.gouv.fr/reverse/"

MAPTILER_GEOCODE_URL = "https://api.maptiler.com/geocoding/{query}.json"

HTTP_TIMEOUT_S = 4.0

# Les communes d'un profil sont des chaînes Nominatim libres suffixées par le
# pays ("Tournai, Belgium"). C'est ce suffixe qui détermine les providers à
# interroger. Ajouter un pays = ajouter une entrée ici
COUNTRY_SUFFIXES = {
    "france": "fr",
    "belgium": "be",
    "belgique": "be",
    "belgië": "be",
    "luxembourg": "lu",
    "netherlands": "nl",
    "nederland": "nl",
    "pays-bas": "nl",
    "germany": "de",
    "deutschland": "de",
    "allemagne": "de",
    "spain": "es",
    "españa": "es",
    "espagne": "es",
    "italy": "it",
    "italia": "it",
    "italie": "it",
    "switzerland": "ch",
    "suisse": "ch",
}

# Pays retenu quand aucune commune ne porte de suffixe reconnu. Le corpus
# historique est français.
DEFAULT_COUNTRY = "fr"

# Pays servis par la BAN. C'est ce qui décide si on peut commencer par une source
# gratuite et faisant autorité, ou s'il faut aller directement chez MapTiler.
BAN_COUNTRIES = frozenset({"fr"})

# Score BAN au-dessus duquel on la considère comme ayant vraiment reconnu l'adresse
BAN_STRONG_MATCH = 0.7

# Sert à trier les résultats (adresse d'abord ou lieu d'abord), jamais
# à choisir un provider
STREET_KEYWORDS = frozenset({
    "rue", "avenue", "av", "boulevard", "bd", "place", "allee", "allée",
    "route", "chemin", "cours", "quai", "impasse", "passage", "square",
    "esplanade", "voie", "sentier", "venelle", "clos", "residence", "résidence",
    "lieu-dit", "rond-point", "chaussee", "chaussée", "dreve", "drève",
    "rampe", "galerie", "parvis", "promenade", "traverse", "villa",
})

# Durée de mise en cache d'un résultat de géocodage, en jours.
# Long par défaut pour ne pas perdre les résultats de géocodage d'adresses
CACHE_TTL_DAYS = int(os.getenv("GEOCODE_CACHE_TTL_DAYS", "365"))

MIN_QUERY_LENGTH = 3
RESULT_LIMIT = 5

# Coordonnées arrondies avant de servir de clé de cache : ~11 m, largement sous
# la tolérance de rattachement au graphe.
CACHE_COORD_PRECISION = 4

# Garde-fou sur le plan MapTiler : au-delà, on dégrade en « BAN seule » plutôt
# que d'épuiser un quota partagé avec les tuiles de la carte.
MAPTILER_MONTHLY_BUDGET = int(os.getenv("MAPTILER_GEOCODING_BUDGET", "40000"))


def maptiler_key() -> str | None:
    """Clé MapTiler, ou None si le géocodage payant est désactivé."""
    # `or None` plutôt qu'un défaut : docker-compose injecte la variable vide
    # quand elle n'est pas renseignée.
    return os.getenv("MAPTILER_KEY") or None
