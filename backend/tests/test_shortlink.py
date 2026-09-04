"""Extraction de coordonnées et garde-fous du suivi de liens courts.

Aucun accès réseau : on teste le parsing et les règles d'autorisation, qui
sont la partie qui casse silencieusement quand Google change ses formats.
"""

import pytest

from geocoding import shortlink


class TestIsShortLink:
    @pytest.mark.parametrize("url", [
        "https://maps.app.goo.gl/ZRafXaexzQEQYPLg9",
        "https://goo.gl/maps/abc123",
        "https://g.co/kgs/xyz",
    ])
    def test_accepte_les_raccourcisseurs_connus(self, url):
        assert shortlink.is_short_link(url) is True

    @pytest.mark.parametrize("url", [
        "https://evil.example.com/redirect",
        "http://169.254.169.254/latest/meta-data/",
        "https://maps.app.goo.gl.evil.com/x",   # suffixe trompeur
        "pas une url",
        "",
    ])
    def test_refuse_le_reste(self, url):
        assert shortlink.is_short_link(url) is False


class TestHostAllowed:
    @pytest.mark.parametrize("url", [
        "https://www.google.com/maps/place/x",
        "https://maps.google.fr/?q=1,2",
        "https://consent.google.com/x",
    ])
    def test_domaines_google(self, url):
        assert shortlink._host_allowed(url) is True

    @pytest.mark.parametrize("url", [
        "http://127.0.0.1:8000/admin",
        "http://169.254.169.254/",           # métadonnées cloud
        "http://10.0.0.5/interne",
        "https://google.com.evil.net/x",     # suffixe trompeur
        "https://notgoogle.com/x",
    ])
    def test_refuse_ip_et_domaines_tiers(self, url):
        assert shortlink._host_allowed(url) is False


class TestCoordsFromUrl:
    def test_priorite_au_point_du_lieu(self):
        """`!3d!4d` est le lieu ; `@` n'est que le centre de la caméra."""
        url = (
            "https://www.google.com/maps/place/Rue+X/@44.8000,-0.6000,17z"
            "/data=!3m1!4b1!4m5!3m4!1s0x0:0x0!8m2!3d44.8414!4d-0.5743"
        )
        assert shortlink._coords_from_url(url) == (44.8414, -0.5743)

    def test_parametre_q(self):
        url = "https://maps.google.com/?q=44.84,-0.57"
        assert shortlink._coords_from_url(url) == (44.84, -0.57)

    def test_arobase_seul(self):
        url = "https://www.google.com/maps/@44.8378,-0.5795,14z"
        assert shortlink._coords_from_url(url) == (44.8378, -0.5795)

    def test_coordonnees_aberrantes_rejetees(self):
        url = "https://maps.google.com/?q=999.0,-0.57"
        assert shortlink._coords_from_url(url) is None

    def test_sans_coordonnees(self):
        assert shortlink._coords_from_url("https://www.google.com/maps") is None


class TestLabelFromUrl:
    def test_nom_de_lieu_decode(self):
        url = "https://www.google.com/maps/place/12+rue+Sainte-Catherine/@44.84,-0.57,17z"
        assert shortlink._label_from_url(url) == "12 rue Sainte-Catherine"

    def test_accents_encodes(self):
        url = "https://www.google.com/maps/place/Gare+Saint-Jean%2C+Bordeaux/@44.8,-0.5,17z"
        assert shortlink._label_from_url(url) == "Gare Saint-Jean, Bordeaux"

    def test_absent(self):
        assert shortlink._label_from_url("https://www.google.com/maps/@44.8,-0.5,14z") is None


class TestResolve:
    def test_refuse_une_url_non_courte_sans_reseau(self):
        """Le garde-fou d'entrée doit trancher avant toute requête sortante."""
        assert shortlink.resolve("https://evil.example.com/x") is None
