"""Réglages de l'ingestion d'accidentologie : sources, millésimes, vocabulaire."""

BAAC_API_URL = "https://opendata.koumoul.com/data-fair/api/v1/datasets/accidents-velos/lines"

BAAC_FIELDS = (
    "Num_Acc", "date", "an", "lat", "long", "grav",
    "catr", "lum", "atm", "agg", "int", "col", "age", "sexe",
)

BAAC_PAGE_SIZE = 1000

STATBEL_ZIP_URL = (
    "https://statbel.fgov.be/sites/default/files/files/opendata/Accident_XY/"
    "OPENDATA_MAP_2017-2024.zip"
)

STATBEL_CRS = "EPSG:31370"

STATBEL_MIN_YEAR = 2022

STATBEL_BICYCLE_CODE = "03"

DEFAULT_SINCE_YEAR = 2015

HTTP_TIMEOUT_S = 60.0

UPSERT_CHUNK_SIZE = 500

BAAC_LUM = {
    1: "Plein jour",
    2: "Crépuscule ou aube",
    3: "Nuit sans éclairage public",
    4: "Nuit avec éclairage public non allumé",
    5: "Nuit avec éclairage public allumé",
}

BAAC_ATM = {
    1: "Normale", 2: "Pluie légère", 3: "Pluie forte", 4: "Neige ou grêle",
    5: "Brouillard ou fumée", 6: "Vent fort ou tempête", 7: "Temps éblouissant",
    8: "Temps couvert", 9: "Autre",
}

BAAC_COL = {
    1: "Frontale entre deux véhicules",
    2: "Par l'arrière",
    3: "Par le côté",
    4: "En chaîne (trois véhicules ou plus)",
    5: "Collisions multiples",
    6: "Autre collision",
    7: "Sans collision",
}

BAAC_CATR = {
    1: "Autoroute", 2: "Route nationale", 3: "Route départementale",
    4: "Voie communale", 5: "Hors réseau public", 6: "Parc de stationnement",
    7: "Route de métropole urbaine", 9: "Autre",
}

BAAC_INT = {
    1: "Hors intersection", 2: "Intersection en X", 3: "Intersection en T",
    4: "Intersection en Y", 5: "Intersection à plus de quatre branches",
    6: "Giratoire", 7: "Place", 8: "Passage à niveau", 9: "Autre intersection",
}
