from pydantic import BaseModel, EmailStr, Field
from datetime import date, datetime
from typing import Literal, Optional

PASSWORD_MAX = 128

class UserBase(BaseModel):
    email: EmailStr
    first_name: Optional[str] = Field(default=None, max_length=100)
    last_name: Optional[str] = Field(default=None, max_length=100)
    birth_date: Optional[date] = None
    sport_level: Optional[str] = Field(default=None, max_length=50)
    home_address: Optional[str] = Field(default=None, max_length=500)
    work_address: Optional[str] = Field(default=None, max_length=500)

class UserCreate(UserBase):
    password: str = Field(min_length=10, max_length=PASSWORD_MAX)

class UserRead(UserBase):
    id: int
    is_admin: bool
    is_verified: bool
    is_banned: bool = False
    reports_blocked: bool = False
    ban_reason: Optional[str] = None
    recap_emails: bool = True
    # Exposée pour que les clients sachent quand pousser une correction : la
    # préférence de l'application fait foi, la colonne suit.
    language: str = "fr"
    created_at: datetime

    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserUpdate(BaseModel):
    first_name: Optional[str] = Field(default=None, max_length=100)
    last_name: Optional[str] = Field(default=None, max_length=100)
    birth_date: Optional[date] = None
    sport_level: Optional[str] = Field(default=None, max_length=50)
    home_address: Optional[str] = Field(default=None, max_length=500)
    work_address: Optional[str] = Field(default=None, max_length=500)
    # Réception du récapitulatif périodique. Absent de `UserAdminUpdate` à
    # dessein : réactiver ce réglage pour quelqu'un d'autre n'est pas une
    # fonctionnalité d'administration.
    recap_emails: Optional[bool] = None
    # Langue des e-mails. `Literal` plutôt qu'une chaîne libre : la valeur finit
    # en clé de catalogue, et une locale inconnue produirait des e-mails
    # silencieusement repliés en français. Absente de `UserAdminUpdate` pour la
    # même raison que `recap_emails`.
    language: Optional[Literal["fr", "en"]] = None

class UserAdminUpdate(BaseModel):
    first_name: Optional[str] = Field(default=None, max_length=100)
    last_name: Optional[str] = Field(default=None, max_length=100)
    birth_date: Optional[date] = None
    sport_level: Optional[str] = Field(default=None, max_length=50)
    home_address: Optional[str] = Field(default=None, max_length=500)
    work_address: Optional[str] = Field(default=None, max_length=500)
    is_admin: Optional[bool] = None
    is_banned: Optional[bool] = None
    reports_blocked: Optional[bool] = None
    ban_reason: Optional[str] = Field(default=None, max_length=500)

class PasswordChange(BaseModel):
    old_password: str
    new_password: str = Field(min_length=10, max_length=PASSWORD_MAX)

class AccountDelete(BaseModel):
    """Suppression définitive du compte, confirmée par le mot de passe."""
    password: str = Field(max_length=PASSWORD_MAX)

class UserBlockRead(BaseModel):
    """Un auteur bloqué. Volontairement sans identité : le blocage naît d'un
    signalement sur la carte, pas d'un annuaire d'utilisateurs à parcourir."""
    blocked_id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class TokenRefresh(BaseModel):
    refresh_token: str

class EmailVerifyRequest(BaseModel):
    email: EmailStr
    code: str = Field(max_length=12)

class ResendVerificationRequest(BaseModel):
    email: EmailStr

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    code: str = Field(max_length=12)
    new_password: str = Field(min_length=10, max_length=PASSWORD_MAX)

class EmailChangeRequest(BaseModel):
    new_email: EmailStr
    password: str = Field(max_length=PASSWORD_MAX)

class EmailChangeConfirm(BaseModel):
    code: str = Field(max_length=12)

class EmailChangeRequested(BaseModel):
    detail: str
    pending_email: EmailStr

class EmailChangeResult(BaseModel):
    """Le changement d'adresse révoque les jetons existants : une paire fraîche
    est renvoyée pour que l'appareil courant reste connecté."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserRead
