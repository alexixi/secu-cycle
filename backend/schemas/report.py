from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class ReportCreate(BaseModel):
    report_type: str
    report_description: Optional[str] = None
    latitude: float
    longitude: float

class ReportRead(ReportCreate):
    id: int
    user_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ReportAdminRead(ReportRead):
    """Vue enrichie pour la modération : infos sur l'auteur + statut d'expiration."""
    is_expired: bool = False
    author_email: Optional[str] = None
    author_name: Optional[str] = None
    author_is_banned: bool = False
    author_reports_blocked: bool = False