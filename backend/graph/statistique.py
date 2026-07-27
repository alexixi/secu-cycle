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
)

# Repli lorsqu'aucun centre de graphe n'est connu (place de la Bourse, Bordeaux).
BORDEAUX_LAT, BORDEAUX_LON = 44.8378, -0.5792

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
    """
    Calcule le dénivelé en appliquant d'abord un lissage (Moyenne Mobile)
    pour effacer le "bruit" du radar (arbres, toits, erreurs de 1m).
    """
    altitudes = []
    for node in route:
        alt = G.nodes[node].get('elevation', 0.0)
        if not math.isnan(alt):
            altitudes.append(alt)
        else:
            altitudes.append(altitudes[-1] if altitudes else 0.0)

    if len(altitudes) < 2:
        return 0.0, 0.0

    altitudes_lissees = []
    for i in range(len(altitudes)):
        debut = max(0, i - window_size // 2)
        fin = min(len(altitudes), i + window_size // 2 + 1)

        moyenne = sum(altitudes[debut:fin]) / (fin - debut)
        altitudes_lissees.append(moyenne)

    elevation_gain = 0.0
    elevation_loss = 0.0

    for i in range(len(altitudes_lissees) - 1):
        diff = altitudes_lissees[i+1] - altitudes_lissees[i]

        if diff > threshold:
            elevation_gain += diff
        elif diff < -threshold:
            elevation_loss += abs(diff)

    return round(elevation_gain, 1), round(elevation_loss, 1)


def calculate_exact_travel_time(G, route_nodes, bike_type, is_electric, cyclist_level):
    total_time_min = 0.0

    idx = 1 if is_electric else BIKE_TYPE_INDEX.get(bike_type.lower(), 0)
    multiplier = 1.0 if is_electric else LEVEL_MULTIPLIER.get(cyclist_level.lower(), 1.0)
    surface_factor = (ELECTRIC_SURFACE_SPEED_FACTOR if is_electric
                      else BIKE_SURFACE_SPEED_FACTOR.get(bike_type.lower(), DEFAULT_SURFACE_SPEED_FACTOR))
    for i in range(len(route_nodes) - 1):
        u, v = route_nodes[i], route_nodes[i + 1]
        edge_data = G.get_edge_data(u, v)

        if edge_data:
            data = edge_data[0] if 0 in edge_data else edge_data

            length_m = float(data.get('length', 1.0))
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

            speed_m_min = (speed_kmh * 1000) / 60

            total_time_min += (length_m / speed_m_min)

    return total_time_min

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
    lat, lon = graph_center(G)
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

def graph_center(G):
    """Centre (lat, lon) du graphe, calculé une fois puis mémorisé sur `G`.

    Sert à situer correctement le calcul lever/coucher du soleil : un graphe
    couvrant Tournai ou Strasbourg n'a pas les mêmes heures de nuit que Bordeaux.
    """
    center = G.graph.get('_center')
    if center is not None:
        return center
    ys = [d['y'] for _, d in G.nodes(data=True) if 'y' in d]
    xs = [d['x'] for _, d in G.nodes(data=True) if 'x' in d]
    center = (sum(ys) / len(ys), sum(xs) / len(xs)) if xs and ys else (BORDEAUX_LAT, BORDEAUX_LON)
    G.graph['_center'] = center
    return center


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

    # L'air a-t-il réellement pesé sur ce calcul ? Vrai seulement quand l'indice
    # régional est dégradé (intensité > 0). Sinon le terme d'exposition est inactif
    # et on ne met pas en avant un critère qui n'a rien orienté (comme l'éclairage
    # de jour). Lue sur le graphe, tenue à jour par la tâche de fond air_quality.
    air_aware = float(G.graph.get('_air_intensity', 0.0)) > 0.0

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
                "pct_low_air_exposure": 0.0, "air_aware": air_aware,
                "accidents_count": 0, "pct_accident_free": 100.0}

    return {
        "pct_cyclable": round(cyclable_length / total_length * 100, 1),
        "pct_low_speed": round(low_speed_length / total_length * 100, 1),
        "pct_lit": round(lit_length / total_length * 100, 1),
        "pct_smooth": round(smooth_length / total_length * 100, 1),
        "pct_contraflow": round(contraflow_length / total_length * 100, 1),
        "pct_low_air_exposure": round(low_air_exposure_length / total_length * 100, 1),
        "air_aware": air_aware,
        **route_accident_stats(G, route),
    }
