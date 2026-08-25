"""En-têtes HTTP de l'internationalisation, sur une application jetable.

On ne construit surtout pas l'application réelle : `main.py` charge le graphe de
routage à l'import. On recrée ici la même pile de middlewares, dans le même
ordre, ce qui suffit à verrouiller le comportement qu'on veut garantir.
"""

import pytest
from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.testclient import TestClient

from i18n import LocaleMiddleware, etag_for, get_locale

ORIGINE = "http://localhost:5173"


@pytest.fixture
def client():
    app = FastAPI()
    # Même ordre que main.py : le premier ajouté est le plus externe.
    app.add_middleware(LocaleMiddleware)
    app.add_middleware(GZipMiddleware, minimum_size=1000)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[ORIGINE], allow_credentials=True,
        allow_methods=["*"], allow_headers=["*"],
        expose_headers=["X-Auth-Error", "Content-Language"],
    )

    @app.get("/echo")
    def echo(locale: str = Depends(get_locale)):
        return {"locale": locale}

    @app.get("/volumineux")
    def volumineux(locale: str = Depends(get_locale)):
        return {"locale": locale, "bourrage": "x" * 5000}

    return TestClient(app)


def _vary(reponse) -> set[str]:
    return {p.strip() for p in reponse.headers.get("vary", "").split(",") if p.strip()}


class TestVary:
    def test_present_sur_toute_reponse(self, client):
        assert "Accept-Language" in _vary(client.get("/echo"))

    def test_cohabite_avec_les_autres(self, client):
        """Le piège : assigner Vary au lieu d'y ajouter écraserait Accept-Encoding
        posé par GZip, ce qui servirait du gzip à un client qui n'en veut pas."""
        reponse = client.get(
            "/volumineux",
            headers={"Origin": ORIGINE, "Accept-Encoding": "gzip"},
        )
        assert reponse.headers.get("content-encoding") == "gzip"
        assert {"Accept-Language", "Accept-Encoding", "Origin"} <= _vary(reponse)

    def test_present_sur_les_erreurs(self, client):
        assert "Accept-Language" in _vary(client.get("/inexistant"))


class TestContentLanguage:
    @pytest.mark.parametrize("entete,attendu", [(None, "fr"), ("en-GB", "en"), ("fr", "fr")])
    def test_reflete_la_langue_servie(self, client, entete, attendu):
        headers = {"Accept-Language": entete} if entete else {}
        reponse = client.get("/echo", headers=headers)
        assert reponse.headers.get("content-language") == attendu
        assert reponse.json()["locale"] == attendu


class TestNegociationDeBoutEnBout:
    def test_lang_bat_l_en_tete(self, client):
        assert client.get("/echo?lang=en", headers={"Accept-Language": "fr"}).json()["locale"] == "en"

    def test_lang_inconnu_est_ignore(self, client):
        assert client.get("/echo?lang=zz", headers={"Accept-Language": "en"}).json()["locale"] == "en"

    def test_le_q_prime_l_ordre(self, client):
        reponse = client.get("/echo", headers={"Accept-Language": "en;q=0.8, fr;q=0.9"})
        assert reponse.json()["locale"] == "fr"


class TestEtag:
    def test_deux_langues_deux_empreintes(self):
        """Sans cela, un client qui change de langue renvoie son If-None-Match
        précédent, reçoit un 304 et garde l'ancienne langue."""
        assert etag_for("42-2026-01-01", "fr") != etag_for("42-2026-01-01", "en")

    def test_stable_a_entree_constante(self):
        assert etag_for("graine", "fr") == etag_for("graine", "fr")

    def test_forme_d_etag_faible(self):
        etag = etag_for("graine", "fr")
        assert etag.startswith('W/"') and etag.endswith('"')
