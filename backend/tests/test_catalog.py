"""Catalogue de traduction : parité des langues et robustesse de t().

C'est le fichier qui prévient réellement des incidents. L'internationalisation
échoue silencieusement — une chaîne servie dans la mauvaise langue ne lève
aucune exception — et le mode de défaillance le plus fréquent est la
contribution à moitié traduite. Le test de parité l'attrape avant la production.
"""

import re

import pytest

from i18n.catalog import CATALOGS, _flatten, plural, t
from i18n.negotiation import DEFAULT_LOCALE, SUPPORTED

PLACEHOLDER = re.compile(r"\{(\w+)")


def _placeholders(gabarit: str) -> set[str]:
    return set(PLACEHOLDER.findall(gabarit))


class TestParite:
    """Chaque clé et chaque paramètre doivent exister dans les deux langues."""

    @pytest.mark.parametrize("locale", [l for l in SUPPORTED if l != DEFAULT_LOCALE])
    def test_aucune_cle_manquante(self, locale):
        manquantes = sorted(set(CATALOGS[DEFAULT_LOCALE]) - set(CATALOGS[locale]))
        assert not manquantes, (
            f"{len(manquantes)} clé(s) absente(s) de {locale}.json : {manquantes[:20]}"
        )

    @pytest.mark.parametrize("locale", [l for l in SUPPORTED if l != DEFAULT_LOCALE])
    def test_aucune_cle_orpheline(self, locale):
        """Une clé présente en anglais seulement est un reliquat de renommage."""
        orphelines = sorted(set(CATALOGS[locale]) - set(CATALOGS[DEFAULT_LOCALE]))
        assert not orphelines, (
            f"{len(orphelines)} clé(s) de {locale}.json sans équivalent français : {orphelines[:20]}"
        )

    @pytest.mark.parametrize("locale", [l for l in SUPPORTED if l != DEFAULT_LOCALE])
    def test_memes_parametres(self, locale):
        """Un {placeholder} oublié à la traduction produit un trou dans la phrase."""
        divergences = []
        for cle, gabarit_fr in CATALOGS[DEFAULT_LOCALE].items():
            gabarit_autre = CATALOGS[locale].get(cle)
            if gabarit_autre is None:
                continue  # déjà signalé par test_aucune_cle_manquante
            if _placeholders(gabarit_fr) != _placeholders(gabarit_autre):
                divergences.append(
                    f"{cle} : fr{sorted(_placeholders(gabarit_fr))} "
                    f"vs {locale}{sorted(_placeholders(gabarit_autre))}"
                )
        assert not divergences, "\n".join(divergences)


class TestRobustesse:
    """t() est appelée surtout depuis HTTPException(detail=...), c'est-à-dire sur
    le chemin d'erreur : une exception y transformerait un 400 en 500."""

    def test_cle_absente_renvoie_la_cle(self):
        assert t("cle.qui.nexiste.pas") == "cle.qui.nexiste.pas"
        assert t("cle.qui.nexiste.pas", "en") == "cle.qui.nexiste.pas"

    def test_parametre_manquant_ne_leve_pas(self, monkeypatch):
        monkeypatch.setitem(CATALOGS["fr"], "essai.gabarit", "Bonjour {prenom}")
        # Le gabarit brut vaut mieux qu'une KeyError remontée en 500.
        assert t("essai.gabarit") == "Bonjour {prenom}"
        assert t("essai.gabarit", "fr", prenom="Alex") == "Bonjour Alex"

    def test_locale_inconnue_retombe_sur_le_francais(self, monkeypatch):
        monkeypatch.setitem(CATALOGS["fr"], "essai.simple", "Bonjour")
        assert t("essai.simple", "klingon") == "Bonjour"

    def test_repli_francais_si_la_cle_manque_en_anglais(self, monkeypatch):
        monkeypatch.setitem(CATALOGS["fr"], "essai.repli", "Seulement en français")
        assert t("essai.repli", "en") == "Seulement en français"


class TestAplatissement:
    def test_arborescence_vers_cles_pointees(self):
        assert _flatten({"a": {"b": "x"}, "c": "y"}) == {"a.b": "x", "c": "y"}

    def test_profondeur_quelconque(self):
        assert _flatten({"a": {"b": {"c": "x"}}}) == {"a.b.c": "x"}

    def test_vide(self):
        assert _flatten({}) == {}


class TestPluriel:
    """Les deux langues divergent sur zéro : le français met la forme « one »
    pour n < 2 (« 0 station »), l'anglais pour n == 1 seulement (« 0 stations »)."""

    @pytest.fixture(autouse=True)
    def _catalogue(self, monkeypatch):
        monkeypatch.setitem(CATALOGS["fr"], "essai.un", "{count} station")
        monkeypatch.setitem(CATALOGS["fr"], "essai.n", "{count} stations")
        monkeypatch.setitem(CATALOGS["en"], "essai.un", "{count} station")
        monkeypatch.setitem(CATALOGS["en"], "essai.n", "{count} stations")

    @pytest.mark.parametrize("count,attendu", [(0, "0 station"), (1, "1 station"), (2, "2 stations")])
    def test_francais(self, count, attendu):
        assert plural(count, "essai.un", "essai.n", "fr") == attendu

    @pytest.mark.parametrize("count,attendu", [(0, "0 stations"), (1, "1 station"), (2, "2 stations")])
    def test_anglais(self, count, attendu):
        assert plural(count, "essai.un", "essai.n", "en") == attendu
