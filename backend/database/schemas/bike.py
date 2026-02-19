from pydantic import BaseModel
from datetime import datetime

class BikeCreate(BaseModel):
    type: str
    is_electric: bool = False

class BikeRead(BikeCreate):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True
