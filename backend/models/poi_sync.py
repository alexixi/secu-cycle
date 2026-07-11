from sqlalchemy import Column, Integer, String, Text, TIMESTAMP, Index
from sqlalchemy.sql import func
from database import Base


SYNC_TRIGGERS = ("manual", "auto")

SYNC_STATUSES = ("running", "success", "failed")

SETTINGS_ID = 1


class PoiSyncRun(Base):
    """Trace d'une synchronisation OSM, réussie ou non."""

    __tablename__ = "poi_sync_runs"

    id = Column(Integer, primary_key=True, index=True)

    trigger = Column(String(10), nullable=False)
    status = Column(String(10), nullable=False, default="running")

    started_at = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    finished_at = Column(TIMESTAMP, nullable=True)

    total_pois = Column(Integer, nullable=True)
    created_pois = Column(Integer, nullable=True)
    deleted_pois = Column(Integer, nullable=True)

    error = Column(Text, nullable=True)

    __table_args__ = (
        Index("ix_poi_sync_runs_started_at", "started_at"),
    )


class PoiSyncSettings(Base):
    """Réglages de la synchro automatique. Une seule ligne (id = SETTINGS_ID)."""

    __tablename__ = "poi_sync_settings"

    id = Column(Integer, primary_key=True, index=True)

    interval_hours = Column(Integer, nullable=True)

    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())
