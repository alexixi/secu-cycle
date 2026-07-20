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

MAX_ATTEMPTS = 4


def generate_code() -> str:
    """Renvoie un code à 6 chiffres (avec zéros de tête)."""
    return f"{secrets.randbelow(1_000_000):06d}"


def _hash_code(code: str) -> str:
    return hashlib.sha256(code.encode("utf-8")).hexdigest()


def issue_code(
    db: Session,
    user: User,
    purpose: str = DEFAULT_PURPOSE,
    target_email: str | None = None,
) -> str:
    """Émet un nouveau code pour `user`/`purpose` et renvoie sa valeur en clair.

    Les codes précédents non consommés pour ce couple sont supprimés afin
    qu'un seul code soit valable à la fois.

    `target_email` scelle une adresse cible dans le code émis (changement
    d'adresse) : elle est relue côté serveur à la confirmation, jamais
    refournie par le client.
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
        target_email=target_email,
        expires_at=datetime.utcnow() + CODE_TTL,
    )
    db.add(entry)
    db.commit()
    return code


def verify_code(
    db: Session, user: User, code: str, purpose: str = DEFAULT_PURPOSE
) -> bool:
    """Valide `code` pour `user`/`purpose`. Voir `consume_code`."""
    return consume_code(db, user, code, purpose) is not None


def consume_code(
    db: Session, user: User, code: str, purpose: str = DEFAULT_PURPOSE
) -> EmailVerification | None:
    """Valide `code` pour `user`/`purpose`.

    En cas de succès : le code est marqué consommé et, pour une vérification
    d'e-mail, `user.is_verified` passe à True. Renvoie la ligne consommée —
    les appelants ayant scellé une adresse cible y lisent `target_email` — ou
    None si aucun code valide (inexistant, expiré, déjà consommé, incorrect,
    ou trop d'essais).
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
        return None

    if not hmac.compare_digest(entry.code_hash, _hash_code(code)):
        entry.attempts = (entry.attempts or 0) + 1
        if entry.attempts >= MAX_ATTEMPTS:
            entry.consumed_at = datetime.utcnow()
        db.commit()
        return None

    entry.consumed_at = datetime.utcnow()
    if purpose == DEFAULT_PURPOSE:
        user.is_verified = True
    db.commit()
    return entry
