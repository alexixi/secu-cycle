"""Négociation de la langue de réponse.

Deux entrées possibles, par ordre de précédence :

  1. le paramètre de requête ``?lang=`` — il fait varier l'URL, donc il est
     intrinsèquement sûr côté cache, sans dépendre d'un ``Vary`` correctement
     implémenté par un intermédiaire ;
  2. l'en-tête ``Accept-Language`` — CORS-safelisted, donc il ne déclenche pas
     de requête préliminaire OPTIONS, contrairement à un en-tête maison.

Un ``?lang=`` inconnu est ignoré silencieusement plutôt que rejeté : renvoyer une
erreur sur une carte publique à cause d'une faute de frappe dans un paramètre
cosmétique serait un mauvais échange.
"""

from fastapi import Query, Request

SUPPORTED = ("fr", "en")
DEFAULT_LOCALE = "fr"

# L'en-tête arrive sur des routes publiques non authentifiées : on le borne avant
# de le découper, pour qu'un en-tête pathologique coûte un slice et rien de plus.
_MAX_HEADER_LEN = 512
_MAX_ENTRIES = 16


def parse_accept_language(header: str | None) -> str:
    """« en-GB;q=0.9, fr;q=0.8 » -> « en ». Repli DEFAULT_LOCALE.

    Fonction totale : ne lève jamais, quelle que soit l'entrée.

    Les trois règles que l'on rate habituellement :
      - le tri par q prime l'ordre d'apparition (« en;q=0.8, fr;q=0.9 » -> fr) ;
      - q=0 signifie « refusé », pas « faible priorité » : l'entrée est écartée ;
      - on saute les langues non supportées au lieu de s'arrêter à la première
        (« de,en;q=0.8 » -> en).
    """
    if not header:
        return DEFAULT_LOCALE

    candidates = []
    for index, part in enumerate(header[:_MAX_HEADER_LEN].split(",")[:_MAX_ENTRIES]):
        tag, _, params = part.strip().partition(";")
        tag = tag.strip().lower()
        if not tag:
            continue

        # « en-GB » -> « en ». « * » ne désigne aucune langue en particulier.
        primary = tag.split("-")[0]
        if primary not in SUPPORTED:
            continue

        quality = 1.0
        key, _, raw = params.strip().partition("=")
        if key.strip().lower() == "q":
            try:
                quality = float(raw.strip())
            except ValueError:
                # q illisible : on le traite comme absent plutôt que d'écarter
                # une langue que le client a bel et bien demandée.
                quality = 1.0

        if quality <= 0:
            continue

        # L'index départage à qualité égale, en respectant l'ordre d'apparition.
        candidates.append((-quality, index, primary))

    if not candidates:
        return DEFAULT_LOCALE

    candidates.sort()
    return candidates[0][2]


def negotiate(header: str | None, lang_param: str | None = None) -> str:
    """Locale effective d'une requête. Fonction pure, appelée par la dépendance
    FastAPI comme par le middleware — mêmes entrées, même résultat."""
    if lang_param:
        candidate = lang_param.strip().lower().split("-")[0]
        if candidate in SUPPORTED:
            return candidate
    return parse_accept_language(header)


def get_locale(
    request: Request,
    lang: str | None = Query(None, include_in_schema=False),
) -> str:
    """Dépendance FastAPI. Précédence : ?lang= > Accept-Language > fr."""
    return negotiate(request.headers.get("accept-language"), lang)
