"""Gabarit du récapitulatif d'activité.

`mailer.templates` n'importe que `html.escape` : ces tests le rendent donc sans
base, sans réseau et sans variable d'environnement — c'est aussi ce qui permet à
`make mail` de fonctionner à sec.

Deux propriétés se dégradent en silence et méritent d'être verrouillées : la
présence du lien de désabonnement (son absence transforme un désabonnement en
signalement de spam) et l'échappement du prénom, premier contenu utilisateur libre
injecté dans un e-mail du projet.
"""

from mailer.templates import (
    recap_email,
    unsubscribe_confirm_page,
    unsubscribe_done_page,
    unsubscribe_invalid_page,
)

LIEN = "https://api.secu-cycle.fr/recaps/unsubscribe?u=42&t=jeton"


def _stats(**kw):
    base = {
        "trajets": 12,
        "phrase_trajets": "12 trajets",
        "tuiles": [
            {"libelle": "Trajets", "valeur": "12"},
            {"libelle": "Distance", "valeur": "84 km"},
            {"libelle": "Temps estimé", "valeur": "5 h 10"},
        ],
        "comparaison": "Soit 40 % de plus qu'en juin.",
        "badges": [{"nom": "10 itinéraires", "description": "Terminer 10 trajets."}],
        "trajet_le_plus_long": "14.8 km",
        "trajets_surs": 5,
        "trajets_pluie": 2,
    }
    base.update(kw)
    return base


def test_le_lien_de_desabonnement_est_dans_les_deux_versions():
    """Le bouton natif du client mail ne suffit pas : tous ne l'affichent pas."""
    _, html, texte = recap_email("monthly", "juillet 2026", "Alexis", _stats(), LIEN)
    assert "recaps/unsubscribe" in html
    assert LIEN in texte


def test_le_prenom_est_echappe():
    """Premier contenu utilisateur libre dans un e-mail : il n'est validé qu'en longueur."""
    _, html, _ = recap_email("monthly", "juillet 2026", "<script>alert(1)</script>", _stats(), LIEN)
    assert "<script>" not in html
    assert "&lt;script&gt;" in html


def test_sans_prenom_la_salutation_reste_correcte():
    _, html, texte = recap_email("monthly", "juillet 2026", None, _stats(), LIEN)
    assert "Bonjour," in html
    assert "Bonjour," in texte


def test_le_genre_change_l_objet_et_le_titre():
    mensuel, html_m, _ = recap_email("monthly", "juillet 2026", None, _stats(), LIEN)
    annuel, html_a, _ = recap_email("yearly", "2026", None, _stats(), LIEN)
    assert mensuel != annuel
    assert "mois" in mensuel
    assert "année" in annuel
    assert "Votre année 2026" in html_a


def test_sans_badge_aucune_section_vide():
    """Un mois sans badge ne doit pas afficher un cadre vide."""
    _, html, texte = recap_email("monthly", "juillet 2026", None, _stats(badges=[]), LIEN)
    assert "nouveaux badges" not in html
    assert "Nouveau badge" not in html
    assert "Badges débloqués" not in texte


def test_un_seul_badge_est_au_singulier():
    _, html, _ = recap_email("monthly", "juillet 2026", None, _stats(), LIEN)
    assert "Nouveau badge" in html


def test_sans_comparaison_la_phrase_disparait():
    _, html, texte = recap_email("monthly", "juillet 2026", None, _stats(comparaison=None), LIEN)
    assert "de plus qu'en" not in html
    assert "de plus qu'en" not in texte


def test_le_cas_le_plus_sobre_ne_leve_pas():
    """Un trajet, aucun badge, aucune comparaison : le mail doit rester lisible."""
    minimal = {
        "trajets": 1,
        "phrase_trajets": "1 trajet",
        "tuiles": [{"libelle": "Trajets", "valeur": "1"}],
        "comparaison": None,
        "badges": [],
        "trajet_le_plus_long": None,
        "trajets_surs": 0,
        "trajets_pluie": 0,
    }
    objet, html, texte = recap_email("monthly", "juillet 2026", None, minimal, LIEN)
    assert objet and html and texte
    assert "1 trajet" in texte


def test_la_grille_est_un_tableau():
    """Outlook ignore flex et grid : les tuiles s'empileraient les unes sous les autres."""
    _, html, _ = recap_email("monthly", "juillet 2026", None, _stats(), LIEN)
    assert "<table" in html
    assert "display: flex" not in html
    assert "display:flex" not in html


def test_la_duree_est_annoncee_comme_estimee():
    """`duration_min` n'est pas chronométré : ne pas laisser croire le contraire."""
    _, html, texte = recap_email("monthly", "juillet 2026", None, _stats(), LIEN)
    assert "estim" in html
    assert "estim" in texte


def test_la_page_de_confirmation_poste():
    """Le GET ne doit rien changer : c'est le formulaire qui agit."""
    page = unsubscribe_confirm_page("https://api.secu-cycle.fr/recaps/unsubscribe?u=42&t=j")
    assert 'method="post"' in page
    assert "<form" in page
    # L'esperluette de l'URL doit être échappée dans l'attribut HTML.
    assert "&amp;t=j" in page


def test_les_pages_de_desabonnement_se_rendent():
    assert "plus de récapitulatif" in unsubscribe_done_page()
    assert "n'est plus valide" in unsubscribe_invalid_page()


def test_la_page_d_echec_ne_pretend_pas_avoir_reussi():
    """Un lien tronqué qui afficherait « c'est fait » serait le pire des cas."""
    page = unsubscribe_invalid_page()
    assert "C'est fait" not in page
    assert "contact@secu-cycle.fr" in page
