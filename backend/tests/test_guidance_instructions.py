"""Guidage : rendu des instructions dans les deux langues.

Deux défaillances sont couvertes ici, toutes deux silencieuses en production.

La première est l'ordinal de sortie de rond-point : ce n'est pas une chaîne mais
une règle morphologique, et l'anglais en a quatre formes avec une exception sur
11/12/13. Une table de traduction ordinaire produirait « 11st ».

La seconde est la clé dynamique. `build_instruction` compose ses clés à partir
du `turn_type` reçu dans le corps de la requête : aucun contrôle statique ne
peut vérifier qu'elles résolvent toutes, ni qu'un `turn_type` inconnu ne fait
pas afficher la clé brute à un cycliste en train de rouler.
"""

import pytest

from graph.instruction_builder import (
    LABELLED_TURNS,
    TURN_ICONS,
    build_instruction,
    format_distance,
)
from i18n import ordinal
from i18n.negotiation import SUPPORTED
from schemas.navigation import InstructionOut


class TestOrdinal:
    """Rangs écrits : « 1ère » / “1st”, avec l'exception anglaise des dizaines."""

    @pytest.mark.parametrize("n,attendu", [
        (1, "1ère"), (2, "2ème"), (3, "3ème"), (4, "4ème"),
        (11, "11ème"), (21, "21ème"),
    ])
    def test_francais(self, n, attendu):
        assert ordinal(n, "fr") == attendu

    @pytest.mark.parametrize("n,attendu", [
        (1, "1st"), (2, "2nd"), (3, "3rd"), (4, "4th"),
        (11, "11th"), (12, "12th"), (13, "13th"),
        (21, "21st"), (22, "22nd"), (23, "23rd"),
        (101, "101st"), (111, "111th"),
    ])
    def test_anglais(self, n, attendu):
        assert ordinal(n, "en") == attendu


class TestDistance:
    @pytest.mark.parametrize("locale,metres,attendu", [
        ("fr", 10, "maintenant"), ("en", 10, "now"),
        ("fr", 250, "dans 250 m"), ("en", 250, "in 250 m"),
        # Séparateur décimal : le français écrit « 1,2 km ».
        ("fr", 1234, "dans 1,2 km"), ("en", 1234, "in 1.2 km"),
    ])
    def test_forme(self, locale, metres, attendu):
        assert format_distance(metres, locale) == attendu


class TestInstructions:
    """Aucune clé brute servie, quelle que soit l'entrée."""

    @pytest.mark.parametrize("locale", SUPPORTED)
    @pytest.mark.parametrize("turn", sorted(TURN_ICONS) + ["inconnu"])
    @pytest.mark.parametrize("rue", [None, "Cours de la Marne"])
    def test_aucune_cle_brute(self, locale, turn, rue):
        instruction = build_instruction(
            {"turn_type": turn, "street_name": rue, "exit_number": 2}, 300, locale
        )
        texte = instruction["text"]
        assert "guidance." not in texte and "{" not in texte, texte
        assert texte.strip()
        # « arrive » est la seule manœuvre qui ignore le nom de rue : on annonce
        # l'arrivée, pas la voie sur laquelle elle se trouve.
        if rue and turn != "arrive":
            assert rue in texte

    @pytest.mark.parametrize("locale", SUPPORTED)
    def test_turn_type_inconnu_retombe_sur_le_repli(self, locale):
        """`turn_type` vient du client : l'inconnu ne doit pas fuir à l'écran."""
        repli = build_instruction({"turn_type": "n_importe_quoi"}, 300, locale)
        attendu = build_instruction({"turn_type": "fallback_absent"}, 300, locale)
        assert repli["text"] == attendu["text"]
        assert "n_importe_quoi" not in repli["text"]

    @pytest.mark.parametrize("locale", SUPPORTED)
    def test_rond_point_sans_numero_de_sortie(self, locale):
        """`exit_number` est optionnel : pas de rang inventé, pas de 500.

        L'implémentation précédente écrivait « ?ème » et posait la chaîne « ? »
        dans un champ `Optional[int]`, ce que le modèle de réponse refusait.
        """
        instruction = build_instruction({"turn_type": "roundabout"}, 300, locale)
        assert instruction["exit_number"] is None
        assert "?" not in instruction["text"]
        InstructionOut(**instruction)

    @pytest.mark.parametrize("locale", SUPPORTED)
    def test_reponse_toujours_valide(self, locale):
        for turn in sorted(TURN_ICONS) + ["inconnu"]:
            for sortie in (None, 1, 3):
                for distance in (0, 300, 5678):
                    instruction = build_instruction(
                        {"turn_type": turn, "exit_number": sortie}, distance, locale
                    )
                    InstructionOut(**instruction)

    def test_libelles_et_icones_restent_alignes(self):
        """Les manœuvres libellées doivent toutes avoir une icône."""
        assert LABELLED_TURNS <= set(TURN_ICONS)
