"""Récapitulatifs périodiques : désabonnement public et pilotage administrateur.

Le désabonnement tient en deux endpoints qui se ressemblent et ne font pas du
tout la même chose, et cette dissymétrie est le point le plus important du
fichier :

    GET  /recaps/unsubscribe  → affiche une page. N'écrit rien.
    POST /recaps/unsubscribe  → désabonne.

Outlook SafeLinks, les antivirus de messagerie et les proxys d'images visitent en
`GET` les liens qu'ils trouvent dans un message, sans que personne n'ait cliqué.
Un `GET` qui désabonnerait retirerait donc du service des gens qui n'ont rien
demandé, et le ferait silencieusement. Le `POST` sert d'un même mouvement le
bouton de la page de confirmation et le désabonnement en un clic des clients de
messagerie (RFC 8058) : le jeton voyageant dans l'URL, aucun corps de requête
n'est nécessaire.
"""

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import HTMLResponse
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from database import get_db
from dependencies import require_admin
from i18n import DEFAULT_LOCALE, get_locale, t
from limiter import limiter
from mailer import send_email
from mailer.templates import (
    recap_email,
    unsubscribe_confirm_page,
    unsubscribe_done_page,
    unsubscribe_invalid_page,
)
from models.recap import RecapSend
from models.user import User
from recap import periodes, requetes, runner, stats
from utils.badges import libelles as libelles_badge
from schemas.recap import (
    RecapPeriodStatus,
    RecapPreviewRequest,
    RecapPreviewResponse,
    RecapSettingsRead,
    RecapSettingsUpdate,
    RecapStatus,
)
from utils.unsubscribe import check_token

router = APIRouter(prefix="/recaps", tags=["Recaps"])


def _utilisateur_du_lien(db: Session, user_id: int, token: str) -> User | None:
    """Utilisateur désigné par un lien de désabonnement, si le jeton concorde."""
    utilisateur = db.get(User, user_id)
    if utilisateur is None:
        return None
    if not check_token(user_id, utilisateur.recap_unsub_version, token,
                       runner.secret_desabonnement()):
        return None
    return utilisateur


@router.get("/unsubscribe", response_class=HTMLResponse)
@limiter.limit("60/minute")
def unsubscribe_page(
    request: Request,
    u: int = Query(...),
    t: str = Query(...),
    db: Session = Depends(get_db),
    locale: str = Depends(get_locale),
):
    """Page de confirmation. Ne modifie rien : voir le préambule du module.

    La limite est volontairement large : les visites automatiques arrivent depuis
    un petit nombre d'adresses (Gmail, Outlook), et un désabonnement bloqué par
    un rate-limit se transforme en signalement de spam.
    """
    utilisateur = _utilisateur_du_lien(db, u, t)
    if utilisateur is None:
        # Personne dont lire la préférence : on retombe sur la langue négociée.
        return HTMLResponse(unsubscribe_invalid_page(locale), status_code=400)

    return HTMLResponse(unsubscribe_confirm_page(
        f"{runner.api_url()}/recaps/unsubscribe?u={u}&t={t}",
        utilisateur.language or DEFAULT_LOCALE,
    ))


@router.post("/unsubscribe", response_class=HTMLResponse)
@limiter.limit("60/minute")
def unsubscribe(
    request: Request,
    u: int = Query(...),
    t: str = Query(...),
    db: Session = Depends(get_db),
    locale: str = Depends(get_locale),
):
    """Désabonne. Sert le formulaire de confirmation comme le clic natif du client.

    Un compte supprimé renvoie la même page de succès qu'un désabonnement réel :
    répondre 404 divulguerait l'existence d'un compte à qui détient le lien, et
    inquiéterait pour rien quelqu'un qui a simplement supprimé le sien.

    Un jeton illisible, lui, renvoie une erreur franche. Afficher « c'est fait »
    sur un lien tronqué par un client de messagerie serait le pire des cas : la
    personne croirait être désabonnée et continuerait de recevoir les envois.
    """
    utilisateur = _utilisateur_du_lien(db, u, t)
    if utilisateur is None:
        if db.get(User, u) is None:
            return HTMLResponse(unsubscribe_done_page(locale))
        return HTMLResponse(unsubscribe_invalid_page(locale), status_code=400)

    # Idempotent : un second clic ne change rien et affiche la même page.
    utilisateur.recap_emails = False
    db.commit()

    return HTMLResponse(unsubscribe_done_page(utilisateur.language or DEFAULT_LOCALE))


@router.get("/admin/settings", response_model=RecapSettingsRead)
def get_recap_settings(db: Session = Depends(get_db), _admin: User = Depends(require_admin)):
    return runner.get_settings(db)


@router.patch("/admin/settings", response_model=RecapSettingsRead)
def update_recap_settings(
    updates: RecapSettingsUpdate,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
    locale: str = Depends(get_locale),
):
    """Active ou coupe l'envoi automatique.

    C'est le geste qui met la fonctionnalité en service : le code est déployé
    inerte, et rien ne part tant que ce réglage n'a pas été basculé à la main.
    """
    donnees = updates.model_dump(exclude_unset=True)
    if not donnees:
        raise HTTPException(status_code=400, detail=t("error.common.no_fields", locale))

    settings = runner.get_settings(db)
    for champ, valeur in donnees.items():
        setattr(settings, champ, valeur)
    db.commit()
    db.refresh(settings)
    return settings


@router.get("/admin/status", response_model=RecapStatus)
def recap_status(
    limit: int = Query(6, ge=1, le=50),
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    """État des dernières campagnes, agrégé par statut.

    C'est ce qui permet de répondre à « untel n'a rien reçu » : la ligne existe et
    dit pourquoi — pas d'activité, échec d'envoi, ou issue indéterminée après un
    redémarrage.
    """
    lignes = db.execute(
        select(
            RecapSend.kind,
            RecapSend.period_start,
            RecapSend.status,
            func.count().label("total"),
        )
        .group_by(RecapSend.kind, RecapSend.period_start, RecapSend.status)
        .order_by(RecapSend.period_start.desc())
    ).all()

    campagnes: dict = {}
    for kind, period_start, statut, total in lignes:
        cle = (kind, period_start)
        campagne = campagnes.setdefault(
            cle, RecapPeriodStatus(kind=kind, period_start=period_start)
        )
        if hasattr(campagne, statut):
            setattr(campagne, statut, total)

    due = periodes.periode_due(datetime.now())
    return RecapStatus(
        enabled=runner.get_settings(db).enabled,
        periode_courante=periodes.libelle_periode(due[0], due[1]) if due else None,
        campagnes=sorted(campagnes.values(), key=lambda c: c.period_start, reverse=True)[:limit],
    )


def _rendre_pour(db: Session, user_id: int, genre: str | None, locale: str):
    """Rend le récapitulatif d'un utilisateur, sans rien envoyer ni enregistrer.

    Hors fenêtre d'envoi, on retombe sur le mois précédent : cet outil sert
    justement à relire un rendu n'importe quand, pas seulement les cinq premiers
    jours du mois.
    """
    due = periodes.periode_due(datetime.now())
    if due is None:
        maintenant = datetime.now()
        due = periodes.periode_due(maintenant.replace(day=1, hour=12, minute=0))
    if due is None:
        raise HTTPException(status_code=503, detail=t("error.recap.no_period", locale))

    genre_effectif = genre or due[0]
    _, debut, fin, debut_precedent = due
    periode = debut.date()

    # Large, et sans écarter ceux déjà servis : on cherche une personne précise
    # pour relire son e-mail, pas le prochain lot d'envoi.
    lot = requetes.destinataires(
        db, genre_effectif, periode, debut, fin, debut_precedent, 500,
        exclure_servis=False,
    )
    ligne = next((d for d in lot if d["id"] == user_id), None)
    if ligne is None:
        raise HTTPException(
            status_code=404,
            detail=t("error.recap.no_recap", locale),
        )

    # La langue est celle du destinataire, jamais celle de l'administrateur : cet
    # outil sert à relire ce que la personne reçoit, et le dashboard force lang=fr.
    langue = ligne.get("language") or DEFAULT_LOCALE

    badges = requetes.badges_par_utilisateur(db, [user_id], debut, fin).get(user_id, [])
    badges = [{**badge, **libelles_badge(badge, langue)} for badge in badges]
    resume = stats.resume(
        ligne, badges,
        periodes.libelle_periode_precedente(genre_effectif, debut_precedent, langue),
        langue,
    )
    return recap_email(
        genre_effectif,
        periodes.libelle_periode(genre_effectif, debut, langue),
        ligne.get("first_name"),
        resume,
        runner.lien_desabonnement(user_id, ligne["recap_unsub_version"]),
        langue,
    )


@router.post("/admin/preview", response_model=RecapPreviewResponse)
def preview_recap(
    data: RecapPreviewRequest,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
    locale: str = Depends(get_locale),
):
    """Rend le récapitulatif d'un utilisateur sans l'envoyer.

    L'outil de diagnostic principal : il montre exactement ce que la personne
    recevrait, sans effet de bord et sans consommer sa période.
    """
    sujet, html, texte = _rendre_pour(db, data.user_id, data.kind, locale)
    return RecapPreviewResponse(subject=sujet, html=html, text=texte)


@router.post("/admin/test", status_code=202)
def test_recap(
    data: RecapPreviewRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
    locale: str = Depends(get_locale),
):
    """Envoie un récapitulatif à l'administrateur appelant, et à lui seul.

    L'adresse de destination n'est délibérément pas un paramètre : un endpoint
    authentifié capable d'expédier un message composé à une adresse arbitraire,
    avec le domaine du projet comme expéditeur, serait un relais de spam.

    Aucune ligne `recap_sends` n'est créée : un test ne consomme la période de
    personne.
    """
    sujet, html, texte = _rendre_pour(db, data.user_id, data.kind, locale)
    send_email(admin.email, f"[Test] {sujet}", html, texte)
    return {"detail": t("message.recap_test_sent", locale, email=admin.email)}
