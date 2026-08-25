"""Internationalisation du backend (français, anglais).

La langue de la réponse est négociée par requête (``?lang=`` puis
``Accept-Language``, repli français) ; elle n'est jamais déduite du profil
utilisateur, qui ne fait autorité que pour les e-mails transactionnels.

Règle structurante du module : la couche de calcul émet des clés, la couche de
sérialisation émet des mots. Rien qui tourne dans une boucle de fond ni qui
finit dans un cache ne doit porter un libellé déjà rendu.

Ne jamais traduire les attributions de sources (« Licence Ouverte 2.0 »,
« BAAC / ONISR », « Bordeaux Métropole ») : ce sont des noms légaux de licences
et d'institutions, identiques en anglais. Les laisser tranquilles garde les
réponses /pois/ et /streetlight/ neutres en langue — donc immunisées au piège du
cache partagé, puisqu'elles sont servies en ``public, max-age=3600``.
"""

from i18n.catalog import plural, t
from i18n.http import LocaleMiddleware, etag_for
from i18n.negotiation import DEFAULT_LOCALE, SUPPORTED, get_locale, negotiate

__all__ = [
    "DEFAULT_LOCALE", "SUPPORTED", "get_locale", "negotiate",
    "t", "plural", "etag_for", "LocaleMiddleware",
]
