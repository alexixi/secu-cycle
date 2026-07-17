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
    confirmations_count: int = 0
    denials_count: int = 0
    is_verified: bool = False

    class Config:
        from_attributes = True


class ReportAdminRead(ReportRead):
    """Vue enrichie pour la modération : infos sur l'auteur + statut d'expiration."""
    is_expired: bool = False
    is_disabled: bool = False
    author_email: Optional[str] = None
    author_name: Optional[str] = None
    author_is_banned: bool = False
    author_reports_blocked: bool = False


class ReportVerifyUpdate(BaseModel):
    """Bascule le statut « vérifié » d'un signalement (admin)."""
    is_verified: bool


class ReportVoteCreate(BaseModel):
    """Corps de requête d'un vote : True = « Là », False = « Pas là »."""
    is_present: bool


class ReportVoteResult(BaseModel):
    """Réponse renvoyée après un vote : compteurs et statut recalculés."""
    id: int
    confirmations_count: int
    denials_count: int
    is_disabled: bool
    my_vote: Optional[bool] = None
