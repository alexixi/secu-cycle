import logging
from datetime import datetime, timedelta

from sqlalchemy import func
from sqlalchemy.exc import IntegrityError

from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from database import get_db
from models.user import User
from models.email_verification import EmailVerification
from models.refresh_session import RefreshSession
from models.route import Route
from models.user_block import UserBlock
from schemas.user import (
    UserCreate, UserRead, UserLogin, UserUpdate, UserAdminUpdate, PasswordChange,
    AccountDelete, UserBlockRead,
    TokenRefresh, EmailVerifyRequest, ResendVerificationRequest,
    ForgotPasswordRequest, ResetPasswordRequest,
    EmailChangeRequest, EmailChangeConfirm, EmailChangeRequested, EmailChangeResult,
)
from fastapi import HTTPException
from utils.security import verify_password, hash_password, create_access_token, create_refresh_token, verify_token
from utils.verification import issue_code, verify_code, consume_code, CODE_TTL
from utils import refresh_sessions
from dependencies import get_current_user, require_admin
from admin_emails import is_user_admin, is_admin_email
from fastapi.security import OAuth2PasswordRequestForm
from limiter import limiter
import mailer
from mailer.templates import (
    verification_email, password_reset_email,
    email_change_code_email, email_change_alert_email, account_deleted_email,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/users", tags=["Users"])

PASSWORD_RESET_PURPOSE = "password_reset"
EMAIL_CHANGE_PURPOSE = "email_change"

EMAIL_CHANGE_COOLDOWN = timedelta(seconds=60)

_DUMMY_PASSWORD_HASH = hash_password("timing-attack-equalizer")


def _send_verification_code(db: Session, user: User) -> None:
    """Émet un code de vérification et l'envoie par e-mail.

    Les erreurs d'envoi sont loguées mais n'interrompent pas l'appelant :
    l'utilisateur pourra toujours demander un renvoi via /users/resend-verification.
    """
    try:
        code = issue_code(db, user)
        subject, html, text = verification_email(code)
        mailer.send_email(user.email, subject, html, text)
    except Exception:
        logger.exception("Échec de l'envoi du code de vérification à %s", user.email)


def _send_reset_code(db: Session, user: User) -> None:
    """Émet un code de réinitialisation de mot de passe et l'envoie par e-mail.

    Les erreurs d'envoi sont loguées mais n'interrompent pas l'appelant :
    l'utilisateur pourra toujours redemander un code via /users/forgot-password.
    """
    try:
        code = issue_code(db, user, purpose=PASSWORD_RESET_PURPOSE)
        subject, html, text = password_reset_email(code)
        mailer.send_email(user.email, subject, html, text)
    except Exception:
        logger.exception("Échec de l'envoi du code de réinitialisation à %s", user.email)


def _purge_user(db: Session, user: User) -> None:
    """Supprime un compte et les données personnelles qui ne partent pas d'elles-mêmes.

    Les cascades sont déclarées côté base (`ondelete=`) : vélos, badges obtenus,
    historique, votes, codes de vérification et sessions de refresh s'effacent
    avec le compte. `routes` et `reports` sont en SET NULL — c'est le
    comportement voulu pour les signalements, qui restent visibles sans lien
    avec leur auteur (politique de confidentialité §7), mais pas pour les
    itinéraires : ils portent les adresses de départ et d'arrivée ainsi que le
    tracé, on les supprime donc explicitement.
    """
    db.query(Route).filter(Route.user_id == user.id).delete(synchronize_session=False)
    db.delete(user)
    db.commit()


def _with_effective_admin(db: Session, user: User) -> User:
    """Reflète `ADMIN_EMAILS` dans le champ `is_admin` renvoyé, sans persister.

    L'instance est détachée de la session pour garantir qu'aucune écriture ne
    parte en base (les endpoints concernés sont en lecture seule).
    """
    db.expunge(user)
    user.is_admin = is_user_admin(user)
    return user

@router.post("/", response_model=UserRead)
@limiter.limit("30/hour")
def create_user(request: Request, user: UserCreate, db: Session = Depends(get_db)):
    db_user = User(
        email=user.email,
        password_hash= hash_password(user.password),
        first_name=user.first_name,
        last_name=user.last_name,
        birth_date=user.birth_date,
        sport_level=user.sport_level,
        home_address=user.home_address,
        work_address=user.work_address
    )
   # print("TYPE PASSWORD:", type(user.password))
   # print("VALUE PASSWORD:", user.password)
    db.add(db_user)
    try:
        db.commit()
        db.refresh(db_user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Cette adresse e-mail est déjà associée à un compte."
        )
    _send_verification_code(db, db_user)
    return db_user

@router.post("/login")
@limiter.limit("5/minute")
def login(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    db_user = db.query(User).filter(User.email == form_data.username).first()

    if not db_user:
        verify_password(form_data.password, _DUMMY_PASSWORD_HASH)
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not verify_password(form_data.password, db_user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not db_user.is_verified:
        raise HTTPException(
            status_code=403,
            detail="Compte non vérifié. Vérifiez votre e-mail.",
        )

    if db_user.is_banned:
        raise HTTPException(
            status_code=403,
            detail="Compte suspendu. Contactez l'administration.",
        )

    token_data = {"sub": str(db_user.id), "tv": db_user.token_version}
    access_token = create_access_token(data=token_data)
    sid, jti = refresh_sessions.create_session(db, db_user.id)
    refresh_token = create_refresh_token(data={**token_data, "sid": sid, "jti": jti})

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }


@router.post("/refresh")
@limiter.limit("30/minute")
def refresh_access_token(request: Request, data: TokenRefresh, db: Session = Depends(get_db)):
    payload = verify_token(data.refresh_token, expected_type="refresh")
    if payload is None:
        raise HTTPException(status_code=401, detail="Refresh token invalide ou expiré")

    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=401, detail="Refresh token invalide")

    try:
        user_id = int(user_id)
    except (TypeError, ValueError):
        raise HTTPException(status_code=401, detail="Refresh token invalide")

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=401, detail="Utilisateur introuvable")

    if user.is_banned:
        raise HTTPException(status_code=403, detail="Compte suspendu.")

    if payload.get("tv", 0) != (user.token_version or 0):
        raise HTTPException(status_code=401, detail="Refresh token révoqué")

    sid = payload.get("sid")
    jti = payload.get("jti")
    new_jti = None
    if sid and jti:
        new_jti = refresh_sessions.rotate(db, sid, jti)
        if new_jti is None:
            raise HTTPException(status_code=401, detail="Refresh token révoqué")

    token_data = {"sub": str(user.id), "tv": user.token_version}
    access_token = create_access_token(data=token_data)

    response = {"access_token": access_token, "token_type": "bearer"}
    if new_jti is not None:
        response["refresh_token"] = create_refresh_token(
            data={**token_data, "sid": sid, "jti": new_jti}
        )
    return response


@router.post("/verify")
@limiter.limit("5/minute")
def verify_email(request: Request, data: EmailVerifyRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if user is None or not verify_code(db, user, data.code):
        raise HTTPException(status_code=400, detail="Code invalide ou expiré.")
    return {"detail": "Compte vérifié."}


@router.post("/resend-verification")
@limiter.limit("3/hour")
def resend_verification(
    request: Request, data: ResendVerificationRequest, db: Session = Depends(get_db)
):
    # Réponse générique dans tous les cas pour ne pas divulguer l'existence d'un compte.
    user = db.query(User).filter(User.email == data.email).first()
    if user is not None and not user.is_verified:
        _send_verification_code(db, user)
    return {"detail": "Si un compte non vérifié existe pour cet e-mail, un code a été envoyé."}


@router.post("/forgot-password")
@limiter.limit("3/hour")
def forgot_password(
    request: Request, data: ForgotPasswordRequest, db: Session = Depends(get_db)
):
    # Réponse générique dans tous les cas pour ne pas divulguer l'existence d'un compte.
    user = db.query(User).filter(User.email == data.email).first()
    if user is not None:
        _send_reset_code(db, user)
    return {"detail": "Si un compte existe pour cet e-mail, un code a été envoyé."}


@router.post("/reset-password")
@limiter.limit("5/minute")
def reset_password(
    request: Request, data: ResetPasswordRequest, db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.email == data.email).first()
    if user is None or not verify_code(
        db, user, data.code, purpose=PASSWORD_RESET_PURPOSE
    ):
        raise HTTPException(status_code=400, detail="Code invalide ou expiré.")

    user.password_hash = hash_password(data.new_password)
    user.is_verified = True
    user.token_version = (user.token_version or 0) + 1
    db.commit()
    return {"detail": "Mot de passe réinitialisé."}


@router.get("/me", response_model=UserRead)
def get_me(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return _with_effective_admin(db, current_user)


@router.patch("/me", response_model=UserRead)
def update_me(
    updates: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    update_data = updates.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="Aucun champ à mettre à jour.")
    for field, value in update_data.items():
        setattr(current_user, field, value)
    db.commit()
    db.refresh(current_user)
    return current_user


@router.patch("/me/password", status_code=204)
def update_password(
    data: PasswordChange,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not verify_password(data.old_password, current_user.password_hash):
        raise HTTPException(status_code=401, detail="Ancien mot de passe incorrect.")
    current_user.password_hash = hash_password(data.new_password)
    db.commit()


@router.get("/me/blocks", response_model=list[UserBlockRead])
def list_my_blocks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Auteurs bloqués par l'appelant, pour pouvoir revenir sur un blocage."""
    return (
        db.query(UserBlock)
        .filter(UserBlock.blocker_id == current_user.id)
        .order_by(UserBlock.created_at.desc())
        .all()
    )


@router.delete("/me/blocks/{blocked_id}", status_code=204)
def unblock_user(
    blocked_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Lève un blocage. Silencieux s'il n'existait pas : l'appelant veut un état
    final, pas un compte rendu."""
    db.query(UserBlock).filter(
        UserBlock.blocker_id == current_user.id,
        UserBlock.blocked_id == blocked_id,
    ).delete(synchronize_session=False)
    db.commit()


@router.delete("/me", status_code=204)
@limiter.limit("5/minute")
def delete_me(
    request: Request,
    data: AccountDelete,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Suppression définitive du compte par son propriétaire.

    Le mot de passe est redemandé : un jeton volé ne doit pas suffire à effacer
    un compte. L'e-mail de confirmation part après coup, en best effort — un
    serveur SMTP indisponible ne doit pas laisser croire que la suppression a
    échoué alors qu'elle est déjà actée.
    """
    if not verify_password(data.password, current_user.password_hash):
        raise HTTPException(status_code=401, detail="Mot de passe incorrect.")

    email = current_user.email
    _purge_user(db, current_user)

    try:
        subject, html, text = account_deleted_email()
        mailer.send_email(email, subject, html, text)
    except Exception:
        logger.exception("Échec de l'envoi de la confirmation de suppression à %s", email)


@router.post("/me/email", response_model=EmailChangeRequested, status_code=202)
@limiter.limit("3/hour")
def request_email_change(
    request: Request,
    data: EmailChangeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Étape 1 : demande de changement d'adresse.

    Le code part vers la NOUVELLE adresse (preuve de possession) ; une alerte
    informative part vers l'ANCIENNE (détection d'une session compromise).
    L'adresse du compte n'est PAS modifiée à ce stade : une faute de frappe est
    donc sans conséquence, l'utilisateur ne reçoit simplement aucun code.
    """
    new_email = data.new_email.strip().lower()

    if not verify_password(data.password, current_user.password_hash):
        raise HTTPException(status_code=401, detail="Mot de passe incorrect.")

    if new_email == (current_user.email or "").lower():
        raise HTTPException(
            status_code=400, detail="Cette adresse est déjà celle de votre compte."
        )

    taken = (
        db.query(User.id)
        .filter(func.lower(User.email) == new_email, User.id != current_user.id)
        .first()
    )
    if taken is not None:
        raise HTTPException(
            status_code=409, detail="Cette adresse e-mail est déjà associée à un compte."
        )

    if is_admin_email(new_email) and not is_admin_email(current_user.email):
        raise HTTPException(
            status_code=409, detail="Cette adresse e-mail est déjà associée à un compte."
        )

    pending = (
        db.query(EmailVerification)
        .filter(
            EmailVerification.user_id == current_user.id,
            EmailVerification.purpose == EMAIL_CHANGE_PURPOSE,
            EmailVerification.consumed_at.is_(None),
        )
        .order_by(EmailVerification.expires_at.desc())
        .first()
    )
    # La fenêtre se calcule depuis `expires_at` (écrit par Python) et non
    # `created_at` (écrit par le now() de la base), pour ne pas dépendre du
    # fuseau horaire de la session Postgres.
    if pending is not None and pending.expires_at is not None:
        issued_at = pending.expires_at - CODE_TTL
        if datetime.utcnow() - issued_at < EMAIL_CHANGE_COOLDOWN:
            raise HTTPException(
                status_code=429,
                detail="Un code vient d'être envoyé. Réessayez dans une minute.",
            )

    old_email = current_user.email
    code = issue_code(
        db, current_user, purpose=EMAIL_CHANGE_PURPOSE, target_email=new_email
    )

    # Les échecs d'envoi sont journalisés sans interrompre : l'utilisateur peut
    # relancer la demande (même contrat que _send_reset_code).
    try:
        subject, html, text = email_change_code_email(code, new_email)
        mailer.send_email(new_email, subject, html, text)
    except Exception:
        logger.exception(
            "Échec de l'envoi du code de changement d'e-mail à %s", new_email
        )

    try:
        subject, html, text = email_change_alert_email(new_email)
        mailer.send_email(old_email, subject, html, text)
    except Exception:
        logger.exception(
            "Échec de l'envoi de l'alerte de changement d'e-mail à %s", old_email
        )

    return EmailChangeRequested(
        detail="Un code de confirmation a été envoyé à la nouvelle adresse.",
        pending_email=new_email,
    )


@router.post("/me/email/confirm", response_model=EmailChangeResult)
@limiter.limit("5/minute")
def confirm_email_change(
    request: Request,
    data: EmailChangeConfirm,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Étape 2 : confirmation par le code reçu sur la nouvelle adresse.

    L'adresse cible est relue en base (scellée à l'émission) : le client ne la
    refournit pas, un code valide ne peut donc pas viser une autre adresse.
    """
    entry = consume_code(db, current_user, data.code, purpose=EMAIL_CHANGE_PURPOSE)
    if entry is None:
        raise HTTPException(status_code=400, detail="Code invalide ou expiré.")

    new_email = entry.target_email
    if not new_email:
        # Ne devrait pas arriver : issue_code scelle toujours l'adresse pour ce purpose.
        logger.error(
            "Code de changement d'e-mail sans adresse cible (entry=%s, user=%s)",
            entry.id, current_user.id,
        )
        raise HTTPException(status_code=400, detail="Demande de changement introuvable.")

    current_user.email = new_email
    current_user.is_verified = True
    # L'adresse est l'identifiant de connexion ET le canal de récupération :
    # on révoque toutes les sessions, puis on en rouvre une pour l'appareil courant.
    current_user.token_version = (current_user.token_version or 0) + 1

    try:
        db.commit()
    except IntegrityError:
        # L'adresse a été prise entre la demande et la confirmation. L'index
        # unique est le seul garde fiable contre cette course ; le contrôle de
        # l'étape 1 n'est qu'un confort d'UX. Le code reste consommé (commit
        # distinct dans consume_code) : pas de rejeu, il faut relancer une demande.
        db.rollback()
        raise HTTPException(
            status_code=409, detail="Cette adresse e-mail est déjà associée à un compte."
        )

    # Les sessions de refresh échouent désormais le contrôle `tv` : on les purge,
    # rien d'autre ne nettoie cette table.
    db.query(RefreshSession).filter(
        RefreshSession.user_id == current_user.id
    ).delete(synchronize_session=False)
    db.commit()

    sid, jti = refresh_sessions.create_session(db, current_user.id)

    # create_session commite, ce qui expire l'instance (expire_on_commit par
    # défaut) : il faut la recharger AVANT de la détacher plus bas, sinon la
    # lecture de ses attributs lèverait DetachedInstanceError.
    db.refresh(current_user)

    token_data = {"sub": str(current_user.id), "tv": current_user.token_version}
    access_token = create_access_token(data=token_data)
    refresh_token = create_refresh_token(data={**token_data, "sid": sid, "jti": jti})

    # _with_effective_admin détache l'instance (db.expunge) : impérativement en
    # dernier, sinon le changement d'adresse serait silencieusement perdu.
    return EmailChangeResult(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user=UserRead.model_validate(_with_effective_admin(db, current_user)),
    )


# --- Administration des utilisateurs (réservé aux admins) ---

@router.get("/", response_model=list[UserRead])
def list_users(
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    users = db.query(User).order_by(User.created_at.desc()).all()
    return [_with_effective_admin(db, u) for u in users]


@router.get("/admins", response_model=list[UserRead])
def list_admins(
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    """Liste des administrateurs effectifs (utilisée pour assigner les tâches)."""
    users = db.query(User).order_by(User.first_name, User.last_name, User.email).all()
    return [_with_effective_admin(db, u) for u in users if is_user_admin(u)]


@router.get("/{user_id}", response_model=UserRead)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable.")
    return _with_effective_admin(db, user)


@router.patch("/{user_id}", response_model=UserRead)
def admin_update_user(
    user_id: int,
    updates: UserAdminUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable.")

    update_data = updates.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="Aucun champ à mettre à jour.")

    # Un admin ne peut pas se retirer à lui-même ses propres droits (évite de se verrouiller dehors).
    if user.id == admin.id and update_data.get("is_admin") is False:
        raise HTTPException(
            status_code=400,
            detail="Vous ne pouvez pas retirer vos propres droits d'administrateur.",
        )

    if user.id == admin.id and (
        update_data.get("is_banned") is True or update_data.get("reports_blocked") is True
    ):
        raise HTTPException(
            status_code=400,
            detail="Vous ne pouvez pas vous sanctionner vous-même.",
        )

    for field, value in update_data.items():
        setattr(user, field, value)
    if update_data.get("is_banned") is True:
        user.token_version = (user.token_version or 0) + 1
    db.commit()
    db.refresh(user)
    return _with_effective_admin(db, user)


@router.delete("/{user_id}", status_code=204)
def admin_delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    if user_id == admin.id:
        raise HTTPException(
            status_code=400,
            detail="Vous ne pouvez pas supprimer votre propre compte.",
        )
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable.")
    _purge_user(db, user)
