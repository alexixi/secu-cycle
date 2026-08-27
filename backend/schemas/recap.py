from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel


class RecapSettingsRead(BaseModel):
    enabled: bool
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class RecapSettingsUpdate(BaseModel):
    enabled: Optional[bool] = None


class RecapPeriodStatus(BaseModel):
    """État d'une campagne, agrégé par statut."""

    kind: str
    period_start: date
    sent: int = 0
    skipped: int = 0
    failed: int = 0
    pending: int = 0
    unknown: int = 0


class RecapStatus(BaseModel):
    enabled: bool
    # Période que la boucle traiterait maintenant, ou None hors fenêtre d'envoi.
    periode_courante: Optional[str] = None
    campagnes: list[RecapPeriodStatus] = []


class RecapPreviewRequest(BaseModel):
    user_id: int
    # Par défaut, la période que la boucle traiterait aujourd'hui.
    kind: Optional[str] = None


class RecapPreviewResponse(BaseModel):
    subject: str
    html: str
    text: str
