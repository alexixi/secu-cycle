"""Dénivelé d'un profil d'altitudes.

`graph.elevation_profile` est délibérément sans dépendance : ces tests peuvent
donc l'importer directement, sans graphe ni base, comme l'exige le README de ce
répertoire.

Ce qui est vérifié ici n'est pas décoratif. Le dénivelé a deux sources
d'altitudes — les nœuds du graphe pendant un calcul, et le tracé `routes.path`
quand on reprend l'historique — et rien, à l'exécution, ne signalerait qu'elles
ont divergé : l'application afficherait un chiffre, l'e-mail récapitulatif un
autre, sans la moindre erreur. Le dernier test de ce fichier est celui qui
prévient ce silence-là.
"""

import pytest

from graph.elevation_profile import altitudes_depuis_path, gain_perte


def test_profil_plat():
    assert gain_perte([12.0] * 20) == (0.0, 0.0)


def test_profil_vide_ou_unique():
    assert gain_perte([]) == (0.0, 0.0)
    assert gain_perte([42.0]) == (0.0, 0.0)


def test_montee_reguliere():
    gain, perte = gain_perte([float(i) for i in range(30)])
    assert gain > 0
    assert perte == 0.0


def test_descente_reguliere():
    gain, perte = gain_perte([float(30 - i) for i in range(30)])
    assert gain == 0.0
    assert perte > 0


def test_aller_retour_symetrique():
    """Monter puis redescendre d'autant : gain et perte se répondent."""
    montee = [float(i) for i in range(20)]
    profil = montee + montee[::-1]
    gain, perte = gain_perte(profil)
    assert gain == pytest.approx(perte, abs=0.2)


def test_le_bruit_metrique_est_lisse():
    """Le relevé radar oscille sur les toits et les arbres.

    Sans lissage, cette alternance produirait des dizaines de mètres de dénivelé
    imaginaire sur un terrain rigoureusement plat.
    """
    profil = [10.0 + (0.4 if i % 2 else -0.4) for i in range(60)]
    gain, perte = gain_perte(profil)
    assert gain < 1.0
    assert perte < 1.0


def test_altitude_manquante_ne_cree_pas_de_descente():
    """Un `NaN` reprend la valeur précédente : une mesure absente n'est pas un trou."""
    nan = float("nan")
    assert gain_perte([10.0, nan, nan, 10.0] * 8) == (0.0, 0.0)
    assert gain_perte([None, None, 10.0, 10.0]) == (0.0, 0.0)


def test_path_reduit_les_paliers():
    """`extract_route_geometry` répète l'altitude du nœud amont sur toute l'arête."""
    path = [
        [44.8, -0.5, 10.0], [44.8, -0.5, 10.0], [44.8, -0.5, 10.0],
        [44.9, -0.6, 14.0], [44.9, -0.6, 14.0],
        [45.0, -0.7, 11.0],
    ]
    assert altitudes_depuis_path(path) == [10.0, 14.0, 11.0]


def test_path_tolere_les_points_incomplets():
    """Un tracé sans altitude ne doit pas faire échouer la reprise de l'historique."""
    assert altitudes_depuis_path(None) == []
    assert altitudes_depuis_path([]) == []
    assert altitudes_depuis_path([[44.8, -0.5], "cassé", None]) == []
    assert altitudes_depuis_path([[44.8, -0.5, float("nan")], [44.8, -0.5, 7.0]]) == [7.0]


def test_le_path_redonne_le_profil_des_noeuds():
    """Le test qui garantit que l'app et l'e-mail annoncent le même dénivelé.

    On part d'un profil par nœud, on le densifie exactement comme le fait
    `extract_route_geometry` (altitude du nœud amont répétée sur chaque point de
    la géométrie de l'arête), puis on vérifie que la reprise le reconstitue.

    Le profil est choisi sans deux altitudes voisines égales : c'est la seule
    configuration où la réduction des paliers fusionne deux nœuds distincts, une
    perte assumée et documentée dans `altitudes_depuis_path`.
    """
    noeuds = [10.0, 13.5, 17.2, 16.0, 21.4, 25.9, 24.1, 19.8, 15.3, 12.7]

    path = []
    for i, altitude in enumerate(noeuds[:-1]):
        # Densité volontairement irrégulière : c'est le cas réel, la géométrie OSM
        # n'a aucune raison d'être uniforme d'une arête à l'autre.
        for _ in range(1 + i % 4):
            path.append([44.8, -0.5, altitude])
    path.append([44.8, -0.5, noeuds[-1]])

    assert altitudes_depuis_path(path) == noeuds
    assert gain_perte(altitudes_depuis_path(path)) == gain_perte(noeuds)
