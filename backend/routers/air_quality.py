from fastapi import APIRouter, Depends, Request

from limiter import limiter
from i18n import get_locale
from air_quality import service

router = APIRouter(prefix="/air-quality", tags=["AirQuality"])


@router.get("/")
@limiter.limit("60/minute")
async def get_air_quality(request: Request, locale: str = Depends(get_locale)):
    """Qualité de l'air sur la zone couverte, en maille CAMS (~11 km).

    Sert l'instantané tenu à jour par la tâche de fond : aucun appel sortant
    n'est fait ici, la réponse est immédiate même au premier appel. La maille est
    volontairement grossière — c'est un niveau régional, pas une mesure de rue.
    """
    return service.snapshot(locale)
