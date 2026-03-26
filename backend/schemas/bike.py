from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class BikeCreate(BaseModel):
    name: Optional[str] = None
    type: str
    is_electric: bool = False

class BikeUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    is_electric: Optional[bool] = None

class BikeRead(BikeCreate):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True
