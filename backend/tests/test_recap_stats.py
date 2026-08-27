"""Mise en forme des chiffres d'un récapitulatif.

Les cas vérifiés ici sont ceux qui produiraient un e-mail gênant plutôt qu'une
erreur : « 1 trajets », « +4200 % », ou un dénivelé de zéro mètre annoncé sur des
trajets dont l'altitude n'a jamais été mesurée.
"""

from recap.stats import formate_distance, formate_duree, resume


def _brut(**kw):
    base = {
        "trajets": 10, "km": 50.0, "minutes": 180.0,
        "denivele": 200.0, "trajets_avec_denivele": 10,
        "km_precedent": 40.0, "plus_long_km": 12.0,
        "trajets_surs": 3, "trajets_pluie": 1,
    }
    base.update(kw)
    return base


def test_formate_duree():
    assert formate_duree(0) == "0 min"
    assert formate_duree(45) == "45 min"
    assert formate_duree(59.6) == "1 h"
    assert formate_duree(120) == "2 h"
    assert formate_duree(125) == "2 h 05"
    assert formate_duree(750) == "12 h 30"


def test_formate_distance():
    assert formate_distance(0) == "0 km"
    assert formate_distance(7.25) == "7.2 km"
    assert formate_distance(123.4) == "123 km"


def test_singulier_et_pluriel():
    assert resume(_brut(trajets=1), [], "juin")["phrase_trajets"] == "1 trajet"
    assert resume(_brut(trajets=2), [], "juin")["phrase_trajets"] == "2 trajets"


def test_pas_de_comparaison_sans_periode_precedente():
    """Un premier mois d'utilisation n'affiche pas une progression infinie."""
    assert resume(_brut(km_precedent=0), [], "juin")["comparaison"] is None
    assert resume(_brut(km_precedent=0.3), [], "juin")["comparaison"] is None


def test_comparaison_a_la_hausse_et_a_la_baisse():
    assert "de plus" in resume(_brut(km=80.0, km_precedent=40.0), [], "juin")["comparaison"]
    assert "de moins" in resume(_brut(km=20.0, km_precedent=40.0), [], "juin")["comparaison"]


def test_un_ecart_negligeable_n_est_pas_presente_comme_une_progression():
    phrase = resume(_brut(km=41.0, km_precedent=40.0), [], "juin")["comparaison"]
    assert "autant" in phrase


def test_la_tuile_denivele_disparait_quand_rien_n_est_mesure():
    """Ne jamais annoncer « 0 m » là où la base ne sait pas."""
    stats = resume(_brut(denivele=0.0, trajets_avec_denivele=0), [], "juin")
    assert [t["libelle"] for t in stats["tuiles"]] == ["Trajets", "Distance", "Temps estimé"]


def test_la_tuile_denivele_apparait_quand_il_est_mesure():
    stats = resume(_brut(denivele=412.0, trajets_avec_denivele=12), [], "juin")
    assert {"libelle": "Dénivelé", "valeur": "412 m"} in stats["tuiles"]


def test_aucun_badge_ne_leve_pas():
    stats = resume(_brut(), [], "juin")
    assert stats["badges"] == []


def test_les_badges_sont_repris():
    stats = resume(_brut(), [{"name": "10 itinéraires", "description": "Terminer 10 trajets."}], "juin")
    assert stats["badges"][0]["nom"] == "10 itinéraires"


def test_valeurs_nulles_tolerees():
    """Un `COALESCE` oublié en base ne doit pas faire exploser le rendu."""
    stats = resume(
        {"trajets": None, "km": None, "minutes": None, "denivele": None,
         "trajets_avec_denivele": None, "km_precedent": None, "plus_long_km": None},
        [], "juin",
    )
    assert stats["trajets"] == 0
    assert stats["comparaison"] is None
    assert stats["trajet_le_plus_long"] is None
