"""Emprise géographique du graphe chargé, et pays qu'il couvre.

Deux questions reviennent dès qu'on branche une source de données extérieure sur
le graphe : « où faut-il interroger ? » (l'emprise) et « quelle source est
compétente ici ? » (les pays). Le géocodage se les posait déjà ; le trafic se les
pose à son tour. Elles vivent donc ici, à côté du graphe, plutôt que dans l'un des
deux consommateurs.

**L'emprise est plurielle.** Un profil peut couvrir plusieurs villes éloignées
(Bordeaux et Tournai, à 600 km) : leur boîte englobante commune est alors un
rectangle qui avale la moitié de la France, et toute source interrogée dessus
répond à côté — grille de qualité de l'air étalée sur des départements vides,
sources trafic d'autres métropoles réveillées, stations de vélos parisiennes
affichées à Bordeaux. `graph_zones()` rend donc **une emprise par groupe de nœuds
disjoint**, et c'est la seule emprise que ce module expose : il n'y a pas de
boîte englobante globale, parce qu'aucun appelant n'en veut vraiment une.

**Une emprise ne dit pas où mesurer.** Une source ponctuelle — la météo — a
besoin de coordonnées, et le centre du rectangle n'en est pas une bonne : ce
n'est ni le centre de gravité du réseau, ni un endroit où l'on roule. Sur le
profil Bordeaux + Tournai, il laisse le nœud médian à 10 km du point qui est
censé le décrire. `sample_points()` répond à cette seconde question en plaçant un
petit nombre de points **là où il y a du réseau**.
"""

import math


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

DEFAULT_COUNTRY = "fr"


def countries_of(communes) -> list[str]:
    """Codes pays ISO du profil, déduits du suffixe des communes.

    « Tournai, Belgium » → be. Un suffixe inconnu est ignoré ; si aucun n'est
    reconnu, on retombe sur le pays historique.
    """
    codes = []
    for commune in communes or []:
        suffix = str(commune).rsplit(",", 1)[-1].strip().lower()
        code = COUNTRY_SUFFIXES.get(suffix)
        if code and code not in codes:
            codes.append(code)
    return codes or [DEFAULT_COUNTRY]


# Maille du regroupement des nœuds en zones. Deux cellules voisines (voisinage 8)
# appartiennent à la même zone : à 0,1° (~8 à 11 km), les communes d'une même
# agglomération fusionnent toujours, deux villes distantes jamais.
ZONE_CELL_DEG = 0.1


def graph_zones(G) -> list[tuple[float, float, float, float]]:
    """Emprises (w, s, e, n) des groupes de nœuds disjoints, calculées une fois.

    Un profil peut couvrir plusieurs villes sans continuité entre elles — le
    graphe l'assume déjà (`graph_manager.keep_strong_components`). Leur boîte
    englobante commune, elle, ne veut rien dire : pour « Bordeaux + Tournai »,
    c'est un rectangle de 600 km de côté dont l'immense majorité n'est couverte
    par rien. Toute source interrogée sur ce rectangle répond à côté.

    Les zones sont triées par nombre de nœuds décroissant : la première est la
    zone principale du profil, ce qui donne un repli naturel là où une source ne
    peut recevoir qu'un seul point (biais de proximité, par exemple).

    Le regroupement passe par une grille plutôt que par les composantes connexes
    du graphe : c'est un seul passage sur les nœuds, indépendant de la topologie
    (deux quartiers d'une même ville sans lien routier fort restent une zone), et
    ça marche sur les fichiers `.graphml` existants sans régénération.
    """
    cached = G.graph.get("_zones")
    if cached is not None:
        return cached

    step = ZONE_CELL_DEG
    cells: dict[tuple[int, int], list] = {}
    for _, data in G.nodes(data=True):
        x, y = data.get("x"), data.get("y")
        if x is None or y is None:
            continue
        key = (math.floor(x / step), math.floor(y / step))
        cell = cells.get(key)
        if cell is None:
            cells[key] = [x, y, x, y, 1]
        else:
            if x < cell[0]:
                cell[0] = x
            if y < cell[1]:
                cell[1] = y
            if x > cell[2]:
                cell[2] = x
            if y > cell[3]:
                cell[3] = y
            cell[4] += 1

    if not cells:
        return []

    # Composantes connexes des cellules occupées, en voisinage 8.
    unvisited = set(cells)
    grouped = []
    while unvisited:
        seed = unvisited.pop()
        w, s, e, n, nodes = cells[seed]
        stack = [seed]
        while stack:
            ix, iy = stack.pop()
            for dx in (-1, 0, 1):
                for dy in (-1, 0, 1):
                    neighbour = (ix + dx, iy + dy)
                    if neighbour not in unvisited:
                        continue
                    unvisited.discard(neighbour)
                    stack.append(neighbour)
                    cw, cs, ce, cn, cn_nodes = cells[neighbour]
                    w, s = min(w, cw), min(s, cs)
                    e, n = max(e, ce), max(n, cn)
                    nodes += cn_nodes
        grouped.append((nodes, (w, s, e, n)))

    grouped.sort(key=lambda item: item[0], reverse=True)
    zones = [bbox for _, bbox in grouped]
    G.graph["_zones"] = zones
    return zones


# Zones de l'emprise de données, gardées d'un appel à l'autre : la boucle des
# vélos en libre-service bat toutes les quelques dizaines de secondes, et le
# calcul demande une lecture en base par commune.
_data_zones_cache: dict = {"communes": None, "zones": None}


def data_zones() -> list[tuple[float, float, float, float]]:
    """Emprises (w, s, e, n) de l'emprise **de données**, dans le même format
    que `graph_zones()`.

    Pendant de `graph_zones()` pour les couches qui n'ont pas besoin du graphe.
    Une carte de stations n'a besoin que de savoir *où regarder* ; seul le
    calcul d'itinéraire a besoin du réseau lui-même. Dériver ces zones des
    communes plutôt que des nœuds permet donc de couvrir des villes que le
    graphe n'embarque pas — il doit tenir en RAM, pas elles.

    Les contours viennent du cache `commune_geometries` (`graph.communes`), donc
    sans réseau une fois les communes validées. **Bloquant** malgré tout :
    appeler via `asyncio.to_thread` depuis l'event loop.

    Les zones sont triées par surface décroissante, pour offrir le même repli
    « zone principale d'abord » que `graph_zones()`.
    """
    from shapely.geometry import shape
    from shapely.ops import unary_union

    from database import SessionLocal
    from graph.communes import CommuneNotFound, geometry_of
    from graph.graph_manager import load_data_profile

    profile = load_data_profile(announce=False)
    communes = profile["communes"]

    if _data_zones_cache["communes"] == communes:
        return _data_zones_cache["zones"]

    db = SessionLocal()
    try:
        geometries = []
        for name in communes:
            try:
                geometries.append(shape(geometry_of(db, name)))
            except CommuneNotFound as exc:
                print(f"[emprise-données] {exc}", flush=True)
    finally:
        db.close()

    if not geometries:
        # Ne rien renvoyer plutôt qu'une emprise fausse : les consommateurs
        # traitent la liste vide comme « aucune couverture » et se désactivent,
        # ce qui vaut mieux que d'afficher les stations d'une autre ville.
        print("[emprise-données] aucun contour de commune obtenu : emprise vide.",
              flush=True)
        _data_zones_cache.update({"communes": communes, "zones": []})
        return []

    merged = unary_union(geometries)
    parts = list(merged.geoms) if merged.geom_type == "MultiPolygon" else [merged]
    parts.sort(key=lambda part: part.area, reverse=True)
    zones = [tuple(part.bounds) for part in parts]

    print(f"[emprise-données] {len(communes)} commune(s) en {len(zones)} zone(s).",
          flush=True)
    _data_zones_cache.update({"communes": communes, "zones": zones})
    return zones


def bbox_clause(latitude, longitude, zones):
    """Clause SQLAlchemy « ce point tombe dans l'une de ces emprises ».

    Sert aux purges de synchro : quand une emprise n'a pas pu être rafraîchie
    (Overpass indisponible sur cette zone-là), il faut restreindre la purge aux
    zones réellement à jour, faute de quoi une seule requête en échec effacerait
    les données d'une ville entière.

    Rend `False` sur une liste vide — aucune ligne ne correspond, plutôt que
    toutes.
    """
    from sqlalchemy import and_, false, or_

    if not zones:
        return false()

    return or_(*[
        and_(longitude >= w, longitude <= e, latitude >= s, latitude <= n)
        for w, s, e, n in zones
    ])


def overlaps(a, b) -> bool:
    """Les deux emprises (w, s, e, n) se croisent-elles ?

    C'est le portillon des sources extérieures : une source de portée
    métropolitaine ne doit pas être interrogée pour un graphe situé à l'autre
    bout du pays, même s'ils partagent un code pays.
    """
    return not (a[2] < b[0] or b[2] < a[0] or a[3] < b[1] or b[3] < a[1])


def overlaps_any(zones, coverage) -> bool:
    """Cette couverture croise-t-elle au moins une zone du graphe ?"""
    return any(overlaps(zone, coverage) for zone in zones)


def contains(zone, lat: float, lon: float) -> bool:
    """Le point tombe-t-il dans cette emprise (w, s, e, n) ?"""
    w, s, e, n = zone
    return w <= lon <= e and s <= lat <= n


def contains_any(zones, lat: float, lon: float) -> bool:
    """Le point tombe-t-il dans au moins une zone du graphe ?"""
    return any(contains(zone, lat, lon) for zone in zones)


def zone_center(zone) -> tuple[float, float]:
    """Centre d'une emprise, en (lat, lon) — l'ordre attendu par les providers."""
    w, s, e, n = zone
    return ((s + n) / 2, (w + e) / 2)


EARTH_RADIUS_KM = 6371.0


def distance_km(a: tuple[float, float], b: tuple[float, float]) -> float:
    """Distance entre deux (lat, lon), en kilomètres.

    Approximation équirectangulaire plutôt que haversine : en dessous de 100 km
    l'écart est de l'ordre du mètre, et cette fonction est appelée des centaines
    de milliers de fois au placement des points de mesure.
    """
    lat1, lon1 = a
    lat2, lon2 = b
    x = math.radians(lon2 - lon1) * math.cos(math.radians((lat1 + lat2) / 2))
    y = math.radians(lat2 - lat1)
    return EARTH_RADIUS_KM * math.hypot(x, y)


def _distance_deg(zone, lat: float, lon: float) -> float:
    """Distance approchée du point au rectangle, en degrés (0 s'il est dedans).

    L'écart en longitude est ramené à l'échelle des latitudes : sans cette
    correction, deux zones à même distance réelle ne seraient pas départagées de
    la même façon selon leur orientation.
    """
    w, s, e, n = zone
    dlon = max(w - lon, 0.0, lon - e) * math.cos(math.radians(lat))
    dlat = max(s - lat, 0.0, lat - n)
    return math.hypot(dlon, dlat)


def zone_of(G, lat: float, lon: float) -> int | None:
    """Index de la zone où tombe le point, ou de la plus proche à défaut.

    On ne renvoie jamais « aucune » sur un graphe non vide : un point accroché au
    réseau peut tomber juste hors du rectangle de sa zone (le rectangle enserre
    les nœuds, pas la voirie), et il doit malgré tout hériter du soleil et de la
    qualité de l'air de sa ville.
    """
    zones = graph_zones(G)
    if not zones:
        return None
    for index, zone in enumerate(zones):
        if contains(zone, lat, lon):
            return index
    return min(range(len(zones)), key=lambda i: _distance_deg(zones[i], lat, lon))


# --- Points de mesure --------------------------------------------------------
# Maille des cellules candidates. Ce n'est pas la résolution du résultat : c'est
# la finesse avec laquelle on décrit la densité du réseau avant d'y placer les
# points. 0,02° ≈ 1,6 km, soit largement plus fin que l'écart minimal qu'on
# s'autorise entre deux points de mesure.
SAMPLE_CELL_DEG = 0.02

# Plafond de cellules candidates, prises parmi les plus peuplées. Le placement
# est en O(candidats × K²) : sans ce plafond, une emprise régionale ferait
# dériver le temps de démarrage. La coupe est sans effet visible — les cellules
# écartées sont celles où presque personne ne roule.
MAX_SAMPLE_CANDIDATES = 2000


def _sample_cells(G) -> list[tuple[int, float, float]]:
    """Cellules occupées, en (nombre de nœuds, lat, lon) du **centroïde réel**.

    Le centroïde et non le centre de maille : c'est exactement l'erreur que fait
    `zone_center` à l'échelle de la zone, il n'y a pas de raison de la refaire à
    l'échelle de la cellule.
    """
    step = SAMPLE_CELL_DEG
    cells: dict[tuple[int, int], list] = {}
    for _, data in G.nodes(data=True):
        x, y = data.get("x"), data.get("y")
        if x is None or y is None:
            continue
        key = (math.floor(x / step), math.floor(y / step))
        cell = cells.get(key)
        if cell is None:
            cells[key] = [1, y, x]
        else:
            cell[0] += 1
            cell[1] += y
            cell[2] += x

    candidates = [(n, slat / n, slon / n) for n, slat, slon in cells.values()]
    # Tri complet (poids, puis coordonnées) et non par poids seul : à poids égal,
    # départager par l'ordre d'itération du dictionnaire rendrait la coupe
    # dépendante de l'ordre des nœuds dans le fichier.
    candidates.sort(key=lambda c: (-c[0], c[1], c[2]))
    return candidates[:MAX_SAMPLE_CANDIDATES]


def _seed(candidates, max_points: int, min_spacing_km: float) -> list[tuple[float, float]]:
    """Amorçage glouton : k-means++ dont on prend le maximum au lieu de tirer.

    À chaque tour on retient la cellule qui maximise `n × d²` — `d` étant sa
    distance au point déjà retenu le plus proche. Le produit arbitre le seul
    compromis qui compte : une cellule très peuplée mais déjà décrite par un
    point voisin ne vaut rien, une cellule isolée mais vide non plus.

    Deux arrêts. Le plafond `max_points` est budgétaire ; l'écart minimal est
    météorologique — en dessous, deux points décrivent la même averse et le
    second ne fait que consommer du quota.
    """
    points = [candidates[0][1:]]
    while len(points) < max_points:
        best, best_distance, best_score = None, 0.0, -1.0
        for n, lat, lon in candidates:
            distance = min(distance_km((lat, lon), p) for p in points)
            score = n * distance * distance
            if score > best_score:
                best, best_distance, best_score = (lat, lon), distance, score
        if best is None or best_score <= 0 or best_distance < min_spacing_km:
            break
        points.append(best)
    return points


def _lloyd(candidates, points, rounds: int = 30) -> tuple[list, list[int]]:
    """Raffinement de Lloyd, pondéré. Rend les points recentrés et leur poids.

    L'amorçage place les points sur des cellules existantes ; les recentrer sur
    le barycentre de ce qu'ils décrivent gagne un demi-kilomètre au p95. La
    convergence est atteinte en quelques tours, le plafond n'est qu'un garde-fou.
    """
    weights = [0] * len(points)
    for _ in range(rounds):
        sums = [[0, 0.0, 0.0] for _ in points]
        for n, lat, lon in candidates:
            nearest = min(range(len(points)),
                          key=lambda i: distance_km((lat, lon), points[i]))
            sums[nearest][0] += n
            sums[nearest][1] += n * lat
            sums[nearest][2] += n * lon

        moved = False
        for i, (n, sum_lat, sum_lon) in enumerate(sums):
            weights[i] = n
            if not n:
                continue
            centroid = (sum_lat / n, sum_lon / n)
            if distance_km(centroid, points[i]) > 0.01:
                moved = True
            points[i] = centroid
        if not moved:
            break
    return points, weights


def sample_points(G, max_points: int = 24,
                  min_spacing_km: float = 4.0) -> list[tuple[float, float, int]]:
    """(lat, lon, index de zone) des points où interroger une source ponctuelle.

    Les points sont placés par densité de nœuds, pas par géométrie : c'est là où
    l'on roule qu'il faut savoir s'il pleut. Leur **nombre s'adapte au profil** —
    trois pour Bruxelles, vingt-quatre pour Bordeaux + Tournai — entre les deux
    bornes passées par l'appelant, sans réglage manuel par profil.

    Le placement est entièrement déterministe (aucun tirage aléatoire) : deux
    démarrages doivent rendre les mêmes coordonnées, sans quoi l'empreinte servie
    par la couche météo changerait sans qu'aucune donnée n'ait bougé.

    L'ordre est significatif : `[0]` est le point le plus dense de la zone
    principale. C'est ce qui permet à un appelant de garder un « résumé global »
    ayant le même sens qu'avec un seul point par zone.
    """
    key = (max_points, min_spacing_km)
    cached = G.graph.get("_sample_points")
    if cached is not None and cached[0] == key:
        return cached[1]

    zones = graph_zones(G)
    candidates = _sample_cells(G) if zones else []
    if not candidates:
        return []

    points, weights = _lloyd(candidates, _seed(candidates, max(1, max_points), min_spacing_km))

    placed = [(lat, lon, zone_of(G, lat, lon), weight)
              for (lat, lon), weight in zip(points, weights)]
    # Zone croissante puis poids décroissant : `[0]` tombe dans la zone
    # principale (les zones sont déjà triées par nombre de nœuds) et y désigne le
    # point le plus dense. Les coordonnées départagent les ex æquo.
    placed.sort(key=lambda p: (p[2], -p[3], p[0], p[1]))

    out = [(lat, lon, index) for lat, lon, index, _ in placed]
    G.graph["_sample_points"] = (key, out)
    return out
