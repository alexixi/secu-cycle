from sqlalchemy import Column, Integer, String, TIMESTAMP, ForeignKey
from sqlalchemy.sql import func
from database import Base


class RefreshSession(Base):
    """Une session = une « famille » de refresh tokens, créée à la connexion.

    À chaque refresh le jeton tourne : `jti` est remplacé, l'ancien passe en
    `prev_jti`. Rejouer un jti périmé (hors fenêtre de grâce) trahit un vol → la
    session est supprimée (révoquée). Le suivi est **par session**, ce qui
    préserve les connexions simultanées sur plusieurs appareils.
    """

    __tablename__ = "refresh_sessions"

    id = Column(Integer, primary_key=True, index=True)
    sid = Column(String(64), unique=True, nullable=False, index=True)
    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    jti = Column(String(64), nullable=False)
    prev_jti = Column(String(64), nullable=True)
    rotated_at = Column(TIMESTAMP, nullable=True)
    expires_at = Column(TIMESTAMP, nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())
