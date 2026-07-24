from sqlalchemy import Column, Integer, String, Text, TIMESTAMP, Index
from sqlalchemy.sql import func
from database import Base


SYNC_TRIGGERS = ("manual", "auto")

SYNC_STATUSES = ("running", "success", "failed")

SETTINGS_ID = 1


class StreetLampSyncRun(Base):
    """Trace d'une synchronisation de l'éclairage public, réussie ou non."""

    __tablename__ = "street_lamp_sync_runs"

    id = Column(Integer, primary_key=True, index=True)

    trigger = Column(String(10), nullable=False)
    status = Column(String(10), nullable=False, default="running")

    started_at = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    finished_at = Column(TIMESTAMP, nullable=True)

    total_lamps = Column(Integer, nullable=True)
    created_lamps = Column(Integer, nullable=True)
    deleted_lamps = Column(Integer, nullable=True)

    error = Column(Text, nullable=True)

    __table_args__ = (
        Index("ix_street_lamp_sync_runs_started_at", "started_at"),
    )


class StreetLampSyncSettings(Base):
    """Réglages de la synchro automatique. Une seule ligne (id = SETTINGS_ID).

    L'intervalle se compte en **jours** : les positions de lampadaires (OSM et
    open data) n'évoluent qu'à la marge d'un mois à l'autre.
    """

    __tablename__ = "street_lamp_sync_settings"

    id = Column(Integer, primary_key=True, index=True)

    interval_days = Column(Integer, nullable=True)

    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())
