from pydantic import BaseModel, EmailStr, Field
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
    password: str = Field(min_length=10)

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

class PasswordChange(BaseModel):
    old_password: str
    new_password: str = Field(min_length=10)

class TokenRefresh(BaseModel):
    refresh_token: str
