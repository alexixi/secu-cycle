from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class HomeCaseBase(BaseModel):
    title: str
    text: str = ""


class HomeCaseCreate(HomeCaseBase):
    position: Optional[int] = None


class HomeCaseUpdate(BaseModel):
    title: Optional[str] = None
    text: Optional[str] = None
    position: Optional[int] = None


class HomeCaseRead(HomeCaseBase):
    id: int
    position: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class HomeCaseReorder(BaseModel):
    ids: list[int]
