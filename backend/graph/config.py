SCORE_HIGHWAY = {
    'cycleway': 10,
    'pedestrian': 9,
    'footway': 9,
    'living_street': 8,
    'residential': 8,
    'path': 7,
    'bridleway': 7,
    'track': 6,
    'service': 5,
    'unclassified': 4,
    'tertiary': 3,
    'tertiary_link': 3,
    'secondary': 2,
    'secondary_link': 2,
    'busway': 2,
    'primary': 5,
    'primary_link': 5,
    'trunk': 5,
    'trunk_link': 5
}

SCORE_CYCLEWAY = {
    'track': 5, 'separate': 5, 'shared_busway': 4, 'lane': 3, 'shared_lane': 2, 'none': 1
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
    "ville":    0,
    "vtt":      2,
    "route":    3,
}

LEVEL_MULTIPLIER = {
    "debutant": 0.8,
    "intermediaire": 1.0,
    "experimente": 1.3
}

ELEVATION_WEIGHT_BY_LEVEL = {
    "debutant": 0.6,
    "intermediaire": 0.4,
    "experimente": 0.1
}

REPORT_PENALTIES = {
    'accident': 20.0,
    'danger': 10.0,
    'travaux': 8.0,
    'obstacle': 6.0,
    'default': 5.0
}
