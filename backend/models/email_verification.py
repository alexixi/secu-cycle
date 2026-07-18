from sqlalchemy import Column, Integer, String, Text, TIMESTAMP, ForeignKey
from sqlalchemy.sql import func
from database import Base


class EmailVerification(Base):
    """Code à usage unique envoyé par e-mail.

    Le champ `purpose` rend la table réutilisable pour d'autres flux
    (ex. réinitialisation de mot de passe) sans en changer le schéma.
    Le code n'est jamais stocké en clair (voir `utils/verification.py`).
    """

    __tablename__ = "email_verifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    code_hash = Column(Text, nullable=False)
    purpose = Column(String(50), nullable=False, default="email_verification")
    expires_at = Column(TIMESTAMP, nullable=False)
    consumed_at = Column(TIMESTAMP, nullable=True)
    attempts = Column(Integer, nullable=False, server_default="0", default=0)
    created_at = Column(TIMESTAMP, server_default=func.now())
