"""Catalogue de traduction.

Format : un JSON par langue dans ``locales/``, arborescent à l'écriture,
aplati en clés pointées au chargement. Les fichiers entrent dans l'image via le
``COPY . .`` du Dockerfile — il n'y a aucune étape de compilation à ajouter, et
donc aucun artefact de build qui pourrait manquer silencieusement en production.

Le chargement a lieu une fois, à l'import. Pas de rechargement à chaud :
``POST /navigation/update`` est appelé toutes les deux secondes par utilisateur
en navigation, ``t()`` doit rester un accès dictionnaire.
"""

import json
import logging
from pathlib import Path

from i18n.negotiation import DEFAULT_LOCALE, SUPPORTED

logger = logging.getLogger(__name__)

_LOCALES_DIR = Path(__file__).parent / "locales"


def _flatten(node, prefix: str = "") -> dict[str, str]:
    """{"a": {"b": "x"}} -> {"a.b": "x"}."""
    flat: dict[str, str] = {}
    for key, value in node.items():
        path = f"{prefix}.{key}" if prefix else key
        if isinstance(value, dict):
            flat.update(_flatten(value, path))
        else:
            flat[path] = value
    return flat


def _load() -> dict[str, dict[str, str]]:
    catalogs: dict[str, dict[str, str]] = {}
    for locale in SUPPORTED:
        path = _LOCALES_DIR / f"{locale}.json"
        try:
            catalogs[locale] = _flatten(json.loads(path.read_text(encoding="utf-8")))
        except (OSError, ValueError) as exc:
            # Un catalogue illisible ne doit pas empêcher l'API de démarrer : on
            # sert la clé brute, ce qui est laid mais diagnostiquable, plutôt que
            # de refuser tout trafic.
            logger.error("Catalogue %s illisible (%s) : les clés seront servies brutes.", path, exc)
            catalogs[locale] = {}
    return catalogs


CATALOGS = _load()


def t(key: str, locale: str = DEFAULT_LOCALE, /, **params) -> str:
    """Rend `key` dans `locale`. Repli sur le français, puis sur la clé elle-même.

    Ne lève JAMAIS. L'usage le plus fréquent de cette fonction est
    ``HTTPException(detail=t(...))``, c'est-à-dire le chemin d'erreur : une
    KeyError y transformerait un 400 attendu en 500 inattendu.
    """
    catalog = CATALOGS.get(locale) or CATALOGS.get(DEFAULT_LOCALE, {})
    template = catalog.get(key)

    if template is None and locale != DEFAULT_LOCALE:
        template = CATALOGS.get(DEFAULT_LOCALE, {}).get(key)

    if template is None:
        logger.warning("Clé de traduction absente : %s (%s)", key, locale)
        return key

    if not params:
        return template

    try:
        return template.format(**params)
    except (KeyError, IndexError, ValueError) as exc:
        logger.warning("Interpolation impossible pour %s (%s) : %s", key, locale, exc)
        return template


def t_or(key: str, defaut: str | None, locale: str = DEFAULT_LOCALE, /, **params) -> str:
    """Rend `key`, ou `defaut` si elle n'existe dans aucun catalogue.

    Pour les libellés qui vivent aussi en base — les badges, dont le catalogue
    fait autorité et dont la valeur stockée sert de repli aux lignes ajoutées
    sans clé. Contrairement à `t()`, l'absence n'est pas une anomalie : elle
    n'est donc pas journalisée, sans quoi un catalogue de badges partiellement
    rempli produirait deux avertissements par badge à chaque `GET /badges/`.
    """
    for candidat in (locale, DEFAULT_LOCALE):
        template = CATALOGS.get(candidat, {}).get(key)
        if template is not None:
            return template.format(**params) if params else template
    return key if defaut is None else defaut


def ordinal(count: int, locale: str = DEFAULT_LOCALE, /) -> str:
    """Rang écrit : « 1ère », « 3ème » / “1st”, “3rd”.

    Un ordinal n'est pas une chaîne mais une règle morphologique, et les deux
    langues ne la partagent pas : le français ne distingue que le premier rang,
    l'anglais en distingue quatre — avec l'exception 11/12/13, qui reprend la
    forme générale (“11th”, pas “11st”). C'est la seule raison pour laquelle
    cette fonction existe plutôt qu'une clé de catalogue interpolée.

    Les catégories sont celles de CLDR (« one », « two », « few », « other »).
    Le français les définit toutes malgré tout : la parité des catalogues est
    contrôlée clé à clé, et trois d'entre elles y valent la même chose.
    """
    return t(f"ordinal.{_ordinal_category(count, locale)}", locale, count=count)


def _ordinal_category(count: int, locale: str) -> str:
    """Catégorie ordinale CLDR d'un entier, dans la locale donnée."""
    n = abs(count)
    if locale != "en":
        return "one" if n == 1 else "other"
    # 11, 12 et 13 sont réguliers en anglais, contrairement à 1, 2 et 3.
    if n % 100 in (11, 12, 13):
        return "other"
    return {1: "one", 2: "two", 3: "few"}.get(n % 10, "other")


def plural(count: int, one_key: str, other_key: str, locale: str = DEFAULT_LOCALE, /, **params) -> str:
    """Choisit la forme singulier/pluriel selon la règle CLDR de la locale.

    La différence entre les deux langues porte sur zéro : le français met la
    forme « one » pour n < 2 (« 0 station »), l'anglais pour n == 1 seulement
    (« 0 stations »).
    """
    is_one = abs(count) < 2 if locale == "fr" else abs(count) == 1
    return t(one_key if is_one else other_key, locale, count=count, **params)
