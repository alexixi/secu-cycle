from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.sql import func
from database import Base



class Badge(Base):
    __tablename__ = "badges"

    id = Column(Integer, primary_key=True, index=True)
    # Nullable : la table peut préexister avec des lignes, un ADD COLUMN NOT NULL
    # sans défaut échouerait. En Postgres les NULL sont distincts, l'index unique les tolère.
    code = Column(String(50), unique=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    criteria = Column(String(50))  # routes_completed / safe_routes_completed / total_distance_km
    icon = Column(String(50))
    goal_value = Column(Integer)


class UserBadge(Base):
    __tablename__ = "user_badges"

    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    badge_id = Column(Integer, ForeignKey("badges.id", ondelete="CASCADE"), primary_key=True)
    obtained_at = Column(DateTime(timezone=True), server_default=func.now())
