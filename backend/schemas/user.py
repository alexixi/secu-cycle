from pydantic import BaseModel, EmailStr
from datetime import date, datetime
from typing import Optional

class UserBase(BaseModel):
    email: EmailStr
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    birth_date: Optional[date] = None
    sport_level: Optional[str] = None
    home_address: Optional[str] = None
    work_address: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserRead(UserBase):
    id: int
    is_admin: bool
    created_at: datetime

    class Config:
        from_attributes = True
        
class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    birth_date: Optional[date] = None
    sport_level: Optional[str] = None
    home_address: Optional[str] = None
    work_address: Optional[str] = None
