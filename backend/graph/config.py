SCORE_HIGHWAY = {
    'cycleway': 10,
    'pedestrian': 10,
    'footway': 9,
    'living_street': 9,
    'residential': 8,
    'path': 8,
    'bridleway': 7,
    'track': 7,
    'service': 5,
    'unclassified': 4,
    'tertiary': 4,
    'tertiary_link': 4,
    'secondary': 2,
    'secondary_link': 2,
    'busway': 2,
    'primary': 1,
    'primary_link': 1,
    'trunk': 1,
    'trunk_link': 1
}

SCORE_CYCLEWAY = {
    'track': 10,
    'separate': 10,
    'lane': 7,
    'shared_busway': 6,
    'shared_lane': 4,
    'none': 1
}

DEFAULT_MAXSPEED_BY_HIGHWAY = {
    'primary': 50, 'primary_link': 50, 'secondary': 50, 'secondary_link': 50,
    'residential': 30, 'tertiary': 30, 'tertiary_link': 30, 'unclassified': 30,
    'living_street': 20,
    'cycleway': 25, 'path': 25, 'track': 25,
    'footway': 10, 'pedestrian': 10
}

# Score d'éclairage (sur 10) d'une voie dont l'éclairage n'est PAS renseigné :
# ni tag OSM `lit`, ni inférence lampadaires. Variante prudente pour une app de
# sécurité : on ne suppose rien — ni éclairée, ni obscure — donc score NEUTRE.
# L'éclairage ne récompense ainsi que le connu (`lit=yes` ou lampadaires
# proches) et ne pénalise que le connu (`lit=no`) ; il ne prête jamais
# d'éclairage à une voie sur la seule foi de son type.
LIT_NEUTRAL_SCORE = 5.0

# Coupure nocturne de l'éclairage public (heures locales) : de nombreuses
# communes éteignent leurs lampadaires en cœur de nuit. Heuristique, faute de
# donnée d'extinction commune par commune ; bornes [début, fin[.
NIGHT_EXTINCTION_WINDOW = (1, 5)

# Inférence d'éclairage à partir des lampadaires (table `street_lamps`).
# Rayon d'INFLUENCE d'un lampadaire : il compte pour TOUTES les arêtes situées à
# moins de cette distance, et non pour la seule plus proche — une lampe en bord
# de chaussée éclaire aussi la piste cyclable qui la longe.
STREETLAMP_SNAP_RADIUS_M = 20.0
# Densité (lampadaires pour 100 m) à partir de laquelle une arête sans tag `lit`
# est réputée éclairée. ~1 lampadaire tous les 30 m sur une voie urbaine.
STREETLAMP_LIT_MIN_PER_100M = 2.5

# Propagation de l'éclairage depuis une voie tagguée `lit=yes` (OSM) vers les
# aménagements séparés qui la longent (piste cyclable, chemin, trottoir).
LIT_SPILL_RADIUS_M = 15.0
# Part de la longueur de la voie candidate devant courir à moins de
# LIT_SPILL_RADIUS_M d'une voie éclairée. Un critère de COUVERTURE (et non la
# distance minimale) est indispensable : deux arêtes qui se touchent à un
# carrefour sont à distance nulle, or une rue perpendiculaire n'est pas éclairée
# par le boulevard qu'elle croise. Longer, oui ; croiser, non.
LIT_SPILL_MIN_COVERAGE = 0.6
LIT_SPILL_SAMPLE_STEP_M = 10.0
# Seuls ces types de voies bénéficient de la propagation : les aménagements
# séparés de la chaussée, pas les rues voisines.
LIT_SPILL_TARGET_HIGHWAYS = ('cycleway', 'path', 'footway', 'track')

SPEED_BY_INFRASTRUCTURE = {
    "none":          (18, 21, 14, 22),
    "opposite":      (16, 18, 13, 19),
    "shared":        (17, 18, 13, 20),
    "shared_busway": (20, 23, 15, 23),
    "lane":          (20, 23, 15, 25),
    "track":         (19, 21, 16, 24),
}

DEFAULT_SPEED = (18, 21, 14, 22)

BIKE_TYPE_INDEX = {
    "standard": 0,
    "vtt":      2,
    "route":    3,
}

LEVEL_MULTIPLIER = {
    "debutant": 0.8,
    "intermediaire": 1.0,
    "experimente": 1.3
}

ELEVATION_WEIGHT_BY_LEVEL = {
    'debutant': 1.2,
    'intermediaire': 0.7,
    'experimente': 0.2
}

REPORT_PENALTIES = {
    'accident': 10.0,
    'danger': 5.0,
    'travaux': 3.0,
    'obstacle': 2.0,
    'default': 2.0
}

# Distance (m) au-delà de laquelle un accident n'est plus considéré comme attaché à une arête du graphe
ACCIDENT_SNAP_RADIUS_M = 25.0

# Demi-vie de l'ancienneté d'un accident : au bout de ce délai, il ne pèse plus que moitié
ACCIDENT_HALF_LIFE_YEARS = 5.0

# Longueur de référence de la densité d'accidents (accidents pour 100 m).
ACCIDENT_REFERENCE_LENGTH_M = 100.0

# Plafond du malus, en points sur 10. Volontairement bas : l'accidentologie
# corrige la note d'infrastructure, elle ne la remplace pas. Les données ne
# comportent aucun dénominateur d'exposition (nombre de cyclistes passés), si
# bien qu'un axe cyclable très fréquenté cumule des accidents sans être plus
# dangereux au kilomètre parcouru. Un malus non plafonné pénaliserait donc les
# grands axes aménagés au profit de rues résidentielles désertes.
ACCIDENT_MAX_MALUS = 1.5
# Calibré pour qu'un seul accident, même mortel, n'atteigne pas le plafond : sans
# quoi tous les points noirs seraient à égalité et le score cesserait de les
# distinguer. Ordre de grandeur obtenu sur un segment de 100 m : un blessé léger
# récent coûte 0,3 pt, un mort 1,1 pt, un carrefour cumulant plusieurs drames
# atteint le plafond.
ACCIDENT_MALUS_K = 0.5

ELEVATION_DIVISOR = 30.0
DEFAULT_SAFETY_PENALTY = 30.0

# Malus d'un tronçon congestionné, en mètres virtuels, pondéré par la sévérité
TRAFFIC_BASE_PENALTY = 50.0
TRAFFIC_SAFETY_FACTOR = 120.0

# Types de voie où le cycliste est physiquement séparé de la circulation
# automobile (piste, chemin, trottoir…). Notions de réseau, partagées par le
# trafic et la qualité de l'air : une voie séparée n'hérite ni de la congestion
# des voitures ni de leur pollution de proximité.
SEPARATED_HIGHWAYS = frozenset({"cycleway", "footway", "path", "pedestrian", "steps", "bridleway"})
SEPARATED_CYCLEWAY_TAGS = frozenset({"track", "separate"})

# Exposition du cycliste à la pollution de proximité selon la classe de voie :
# proxy spatial du gradient intra-urbain que le CAMS (maille ~11 km) ne capte
# pas. 0 = à l'écart du trafic, 1 = au cœur d'un grand axe. Nul sur une voie
# séparée de la chaussée (posé à 0 dans precompute_static_costs).
AIR_EXPOSURE_BY_HIGHWAY = {
    'trunk': 1.0, 'trunk_link': 1.0, 'primary': 0.9, 'primary_link': 0.9,
    'secondary': 0.7, 'secondary_link': 0.7, 'busway': 0.7,
    'tertiary': 0.5, 'tertiary_link': 0.5, 'unclassified': 0.35,
    'residential': 0.25, 'service': 0.2, 'living_street': 0.1,
}
DEFAULT_AIR_EXPOSURE = 0.35
AIR_CONGESTION_BOOST = 0.5   # trafic à l'arrêt/redémarrage = émissions accrues
# Malus d'exposition, proportionnel à la longueur (dose = concentration × temps).
# Volontairement modéré : l'air corrige la note d'infrastructure, il ne la
# remplace pas (cf. ACCIDENT_MAX_MALUS). Calibrage visant ~10 % d'influence face
# au terme de risque (qui monte à DEFAULT_SAFETY_PENALTY = 30).
AIR_BASE_PENALTY = 0.2       # à calibrer
AIR_SAFETY_FACTOR = 3.0      # à calibrer
# En deçà de ce seuil EAQI aucun malus (air « Moyen ») ; au-delà de FULL, malus
# plein (« Très mauvais »). Barème EEA, valable France et Belgique.
AIR_INTENSITY_LOW_EXPOSURE = 0.25  # seuil « à l'écart du trafic » pour pct_low_air_exposure

# --- Vent : durée AFFICHÉE uniquement ---------------------------------------
# Ces facteurs n'entrent PAS dans `_edge_cost` ni dans la dichotomie sur
# `max_time_min` (routing.py, `get_optimal_routes`). Trois raisons, toutes
# vérifiables dans le code :
#   - la dichotomie décide de l'EXISTENCE de la variante « Compromis » : un vent
#     qui tourne la ferait apparaître et disparaître entre deux requêtes
#     identiques, et `alpha_final` dériverait toutes les dix minutes sans qu'aucune
#     entrée utilisateur n'ait changé ;
#   - la clé du cache d'itinéraires ne contient pas le vent : un utilisateur
#     récupérerait un trajet mis en cache dont la durée a été calculée sous le vent
#     d'il y a trois heures ;
#   - c'est une prévision sur un instantané de dix minutes, appliquée à un trajet
#     qui part maintenant. La laisser décider de l'itinéraire, c'est laisser une
#     panne de source changer ce que l'utilisateur reçoit.
# Le vent est donc appliqué après le cache, dans `routers/route.py`, sur une durée
# `duration_wind` posée À CÔTÉ de `duration`, jamais à sa place.
WIND_HEADWIND_SPEED_FACTOR = 0.09   # -9 % de vitesse par 10 km/h de vent de face
WIND_CROSSWIND_SPEED_FACTOR = 0.02  # latéral : gêne et déport, pas frein
WIND_SPEED_FLOOR = 0.55             # même dans 60 km/h de face, on avance
WIND_SPEED_CEIL = 1.15              # le vent arrière ne fait pas voler
WIND_MIN_SPEED_KMH = 12.0           # en deçà, terme inactif : c'est dans le bruit
# Demi-angle du secteur « de face » pour le COMPTAGE de la part du trajet.
# La pénalité de vitesse, elle, reste continue en cos/sin : c'est bien un
# ralentissement progressif. Mais annoncer « vent de face » demande un seuil, et
# le retenir dès que la composante est positive ferait qualifier de face un vent
# à 89° du cap, c'est-à-dire un pur travers. ±45° est la convention usuelle
# (face / travers / dos en trois secteurs égaux).
WIND_HEADWIND_SECTOR_DEG = 45.0
# Part de la distance en vent de face au-delà de laquelle ça vaut d'être signalé.
WIND_HEADWIND_REPORT_PCT = 40.0

# --- Ponts verglaçants -------------------------------------------------------
# Un tablier de pont perd sa chaleur par ses deux faces : il rayonne vers le ciel
# et se refroidit par convection en dessous, sans l'inertie du sol qui protège une
# chaussée ordinaire. D'où 1 à 3 °C de moins et un passage sous zéro une à deux
# heures plus tôt — le panneau « bridge ices before road » n'est pas une légende.
# S'y ajoutent l'exposition au vent et un tablier béton/acier peu isolant.
#
# On INFORME, on ne fait pas dévier : un relevé par agglomération n'a pas la
# finesse pour arbitrer un itinéraire, et `_edge_cost` reste intouché.
ICE_BRIDGE_TEMP_C = 3.0
# En deçà, un `bridge=yes` est un ponceau au-dessus d'un fossé : aucune inertie
# thermique différente du sol. Sans ce filtre, on crierait au verglas sur 4 m de
# dalle et l'avertissement perdrait tout crédit.
BRIDGE_MIN_LENGTH_M = 30.0

SURFACE_ROUGHNESS = {
    'asphalt': 0.0, 'concrete': 0.05, 'concrete:plates': 0.1, 'paved': 0.05,
    'metal': 0.1, 'wood': 0.2,
    'paving_stones': 0.2, 'compacted': 0.35, 'fine_gravel': 0.35,
    'sett': 0.5, 'gravel': 0.6, 'unpaved': 0.5, 'pebblestone': 0.6,
    'cobblestone': 0.75, 'unhewn_cobblestone': 0.85,
    'ground': 0.7, 'dirt': 0.7, 'earth': 0.7, 'grass': 0.85,
    'sand': 1.0, 'mud': 1.0,
}
SMOOTHNESS_ROUGHNESS = {
    'excellent': 0.0, 'good': 0.1, 'intermediate': 0.3, 'bad': 0.6,
    'very_bad': 0.8, 'horrible': 0.9, 'very_horrible': 1.0, 'impassable': 1.0,
}
TRACKTYPE_ROUGHNESS = {
    'grade1': 0.2, 'grade2': 0.4, 'grade3': 0.6, 'grade4': 0.8, 'grade5': 1.0,
}
DEFAULT_ROUGHNESS = 0.05

BIKE_SURFACE_SENSITIVITY = {'route': 14.0, 'standard': 4.0, 'vtt': 0.5}
BIKE_SURFACE_SPEED_FACTOR = {'route': 0.6, 'standard': 0.35, 'vtt': 0.1}
DEFAULT_SURFACE_SENSITIVITY = 4.0
DEFAULT_SURFACE_SPEED_FACTOR = 0.35
ELECTRIC_SURFACE_SENSITIVITY = 3.0
ELECTRIC_SURFACE_SPEED_FACTOR = 0.25

PEDESTRIAN_SHARED_HIGHWAYS = ('footway', 'pedestrian')
FOOTWAY_SPEED_FACTOR = 0.6

BIKE_FOOTWAY_AVOIDANCE = {'route': 1.5, 'standard': 0.2, 'vtt': 0.1}
DEFAULT_FOOTWAY_AVOIDANCE = 0.2
ELECTRIC_FOOTWAY_AVOIDANCE = 0.4

SEGREGATED_BONUS = 1.5          # segregated=yes : piste séparée des piétons
BICYCLE_DESIGNATED_BONUS = 1.0  # bicycle=designated : voie pensée pour le vélo
BICYCLE_DISMOUNT_PENALTY = 4.0  # bicycle=dismount : pied à terre obligatoire
NARROW_WIDTH_M = 2.5            # largeur (m) en deçà de laquelle on pénalise
NARROW_WIDTH_PENALTY = 1.0
MULTILANE_LANES = 3            # nb de voies à partir duquel on pénalise
MULTILANE_PENALTY = 1.0
CONTRAFLOW_PENALTY = 0.5        # léger malus de confort pour un contre-sens

# --- Itinéraires cyclables balisés (relations OSM `route=bicycle`) -----------
# Une relation porte ce qu'aucun tag de voie ne dit : la continuité de l'axe et
# son jalonnement. Deux niveaux, cf. `graph.veloroutes`.

# Itinéraires écartés : non praticables aujourd'hui.
VELOROUTE_EXCLUDED_STATES = frozenset({
    'proposed', 'construction', 'planned', 'abandoned', 'temporary',
})

# Niveau 2 — axes cyclables structurants. Le classement s'appuie sur
# `cycle_network` AVANT `network`, car la hiérarchie administrative des réseaux
# ne dit rien de la qualité de l'axe et s'inverse d'un pays à l'autre : le ReVE
# bordelais est tagué `network=lcn`, tandis qu'en Belgique `rcn` désigne le
# réseau points-nœuds, récréatif et très dense. Le nom du réseau, lui, est
# fiable.
VELOROUTE_STRUCTURING_CYCLE_NETWORKS = frozenset({
    'ReVE',                  # Réseau Express Vélo, Bordeaux Métropole
    'BE-VLG:cycle_highway',  # fietssnelwegen flamandes
    'BE:RAVeL',              # RAVeL wallon
    'FR:REV Vélo+',          # REV, métropole lilloise
})
# Repli par motif pour les variantes régionales non énumérées
# (BE-WAL:cycle_highway, NL:*:cycle_highway…). Comparaison SENSIBLE À LA CASSE :
# ce sont des noms propres, et une correspondance insensible produirait des faux
# positifs sur des réseaux sans rapport.
VELOROUTE_STRUCTURING_MARKERS = ('cycle_highway', 'RAVeL', 'ReVE', 'REV Vélo')
# EuroVelo et véloroutes nationales (V80, V41…) : structurantes par nature.
VELOROUTE_STRUCTURING_NETWORKS = frozenset({'icn', 'ncn'})

VELOROUTE_TIER_STRUCTURING = 2
VELOROUTE_TIER_SIGNED = 1       # tout autre réseau balisé actif (rcn, lcn…)

# Bonus de score, du même ordre que SEGREGATED_BONUS. Plafonné à 10 dans
# `_edge_quality` : donc sans effet sur une voie déjà notée au maximum, et
# maximal là où les tags de voie sont pauvres (véloroute passant en rue
# résidentielle ou sur un chemin) — exactement là où la relation informe.
VELOROUTE_SCORE_BONUS = {VELOROUTE_TIER_SIGNED: 0.5, VELOROUTE_TIER_STRUCTURING: 1.5}

# Rabais multiplicatif sur le coût de l'arête, modulé par (1 - alpha) : nul sur
# l'itinéraire « Rapide », plein sur « Sécurisé ». Récompense la CONTINUITÉ d'un
# axe balisé même entre deux aménagements également bien notés — ce que le bonus
# de score, plafonné, ne peut pas faire. Volontairement faible : à 8 %, aucun
# détour de plus de ~9 % ne peut être justifié par ce seul terme.
VELOROUTE_DISCOUNT = {VELOROUTE_TIER_SIGNED: 0.03, VELOROUTE_TIER_STRUCTURING: 0.08}
# Doit rester égal au maximum de VELOROUTE_DISCOUNT : l'heuristique d'A* est
# dégonflée d'autant pour rester admissible (cf. `routing._astar_nodes`).
VELOROUTE_MAX_DISCOUNT = 0.08

# Distance (m) au-delà de laquelle un point n'est plus considéré comme desservi par le graphe chargé
MAX_SNAP_DISTANCE_M = 1000.0
