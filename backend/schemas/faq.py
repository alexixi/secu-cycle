from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class FaqBase(BaseModel):
    question: str
    answer: str = ""


class FaqCreate(FaqBase):
    position: Optional[int] = None
    is_published: Optional[bool] = None


class FaqUpdate(BaseModel):
    question: Optional[str] = None
    answer: Optional[str] = None
    position: Optional[int] = None
    is_published: Optional[bool] = None


class FaqRead(FaqBase):
    id: int
    position: int
    is_published: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class FaqReorder(BaseModel):
    ids: list[int]
