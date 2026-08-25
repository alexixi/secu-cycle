from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Dict, Optional, Literal


class ReportBase(BaseModel):
    """Champs communs, SANS contrainte : sert à la lecture (sortie), qui doit
    accepter telles quelles les données déjà en base."""
    report_type: str
    report_description: Optional[str] = None
    latitude: float
    longitude: float


class ReportCreate(ReportBase):
    """Entrée d'un nouveau signalement : bornée pour éviter DoS / données invalides.

    Découplé de la lecture : durcir l'entrée ne doit pas faire échouer la
    sérialisation d'anciens signalements hors bornes.
    """
    model_config = ConfigDict(allow_inf_nan=False)  # rejette NaN/inf

    report_type: Literal["accident", "danger", "obstacle", "travaux"]
    report_description: Optional[str] = Field(default=None, max_length=1000)
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)


class ReportRead(ReportBase):
    id: int
    user_id: Optional[int] = None
    created_at: datetime
    confirmations_count: int = 0
    denials_count: int = 0
    is_verified: bool = False

    class Config:
        from_attributes = True


class ReportAdminRead(ReportRead):
    """Vue enrichie pour la modération : infos sur l'auteur + statut d'expiration."""
    is_expired: bool = False
    is_disabled: bool = False
    abuse_count: int = 0
    is_hidden_for_abuse: bool = False
    # Motifs invoqués et leur nombre : « Signalé ×3 » sans le pourquoi n'aide pas
    # le modérateur à trancher.
    abuse_reasons: Dict[str, int] = {}
    author_email: Optional[str] = None
    author_name: Optional[str] = None
    author_is_banned: bool = False
    author_reports_blocked: bool = False


class ReportVerifyUpdate(BaseModel):
    """Bascule le statut « vérifié » d'un signalement (admin)."""
    is_verified: bool


class ReportVoteCreate(BaseModel):
    """Corps de requête d'un vote : True = « Là », False = « Pas là »."""
    is_present: bool


class ReportVoteResult(BaseModel):
    """Réponse renvoyée après un vote : compteurs et statut recalculés."""
    id: int
    confirmations_count: int
    denials_count: int
    is_disabled: bool
    my_vote: Optional[bool] = None


class ReportAbuseCreate(BaseModel):
    """Dénonciation d'un signalement pour contenu répréhensible.

    Le motif est une liste fermée : un champ libre serait un second vecteur de
    contenu répréhensible, adressé cette fois aux modérateurs.
    """
    reason: Literal["offensive", "spam", "wrong_place", "other"] = "other"


class ReportAbuseResult(BaseModel):
    """Réponse après une dénonciation, du point de vue du dénonciateur."""
    id: int
    abuse_count: int
    is_hidden: bool
