from pydantic import BaseModel, field_validator
from datetime import datetime
from typing import Optional


class StreetLampStatsRead(BaseModel):
    """Comptage des points lumineux en base, par source."""

    by_source: dict[str, int]
    total: int
    last_sync: Optional[datetime] = None


class StreetLampSyncRunRead(BaseModel):
    id: int
    trigger: str
    status: str
    started_at: datetime
    finished_at: Optional[datetime] = None
    total_lamps: Optional[int] = None
    created_lamps: Optional[int] = None
    deleted_lamps: Optional[int] = None
    error: Optional[str] = None

    class Config:
        from_attributes = True


class StreetLampSyncSettingsRead(BaseModel):
    interval_days: Optional[int] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class StreetLampSyncSettingsUpdate(BaseModel):
    interval_days: Optional[int] = None

    @field_validator("interval_days")
    @classmethod
    def check_interval(cls, value):
        if value is not None and value < 0:
            raise ValueError("L'intervalle doit être positif (0 = désactivé).")
        return value
