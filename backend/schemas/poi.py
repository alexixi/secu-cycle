from pydantic import BaseModel, field_validator
from datetime import datetime
from typing import Optional


class PoiStatsRead(BaseModel):
    """Comptage des POI en base, par catégorie."""

    by_category: dict[str, int]
    total: int
    last_sync: Optional[datetime] = None


class PoiSyncRunRead(BaseModel):
    id: int
    trigger: str
    status: str
    started_at: datetime
    finished_at: Optional[datetime] = None
    total_pois: Optional[int] = None
    created_pois: Optional[int] = None
    deleted_pois: Optional[int] = None
    error: Optional[str] = None

    class Config:
        from_attributes = True


class PoiSyncSettingsRead(BaseModel):
    interval_hours: Optional[int] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class PoiSyncSettingsUpdate(BaseModel):
    interval_hours: Optional[int] = None

    @field_validator("interval_hours")
    @classmethod
    def check_interval(cls, value):
        if value is not None and value < 0:
            raise ValueError("L'intervalle doit être positif (0 = désactivé).")
        return value
