from sqlalchemy import (
    Column, Integer, BigInteger, String, Text, Boolean, JSON, TIMESTAMP,
    ForeignKey, Index,
)
from sqlalchemy.sql import func
from database import Base


BUILD_STATUSES = ("running", "success", "failed")


class GraphProfile(Base):
    """Une emprise géographique nommée, à partir de laquelle un graphe est construit."""

    __tablename__ = "graph_profiles"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String(64), nullable=False, unique=True)

    communes = Column(JSON, nullable=False, default=list)

    is_default = Column(Boolean, nullable=False, default=False)

    # Fenêtre d'extinction de l'éclairage public (heures locales, 0–24), repli
    # quand une voie ne porte pas d'horaire OSM `lit:conditional`. NULL = repli
    # sur NIGHT_EXTINCTION_WINDOW ; start == end = pas d'extinction.
    night_extinction_start = Column(Integer, nullable=True)
    night_extinction_end = Column(Integer, nullable=True)

    nodes = Column(Integer, nullable=True)
    edges = Column(Integer, nullable=True)
    size_bytes = Column(BigInteger, nullable=True)
    built_at = Column(TIMESTAMP, nullable=True)
    built_communes = Column(JSON, nullable=True)

    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())


class GraphBuildRun(Base):
    """Trace d'une génération de graphe, réussie ou non."""

    __tablename__ = "graph_build_runs"

    id = Column(Integer, primary_key=True, index=True)

    profile_id = Column(
        Integer, ForeignKey("graph_profiles.id", ondelete="CASCADE"), nullable=False
    )
    profile_name = Column(String(64), nullable=False)

    status = Column(String(10), nullable=False, default="running")

    step = Column(String(40), nullable=True)
    progress = Column(Integer, nullable=True)

    started_at = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    finished_at = Column(TIMESTAMP, nullable=True)

    nodes = Column(Integer, nullable=True)
    edges = Column(Integer, nullable=True)
    size_bytes = Column(BigInteger, nullable=True)

    error = Column(Text, nullable=True)

    __table_args__ = (
        Index("ix_graph_build_runs_started_at", "started_at"),
    )


class CommuneGeometry(Base):
    """Cache des contours de communes géocodés via Nominatim.

    Nominatim est limité à environ une requête par seconde : sans ce cache,
    afficher l'emprise d'un profil de 43 communes prendrait presque une minute
    et risquerait un bannissement.
    """

    __tablename__ = "commune_geometries"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String(255), nullable=False, unique=True)
    geojson = Column(JSON, nullable=False)

    fetched_at = Column(TIMESTAMP, server_default=func.now())
