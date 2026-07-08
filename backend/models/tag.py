from sqlalchemy import Column, Integer, String, TIMESTAMP, ForeignKey, Table
from sqlalchemy.sql import func
from database import Base


# Table d'association many-to-many entre les tâches et les étiquettes.
task_tags = Table(
    "task_tags",
    Base.metadata,
    Column("task_id", Integer, ForeignKey("tasks.id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", Integer, ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True),
)


class Tag(Base):
    """Étiquette de thème réutilisable, applicable à plusieurs tâches."""

    __tablename__ = "tags"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), nullable=False, unique=True)
    # Couleur au format hexadécimal (#RRGGBB).
    color = Column(String(7), nullable=False)

    created_at = Column(TIMESTAMP, server_default=func.now())
