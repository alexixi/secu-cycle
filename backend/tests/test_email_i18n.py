"""Traduction des e-mails : le filet contre la clé servie telle quelle.

`t()` ne lève jamais — c'est délibéré, une KeyError sur le chemin d'erreur
transformerait un 400 attendu en 500. La contrepartie est qu'une clé absente du
catalogue produit un e-mail contenant « email.recap.intro » en toutes lettres,
**et qu'il part quand même** : aucune exception, aucun code d'erreur, rien dans
les logs qu'un envoi réussi. C'est le seul mode de défaillance irréversible du
lot, et ce fichier est ce qui l'attrape.

Les gabarits sont donc rendus dans toutes les langues servies, et l'on vérifie
qu'aucune clé du catalogue n'affleure dans la sortie.
"""

import pytest

from i18n import SUPPORTED
from i18n.catalog import CATALOGS
from mailer.templates import (
    account_deleted_email,
    contact_email,
    email_change_alert_email,
    email_change_code_email,
    password_reset_email,
    recap_email,
    unsubscribe_confirm_page,
    unsubscribe_done_page,
    unsubscribe_invalid_page,
    verification_email,
)

LIEN = "https://api.secu-cycle.fr/recaps/unsubscribe?u=42&t=jeton"

# Toutes les clés que ces gabarits sont susceptibles de rendre. Chercher les clés
# du catalogue plutôt que le préfixe « email. » évite un faux positif le jour où
# une phrase se terminera par le mot « email ».
CLES = sorted(
    cle for cle in CATALOGS["fr"]
    if cle.startswith(("email.", "badge."))
)


def _stats(locale):
    """Un résumé déjà rendu, tel que `recap.stats.resume` le produit."""
    from recap.stats import resume
    return resume(
        {"trajets": 12, "km": 84.0, "minutes": 310.0, "denivele": 420.0,
         "trajets_avec_denivele": 12, "km_precedent": 60.0, "plus_long_km": 14.8,
         "trajets_surs": 5, "trajets_pluie": 2},
        [{"code": "routes_10", "name": "10 itinéraires", "description": "Terminer 10 trajets."}],
        "juin" if locale == "fr" else "June",
        locale,
    )


def _rendus(locale):
    """Sujets, HTML et textes de tout ce qui part vers un utilisateur."""
    triplets = [
        verification_email("123456", locale),
        password_reset_email("123456", locale),
        email_change_code_email("123456", "nouvelle@exemple.fr", locale),
        email_change_alert_email("nouvelle@exemple.fr", locale),
        account_deleted_email(locale),
        recap_email("monthly", "juillet 2026", "Alexis", _stats(locale), LIEN, locale),
        recap_email("yearly", "2026", None, _stats(locale), LIEN, locale),
    ]
    pages = [
        unsubscribe_confirm_page(LIEN, locale),
        unsubscribe_done_page(locale),
        unsubscribe_invalid_page(locale),
    ]
    return [part for triplet in triplets for part in triplet] + pages


@pytest.mark.parametrize("locale", SUPPORTED)
def test_aucune_cle_de_catalogue_ne_transparait(locale):
    """Une clé absente serait servie telle quelle, sans la moindre erreur."""
    for rendu in _rendus(locale):
        for cle in CLES:
            assert cle not in rendu, f"clé non traduite dans un e-mail {locale} : {cle}"


@pytest.mark.parametrize("locale", SUPPORTED)
def test_aucune_interpolation_ne_reste_ouverte(locale):
    """Une interpolation ratée laisse le gabarit tel quel, sans lever.

    `t()` attrape les erreurs de `str.format` et renvoie le modèle non
    interpolé : « Votre code est : {code} » partirait ainsi à un utilisateur.
    Les styles en ligne de ces gabarits n'utilisent aucune accolade, l'absence
    totale d'accolade est donc un contrôle exact.
    """
    for rendu in _rendus(locale):
        assert rendu.strip()
        assert "{" not in rendu and "}" not in rendu


def test_les_deux_langues_different_vraiment():
    """Garde-fou contre une locale ignorée en chemin : le repli est silencieux.

    Un `locale` oublié dans un appel intermédiaire ne casse rien — il produit un
    e-mail français pour un anglophone, ce qui ne se voit qu'à la réception.
    """
    identiques = [
        i for i, (fr, en) in enumerate(zip(_rendus("fr"), _rendus("en"))) if fr == en
    ]
    assert not identiques, f"rendus identiques en fr et en : positions {identiques}"


def test_le_formulaire_de_contact_reste_en_francais():
    """Son destinataire est l'équipe, comme le dashboard d'administration."""
    sujet, html, texte = contact_email(
        "Jean", "Dupont", "jean@exemple.fr", "Question", "Bonjour",
    )
    assert sujet.startswith("[Contact]")
    assert "Nouveau message" in html
    assert "Nouveau message" in texte
