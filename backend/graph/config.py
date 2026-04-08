SCORE_HIGHWAY = {
    'cycleway': 10, 'footway': 9, 'residential': 8, 'path': 7,
    'living_street': 6, 'service': 5, 'unclassified': 4,
    'tertiary': 3, 'secondary': 2, 'primary': 1
}

SCORE_CYCLEWAY = {
    'track': 5, 'separate': 5, 'shared_busway': 4, 'lane': 3, 'shared_lane': 2, 'none': 1
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
    "sportif": 1.3
}

ELEVATION_WEIGHT_BY_LEVEL = {
    "debutant": 0,
    "intermediaire": 00,
    "sportif": 0
}

REPORT_PENALTIES = {
    'accident': 20.0, 
    'danger': 10.0,   
    'travaux': 8.0,   
    'Obstacle': 6.0,   
    'default': 5.0 
}