"""Réglages de la couche vélos en libre-service : systèmes, cadences, vocabulaire.

La couche est **informative** : elle ne pèse pas sur le calcul d'itinéraire. Aucun
réglage de routage ici, contrairement au trafic (`graph/config.py`).

Le registre `SYSTEMS` ne contient que des services **à stations** (bornettes). Les
opérateurs en flotte libre (Dott, Lime, Pony…) ne publient pas de
`station_information` et sont de toute façon écartés par l'auto-discovery — mais on
ne les inscrit pas : un système inscrit doit avoir été vérifié.
"""

import os

HTTP_TIMEOUT_S = 10.0

# Les portails open data apprécient qu'on se présente ; certains filtrent les
# clients anonymes.
USER_AGENT = "SecuCycle/1.0 (+https://secu-cycle.fr)"

# Battement de la boucle de fond. Chaque système décide seul s'il est dû : c'est
# ce qui permet de tenir deux cadences (statut temps réel, informations quasi
# statiques) avec une seule boucle.
TICK_S = 30

# Statut des stations : temps réel. Le `ttl` publié par le flux fait foi, encadré
# par ces bornes — Bordeaux annonce `ttl: 0` (« ne pas mettre en cache »), ce qui
# n'est pas une invitation à l'interroger en boucle.
DEFAULT_STATUS_INTERVAL_S = 60
MIN_STATUS_INTERVAL_S = 60
MAX_STATUS_INTERVAL_S = 300

# Informations de stations : quasi statiques (une station nouvelle par mois, au
# mieux). Rechargées avec le manifeste et les types de véhicules.
INFORMATION_INTERVAL_S = 6 * 3600

# Fraîcheur mesurée sur **notre** dernière collecte réussie, pas sur le
# `last_reported` publié par la station : ce dernier n'est pas maintenu par tous
# les opérateurs (Blue-bike le laisse figé depuis des mois) et blanchirait un
# réseau entier à tort. Il est restitué tel quel, à titre indicatif, dans la
# popup.
#
# Au-delà, les compteurs d'un système sont marqués périmés (affichés grisés)...
STALE_AFTER_S = 900
# ...et au-delà, ils sont effacés : les stations restent sur la carte (leur nom et
# leur capacité restent vrais) mais on ne ment pas sur le nombre de vélos.
DROP_COUNTS_AFTER_S = 3600

# Recul exponentiel sur un flux en échec, pour ne pas le marteler.
BACKOFF_BASE_S = 120
BACKOFF_MAX_S = 900

# ~1 m de précision : divise par deux le poids du GeoJSON sans rien perdre.
COORD_PRECISION = 5

# Interrupteur global : permet de masquer la couche sans redéployer.
ENABLED = os.getenv("BIKESHARE_ENABLED", "1").strip().lower() not in {"0", "false", "no"}

# Clé publique de la plateforme open data de Bordeaux Métropole : elle circule en
# clair sur leur portail, ce n'est pas un secret. Elle est néanmoins sortie du code
# pour pouvoir être remplacée sans redéploiement. `os.getenv(x, défaut)` renvoie ""
# quand la variable existe mais vide (cas docker-compose), d'où le `or`.
TBM_API_KEY = (
    os.getenv("BIKESHARE_TBM_API_KEY", "").strip()
    or "opendata-bordeaux-metropole-flux-gtfs-rt"
)

# Ventilation mécanique/électrique en GBFS v1/v2 : les clés de
# `num_bikes_available_types` ne sont pas normalisées par la spec, chaque
# opérateur y va de son vocabulaire.
MECHANICAL_KEYS = frozenset({"mechanical", "bike", "bikes", "classic", "manual"})
ELECTRIC_KEYS = frozenset({
    "ebike", "ebikes", "electric", "electrical",
    "ebike_with_battery", "ebike_without_battery", "electric_assist",
})

# Formes de véhicules retenues : on affiche des stations de vélos, pas de
# trottinettes. Un type hors de cette liste n'entre pas dans la ventilation.
BIKE_FORM_FACTORS = frozenset({"bicycle", "cargo_bicycle", "bike"})

# Registre des systèmes GBFS. Une entrée est réveillée uniquement si son
# `coverage` (w, s, e, n) croise l'emprise du graphe chargé — la sélection est
# géographique, jamais nationale.
#
# `coverage` est volontairement **grossier** : c'est un portillon de réveil
# hors-ligne, pas un filtre de précision. La précision vient du second étage, dans
# le service : chaque station est ensuite confrontée à l'emprise réelle du graphe,
# et un système qui n'en garde aucune est mis en sommeil.
#
# Aucune URL de flux en dur, aucun numéro de version : tout passe par
# l'auto-discovery (`gbfs.json`), ce qui permet d'ajouter un système sans savoir
# quelle version du standard il parle.
#
# Pour ajouter une ville, deux catalogues donnent l'URL de découverte :
#   - mondial : https://raw.githubusercontent.com/MobilityData/gbfs/master/systems.csv
#     (colonne « Auto-Discovery URL », 269 systèmes FR et 35 BE au dernier relevé)
#   - français : GET https://transport.data.gouv.fr/api/datasets, filtrer sur
#     `sub_types` contenant « bicycle » et `resources[].format == "gbfs"`
# Vérifier ensuite que le flux publie bien `station_information` **et**
# `station_status`, et relever son emprise réelle pour renseigner `coverage` :
# une entrée jamais exécutée est un format non vérifié, donc un bug latent.
SYSTEMS = {
    "bordeaux-tbm": {
        "name": "Le Vélo",
        "operator": "Bordeaux Métropole / Keolis",
        "discovery_url": "https://bdx.mecatran.com/utw/ws/gbfs/bordeaux/v3/gbfs.json",
        # La clé vit ici, jamais concaténée dans l'URL : elle ne doit pas finir
        # dans un log ni dans un message d'erreur exposé par l'API.
        "params": {"apiKey": TBM_API_KEY},
        "coverage": (-0.78, 44.71, -0.45, 44.95),
        "lang": "fr",
        "attribution": "Bordeaux Métropole — Open Data",
    },
    "paris-velib": {
        # GBFS v1/v2 : `data` indexé par langue, `station_id` entier, drapeaux 0/1,
        # `last_reported` en epoch. C'est l'autre branche du normalisateur.
        "name": "Vélib' Métropole",
        "operator": "Smovengo",
        "discovery_url": "https://velib-metropole-opendata.smovengo.cloud"
                         "/opendata/Velib_Metropole/gbfs.json",
        "coverage": (1.95, 48.65, 2.65, 49.05),
        "lang": "fr",
        "attribution": "Vélib' Métropole",
    },
    "lille-vlille": {
        # Manifeste indexé par langue (`data.en.feeds`) mais flux de stations à
        # plat : les deux branches du normalisateur se croisent sur ce système.
        # Parc uniquement mécanique — `vehicle_types` ne déclare qu'un type —,
        # la ventilation mécanique/électrique n'apporte donc rien ici. Comme
        # Blue-bike, `last_reported` est figé depuis des mois sur une partie des
        # stations ; sans effet, la fraîcheur se mesure sur notre collecte.
        "name": "V'Lille",
        "operator": "Métropole Européenne de Lille / Ilévia",
        "discovery_url": "https://media.ilevia.fr/opendata/gbfs.json",
        "coverage": (2.90, 50.55, 3.30, 50.80),
        "lang": "fr",
        "attribution": "Ilévia — Open Data",
    },
    "rennes-velostar": {
        # GBFS **1.0**, la plus ancienne branche encore en service : pas de
        # `vehicle_types`, donc aucune ventilation mécanique/électrique possible.
        # La popup n'affichera que le total — c'est le comportement voulu, le
        # normalisateur renvoie `None` plutôt que d'inventer une répartition.
        "name": "LE vélo STAR",
        "operator": "Rennes Métropole / STAR",
        "discovery_url": "https://eu.ftp.opendatasoft.com/star/gbfs/gbfs.json",
        "coverage": (-1.82, 48.02, -1.55, 48.20),
        "lang": "fr",
        "attribution": "STAR — Rennes Métropole",
    },
    "nantes-naolib": {
        # Cyclocity (JCDecaux), comme Lyon : voir la note sur le keep-alive de
        # `api.cyclocity.fr` dans `providers._get_json`. Parc mécanique seul.
        "name": "Naolib",
        "operator": "Nantes Métropole / JCDecaux",
        "discovery_url": "https://api.cyclocity.fr/contracts/nantes/gbfs/v3/gbfs.json",
        "coverage": (-1.70, 47.13, -1.44, 47.31),
        "lang": "fr",
        "attribution": "Naolib / JCDecaux",
    },
    "lyon-velov": {
        # Le plus gros réseau du registre après Vélib' (465 stations), et le seul
        # avec une vraie flotte électrique — c'est lui qui exerce la ventilation
        # mécanique/électrique de la popup.
        #
        # Une station (« PLATINE PLAISIR BEE ») est saisie aux coordonnées de
        # Plaisir, dans les Yvelines, ses vraies coordonnées traînant en texte
        # libre dans le champ `address`. On ne la traite pas ici : `coverage`
        # reste l'emprise lyonnaise réelle, et le second étage — confrontation de
        # chaque station à l'emprise du graphe — l'écarte de lui-même.
        "name": "Vélo'v",
        "operator": "Métropole de Lyon / JCDecaux",
        "discovery_url": "https://api.cyclocity.fr/contracts/lyon/gbfs/v3/gbfs.json",
        "coverage": (4.70, 45.62, 5.06, 45.96),
        "lang": "fr",
        "attribution": "Vélo'v / JCDecaux",
    },
    "strasbourg-velhop": {
        # Sur l'infrastructure nextbike, d'où le `system_id` opaque
        # (`nextbike_ae`). Le flux publie aussi un `free_bike_status` — des vélos
        # hors station — qu'on ignore : la couche affiche des stations.
        "name": "Vélhop",
        "operator": "Strasbourg Mobilités Vélo",
        "discovery_url": "https://gbfs.nextbike.net/maps/gbfs/v2/nextbike_ae/gbfs.json",
        "coverage": (7.54, 48.45, 7.92, 48.74),
        "lang": "fr",
        "attribution": "Vélhop — Eurométropole de Strasbourg",
    },
    "bruxelles-villo": {
        # Troisième réseau Cyclocity du registre, avec Lyon et Nantes : même
        # remarque sur le keep-alive de `api.cyclocity.fr` (`providers._get_json`).
        # C'est le plus électrifié de tous — plus d'un vélo sur deux — et dix de
        # ses stations n'ont pas de nom ; les deux frontends retombent alors sur
        # « Station de vélos ».
        #
        # Son emprise est incluse dans celle de Blue-bike : sur un graphe
        # bruxellois les deux systèmes se réveillent ensemble et cohabitent sur la
        # carte, chacun identifié par le logo de sa popup. C'est le
        # fonctionnement voulu, pas un doublon.
        "name": "Villo!",
        "operator": "Bruxelles-Capitale / JCDecaux",
        "discovery_url": "https://api.cyclocity.fr/contracts/bruxelles/gbfs/v3/gbfs.json",
        "coverage": (4.18, 50.73, 4.55, 50.95),
        "lang": "fr",
        "attribution": "Villo! / JCDecaux",
    },
    "be-bluebike": {
        # Stations en gare, surtout en Flandre : rien en Wallonie picarde. Sur un
        # profil Tournai, le système est réveillé par son emprise puis mis en
        # sommeil faute de station dans le graphe — c'est le cas qui valide ce
        # mécanisme.
        "name": "Blue-bike",
        "operator": "Blue-mobility",
        "discovery_url": "https://api.delijn.be/gbfs/gbfs.json",
        "coverage": (2.55, 49.88, 5.85, 51.50),
        "lang": "nl",
        "attribution": "Blue-bike / De Lijn",
    },
}
