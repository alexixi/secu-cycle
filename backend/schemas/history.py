from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from schemas.route import RouteRead

class UserHistoryBase(BaseModel):
    route_id: int
    action_type: str

class UserHistoryCreate(UserHistoryBase):
    pass

class UserHistoryRead(UserHistoryBase):
    id: int
    user_id: int
    created_at: datetime
    route: Optional[RouteRead] = None

    class Config:
        from_attributes = True
