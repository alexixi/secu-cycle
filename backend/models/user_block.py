from sqlalchemy import Column, Integer, TIMESTAMP, ForeignKey, UniqueConstraint, CheckConstraint
from sqlalchemy.sql import func
from database import Base


class UserBlock(Base):
    """« A ne veut plus voir les contenus de B ».

    Le blocage est stocké côté serveur et non sur l'appareil : les stores
    attendent qu'il suive l'utilisateur, or une liste locale se perd à la
    réinstallation et ne vaut pas entre l'application et le site.

    Relation à sens unique et non réciproque : bloquer quelqu'un masque ses
    signalements pour soi, sans rien changer pour lui.
    """

    __tablename__ = "user_blocks"
    __table_args__ = (
        UniqueConstraint("blocker_id", "blocked_id", name="uq_user_blocks_pair"),
        CheckConstraint("blocker_id <> blocked_id", name="ck_user_blocks_not_self"),
    )

    id = Column(Integer, primary_key=True, index=True)
    blocker_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    blocked_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(TIMESTAMP, server_default=func.now())
