"""Négociation de la langue à partir d'Accept-Language et de ?lang=."""

import pytest

from i18n.negotiation import negotiate, parse_accept_language

# Les deux cas signalés dans le plan sont ceux que les implémentations maison
# ratent presque toujours : le tri par q qui prime l'ordre d'apparition, et q=0
# qui signifie « refusé » et non « faible priorité ».
CAS = [
    (None,                "fr", "en-tête absent"),
    ("",                  "fr", "en-tête vide"),
    ("en",                "en", "langue simple"),
    ("en-GB",             "en", "sous-étiquette régionale"),
    ("EN-gb",             "en", "casse indifférente"),
    ("en-US,en;q=0.9",    "en", "liste cohérente"),
    ("fr-CA",             "fr", "français régional"),
    ("de",                "fr", "langue non supportée"),
    ("de,en;q=0.8",       "en", "on saute la non supportée au lieu de s'arrêter"),
    ("en;q=0.8,fr;q=0.9", "fr", "le q prime l'ordre d'apparition"),
    ("fr;q=0,en",         "en", "q=0 écarte le français"),
    ("en;q=0",            "fr", "q=0 signifie refusé, pas faible priorité"),
    ("*",                 "fr", "joker"),
    ("en;q=bogus",        "en", "q illisible traité comme absent"),
    ("  en  ;  q=0.5 ",   "en", "espaces superflus"),
    (";;;",               "fr", "en-tête dégénéré"),
]


@pytest.mark.parametrize("header,attendu,intitule", CAS, ids=[c[2] for c in CAS])
def test_parse_accept_language(header, attendu, intitule):
    assert parse_accept_language(header) == attendu


def test_en_tete_pathologique_ne_coute_rien():
    """L'en-tête est lu sur des routes publiques non authentifiées : il est borné."""
    assert parse_accept_language("x" * 100_000) == "fr"
    assert parse_accept_language(",".join(["en"] * 10_000)) == "en"


def test_parse_ne_leve_jamais():
    for entree in (None, "", "=", "en;q=", "en;;q=1", "\x00", "é" * 10):
        assert parse_accept_language(entree) in ("fr", "en")


class TestPrecedence:
    def test_lang_bat_l_en_tete(self):
        assert negotiate("fr", "en") == "en"
        assert negotiate("en", "fr") == "fr"

    def test_lang_inconnu_est_ignore_silencieusement(self):
        # Plutôt qu'un 400 : refuser une carte publique pour une faute de frappe
        # dans un paramètre cosmétique serait un mauvais échange.
        assert negotiate("en", "zz") == "en"
        assert negotiate(None, "klingon") == "fr"

    def test_lang_regional(self):
        assert negotiate(None, "en-US") == "en"

    def test_sans_rien(self):
        assert negotiate(None, None) == "fr"
