from sqlalchemy import (
    Column, Integer, String, Float, Boolean, Date, JSON, TIMESTAMP,
    UniqueConstraint, Index,
)
from sqlalchemy.sql import func, expression
from database import Base


ACCIDENT_SOURCES = ("baac", "statbel")

SOURCE_BY_COUNTRY = {"fr": "baac", "be": "statbel"}

SOURCE_ATTRIBUTIONS = {
    "baac": "BAAC / ONISR — Licence Ouverte 2.0",
    "statbel": "Statbel — CC BY 4.0",
}

SEVERITY_BY_BAAC_GRAV = {1: 0, 4: 1, 3: 3, 2: 10}

SEVERITY_LABELS = {0: "indemne", 1: "blessé léger", 3: "blessé hospitalisé", 10: "tué"}


class RoadAccident(Base):
    """Un accident corporel géolocalisé, tel que publié par une source officielle. """

    __tablename__ = "road_accidents"

    id = Column(Integer, primary_key=True, index=True)

    source = Column(String(20), nullable=False)
    source_ref = Column(String(64), nullable=False)
    country = Column(String(2), nullable=False)

    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)

    occurred_on = Column(Date, nullable=True)
    severity = Column(Integer, nullable=False, server_default="1")

    involves_bicycle = Column(Boolean, nullable=False, server_default=expression.true())

    properties = Column(JSON, nullable=True)

    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        UniqueConstraint("source", "source_ref", name="uq_road_accidents_source_ref"),
        Index("ix_road_accidents_lat_lon", "latitude", "longitude"),
        Index("ix_road_accidents_occurred_on", "occurred_on"),
    )
