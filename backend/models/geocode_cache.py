from sqlalchemy import Column, Integer, String, JSON, TIMESTAMP, UniqueConstraint, Index
from sqlalchemy.sql import func

from database import Base


class GeocodeCache(Base):
    """Réponses de géocodage mémorisées, tous providers confondus."""

    __tablename__ = "geocode_cache"

    id = Column(Integer, primary_key=True, index=True)

    kind = Column(String(16), nullable=False)
    query = Column(String(255), nullable=False)
    profile = Column(String(64), nullable=False)

    results = Column(JSON, nullable=False)

    fetched_at = Column(TIMESTAMP, server_default=func.now(), nullable=False)

    __table_args__ = (
        UniqueConstraint("kind", "query", "profile", name="uq_geocode_cache_key"),
        Index("ix_geocode_cache_fetched_at", "fetched_at"),
    )


class GeocodeUsage(Base):
    """Compteur mensuel d'appels sortants facturés (MapTiler)."""

    __tablename__ = "geocode_usage"

    id = Column(Integer, primary_key=True, index=True)

    provider = Column(String(32), nullable=False)
    period = Column(String(7), nullable=False)
    calls = Column(Integer, nullable=False, default=0)

    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        UniqueConstraint("provider", "period", name="uq_geocode_usage_period"),
    )
