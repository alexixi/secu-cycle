"""Exécution d'une campagne de récapitulatifs.

Calqué sur `pois/runner.py`, avec une différence de nature : une synchronisation
POI ratée se relance sans conséquence, un e-mail parti ne se rattrape pas. Tout
ce module est écrit autour de cette asymétrie.

L'ordre des opérations pour un destinataire n'est pas négociable :

1. **réserver** la ligne `recap_sends` et *committer* ;
2. rendre l'e-mail — aucun effet externe, une erreur ici ne fait rien partir ;
3. envoyer ;
4. enregistrer le résultat, immédiatement.

La réservation vient en premier parce que c'est elle qui rend le doublon
impossible : la contrainte d'unicité rejette la seconde tentative, quel que soit
le nombre de processus. Si le conteneur s'arrête entre 3 et 4 — un déploiement
Coolify peut survenir à tout instant — la ligne reste `pending` et sera marquée
`unknown` au redémarrage. On ne la rejoue **jamais** automatiquement : personne ne
peut savoir si l'e-mail est parti, et devant ce doute, ne rien envoyer est le
moindre mal.

Les appels réseau sont synchrones et bloquants : ce module s'appelle depuis
`asyncio.to_thread`, jamais directement depuis la boucle d'événements.
"""

import logging
import os
import time
from datetime import datetime

from sqlalchemy import text, update
from sqlalchemy.sql import func

from database import SessionLocal
from i18n import DEFAULT_LOCALE
from mailer import MailerError, send_email
from mailer.templates import recap_email
from models.recap import (
    ECHOUE,
    EN_COURS,
    ENVOYE,
    IGNORE,
    INDETERMINE,
    MAILER_DESACTIVE,
    SANS_ACTIVITE,
    SETTINGS_ID,
    RecapSend,
    RecapSettings,
)
from recap import periodes, requetes, stats
from utils.badges import libelles as libelles_badge
from utils.unsubscribe import derive_secret, make_token

logger = logging.getLogger(__name__)

# Destinataires traités par tour de boucle. La campagne avance par tranches et
# rend la main entre chacune : l'API n'a qu'un worker, et il doit continuer à
# calculer des itinéraires pendant l'envoi.
TAILLE_LOT = 20

# Pause entre deux envois. Resend limite le débit ; on reste nettement dessous,
# quitte à ce qu'un lot dure une douzaine de secondes.
PAUSE_ENTRE_ENVOIS_S = 0.6

# Au-delà, on considère que le problème n'est pas le destinataire mais le service :
# inutile de brûler la campagne entière ligne par ligne.
ECHECS_CONSECUTIFS_MAX = 5

API_URL_DEFAUT = "https://api.secu-cycle.fr"


def api_url() -> str:
    """Base publique de l'API, cible du lien de désabonnement.

    Valeur par défaut en dur, comme `LOGO_URL` dans les gabarits : la production
    fonctionne sans qu'il faille penser à renseigner une variable de plus.
    """
    return (os.getenv("PUBLIC_API_URL") or API_URL_DEFAUT).rstrip("/")


def secret_desabonnement() -> bytes:
    """Secret de signature des liens de désabonnement.

    Dérivé de `SECRET_KEY` par défaut, mais surchargeable : faire tourner la clé
    applicative est une opération de sécurité normale pour des JWT, et elle ne
    doit pas invalider au passage les liens déjà présents dans les boîtes mail.
    """
    dedie = os.getenv("RECAP_UNSUB_SECRET")
    if dedie:
        return derive_secret(dedie)
    return derive_secret(os.getenv("SECRET_KEY") or "")


def lien_desabonnement(user_id: int, version: int) -> str:
    jeton = make_token(user_id, version, secret_desabonnement())
    return f"{api_url()}/recaps/unsubscribe?u={user_id}&t={jeton}"


def get_settings(db) -> RecapSettings:
    """Réglages de la campagne, créés à la volée s'ils manquent."""
    settings = db.get(RecapSettings, SETTINGS_ID)
    if settings is None:
        settings = RecapSettings(id=SETTINGS_ID, enabled=False)
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings


def fail_stale_sends() -> int:
    """Clôt les envois restés « en cours » après un arrêt du serveur.

    Ils passent en `unknown` et non en `failed` : on ignore si l'e-mail est parti.
    Le nom du statut est le message — il dit à l'administrateur que rejouer ces
    lignes peut produire des doublons, et que c'est à lui d'en décider.
    """
    db = SessionLocal()
    try:
        orphelins = db.execute(
            update(RecapSend)
            .where(RecapSend.status == EN_COURS)
            .values(
                status=INDETERMINE,
                error="Envoi interrompu par un arrêt du serveur : issue inconnue.",
            )
        ).rowcount
        db.commit()
        return orphelins
    finally:
        db.close()


def _reserver(db, user_id: int, genre: str, periode) -> bool:
    """Réserve la ligne d'envoi. `False` si elle existait déjà.

    Même motif que `utils.badges.evaluate_badges` : seule l'insertion réellement
    effectuée renvoie une ligne, ce qui neutralise deux campagnes concurrentes
    sans verrou applicatif.
    """
    reserve = db.execute(text("""
        INSERT INTO recap_sends (user_id, kind, period_start, status)
        VALUES (:uid, :genre, :periode, :statut)
        ON CONFLICT (user_id, kind, period_start) DO NOTHING
        RETURNING id
    """), {"uid": user_id, "genre": genre, "periode": periode, "statut": EN_COURS}).first()
    db.commit()
    return reserve is not None


def _cloturer(db, user_id, genre, periode, statut, **champs) -> None:
    db.execute(
        update(RecapSend)
        .where(
            RecapSend.user_id == user_id,
            RecapSend.kind == genre,
            RecapSend.period_start == periode,
        )
        .values(status=statut, **champs)
    )
    db.commit()


def _envoyer_un(db, destinataire, genre, debut, debut_precedent, periode, badges) -> str:
    """Traite un destinataire déjà réservé. Renvoie le statut retenu.

    Les libellés de période sont calculés ici et non une fois pour le lot :
    deux destinataires du même lot n'ont pas forcément la même langue, et un
    « juillet 2026 » calculé en amont partirait tel quel à un anglophone.
    """
    user_id = destinataire["id"]
    locale = destinataire.get("language") or DEFAULT_LOCALE

    libelle = periodes.libelle_periode(genre, debut, locale)
    libelle_precedent = periodes.libelle_periode_precedente(genre, debut_precedent, locale)

    badges = [{**badge, **libelles_badge(badge, locale)} for badge in badges]
    resume = stats.resume(destinataire, badges, libelle_precedent, locale)
    if not resume["trajets"]:
        # Ne peut normalement pas arriver — la requête ne renvoie que des
        # utilisateurs actifs — mais un récapitulatif vide est précisément le
        # message qui fait signaler l'expéditeur comme indésirable.
        _cloturer(db, user_id, genre, periode, IGNORE, skip_reason=SANS_ACTIVITE)
        return IGNORE

    lien = lien_desabonnement(user_id, destinataire["recap_unsub_version"])
    sujet, html, texte = recap_email(
        genre, libelle, destinataire.get("first_name"), resume, lien, locale,
    )

    message_id = send_email(
        destinataire["email"],
        sujet,
        html,
        texte,
        headers={
            # Les chevrons sont exigés par la RFC 2369 : sans eux, l'en-tête est
            # ignoré en silence et le bouton natif du client n'apparaît pas.
            "List-Unsubscribe": f"<{lien}>",
            "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
    )

    if message_id is None:
        # Aucune clé Resend : rien n'est parti. Marquer `sent` ici remplirait la
        # table de faux positifs en préproduction, et masquerait l'absence de
        # configuration jusqu'au jour où quelqu'un s'étonne de ne rien recevoir.
        _cloturer(db, user_id, genre, periode, IGNORE, skip_reason=MAILER_DESACTIVE)
        return IGNORE

    _cloturer(db, user_id, genre, periode, ENVOYE,
              provider_message_id=message_id or None, sent_at=func.now())
    return ENVOYE


def traiter_lot(genre: str, debut, fin, debut_precedent, taille=TAILLE_LOT) -> dict:
    """Traite un lot de destinataires. Bloquant : appeler via `asyncio.to_thread`.

    Renvoie le décompte par statut, ainsi que `restants`, qui indique si un lot
    complet a été servi — auquel cas il reste probablement du monde.
    """
    periode = debut.date()

    compte = {ENVOYE: 0, IGNORE: 0, ECHOUE: 0}
    echecs_consecutifs = 0

    db = SessionLocal()
    try:
        lot = requetes.destinataires(db, genre, periode, debut, fin, debut_precedent, taille)
        if not lot:
            return {**compte, "restants": False}

        badges = requetes.badges_par_utilisateur(
            db, [d["id"] for d in lot], debut, fin
        )

        for destinataire in lot:
            user_id = destinataire["id"]

            if not _reserver(db, user_id, genre, periode):
                continue

            try:
                statut = _envoyer_un(
                    db, destinataire, genre, debut, debut_precedent,
                    periode, badges.get(user_id, []),
                )
                compte[statut] = compte.get(statut, 0) + 1
                echecs_consecutifs = 0
            except MailerError as exc:
                if exc.status_code in (401, 403):
                    # Clé révoquée ou expirée : le problème est la configuration,
                    # pas ce destinataire. Poursuivre condamnerait toute la
                    # campagne, un échec à la fois.
                    _cloturer(db, user_id, genre, periode, ECHOUE, error=str(exc))
                    compte[ECHOUE] += 1
                    logger.error("Récapitulatifs : authentification Resend refusée, lot interrompu.")
                    break
                _cloturer(db, user_id, genre, periode, ECHOUE, error=str(exc))
                compte[ECHOUE] += 1
                echecs_consecutifs += 1
            except Exception as exc:  # réseau, rendu, base
                _cloturer(db, user_id, genre, periode, ECHOUE, error=str(exc)[:2000])
                compte[ECHOUE] += 1
                echecs_consecutifs += 1
                logger.exception("Récapitulatif non envoyé à l'utilisateur %s", user_id)

            if echecs_consecutifs >= ECHECS_CONSECUTIFS_MAX:
                logger.error(
                    "Récapitulatifs : %s échecs d'affilée, lot interrompu.",
                    echecs_consecutifs,
                )
                break

            time.sleep(PAUSE_ENTRE_ENVOIS_S)

        return {**compte, "restants": len(lot) == taille}
    finally:
        db.close()


def campagne_due(maintenant: datetime | None = None):
    """Période à traiter, ou `None` si la campagne est coupée ou hors fenêtre.

    Le réglage est relu à chaque appel, jamais mis en cache : couper une campagne
    en cours doit prendre effet au tour suivant, pas au prochain déploiement.
    """
    db = SessionLocal()
    try:
        if not get_settings(db).enabled:
            return None
    finally:
        db.close()

    return periodes.periode_due(maintenant or datetime.now())
