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