import re
from pydantic import BaseModel, field_validator
from typing import Optional


_HEX_COLOR_RE = re.compile(r"^#[0-9A-Fa-f]{6}$")


def _validate_color(value):
    if value is not None and not _HEX_COLOR_RE.match(value):
        raise ValueError("La couleur doit être au format hexadécimal #RRGGBB.")
    return value


def _validate_name(value):
    if value is not None and not value.strip():
        raise ValueError("Le nom de l'étiquette est obligatoire.")
    return value


class TagBase(BaseModel):
    name: str
    color: str

    @field_validator("name")
    @classmethod
    def check_name(cls, value):
        return _validate_name(value)

    @field_validator("color")
    @classmethod
    def check_color(cls, value):
        return _validate_color(value)


class TagCreate(TagBase):
    pass


class TagUpdate(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None

    @field_validator("name")
    @classmethod
    def check_name(cls, value):
        return _validate_name(value)

    @field_validator("color")
    @classmethod
    def check_color(cls, value):
        return _validate_color(value)


class TagRead(BaseModel):
    id: int
    name: str
    color: str

    class Config:
        from_attributes = True
