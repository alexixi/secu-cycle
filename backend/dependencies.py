from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from database import get_db
from i18n import get_locale, t
from models.user import User
from utils.security import verify_token
from admin_emails import is_user_admin

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="users/login")

SESSION_INVALID = {"X-Auth-Error": "session_invalid"}


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
    locale: str = Depends(get_locale),
):
    payload = verify_token(token)

    if payload is None:
        raise HTTPException(status_code=401, detail=t("error.auth.invalid_token", locale), headers=SESSION_INVALID)

    user_id = payload.get("sub")

    if user_id is None:
        raise HTTPException(status_code=401, detail=t("error.auth.invalid_token_payload", locale), headers=SESSION_INVALID)

    try:
        user_id = int(user_id)
    except (TypeError, ValueError):
        raise HTTPException(status_code=401, detail=t("error.auth.invalid_token_payload", locale), headers=SESSION_INVALID)

    user = db.query(User).filter(User.id == user_id).first()

    if user is None:
        raise HTTPException(status_code=404, detail=t("error.auth.user_not_found", locale))

    if user.is_banned:
        raise HTTPException(status_code=401, detail=t("error.auth.account_suspended", locale), headers=SESSION_INVALID)

    if payload.get("tv", 0) != (user.token_version or 0):
        raise HTTPException(status_code=401, detail=t("error.auth.token_revoked", locale), headers=SESSION_INVALID)

    return user


def require_admin(
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
):
    if not is_user_admin(current_user):
        raise HTTPException(status_code=403, detail=t("error.auth.admin_only", locale))
    return current_user


oauth2_scheme_optional = OAuth2PasswordBearer(tokenUrl="users/login", auto_error=False)

def get_current_user_optional(
    token: str = Depends(oauth2_scheme_optional),
    db: Session = Depends(get_db),
    locale: str = Depends(get_locale),
):
    if not token:
        return None
    return get_current_user(token=token, db=db, locale=locale)
