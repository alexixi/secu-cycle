"""Génération et vérification des codes envoyés par e-mail.

Le code est stocké haché (SHA-256) : même en cas de fuite de la base, les
codes en clair ne sont pas exposés. La comparaison se fait en temps constant.
"""

import hashlib
import hmac
import secrets
from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from models.email_verification import EmailVerification
from models.user import User

CODE_TTL = timedelta(minutes=15)
DEFAULT_PURPOSE = "email_verification"


def generate_code() -> str:
    """Renvoie un code à 6 chiffres (avec zéros de tête)."""
    return f"{secrets.randbelow(1_000_000):06d}"


def _hash_code(code: str) -> str:
    return hashlib.sha256(code.encode("utf-8")).hexdigest()


def issue_code(db: Session, user: User, purpose: str = DEFAULT_PURPOSE) -> str:
    """Émet un nouveau code pour `user`/`purpose` et renvoie sa valeur en clair.

    Les codes précédents non consommés pour ce couple sont supprimés afin
    qu'un seul code soit valable à la fois.
    """
    db.query(EmailVerification).filter(
        EmailVerification.user_id == user.id,
        EmailVerification.purpose == purpose,
        EmailVerification.consumed_at.is_(None),
    ).delete(synchronize_session=False)

    code = generate_code()
    entry = EmailVerification(
        user_id=user.id,
        code_hash=_hash_code(code),
        purpose=purpose,
        expires_at=datetime.utcnow() + CODE_TTL,
    )
    db.add(entry)
    db.commit()
    return code


def verify_code(
    db: Session, user: User, code: str, purpose: str = DEFAULT_PURPOSE
) -> bool:
    """Valide `code` pour `user`/`purpose`.

    En cas de succès : le code est marqué consommé et, pour une vérification
    d'e-mail, `user.is_verified` passe à True. Renvoie False si aucun code
    valide (inexistant, expiré, déjà consommé ou incorrect).
    """
    entry = (
        db.query(EmailVerification)
        .filter(
            EmailVerification.user_id == user.id,
            EmailVerification.purpose == purpose,
            EmailVerification.consumed_at.is_(None),
        )
        .order_by(EmailVerification.created_at.desc())
        .first()
    )

    if entry is None or entry.expires_at < datetime.utcnow():
        return False

    if not hmac.compare_digest(entry.code_hash, _hash_code(code)):
        return False

    entry.consumed_at = datetime.utcnow()
    if purpose == DEFAULT_PURPOSE:
        user.is_verified = True
    db.commit()
    return True
