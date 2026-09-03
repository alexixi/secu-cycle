"""Règles de déclenchement des récapitulatifs.

Ces règles décident qu'un e-mail part vers de vraies personnes. Une erreur ici ne
lève aucune exception : elle envoie deux récapitulatifs le 1ᵉʳ janvier, ou un
bilan de juin au milieu de septembre. D'où ce fichier.
"""

from datetime import datetime

from recap.periodes import (
    ANNUEL,
    MENSUEL,
    libelle_periode,
    libelle_periode_precedente,
    periode_due,
)


def test_rien_avant_huit_heures_le_premier():
    """Une réception nocturne est un signal de spam."""
    assert periode_due(datetime(2026, 8, 1, 7, 59)) is None


def test_le_premier_a_huit_heures_declenche_le_mensuel():
    genre, debut, fin, precedent = periode_due(datetime(2026, 8, 1, 8, 0))
    assert genre == MENSUEL
    assert (debut.year, debut.month, debut.day) == (2026, 7, 1)
    assert (fin.year, fin.month, fin.day) == (2026, 8, 1)
    assert (precedent.year, precedent.month) == (2026, 6)


def test_la_fenetre_reste_ouverte_cinq_jours():
    """Un serveur redémarré le 5 doit encore rattraper sa campagne."""
    assert periode_due(datetime(2026, 8, 5, 23, 30)) is not None


def test_la_fenetre_se_referme_apres():
    """Passé le 5, on ne rattrape plus : pas de campagne périmée au redémarrage."""
    assert periode_due(datetime(2026, 8, 6, 0, 1)) is None
    assert periode_due(datetime(2026, 8, 20, 12, 0)) is None


def test_les_jours_2_a_5_n_attendent_pas_huit_heures():
    """La contrainte horaire ne vaut que pour le premier jour de la fenêtre."""
    assert periode_due(datetime(2026, 8, 3, 2, 0)) is not None


def test_janvier_donne_l_annuel_et_pas_le_mensuel():
    """Le bilan annuel remplace décembre : jamais deux e-mails le même matin."""
    genre, debut, fin, precedent = periode_due(datetime(2027, 1, 1, 9, 0))
    assert genre == ANNUEL
    assert (debut.year, debut.month, debut.day) == (2026, 1, 1)
    assert (fin.year, fin.month, fin.day) == (2027, 1, 1)
    assert precedent.year == 2025


def test_passage_d_annee_en_fevrier():
    """En février, la période précédente est janvier, et la comparaison décembre."""
    genre, debut, fin, precedent = periode_due(datetime(2026, 2, 2, 9, 0))
    assert genre == MENSUEL
    assert (debut.year, debut.month) == (2026, 1)
    assert (precedent.year, precedent.month) == (2025, 12)


def test_mars_couvre_fevrier_bissextile():
    """Les bornes sont des mois, pas des durées : février dure ce qu'il dure."""
    _, debut, fin, _ = periode_due(datetime(2028, 3, 1, 9, 0))
    assert (debut.year, debut.month, debut.day) == (2028, 2, 1)
    assert (fin.year, fin.month, fin.day) == (2028, 3, 1)
    assert (fin - debut).days == 29


def test_les_bornes_sont_a_minuit_local():
    """Le mois commence à minuit à Paris, pas à minuit UTC.

    Sans cela, chaque récapitulatif d'été inclurait les deux dernières heures du
    mois précédent et manquerait les deux dernières du sien.
    """
    for instant in (datetime(2026, 4, 1, 9, 0), datetime(2026, 11, 1, 9, 0)):
        _, debut, fin, _ = periode_due(instant)
        assert (debut.hour, debut.minute) == (0, 0)
        assert (fin.hour, fin.minute) == (0, 0)


def test_la_periode_traverse_le_changement_d_heure():
    """Mars dure une heure de moins qu'un mois de 31 jours : c'est voulu.

    Comparer des `datetime` localisés est correct ; c'est raisonner en « 31 × 24 h »
    qui produirait un décalage d'une heure aux bornes.
    """
    _, debut, fin, _ = periode_due(datetime(2026, 4, 1, 9, 0))
    assert (fin - debut).total_seconds() == 31 * 24 * 3600 - 3600


def test_un_instant_localise_est_ramene_a_paris():
    """La boucle de fond peut fournir un instant aware : il doit être converti."""
    import pytz

    minuit_utc = pytz.utc.localize(datetime(2026, 8, 1, 6, 30))  # 8 h 30 à Paris
    assert periode_due(minuit_utc) is not None

    trop_tot_utc = pytz.utc.localize(datetime(2026, 8, 1, 4, 30))  # 6 h 30 à Paris
    assert periode_due(trop_tot_utc) is None


def test_libelles():
    _, debut, _, precedent = periode_due(datetime(2026, 8, 1, 9, 0))
    assert libelle_periode(MENSUEL, debut) == "juillet 2026"
    assert libelle_periode_precedente(MENSUEL, precedent) == "juin"

    _, debut_annuel, _, precedent_annuel = periode_due(datetime(2027, 1, 2, 9, 0))
    assert libelle_periode(ANNUEL, debut_annuel) == "2026"
    assert libelle_periode_precedente(ANNUEL, precedent_annuel) == "2025"


def test_libelles_en_anglais():
    """Le mois vient du catalogue : jamais de la locale du conteneur."""
    _, debut, _, precedent = periode_due(datetime(2026, 8, 1, 9, 0))
    assert libelle_periode(MENSUEL, debut, "en") == "July 2026"
    assert libelle_periode_precedente(MENSUEL, precedent, "en") == "June"

    # Une année n'a pas de mot à traduire : les deux langues l'écrivent pareil.
    _, debut_annuel, _, _ = periode_due(datetime(2027, 1, 2, 9, 0))
    assert libelle_periode(ANNUEL, debut_annuel, "en") == "2026"
