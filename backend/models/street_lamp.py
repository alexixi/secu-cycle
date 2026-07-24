from sqlalchemy import (
    Column, Integer, String, Float, JSON, TIMESTAMP,
    UniqueConstraint, Index,
)
from sqlalchemy.sql import func
from database import Base


# Sources de points lumineux. `osm` est universel (tous profils) ; les autres
# sont des jeux open data locaux qui densifient une métropole donnée.
STREET_LAMP_SOURCES = ("osm", "bordeaux", "nantes", "strasbourg")

SOURCE_ATTRIBUTIONS = {
    "osm": "© OpenStreetMap contributors — ODbL",
    "bordeaux": "Bordeaux Métropole — Licence Ouverte",
    "nantes": "Nantes Métropole — Licence Ouverte",
    "strasbourg": "Eurométropole de Strasbourg — Licence Ouverte",
}


class StreetLamp(Base):
    """Un point lumineux d'éclairage public géolocalisé.

    Alimenté par `lighting.sync` (OSM `highway=street_lamp` + jeux open data
    OpenDataSoft). Affiché en heatmap sur la carte et exploité par
    `graph.lighting.attach_lighting` pour inférer l'éclairage des arêtes du
    graphe dépourvues du tag OSM `lit`.
    """

    __tablename__ = "street_lamps"

    id = Column(Integer, primary_key=True, index=True)

    source = Column(String(20), nullable=False)
    source_ref = Column(String(64), nullable=False)

    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)

    tags = Column(JSON, nullable=True)

    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        UniqueConstraint("source", "source_ref", name="uq_street_lamps_source_ref"),
        Index("ix_street_lamps_lat_lon", "latitude", "longitude"),
    )
