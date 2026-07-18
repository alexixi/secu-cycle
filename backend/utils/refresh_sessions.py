"""Rotation des refresh tokens par session, avec détection de réutilisation.

Chaque connexion crée une session (famille de refresh tokens). Chaque refresh
fait tourner le jeton : un nouveau `jti` remplace l'ancien. Rejouer un `jti`
périmé hors fenêtre de grâce trahit un vol → la session est révoquée.
"""

import secrets
from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from models.refresh_session import RefreshSession
from utils.security import REFRESH_TOKEN_EXPIRE_MINUTES

GRACE_SECONDS = 30


def _new_id() -> str:
    return secrets.token_urlsafe(16)


def create_session(db: Session, user_id: int) -> tuple[str, str]:
    """Ouvre une nouvelle session de refresh et renvoie (sid, jti)."""
    sid = _new_id()
    jti = _new_id()
    db.add(
        RefreshSession(
            sid=sid,
            user_id=user_id,
            jti=jti,
            expires_at=datetime.utcnow() + timedelta(minutes=REFRESH_TOKEN_EXPIRE_MINUTES),
        )
    )
    db.commit()
    return sid, jti


def rotate(db: Session, sid: str, jti: str) -> str | None:
    """Valide et fait tourner le refresh token d'une session.

    Renvoie le nouveau `jti` à placer dans le refresh token émis, ou None si la
    session est invalide/expirée/révoquée (l'appelant renvoie alors 401).
    """
    session = (
        db.query(RefreshSession).filter(RefreshSession.sid == sid).first()
    )
    if session is None or session.expires_at < datetime.utcnow():
        return None

    if jti == session.jti:
        session.prev_jti = session.jti
        session.jti = _new_id()
        session.rotated_at = datetime.utcnow()
        db.commit()
        return session.jti

    if (
        session.prev_jti is not None
        and jti == session.prev_jti
        and session.rotated_at is not None
        and (datetime.utcnow() - session.rotated_at).total_seconds() < GRACE_SECONDS
    ):
        return session.jti

    db.delete(session)
    db.commit()
    return None
