from fastapi import APIRouter, Request

from limiter import limiter
from traffic import service

router = APIRouter(prefix="/traffic", tags=["Traffic"])


@router.get("/")
@limiter.limit("60/minute")
async def get_traffic(request: Request):
    """État du trafic sur la zone couverte, en GeoJSON.

    Sert l'instantané tenu à jour par la tâche de fond : aucun appel sortant
    n'est fait ici, la réponse est immédiate même au premier appel.
    """
    return service.snapshot()
