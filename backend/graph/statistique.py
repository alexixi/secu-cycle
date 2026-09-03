import math
import re
from datetime import date as _date, datetime
from functools import lru_cache
from astral import LocationInfo
from astral.sun import sun
import pytz
from graph.config import (
    SPEED_BY_INFRASTRUCTURE, DEFAULT_SPEED, BIKE_TYPE_INDEX, LEVEL_MULTIPLIER,
    DEFAULT_ROUGHNESS, BIKE_SURFACE_SPEED_FACTOR, DEFAULT_SURFACE_SPEED_FACTOR,
    ELECTRIC_SURFACE_SPEED_FACTOR,
    PEDESTRIAN_SHARED_HIGHWAYS, FOOTWAY_SPEED_FACTOR,
    NIGHT_EXTINCTION_WINDOW,
    DEFAULT_AIR_EXPOSURE, AIR_INTENSITY_LOW_EXPOSURE,
    WIND_HEADWIND_SPEED_FACTOR, WIND_CROSSWIND_SPEED_FACTOR,
    WIND_SPEED_FLOOR, WIND_SPEED_CEIL, WIND_MIN_SPEED_KMH,
    WIND_HEADWIND_SECTOR_DEG, BRIDGE_MIN_LENGTH_M,
)
from graph.extent import graph_zones, zone_center, zone_of
from graph.elevation_profile import gain_perte

# Repli lorsqu'aucun centre de graphe n'est connu (place de la Bourse, Bordeaux).
BORDEAUX_LAT, BORDEAUX_LON = 44.8378, -0.5792

# Seuil de comptage du vent de face, dérivé une fois du demi-angle du secteur.
_HEADWIND_COS = math.cos(math.radians(WIND_HEADWIND_SECTOR_DEG))

def calculer_statistiques_osm(G):
    """
    Calcule le pourcentage de complétion des données brutes d'OpenStreetMap
    et la répartition des types de routes (highway).
    """
    total_edges = 0
    compteur_lit = 0
    compteur_maxspeed = 0
    compteur_surface = 0
    compteur_smoothness = 0
    compteur_tracktype = 0
    compteur_bicycle = 0
    compteur_contraflow = 0

    highway_counts = {}

    for u, v, k, data in G.edges(keys=True, data=True):
        total_edges += 1

        if 'lit' in data and data['lit'] not in ['unknown', 'none', '']:
            compteur_lit += 1

        if 'maxspeed' in data and data['maxspeed'] not in ['unknown', 'none', '']:
            compteur_maxspeed += 1

        if 'surface' in data:
            compteur_surface += 1
        if 'smoothness' in data:
            compteur_smoothness += 1
        if 'tracktype' in data:
            compteur_tracktype += 1
        if 'bicycle' in data:
            compteur_bicycle += 1
        if data.get('contraflow'):
            compteur_contraflow += 1

        h_type = data.get('highway', 'unknown')
        if isinstance(h_type, list):
            h_type = h_type[0]

        highway_counts[h_type] = highway_counts.get(h_type, 0) + 1

    pct = lambda c: (c / total_edges) * 100 if total_edges > 0 else 0
    pct_lit = pct(compteur_lit)
    pct_maxspeed = pct(compteur_maxspeed)
    pct_surface = pct(compteur_surface)

    print("\n" + "="*50)
    print("STATISTIQUES DES DONNÉES BRUTES OSM")
    print("="*50)
    print(f"Nombre total de segments : {total_edges}")
    print(f"Vitesse (maxspeed) renseignée : {compteur_maxspeed} ({pct_maxspeed:.1f}%)")
    print(f"Éclairage (lit) renseigné     : {compteur_lit} ({pct_lit:.1f}%)")
    print(f"Surface renseignée           : {compteur_surface} ({pct_surface:.1f}%)")
    print(f"Smoothness renseignée        : {compteur_smoothness} ({pct(compteur_smoothness):.1f}%)")
    print(f"Tracktype renseigné          : {compteur_tracktype} ({pct(compteur_tracktype):.1f}%)")
    print(f"Tag bicycle renseigné        : {compteur_bicycle} ({pct(compteur_bicycle):.1f}%)")
    print(f"Arêtes contre-sens cyclable  : {compteur_contraflow} ({pct(compteur_contraflow):.1f}%)\n")

    print("RÉPARTITION DES TYPES DE ROUTES (HIGHWAY)")
    print("-" * 50)

    highways_tries = sorted(highway_counts.items(), key=lambda x: x[1], reverse=True)

    for h_type, count in highways_tries:
        pct = (count / total_edges) * 100
        print(f" - {h_type:<15} : {count:>5} segments ({pct:.1f}%)")

    print("="*50 + "\n")

    return {
        "total": total_edges,
        "pct_lit": pct_lit,
        "pct_maxspeed": pct_maxspeed,
        "highway_counts": highway_counts
    }

def analyser_qualite_trajet(G, route, nom_trajet="Trajet"):
    """Analyse les types de routes et vitesses empruntés par un itinéraire."""
    from routing import _parse_maxspeed
    vitesses = []
    scores = []

    for i in range(len(route) - 1):
        u, v = route[i], route[i + 1]
        edge_data = G.get_edge_data(u, v)
        if edge_data:
            data = edge_data[0] if isinstance(edge_data, dict) and 0 in edge_data else edge_data

            h_type = data.get('highway', 'unknown')
            if isinstance(h_type, list): h_type = h_type[0]
            vmax = _parse_maxspeed(data.get('maxspeed', None), h_type)

            vitesses.append(vmax)
            scores.append(data.get('safety_score', 0))

    vitesse_moyenne_axes = sum(vitesses) / len(vitesses) if vitesses else 0
    score_moyen = sum(scores) / len(scores) if scores else 0
    pct_zone30 = sum(1 for v in vitesses if v <= 30) / len(vitesses) * 100 if vitesses else 0

    print(f"\nANALYSE : {nom_trajet}")
    print(f" - Note de sécurité moyenne : {score_moyen:.2f}/10")
    print(f" - Vitesse moyenne des axes empruntés : {vitesse_moyenne_axes:.1f} km/h")
    print(f" - % du trajet en zone apaisée (<= 30 km/h) : {pct_zone30:.1f} %")

def calculate_route_elevation(G, route, window_size=7, threshold=0.15):
    """Dénivelé (positif, négatif) d'un trajet, en mètres.

    Façade côté graphe : elle ne fait qu'aller chercher les altitudes des nœuds.
    Le calcul lui-même vit dans `graph/elevation_profile.py`, qui n'a aucune
    dépendance — il est ainsi testable, et partagé avec la reprise de l'historique
    qui part du tracé `routes.path` au lieu des nœuds.
    """
    altitudes = [G.nodes[node].get('elevation', 0.0) for node in route]
    return gain_perte(altitudes, window_size, threshold)


def _speed_settings(bike_type, is_electric, cyclist_level):
    """(indice de vitesse, multiplicateur de niveau, sensibilité au revêtement)."""
    idx = 1 if is_electric else BIKE_TYPE_INDEX.get(bike_type.lower(), 0)
    multiplier = 1.0 if is_electric else LEVEL_MULTIPLIER.get(cyclist_level.lower(), 1.0)
    surface_factor = (ELECTRIC_SURFACE_SPEED_FACTOR if is_electric
                      else BIKE_SURFACE_SPEED_FACTOR.get(bike_type.lower(), DEFAULT_SURFACE_SPEED_FACTOR))
    return idx, multiplier, surface_factor


def _edge_speed_kmh(data, idx, multiplier, surface_factor):
    """Vitesse sur un segment : infrastructure × niveau × revêtement × piéton.

    Source unique de vérité des vitesses : `calculate_exact_travel_time` et
    `wind_adjusted_travel_time` l'appellent toutes deux, pour que la correction du
    vent s'applique exactement à la vitesse que l'on affiche par ailleurs.
    """
    cycleway = data.get("cycleway", "none")
    if isinstance(cycleway, list):
        cycleway = cycleway[0]

    speeds = SPEED_BY_INFRASTRUCTURE.get(cycleway, DEFAULT_SPEED)
    speed_kmh = speeds[idx] * multiplier
    roughness = float(data.get('_roughness', DEFAULT_ROUGHNESS))
    speed_kmh *= max(0.2, 1.0 - roughness * surface_factor)

    h_type = data.get('highway', 'unclassified')
    if isinstance(h_type, list):
        h_type = h_type[0]
    bicycle = data.get('bicycle')
    if isinstance(bicycle, list):
        bicycle = bicycle[0]
    if h_type in PEDESTRIAN_SHARED_HIGHWAYS and bicycle != 'designated':
        speed_kmh *= FOOTWAY_SPEED_FACTOR

    return speed_kmh


def calculate_exact_travel_time(G, route_nodes, bike_type, is_electric, cyclist_level):
    total_time_min = 0.0

    idx, multiplier, surface_factor = _speed_settings(bike_type, is_electric, cyclist_level)
    for i in range(len(route_nodes) - 1):
        u, v = route_nodes[i], route_nodes[i + 1]
        edge_data = G.get_edge_data(u, v)

        if edge_data:
            data = edge_data[0] if 0 in edge_data else edge_data

            length_m = float(data.get('length', 1.0))
            speed_kmh = _edge_speed_kmh(data, idx, multiplier, surface_factor)
            speed_m_min = (speed_kmh * 1000) / 60

            total_time_min += (length_m / speed_m_min)

    return total_time_min


def wind_adjusted_travel_time(G, route_nodes, bike_type, is_electric, cyclist_level,
                              wind_speed_kmh, wind_from_deg):
    """(durée corrigée du vent en minutes, part de la distance en vent de face en %).

    `wind_from_deg` est la direction **d'où vient** le vent, convention Open-Meteo
    (`wind_direction_10m`) : 0° = vent de nord, soufflant vers le sud. L'erreur de
    180° est le piège classique de ce calcul — vérification : un cycliste cap
    ouest (b = 270) sous un vent d'ouest (wind_from_deg = 270) a `cos(0) = 1`,
    donc vent de face plein, ce qui est bien le résultat attendu.

    Le résultat ne sert qu'à l'AFFICHAGE : il est posé à côté de `duration`, après
    le cache d'itinéraires, et n'entre jamais dans le coût de routage (voir la
    justification détaillée dans `graph/config.py`, section vent).

    Les parts sont pondérées par la longueur et non par le nombre d'arêtes : un
    itinéraire découpé en micro-segments dans un giratoire ferait autrement peser
    le giratoire autant que la ligne droite qui y mène.
    """
    # Import local : `graph.guidance` importe `graph.statistique`, un import
    # module-level serait circulaire. Même précédent que `graph.accidents`
    # plus bas dans ce fichier.
    from graph.guidance import get_bearing

    nominal = calculate_exact_travel_time(G, route_nodes, bike_type, is_electric, cyclist_level)
    if wind_speed_kmh is None or wind_from_deg is None or wind_speed_kmh < WIND_MIN_SPEED_KMH:
        return nominal, 0.0

    idx, multiplier, surface_factor = _speed_settings(bike_type, is_electric, cyclist_level)
    total_time_min = 0.0
    headwind_m = 0.0
    total_m = 0.0

    for i in range(len(route_nodes) - 1):
        u, v = route_nodes[i], route_nodes[i + 1]
        edge_data = G.get_edge_data(u, v)
        if not edge_data:
            continue
        data = edge_data[0] if 0 in edge_data else edge_data

        length_m = float(data.get('length', 1.0))
        speed_kmh = _edge_speed_kmh(data, idx, multiplier, surface_factor)

        node_u, node_v = G.nodes[u], G.nodes[v]
        bearing = get_bearing(node_u['y'], node_u['x'], node_v['y'], node_v['x'])
        delta = math.radians(wind_from_deg - bearing)
        # Composante signée : positive quand on roule vers l'origine du vent.
        cos_delta = math.cos(delta)
        head = wind_speed_kmh * cos_delta
        cross = wind_speed_kmh * abs(math.sin(delta))

        factor = 1.0 - (WIND_HEADWIND_SPEED_FACTOR * head / 10.0) \
                     - (WIND_CROSSWIND_SPEED_FACTOR * cross / 10.0)
        factor = max(WIND_SPEED_FLOOR, min(WIND_SPEED_CEIL, factor))

        speed_m_min = (speed_kmh * factor * 1000) / 60
        total_time_min += length_m / speed_m_min

        total_m += length_m
        # Le ralentissement est continu, mais le COMPTAGE demande un secteur :
        # sinon un vent à 89° du cap — un pur travers — serait annoncé « de face ».
        if cos_delta > _HEADWIND_COS:
            headwind_m += length_m

    if not total_m:
        return nominal, 0.0
    return total_time_min, round(headwind_m / total_m * 100, 1)


def route_bridge_stats(G, route_nodes):
    """(nombre d'ouvrages, longueur cumulée en m, distance au premier en m).

    Ne comptabilise que les ponts d'au moins `BRIDGE_MIN_LENGTH_M` : un
    `bridge=yes` de quatre mètres au-dessus d'un fossé n'a pas l'inertie thermique
    d'un tablier, et l'inclure noierait l'avertissement de verglas sous du bruit.

    Les segments consécutifs portant `bridge` sont regroupés en un seul ouvrage :
    OSM découpe un viaduc à chaque changement d'attribut, et compter les segments
    annoncerait « 7 ponts » là où le cycliste n'en traverse qu'un.
    """
    bridges = []
    run_length = 0.0
    run_offset = None
    travelled = 0.0

    for i in range(len(route_nodes) - 1):
        u, v = route_nodes[i], route_nodes[i + 1]
        edge_data = G.get_edge_data(u, v)
        if not edge_data:
            continue
        data = edge_data[0] if 0 in edge_data else edge_data

        length_m = float(data.get('length', 1.0))
        bridge = data.get('bridge')
        if isinstance(bridge, list):
            bridge = bridge[0] if bridge else None
        on_bridge = bool(bridge) and str(bridge).lower() not in ('no', 'false')

        if on_bridge:
            if run_offset is None:
                run_offset = travelled
            run_length += length_m
        elif run_offset is not None:
            bridges.append((run_length, run_offset))
            run_length, run_offset = 0.0, None

        travelled += length_m

    if run_offset is not None:
        bridges.append((run_length, run_offset))

    long_enough = [b for b in bridges if b[0] >= BRIDGE_MIN_LENGTH_M]
    if not long_enough:
        return 0, 0.0, None
    return (
        len(long_enough),
        round(sum(length for length, _ in long_enough), 1),
        round(min(offset for _, offset in long_enough), 1),
    )

def calculate_route_distance(G, route):
    """Calcule la distance réelle d'un itinéraire."""
    distance = 0
    for i in range(len(route) - 1):
        u, v = route[i], route[i + 1]
        edge_data = G.get_edge_data(u, v)
        if edge_data:
            if isinstance(edge_data, dict) and 0 in edge_data:
                distance += float(edge_data[0].get('length', 0))
            else:
                distance += float(edge_data.get('length', 0))
    return distance/1000

def get_route_safety_score(G, route, bike_type=None, is_electric=False):
    """Note de sécurité d'un itinéraire (sur 10), pondérée par la longueur.

    Utilise le score précalculé correspondant à l'état d'éclairage courant
    (`_s_on`/`_s_off`) et applique un petit malus si le revêtement est inadapté
    au type de vélo (un vélo de route sur gravier voit sa note baisser).
    """
    lat, lon = node_zone_center(G, route[0]) if route else main_zone_center(G)
    now = datetime.now(pytz.timezone('Europe/Paris'))
    now_min = now.hour * 60 + now.minute
    is_dark = is_dark_now(now, lat, lon)
    ext_on = extinction_states(G, now_min)
    surface_factor = (ELECTRIC_SURFACE_SPEED_FACTOR if is_electric
                      else BIKE_SURFACE_SPEED_FACTOR.get((bike_type or 'standard').lower(),
                                                         DEFAULT_SURFACE_SPEED_FACTOR))

    total_len = 0.0
    weighted_score = 0.0
    weighted_rough = 0.0

    for i in range(len(route) - 1):
        u, v = route[i], route[i + 1]
        edge_data = G.get_edge_data(u, v)
        if not edge_data:
            continue
        data = edge_data[0] if isinstance(edge_data, dict) and 0 in edge_data else edge_data

        length = float(data.get('length', 0.0)) or 1.0
        score_key = '_s_on' if edge_use_on(data, is_dark, now_min, ext_on) else '_s_off'
        base = float(data.get(score_key, data.get('safety_score', 0.0)))
        weighted_score += base * length
        weighted_rough += float(data.get('_roughness', DEFAULT_ROUGHNESS)) * length
        total_len += length

    if total_len == 0:
        return 0.0

    score = weighted_score / total_len
    malus = (weighted_rough / total_len) * surface_factor * 5.0
    score = max(0.0, min(10.0, score - malus))
    return round(score, 2)

def extract_route_geometry(G, route_nodes):
    """
    Extrait les coordonnées exactes du trajet, y compris les courbes des routes.
    Retourne une liste de [lat, lon, elevation].
    """
    path_coords = []

    for i in range(len(route_nodes) - 1):
        u = route_nodes[i]
        v = route_nodes[i + 1]

        elev_u = G.nodes[u].get("elevation", 0.0)

        edge_data = G.get_edge_data(u, v)[0]

        if 'geometry' in edge_data:
            for lon, lat in edge_data['geometry'].coords:
                path_coords.append([lat, lon, elev_u])
        else:
            path_coords.append([G.nodes[u]['y'], G.nodes[u]['x'], elev_u])

    last_node = route_nodes[-1]
    elev_last = G.nodes[last_node].get("elevation", 0.0)
    path_coords.append([G.nodes[last_node]['y'], G.nodes[last_node]['x'], elev_last])

    return path_coords

def main_zone_center(G):
    """Centre (lat, lon) de la zone principale du graphe.

    Repli pour les calculs qui ne se rapportent à aucun point précis. Quand un
    point est disponible, c'est `zone_center_of` qu'il faut : un graphe couvrant
    Bordeaux et Tournai n'a pas les mêmes heures de nuit d'un bout à l'autre.
    """
    zones = graph_zones(G)
    return zone_center(zones[0]) if zones else (BORDEAUX_LAT, BORDEAUX_LON)


def zone_center_of(G, lat, lon):
    """Centre (lat, lon) de la zone où tombe le point — le lieu du calcul solaire.

    C'est le centre de la zone, et non le point lui-même : `_sun_times` mémorise
    par lieu arrondi au centième de degré, et une clé par kilomètre saturerait
    son cache pour un gain nul (à l'échelle d'une agglomération, le coucher du
    soleil ne bouge que de quelques minutes).
    """
    zones = graph_zones(G)
    if not zones:
        return BORDEAUX_LAT, BORDEAUX_LON
    return zone_center(zones[zone_of(G, lat, lon)])


def _node_latlon(G, node):
    """(lat, lon) d'un nœud du graphe, ou None si ses coordonnées manquent."""
    data = G.nodes[node]
    if 'y' not in data or 'x' not in data:
        return None
    return data['y'], data['x']


def node_zone_center(G, node):
    """Centre de la zone d'un nœud du graphe, avec repli si ses coordonnées manquent."""
    point = _node_latlon(G, node)
    return zone_center_of(G, *point) if point else main_zone_center(G)


def air_intensity_at(G, lat, lon):
    """Intensité du malus de pollution applicable au point, dans [0, 1].

    Par zone : un pic mesuré à Tournai ne doit pas alourdir un trajet bordelais.
    Repli sur la valeur globale tant que la tâche de fond `air_quality` n'a pas
    posé le détail par zone (premier démarrage, profil tout juste rechargé).
    """
    per_zone = G.graph.get('_air_zone_intensity')
    if per_zone:
        index = zone_of(G, lat, lon)
        if index is not None and index < len(per_zone):
            return float(per_zone[index])
    return float(G.graph.get('_air_intensity', 0.0))


def node_air_intensity(G, node):
    """Intensité du malus de pollution dans la zone d'un nœud du graphe."""
    point = _node_latlon(G, node)
    if point is None:
        return float(G.graph.get('_air_intensity', 0.0))
    return air_intensity_at(G, *point)


@lru_cache(maxsize=512)
def _sun_times(date_iso, lat, lon):
    """Lever/coucher du soleil, mémorisés par (jour, lieu arrondi).

    `astral` recalcule sinon la course du soleil à chaque requête d'itinéraire ;
    l'arrondi du lieu au centième de degré (~1 km) borne la taille du cache.
    """
    loc = LocationInfo("local", "", "Europe/Paris", lat, lon)
    return sun(loc.observer, date=_date.fromisoformat(date_iso), tzinfo=loc.timezone)


def get_lighting_condition(check_time=None, lat=None, lon=None):
    """
    Renvoie l'état de la luminosité et de l'éclairage public au lieu (lat, lon).
    Retourne : (is_dark_outside, is_public_lighting_on)

    `lat`/`lon` situent le calcul solaire (centre du graphe actif) ; à défaut, on
    retombe sur Bordeaux.
    """
    tz = pytz.timezone('Europe/Paris')
    if check_time is None:
        check_time = datetime.now(tz)
    elif check_time.tzinfo is None:
        check_time = tz.localize(check_time)

    if lat is None or lon is None:
        lat, lon = BORDEAUX_LAT, BORDEAUX_LON

    s = _sun_times(check_time.date().isoformat(), round(lat, 2), round(lon, 2))

    is_dark_outside = check_time < s['sunrise'] or check_time > s['sunset']

    if not is_dark_outside:
        return False, False

    start, end = NIGHT_EXTINCTION_WINDOW
    if start <= check_time.hour < end:
        return True, False

    return True, True


def is_dark_now(check_time=None, lat=None, lon=None):
    """Fait-il nuit (soleil couché) au lieu (lat, lon) à `check_time` ?"""
    tz = pytz.timezone('Europe/Paris')
    if check_time is None:
        check_time = datetime.now(tz)
    elif check_time.tzinfo is None:
        check_time = tz.localize(check_time)
    if lat is None or lon is None:
        lat, lon = BORDEAUX_LAT, BORDEAUX_LON
    s = _sun_times(check_time.date().isoformat(), round(lat, 2), round(lon, 2))
    return check_time < s['sunrise'] or check_time > s['sunset']


def _in_range(now_min, start_min, end_min):
    """`now_min` est-il dans [start, end[ (minutes), passage minuit géré ?"""
    if start_min <= end_min:
        return start_min <= now_min < end_min
    return now_min >= start_min or now_min < end_min


_LIT_RULE_RE = re.compile(r'^(yes|no)\s*@\s*(.+)$', re.I)
_LIT_TIME_RE = re.compile(r'(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})')
# Préfixe de jours couvrant TOUTE la semaine (qu'on peut ignorer sans risque).
_LIT_ALLDAYS_RE = re.compile(r'^\s*(?:Mo-Su|Mo-Sun|Monday-Sunday|24/7)\s*', re.I)


def parse_lit_conditional(value):
    """Parse un tag OSM `lit:conditional` en règles horaires exploitables.

    Renvoie une liste de `(on: bool, start_min: int, end_min: int)`, ou `None`
    si la valeur contient une condition qu'on ne sait pas lire de façon fiable
    (`sunset`/`sunrise`, jours partiels…). On préfère `None` (repli sur la
    fenêtre du profil) plutôt qu'une interprétation hasardeuse.

    Ex. : ``no @ (00:00-05:00)`` → ``[(False, 0, 300)]`` ;
    ``yes @ (05:00-22:00); no @ (22:00-24:00)`` → deux règles.
    """
    if isinstance(value, list):
        value = value[0] if value else None
    if not value:
        return None

    rules = []
    for part in str(value).split(';'):
        part = part.strip()
        if not part:
            continue
        m = _LIT_RULE_RE.match(part)
        if not m:
            return None
        on = m.group(1).lower() == 'yes'
        cond = m.group(2).strip().strip('()').strip()
        cond = _LIT_ALLDAYS_RE.sub('', cond).strip()
        tm = _LIT_TIME_RE.search(cond)
        # Toute lettre résiduelle (sunset, PH, jour partiel Mo-Fr…) => non fiable.
        if tm is None or any(c.isalpha() for c in cond):
            return None
        sh, sm, eh, em = (int(x) for x in tm.groups())
        start = sh * 60 + sm
        end = eh * 60 + em
        if end == 0:
            end = 24 * 60
        rules.append((on, start, end))
    return rules or None


def window_lights_on(now_min, window):
    """Les lampadaires sont-ils censés être ALLUMÉS à `now_min` selon la fenêtre
    d'extinction `window = (start_h, end_h)` (heures) ? Repli sur la constante
    globale si la fenêtre est absente ; `start == end` = pas d'extinction."""
    if not window or window[0] is None or window[1] is None:
        window = NIGHT_EXTINCTION_WINDOW
    start_h, end_h = window
    if start_h == end_h:
        return True
    return not _in_range(now_min, start_h * 60, end_h * 60)


def extinction_states(G, now_min):
    """Les lampadaires sont-ils allumés à `now_min`, commune par commune ?

    Renvoie la liste alignée sur `G.graph['_ext_windows']` : un booléen par
    commune du profil, **suivi de celui de la fenêtre par défaut**. Se calcule
    une fois par requête, puis se lit par arête via `_commune_idx` (l'indice
    `-1` des arêtes non rattachées tombe sur le défaut).
    """
    windows = G.graph.get('_ext_windows')
    if not windows:
        # Graphe chargé sans résolution (ancien cache, échec de lecture) : on
        # dimensionne quand même la liste sur les communes, pour qu'un
        # `_commune_idx` déjà posé reste un indice valide.
        default = window_lights_on(now_min, G.graph.get('_extinction_window'))
        return [default] * (len(G.graph.get('_communes') or []) + 1)
    return [window_lights_on(now_min, w) for w in windows]


def edge_use_on(data, is_dark, now_min, ext_on):
    """Faut-il créditer l'éclairage de CETTE arête maintenant (score `_s_on`) ?

    Faux de jour (aucun crédit d'éclairage). La nuit : suit l'horaire OSM
    `lit:conditional` de l'arête (`_lit_rules`) s'il est renseigné, sinon
    l'horaire de sa commune — `ext_on` est la liste renvoyée par
    `extinction_states`, indexée par `_commune_idx`."""
    if not is_dark:
        return False
    rules = data.get('_lit_rules')
    if rules is None:
        return ext_on[data.get('_commune_idx', -1)]
    state = bool(data.get('_lit_base', True))
    for on, s, e in rules:
        if _in_range(now_min, s, e):
            state = on
    return state


def calculate_infra_stats(G, route):
    total_length = 0.0
    cyclable_length = 0.0
    low_speed_length = 0.0
    lit_length = 0.0
    smooth_length = 0.0
    contraflow_length = 0.0
    low_air_exposure_length = 0.0
    veloroute_length = 0.0

    # L'air a-t-il réellement pesé sur ce calcul ? Vrai seulement quand l'indice
    # régional est dégradé (intensité > 0). Sinon le terme d'exposition est inactif
    # et on ne met pas en avant un critère qui n'a rien orienté (comme l'éclairage
    # de jour). Lue sur le graphe, tenue à jour par la tâche de fond air_quality,
    # et prise dans la zone de l'itinéraire — pas dans celle d'une autre ville.
    air_aware = node_air_intensity(G, route[0]) > 0.0 if route else False

    CYCLABLE_CYCLEWAYS = {'track', 'separate', 'lane', 'shared_busway',
                          'opposite_lane', 'opposite_track', 'opposite'}
    CYCLABLE_HIGHWAYS = {'cycleway', 'path'}

    for i in range(len(route) - 1):
        u, v = route[i], route[i + 1]
        edge_data = G.get_edge_data(u, v)
        if not edge_data:
            continue
        data = edge_data[0] if 0 in edge_data else edge_data

        length = float(data.get('length', 0.0))
        total_length += length

        cycleway = data.get('cycleway', 'none')
        if isinstance(cycleway, list):
            cycleway = cycleway[0]
        h_type = data.get('highway', 'unclassified')
        if isinstance(h_type, list):
            h_type = h_type[0]

        if cycleway in CYCLABLE_CYCLEWAYS or h_type in CYCLABLE_HIGHWAYS:
            cyclable_length += length

        if float(data.get('_roughness', DEFAULT_ROUGHNESS)) <= 0.2:
            smooth_length += length

        if data.get('contraflow'):
            contraflow_length += length

        if data.get('_veloroute'):
            veloroute_length += length

        try:
            vmax_raw = data.get('maxspeed', None)
            if vmax_raw and str(vmax_raw).lower() not in ('unknown', 'none', 'nan', ''):
                if isinstance(vmax_raw, list):
                    vmax_raw = vmax_raw[0]
                vmax = int(str(vmax_raw).split()[0])
            elif h_type in ('primary', 'primary_link', 'secondary', 'secondary_link'):
                vmax = 50
            else:
                vmax = 30
            if vmax <= 30:
                low_speed_length += length
        except (ValueError, AttributeError):
            low_speed_length += length

        # `pct_lit` ne reflète que du CONNU : voie tagguée `lit=yes` dans OSM ou
        # éclairée d'après les données spatiales (`_lit_inferred` : lampadaires
        # proches, ou voie éclairée que ce segment longe). Aucune estimation par
        # type de voie — on n'affiche pas une supposition comme une mesure.
        lit = data.get('lit', 'unknown')
        if lit == 'yes' or (lit != 'no' and data.get('_lit_inferred')):
            lit_length += length

        # Part du trajet à l'écart du trafic (faible exposition à la pollution de
        # proximité). Rend visible et mesurable l'effet du critère d'exposition.
        if float(data.get('_air_exposure', DEFAULT_AIR_EXPOSURE)) <= AIR_INTENSITY_LOW_EXPOSURE:
            low_air_exposure_length += length

    from graph.accidents import route_accident_stats

    if total_length == 0:
        return {"pct_cyclable": 0.0, "pct_low_speed": 0.0, "pct_lit": 0.0,
                "pct_smooth": 0.0, "pct_contraflow": 0.0,
                "pct_veloroute": 0.0,
                "pct_low_air_exposure": 0.0, "air_aware": air_aware,
                "accidents_count": 0, "pct_accident_free": 100.0}

    return {
        "pct_cyclable": round(cyclable_length / total_length * 100, 1),
        "pct_low_speed": round(low_speed_length / total_length * 100, 1),
        "pct_lit": round(lit_length / total_length * 100, 1),
        "pct_smooth": round(smooth_length / total_length * 100, 1),
        "pct_contraflow": round(contraflow_length / total_length * 100, 1),
        "pct_veloroute": round(veloroute_length / total_length * 100, 1),
        "pct_low_air_exposure": round(low_air_exposure_length / total_length * 100, 1),
        "air_aware": air_aware,
        **route_accident_stats(G, route),
    }
