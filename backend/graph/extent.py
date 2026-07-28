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
