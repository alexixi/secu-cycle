from pydantic import BaseModel, field_validator
from datetime import datetime
from typing import Optional


class AccidentStatsRead(BaseModel):
    """Comptage des accidents en base, par source et par gravité."""

    by_source: dict[str, int]
    by_severity: dict[str, int]
    total: int
    first_year: Optional[int] = None
    last_year: Optional[int] = None
    last_sync: Optional[datetime] = None


class AccidentSyncRunRead(BaseModel):
    id: int
    trigger: str
    status: str
    started_at: datetime
    finished_at: Optional[datetime] = None
    total_accidents: Optional[int] = None
    created_accidents: Optional[int] = None
    deleted_accidents: Optional[int] = None
    error: Optional[str] = None

    class Config:
        from_attributes = True


class AccidentSyncSettingsRead(BaseModel):
    interval_days: Optional[int] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class AccidentSyncSettingsUpdate(BaseModel):
    interval_days: Optional[int] = None

    @field_validator("interval_days")
    @classmethod
    def check_interval(cls, value):
        if value is not None and value < 0:
            raise ValueError("L'intervalle doit être positif (0 = désactivé).")
        return value
