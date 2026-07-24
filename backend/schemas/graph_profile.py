from pydantic import BaseModel, field_validator
from datetime import datetime
from typing import Optional


_ALLOWED_NAME_CHARS = set(
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_"
)


def _validate_name(value):
    if value is None:
        return value
    name = value.strip()
    if not name:
        raise ValueError("Le nom du profil est obligatoire.")
    if len(name) > 64:
        raise ValueError("Le nom du profil ne doit pas dépasser 64 caractères.")
    if not set(name) <= _ALLOWED_NAME_CHARS:
        raise ValueError(
            "Le nom du profil ne peut contenir que des lettres, chiffres, tirets "
            "et underscores (il sert de nom de fichier)."
        )
    return name


def _normalize_communes(value):
    """Nettoie et dédoublonne, en conservant l'ordre.

    Les doublons gonfleraient inutilement les appels Overpass.
    """
    if value is None:
        return value
    communes = [c.strip() for c in value if c and c.strip()]
    return list(dict.fromkeys(communes))


def _validate_communes(value):
    communes = _normalize_communes(value)
    if communes is not None and not communes:
        raise ValueError("Un profil doit contenir au moins une commune.")
    return communes


def _validate_hour(value):
    if value is not None and not (0 <= value <= 24):
        raise ValueError("L'heure d'extinction doit être comprise entre 0 et 24.")
    return value


class GraphProfileCreate(BaseModel):
    name: str
    base_profile_ids: list[int] = []
    communes: list[str] = []
    night_extinction_start: Optional[int] = None
    night_extinction_end: Optional[int] = None

    @field_validator("name")
    @classmethod
    def check_name(cls, value):
        return _validate_name(value)

    @field_validator("communes")
    @classmethod
    def check_communes(cls, value):
        return _normalize_communes(value)

    @field_validator("night_extinction_start", "night_extinction_end")
    @classmethod
    def check_extinction(cls, value):
        return _validate_hour(value)


class GraphProfileUpdate(BaseModel):
    name: Optional[str] = None
    communes: Optional[list[str]] = None
    is_default: Optional[bool] = None
    night_extinction_start: Optional[int] = None
    night_extinction_end: Optional[int] = None

    @field_validator("name")
    @classmethod
    def check_name(cls, value):
        return _validate_name(value)

    @field_validator("communes")
    @classmethod
    def check_communes(cls, value):
        return _validate_communes(value)

    @field_validator("night_extinction_start", "night_extinction_end")
    @classmethod
    def check_extinction(cls, value):
        return _validate_hour(value)


class GraphProfileRead(BaseModel):
    id: int
    name: str
    communes: list[str]
    is_default: bool

    is_active: bool = False
    graph_exists: bool = False
    is_stale: bool = False
    is_contiguous: Optional[bool] = None

    nodes: Optional[int] = None
    edges: Optional[int] = None
    size_bytes: Optional[int] = None
    built_at: Optional[datetime] = None

    night_extinction_start: Optional[int] = None
    night_extinction_end: Optional[int] = None

    class Config:
        from_attributes = True


class GraphBuildRunRead(BaseModel):
    id: int
    profile_id: int
    profile_name: str
    status: str
    step: Optional[str] = None
    progress: Optional[int] = None
    started_at: datetime
    finished_at: Optional[datetime] = None
    nodes: Optional[int] = None
    edges: Optional[int] = None
    size_bytes: Optional[int] = None
    error: Optional[str] = None

    class Config:
        from_attributes = True


class GraphStatsRead(BaseModel):
    """État du graphe effectivement chargé par l'API."""

    profile_name: Optional[str] = None
    loaded: bool
    loading: bool = False
    nodes: Optional[int] = None
    edges: Optional[int] = None
    size_bytes: Optional[int] = None
