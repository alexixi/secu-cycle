from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class RouteBase(BaseModel):
    start_address: str
    end_address: str
    route_type: str 
    distance_km: Optional[float] = None
    duration_min: Optional[float] = None
    safety_score: Optional[float] = None

class RouteCreate(RouteBase):
    pass

class RouteRead(RouteBase):
    id: int
    user_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True