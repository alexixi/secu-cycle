"""Quelle période récapituler, et à quel moment l'envoyer.

Module volontairement sans dépendance à la base ni au réseau : ces règles sont
celles qui décident qu'un e-mail part, et une règle qui décide d'un effet externe
irréversible mérite d'être vérifiable en une milliseconde.

Trois décisions y sont encodées.

**La fenêtre d'envoi est bornée aux cinq premiers jours du mois.** C'est ce qui
dispense de toute logique de rattrapage : un serveur arrêté deux semaines ne se
réveille pas en expédiant une campagne périmée, il ne fait simplement rien.

**Rien avant huit heures du matin.** Une réception nocturne est un signal de spam,
et la délivrabilité du domaine sert aussi aux codes de vérification.

**En janvier, le bilan annuel remplace le récapitulatif de décembre.** Deux
e-mails le même matin, c'est ce qui déclenche les plaintes ; et décembre figure de
toute façon dans le bilan de l'année.
"""

from datetime import datetime

import pytz

from i18n import DEFAULT_LOCALE, t

FUSEAU = pytz.timezone("Europe/Paris")

MENSUEL = "monthly"
ANNUEL = "yearly"

# Jusqu'au 5 du mois inclus, et pas avant 8 h locales.
DERNIER_JOUR = 5
HEURE_MINIMALE = 8

def _minuit_local(annee: int, mois: int) -> datetime:
    """Premier instant d'un mois, en heure de Paris.

    `localize` plutôt que `replace(tzinfo=…)` : pytz porterait sinon l'ancien
    décalage LMT de Paris (9 minutes et 21 secondes), une erreur silencieuse qui
    décalerait les bornes de la période.
    """
    return FUSEAU.localize(datetime(annee, mois, 1))


def _mois_precedent(annee: int, mois: int) -> tuple[int, int]:
    return (annee - 1, 12) if mois == 1 else (annee, mois - 1)


def periode_due(maintenant: datetime):
    """Période à récapituler à cet instant, ou `None` s'il n'y a rien à faire.

    Renvoie `(genre, debut, fin, debut_precedent)`. Les trois bornes sont des
    instants localisés : `debut <= completed_at < fin` délimite la période
    couverte, et `debut_precedent <= completed_at < debut` la période de
    comparaison, celle qui permet d'écrire « plus qu'en juin ».

    :param maintenant: instant courant. Un `datetime` naïf est lu comme une heure
        de Paris — l'appelant est la boucle de fond, dont l'horloge est celle du
        serveur.
    """
    local = (
        FUSEAU.localize(maintenant)
        if maintenant.tzinfo is None
        else maintenant.astimezone(FUSEAU)
    )

    if local.day > DERNIER_JOUR:
        return None
    if local.day == 1 and local.hour < HEURE_MINIMALE:
        return None

    if local.month == 1:
        # Le bilan annuel absorbe décembre : voir le préambule du module.
        return (
            ANNUEL,
            _minuit_local(local.year - 1, 1),
            _minuit_local(local.year, 1),
            _minuit_local(local.year - 2, 1),
        )

    annee, mois = _mois_precedent(local.year, local.month)
    annee_prec, mois_prec = _mois_precedent(annee, mois)
    return (
        MENSUEL,
        _minuit_local(annee, mois),
        _minuit_local(local.year, local.month),
        _minuit_local(annee_prec, mois_prec),
    )


def _mois(debut: datetime, locale: str) -> str:
    """Nom du mois, tiré du catalogue et jamais du module `locale`.

    C'est la raison pour laquelle les mois ne sont pas obtenus par `strftime` :
    la locale d'un conteneur n'est pas garantie, et un récapitulatif intitulé
    « July 2026 » chez certains utilisateurs seulement serait un défaut
    difficile à reproduire. Le catalogue, lui, est du JSON versionné.
    """
    return t(f"email.recap.month.{debut.month}", locale)


def libelle_periode(genre: str, debut: datetime, locale: str = DEFAULT_LOCALE) -> str:
    """Nom lisible de la période, tel qu'il apparaît dans l'e-mail.

    Étiquette nue — « juillet 2026 », « 2026 » — et jamais une locution : la
    préposition et l'article vivent dans le catalogue, où le français et
    l'anglais ne les découpent pas de la même façon.
    """
    if genre == ANNUEL:
        return str(debut.year)
    return f"{_mois(debut, locale)} {debut.year}"


def libelle_periode_precedente(genre: str, debut_precedent: datetime,
                               locale: str = DEFAULT_LOCALE) -> str:
    """Nom de la période de comparaison, pour la phrase « plus qu'en juin »."""
    if genre == ANNUEL:
        return str(debut_precedent.year)
    return _mois(debut_precedent, locale)
