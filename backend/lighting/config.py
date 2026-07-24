"""Réglages de la synchro d'éclairage public (module `lighting`)."""

HTTP_TIMEOUT_S = 60

UPSERT_CHUNK_SIZE = 1000

MAX_RETRIES = 3

# Deux points lumineux de sources différentes plus proches que ce rayon sont
# réputés désigner le même lampadaire : on écarte alors le doublon OSM au profit
# du point officiel, pour ne pas surestimer la densité d'éclairage.
DEDUP_RADIUS_M = 8.0


# Registre des jeux open data « points lumineux » exposés via l'API OpenDataSoft
# Explore v2.1. Toutes ces métropoles partagent la même API : un seul provider
# générique (`OdsLightingProvider`) les couvre. Ajouter une ville = ajouter une
# entrée ici, sans nouveau code.
#
#   source      : identifiant interne (doit figurer dans STREET_LAMP_SOURCES)
#   base_url    : racine du portail OpenDataSoft
#   dataset_id  : identifiant du jeu de données
#   geo_field   : champ géographique (geo_point_2d / geo_shape) pour le filtre bbox
#   cities      : noms de communes déclencheurs (le jeu n'est interrogé que si le
#                 profil actif contient l'une d'elles)
ODS_LIGHTING_DATASETS = [
    {
        "source": "bordeaux",
        "label": "Bordeaux Métropole — Points lumineux",
        "base_url": "https://opendata.bordeaux-metropole.fr",
        "dataset_id": "bor_ptlum",
        "geo_field": "geometrie",
        "id_fields": ("code_pl", "entityid", "rowkey"),
        "cities": ("bordeaux",),
    },
    {
        "source": "nantes",
        "label": "Nantes Métropole — Luminaires d'éclairage public",
        "base_url": "https://data.nantesmetropole.fr",
        "dataset_id": "244400404_luminaires-eclairage-public-nantes-metropole",
        "geo_field": "geo_point_2d",
        "id_fields": ("identifiant",),
        "cities": ("nantes",),
    },
]
