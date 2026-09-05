"""Résolution des liens courts de cartographie (maps.app.goo.gl et cie).

Un lien court ne contient aucune coordonnée : il faut suivre la redirection
pour obtenir l'URL longue, puis en extraire le point. Ce travail est fait ici
plutôt que dans l'application mobile parce que `fetch` gère mal
`redirect: 'manual'` en React Native, et parce qu'un correctif de format se
déploie sans republier sur le Play Store.

SÉCURITÉ — un endpoint qui suit une URL fournie par le client est une SSRF en
puissance. Deux garde-fous, cumulatifs : l'hôte de départ doit être un
raccourcisseur connu, et chaque saut doit rester sur un domaine Google. Sans
cela, n'importe qui pourrait faire interroger 169.254.169.254 ou les services
internes par le serveur.
"""

import ipaddress
import logging
import re
from urllib.parse import unquote, urlparse

import httpx

logger = logging.getLogger(__name__)

# Hôtes acceptés en entrée : uniquement des raccourcisseurs de cartographie.
SHORT_HOSTS = frozenset({
    "maps.app.goo.gl",
    "goo.gl",
    "g.co",
    "maps.google.com",
})

# Domaines autorisés à chaque saut. Une redirection sortante interrompt tout.
ALLOWED_SUFFIXES = (
    ".google.com",
    ".google.fr",
    ".goo.gl",
    ".g.co",
)
ALLOWED_HOSTS = frozenset({"google.com", "google.fr", "goo.gl", "g.co"})

MAX_HOPS = 5
TIMEOUT_S = 3.0

# Formats rencontrés dans les URL longues de Google Maps, par fiabilité
# décroissante. `!3d…!4d…` est le point exact du lieu ; `@…` n'est que le
# centre de la caméra, qui peut en différer de quelques dizaines de mètres.
_PATTERNS = (
    re.compile(r"!3d(-?\d{1,3}\.\d+)!4d(-?\d{1,3}\.\d+)"),
    re.compile(r"[?&](?:q|ll|sll|daddr|destination)=(-?\d{1,3}\.\d+),(-?\d{1,3}\.\d+)"),
    re.compile(r"@(-?\d{1,3}\.\d+),(-?\d{1,3}\.\d+)"),
)

_PLACE_RE = re.compile(r"/maps/place/([^/@?]+)")


def is_short_link(url: str) -> bool:
    """L'URL est-elle un lien court que l'on accepte de suivre ?"""
    try:
        host = (urlparse(url).hostname or "").lower()
    except ValueError:
        return False
    return host in SHORT_HOSTS


def _host_allowed(url: str) -> bool:
    """L'hôte est-il un domaine Google, et non une IP ?"""
    try:
        host = (urlparse(url).hostname or "").lower()
    except ValueError:
        return False
    if not host:
        return False

    # Une IP littérale ne peut jamais être légitime ici, et c'est le vecteur
    # d'attaque le plus direct (métadonnées cloud, réseau interne).
    try:
        ipaddress.ip_address(host)
        return False
    except ValueError:
        pass

    return host in ALLOWED_HOSTS or host.endswith(ALLOWED_SUFFIXES)


def _follow(url: str) -> str | None:
    """Suit les redirections à la main et rend l'URL finale.

    `follow_redirects=False` est volontaire : on veut inspecter chaque saut
    avant de le suivre, ce que le suivi automatique ne permet pas.
    """
    current = url
    with httpx.Client(follow_redirects=False, timeout=TIMEOUT_S) as client:
        for _ in range(MAX_HOPS):
            if not (current.startswith("https://") or current.startswith("http://")):
                return None
            if not _host_allowed(current):
                logger.warning("Lien court : saut refusé vers un hôte non autorisé")
                return None

            try:
                response = client.head(current)
            except httpx.HTTPError:
                return None

            if response.status_code not in (301, 302, 303, 307, 308):
                return current

            location = response.headers.get("location")
            if not location:
                return current
            current = str(httpx.URL(current).join(location))

    return None


def _coords_from_url(url: str) -> tuple[float, float] | None:
    """Premier couple de coordonnées trouvé, dans l'ordre de fiabilité."""
    for pattern in _PATTERNS:
        match = pattern.search(url)
        if not match:
            continue
        lat, lon = float(match.group(1)), float(match.group(2))
        if abs(lat) <= 90 and abs(lon) <= 180:
            return lat, lon
    return None


def _label_from_url(url: str) -> str | None:
    """Nom du lieu tel qu'il figure dans l'URL longue, s'il y est."""
    match = _PLACE_RE.search(url)
    if not match:
        return None
    label = unquote(match.group(1)).replace("+", " ").strip()
    return label or None


def resolve(url: str) -> dict | None:
    """Point désigné par un lien court, ou None si on n'a rien pu en tirer.

    Le format de retour reprend celui d'un résultat de `service.search`,
    pour que l'application n'ait aucun cas particulier à traiter.
    """
    if not is_short_link(url):
        return None

    final = _follow(url)
    if not final:
        return None

    coords = _coords_from_url(final)
    if not coords:
        # L'URL longue existe mais ne porte pas de point : le nom du lieu
        # reste exploitable par le géocodage classique.
        label = _label_from_url(final)
        return {"label": label, "lat": None, "lon": None} if label else None

    lat, lon = coords
    return {
        "label": _label_from_url(final),
        "lat": lat,
        "lon": lon,
        "score": 1.0,
        "type": "poi",
    }
