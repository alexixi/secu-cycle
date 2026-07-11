from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


class BadgeRead(BaseModel):
    id: int
    code: Optional[str] = None
    name: str
    description: Optional[str] = None
    criteria: Optional[str] = None
    icon: Optional[str] = None
    goal_value: Optional[int] = None

    class Config:
        from_attributes = True


class BadgeProgress(BadgeRead):
    obtained_at: Optional[datetime] = None  # None => badge verrouillé
    progress: float = 0  # valeur courante du compteur, pour l'affichage x/goal_value


class BadgeObtained(BadgeRead):
    """Badge effectivement débloqué : `obtained_at` est toujours renseigné."""
    obtained_at: datetime


class CompleteRouteResponse(BaseModel):
    completed: bool  # False si le trajet était déjà marqué terminé
    newly_unlocked: List[BadgeRead] = []
