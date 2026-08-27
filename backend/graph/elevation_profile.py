"""Dénivelé d'un profil d'altitudes, isolé de toute dépendance.

Ce module ne connaît ni le graphe, ni la base, ni la configuration : il ne
manipule qu'une liste de nombres. C'est délibéré, et c'est ce qui lui donne ses
deux propriétés utiles.

D'abord il est **testable** : `backend/tests/` interdit d'importer `main`, la
base ou le graphe (cf. son README), or `graph/statistique.py` tire `graph.config`,
`astral` et `pytz` derrière lui. Un fichier sans import est un fichier qu'on peut
vérifier.

Ensuite il est **partageable** : le calcul du dénivelé a deux sources d'altitudes
qui doivent impérativement donner le même résultat — les nœuds du graphe pendant
un calcul d'itinéraire, et le tracé `routes.path` déjà en base quand on reprend
l'historique. Une seule définition ici, deux façades ailleurs, aucun risque de
voir l'application afficher un chiffre et l'e-mail récapitulatif en afficher un
autre pour le même trajet.
"""


def gain_perte(altitudes, window_size: int = 7, threshold: float = 0.15) -> tuple[float, float]:
    """Dénivelé positif et négatif d'un profil, en mètres.

    Les altitudes brutes sont d'abord lissées par moyenne mobile : les relevés
    radar portent le bruit des arbres, des toits et des erreurs métriques, et une
    somme naïve des écarts transformerait ce bruit en centaines de mètres de
    dénivelé imaginaire. `threshold` écarte ensuite les micro-variations qui
    survivent au lissage.

    :param altitudes: profil, dans l'ordre du parcours. Les `NaN` reprennent la
        valeur précédente — une altitude manquante n'est pas une descente.
    :param window_size: largeur de la fenêtre de lissage, en points.
    :param threshold: variation minimale retenue, en mètres.
    """
    profil = []
    for alt in altitudes:
        # `alt != alt` teste NaN sans importer `math` : le module reste sans dépendance.
        if alt is None or alt != alt:
            profil.append(profil[-1] if profil else 0.0)
        else:
            profil.append(float(alt))

    if len(profil) < 2:
        return 0.0, 0.0

    lissees = []
    for i in range(len(profil)):
        debut = max(0, i - window_size // 2)
        fin = min(len(profil), i + window_size // 2 + 1)
        lissees.append(sum(profil[debut:fin]) / (fin - debut))

    gain = 0.0
    perte = 0.0
    for i in range(len(lissees) - 1):
        diff = lissees[i + 1] - lissees[i]
        if diff > threshold:
            gain += diff
        elif diff < -threshold:
            perte += abs(diff)

    return round(gain, 1), round(perte, 1)


def altitudes_depuis_path(path) -> list[float]:
    """Reconstitue le profil par nœud à partir d'un tracé `routes.path`.

    `extract_route_geometry` répète l'altitude du nœud amont pour *chaque* point
    de la géométrie d'une arête : `path` est un escalier dont la longueur des
    paliers suit la densité du tracé OSM, pas le relief. Le passer tel quel dans
    `gain_perte` ferait porter la fenêtre de lissage sur des points parfois
    distants de quelques mètres, et produirait une valeur sans rapport avec celle
    calculée sur les nœuds.

    Réduire chaque palier à un point restitue la séquence d'origine. Deux nœuds
    voisins d'altitude rigoureusement identique fusionnent au passage : la
    séquence raccourcit d'autant et le lissage porte un peu plus loin, ce qui
    sous-estime légèrement le dénivelé. On préfère cette erreur-là à son inverse.
    """
    altitudes = []
    for point in path or []:
        if not isinstance(point, (list, tuple)) or len(point) < 3:
            continue
        alt = point[2]
        if alt is None or alt != alt:
            continue
        alt = float(alt)
        if not altitudes or alt != altitudes[-1]:
            altitudes.append(alt)
    return altitudes
