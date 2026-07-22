from sqlalchemy import Column, Integer, String, Text, TIMESTAMP, Index
from sqlalchemy.sql import func
from database import Base


SYNC_TRIGGERS = ("manual", "auto")

SYNC_STATUSES = ("running", "success", "failed")

SETTINGS_ID = 1


class AccidentSyncRun(Base):
    """Trace d'une récupération des accidents, réussie ou non."""

    __tablename__ = "accident_sync_runs"

    id = Column(Integer, primary_key=True, index=True)

    trigger = Column(String(10), nullable=False)
    status = Column(String(10), nullable=False, default="running")

    started_at = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    finished_at = Column(TIMESTAMP, nullable=True)

    total_accidents = Column(Integer, nullable=True)
    created_accidents = Column(Integer, nullable=True)
    deleted_accidents = Column(Integer, nullable=True)

    error = Column(Text, nullable=True)

    __table_args__ = (
        Index("ix_accident_sync_runs_started_at", "started_at"),
    )


class AccidentSyncSettings(Base):
    """Réglages de la synchro automatique. Une seule ligne (id = SETTINGS_ID).

    L'intervalle se compte en **jours** et non en heures comme pour les POI :
    les bases d'accidentologie ne sont republiées qu'une fois par an.
    """

    __tablename__ = "accident_sync_settings"

    id = Column(Integer, primary_key=True, index=True)

    interval_days = Column(Integer, nullable=True)

    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())
