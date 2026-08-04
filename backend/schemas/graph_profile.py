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


class CommuneLightingItem(BaseModel):
    """Horaire d'extinction d'une commune. Les deux heures à None = pas d'horaire
    connu (la commune retombe sur le défaut de l'emprise)."""

    commune: str
    night_extinction_start: Optional[int] = None
    night_extinction_end: Optional[int] = None

    @field_validator("commune")
    @classmethod
    def check_commune(cls, value):
        commune = (value or "").strip()
        if not commune:
            raise ValueError("Le nom de la commune est obligatoire.")
        if len(commune) > 255:
            raise ValueError("Le nom de la commune ne doit pas dépasser 255 caractères.")
        return commune

    @field_validator("night_extinction_start", "night_extinction_end")
    @classmethod
    def check_extinction(cls, value):
        return _validate_hour(value)

    class Config:
        from_attributes = True


class CommuneLightingUpdate(BaseModel):
    schedules: list[CommuneLightingItem] = []


# --- Import / export de profils ---

# Marqueurs du fichier d'échange, pour refuser tout de suite un JSON qui n'a
# rien à voir plutôt que de laisser Pydantic se plaindre champ par champ.
EXPORT_KIND = "secu-cycle.graph-profile"
EXPORT_VERSION = 1


class GraphProfileExportItem(BaseModel):
    """Un profil dans un fichier d'échange.

    Ni `is_default` ni les compteurs de génération n'y figurent : ils décrivent
    l'état d'une instance, pas l'emprise elle-même.
    """

    name: str
    communes: list[str]
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

    class Config:
        from_attributes = True


class GraphProfileBundle(BaseModel):
    """Le fichier d'échange complet : un ou plusieurs profils et leurs horaires."""

    kind: str = EXPORT_KIND
    version: int = EXPORT_VERSION
    exported_at: Optional[datetime] = None
    profiles: list[GraphProfileExportItem] = []
    commune_lighting: list[CommuneLightingItem] = []

    @field_validator("kind")
    @classmethod
    def check_kind(cls, value):
        if value != EXPORT_KIND:
            raise ValueError("Ce fichier n'est pas un export de profil de graphe.")
        return value

    @field_validator("version")
    @classmethod
    def check_version(cls, value):
        if value > EXPORT_VERSION:
            raise ValueError(
                "Ce fichier a été produit par une version plus récente de Sécu'Cycle."
            )
        return value


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
