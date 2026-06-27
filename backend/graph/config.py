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

DEFAULT_LIT_SCORE_BY_HIGHWAY = {
    'residential': 0.9, 'primary': 0.9, 'secondary': 0.9, 'tertiary': 0.9,
    'living_street': 0.9, 'pedestrian': 0.9,
    'cycleway': 0.7,
    'path': 0.2, 'track': 0.2, 'footway': 0.2
}

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

ELEVATION_DIVISOR = 30.0
DEFAULT_SAFETY_PENALTY = 30.0
TRAFFIC_BASE_PENALTY = 50.0
TRAFFIC_SAFETY_FACTOR = 250.0

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

SEGREGATED_BONUS = 1.5          # segregated=yes : piste séparée des piétons
BICYCLE_DESIGNATED_BONUS = 1.0  # bicycle=designated : voie pensée pour le vélo
BICYCLE_DISMOUNT_PENALTY = 4.0  # bicycle=dismount : pied à terre obligatoire
NARROW_WIDTH_M = 2.5            # largeur (m) en deçà de laquelle on pénalise
NARROW_WIDTH_PENALTY = 1.0
MULTILANE_LANES = 3            # nb de voies à partir duquel on pénalise
MULTILANE_PENALTY = 1.0
CONTRAFLOW_PENALTY = 0.5        # léger malus de confort pour un contre-sens
