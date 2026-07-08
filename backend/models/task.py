from sqlalchemy import Column, Integer, String, Text, TIMESTAMP, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
from models.tag import task_tags


# Statuts (colonnes du planning). Doit rester synchronisé avec le frontend.
TASK_STATUSES = ("a_faire", "en_cours", "fait")

# Niveaux de priorité (facultatif). Doit rester synchronisé avec le frontend.
TASK_PRIORITIES = ("urgent", "moyenne", "peu_urgent")


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False, default="")
    status = Column(String(20), nullable=False, default="a_faire")
    # Priorité facultative : NULL = non renseignée.
    priority = Column(String(20), nullable=True)
    # Position dans la colonne (statut) pour l'ordre d'affichage.
    position = Column(Integer, nullable=False, default=0)

    assignee_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    assignee = relationship("User", foreign_keys=[assignee_id], lazy="joined")
    tags = relationship("Tag", secondary=task_tags, lazy="joined")
