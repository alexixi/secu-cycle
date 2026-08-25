"""Plomberie HTTP de l'internationalisation : en-têtes de réponse et ETags.

Deux responsabilités, toutes deux préventives : signaler aux caches que la
réponse dépend de la langue, et faire entrer la langue dans l'empreinte des
ETags.

Le second point n'est pas théorique. Tous les ETags du projet sont calculés à
partir des données seules : sans correctif, un client qui change de langue
renvoie son ``If-None-Match`` précédent, reçoit un ``304 Not Modified`` et garde
l'ancienne langue en cache. C'est le chemin nominal, pas un cas limite.
"""

import hashlib

from starlette.datastructures import MutableHeaders
from starlette.types import ASGIApp, Message, Receive, Scope, Send

from i18n.negotiation import negotiate

VARY_VALUE = "Accept-Language"


def etag_for(seed: str, locale: str) -> str:
    """ETag faible d'une réponse localisée.

    La locale entre dans l'empreinte : deux langues du même état de données
    doivent produire deux ETags distincts, sinon le 304 sert la mauvaise langue.
    """
    digest = hashlib.md5(
        f"{seed}|{locale}".encode("utf-8"),
        usedforsecurity=False,
    ).hexdigest()
    return f'W/"{digest}"'


class LocaleMiddleware:
    """Ajoute ``Vary: Accept-Language`` et ``Content-Language`` à chaque réponse.

    Global plutôt qu'appliqué route par route : il y a vingt-et-un routers, et
    n'importe quelle route peut gagner une chaîne localisée plus tard. Un opt-in
    par route serait oublié exactement une fois, et cette fois-là serait le bug.

    Middleware ASGI et non BaseHTTPMiddleware, pour ne pas mettre en tampon les
    réponses en flux (les couches GeoJSON sont volumineuses).
    """

    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        locale = negotiate(_header(scope, b"accept-language"), _lang_param(scope))

        async def send_with_locale(message: Message) -> None:
            if message["type"] == "http.response.start":
                headers = MutableHeaders(scope=message)
                # append, jamais __setitem__ : GZipMiddleware a déjà posé
                # Accept-Encoding et CORSMiddleware Origin. Écraser Vary
                # servirait du gzip à un client qui n'en a pas demandé.
                headers.append("Vary", VARY_VALUE)
                headers.setdefault("Content-Language", locale)
            await send(message)

        await self.app(scope, receive, send_with_locale)


def _header(scope: Scope, name: bytes) -> str | None:
    for key, value in scope.get("headers", []):
        if key == name:
            return value.decode("latin-1")
    return None


def _lang_param(scope: Scope) -> str | None:
    query = scope.get("query_string", b"")
    if b"lang=" not in query:
        return None
    from urllib.parse import parse_qs

    values = parse_qs(query.decode("latin-1")).get("lang")
    return values[0] if values else None
