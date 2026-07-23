"""Emprise géographique du graphe chargé, et pays qu'il couvre.

Deux questions reviennent dès qu'on branche une source de données extérieure sur
le graphe : « où faut-il interroger ? » (l'emprise) et « quelle source est
compétente ici ? » (les pays). Le géocodage se les posait déjà ; le trafic se les
pose à son tour. Elles vivent donc ici, à côté du graphe, plutôt que dans l'un des
deux consommateurs.
"""


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


def graph_bbox(G) -> tuple[float, float, float, float] | None:
    """Emprise (w, s, e, n) des nœuds du graphe, calculée une fois puis mémorisée."""
    cached = G.graph.get("_geocode_bbox")
    if cached is not None:
        return cached

    xs = [d["x"] for _, d in G.nodes(data=True) if "x" in d]
    ys = [d["y"] for _, d in G.nodes(data=True) if "y" in d]
    if not xs or not ys:
        return None

    bbox = (min(xs), min(ys), max(xs), max(ys))
    G.graph["_geocode_bbox"] = bbox
    return bbox


def graph_center(G) -> tuple[float, float] | None:
    """Centre de l'emprise, en (lat, lon), pour biaiser les recherches."""
    bbox = graph_bbox(G)
    if bbox is None:
        return None
    w, s, e, n = bbox
    return ((s + n) / 2, (w + e) / 2)
