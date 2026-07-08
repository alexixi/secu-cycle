from pydantic import BaseModel, field_validator
from datetime import datetime
from typing import Optional

from models.task import TASK_STATUSES, TASK_PRIORITIES
from schemas.tag import TagRead


class AdminBrief(BaseModel):
    """Résumé d'un admin, pour l'affichage de l'assigné sur une tâche."""

    id: int
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: str

    class Config:
        from_attributes = True


def _validate_status(value):
    if value is not None and value not in TASK_STATUSES:
        raise ValueError(f"Statut invalide. Valeurs autorisées : {', '.join(TASK_STATUSES)}.")
    return value


def _validate_priority(value):
    if value is not None and value not in TASK_PRIORITIES:
        raise ValueError(f"Priorité invalide. Valeurs autorisées : {', '.join(TASK_PRIORITIES)}.")
    return value


class TaskCreate(BaseModel):
    title: str
    description: str = ""
    status: str = "a_faire"
    priority: Optional[str] = None
    assignee_id: Optional[int] = None
    tag_ids: Optional[list[int]] = None

    @field_validator("status")
    @classmethod
    def check_status(cls, value):
        return _validate_status(value)

    @field_validator("priority")
    @classmethod
    def check_priority(cls, value):
        return _validate_priority(value)


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    assignee_id: Optional[int] = None
    position: Optional[int] = None
    # None = ne pas toucher aux étiquettes ; [] = retirer toutes les étiquettes.
    tag_ids: Optional[list[int]] = None

    @field_validator("status")
    @classmethod
    def check_status(cls, value):
        return _validate_status(value)

    @field_validator("priority")
    @classmethod
    def check_priority(cls, value):
        return _validate_priority(value)


class TaskRead(BaseModel):
    id: int
    title: str
    description: str
    status: str
    priority: Optional[str] = None
    position: int
    assignee_id: Optional[int] = None
    assignee: Optional[AdminBrief] = None
    tags: list[TagRead] = []
    created_by_id: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class TaskReorderItem(BaseModel):
    id: int
    status: str
    position: int

    @field_validator("status")
    @classmethod
    def check_status(cls, value):
        return _validate_status(value)


class TaskReorder(BaseModel):
    items: list[TaskReorderItem]
