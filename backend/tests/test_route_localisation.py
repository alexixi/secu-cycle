"""Itinéraires : le cache partagé ne doit porter aucun mot.

`route_cache` est un LRU partagé par tous les visiteurs d'un worker, et sa clé
ignore délibérément la langue — l'y ajouter doublerait la mémoire pour un
résultat identique au bit près. La contrepartie est stricte : rien de ce que
`get_optimal_routes` met en cache ne peut porter un libellé rendu.

C'est la défaillance la plus discrète du chantier. Un nom de variante rendu en
amont ne lève rien, ne journalise rien, et ressort simplement dans la mauvaise
langue chez le visiteur suivant.
"""

import copy
import re

import pytest

from graph import routing
from i18n import t
from i18n.catalog import CATALOGS
from i18n.negotiation import SUPPORTED

VARIANTES = ("fast", "safe", "compromise")

# Les clés d'erreur que `get_optimal_routes` peut renvoyer, plus le repli du
# routeur. Composées littéralement dans le source : on les relit de là.
CLES_ERREUR = set(re.findall(r'"(error\.route\.[a-z_]+)"', 
                             open(routing.__file__, encoding="utf-8").read()))


def rendre(resultat: dict, locale: str) -> dict:
    """Reproduit ce que fait `routers/route.py` sur un résultat sorti du cache."""
    rendu = copy.deepcopy(resultat)          # route_cache.get() renvoie une copie
    for route in rendu.get("routes", []):
        route["name"] = t(f"route.variant.{route['id']}", locale)
    return rendu


class TestCacheSansMots:
    def test_get_optimal_routes_ne_pose_aucun_nom(self):
        """Aucun `"name":` littéral ne subsiste dans ce qui est mis en cache."""
        source = open(routing.__file__, encoding="utf-8").read()
        assert '"name"' not in source, (
            "un libellé est reposé dans get_optimal_routes : il finirait en cache"
        )

    def test_aucune_phrase_dans_les_retours_d_erreur(self):
        """Les échecs sortent en clés, jamais en phrases."""
        source = open(routing.__file__, encoding="utf-8").read()
        assert '"error":' not in source, (
            "un message rendu est renvoyé par get_optimal_routes"
        )

    @pytest.mark.parametrize("cle", sorted(CLES_ERREUR))
    @pytest.mark.parametrize("locale", SUPPORTED)
    def test_chaque_cle_d_erreur_resout(self, cle, locale):
        rendu = t(cle, locale)
        assert rendu != cle, f"{cle} absente de {locale}.json"
        assert "{" not in rendu


class TestRenduParLangue:
    @pytest.mark.parametrize("variante", VARIANTES)
    @pytest.mark.parametrize("locale", SUPPORTED)
    def test_chaque_variante_a_un_nom(self, variante, locale):
        cle = f"route.variant.{variante}"
        assert t(cle, locale) != cle

    def test_un_meme_resultat_en_cache_donne_deux_langues(self):
        """Le scénario redouté : un calcul servi à deux visiteurs successifs."""
        en_cache = {"success": True, "routes": [
            {"id": "fast", "distance": 3.2}, {"id": "safe", "distance": 3.9},
            {"id": "compromise", "distance": 3.5},
        ]}
        fige = copy.deepcopy(en_cache)

        noms_fr = [r["name"] for r in rendre(en_cache, "fr")["routes"]]
        noms_en = [r["name"] for r in rendre(en_cache, "en")["routes"]]

        assert noms_fr == ["Rapide", "Sécurisé", "Compromis"]
        assert noms_en == ["Fastest", "Safest", "Balanced"]
        # L'objet en cache n'a jamais gagné de libellé au passage.
        assert en_cache == fige
        assert all("name" not in r for r in en_cache["routes"])

    def test_accord_avec_le_catalogue_du_front_web(self):
        """Le front web porte ses propres libellés : les deux ne doivent pas diverger."""
        import json
        import pathlib

        racine = pathlib.Path(routing.__file__).parents[2]
        for locale in SUPPORTED:
            chemin = racine / "frontend-web/src/i18n/locales" / locale / "itineraire.json"
            if not chemin.exists():
                pytest.skip("catalogue du front web absent de cette arborescence")
            front = json.loads(chemin.read_text(encoding="utf-8"))["itineraires"]["nom"]
            for variante in VARIANTES:
                assert front[variante] == CATALOGS[locale][f"route.variant.{variante}"], (
                    f"{locale} : « {variante} » diffère entre l'API et le front"
                )
