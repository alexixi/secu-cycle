from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse, Response

from limiter import limiter
from bikeshare import service

router = APIRouter(prefix="/bikeshare", tags=["Bikeshare"])

# « no-cache » = revalider avant de servir, pas « ne pas mettre en cache » : le
# navigateur garde la réponse, l'ETag lui évite de la retélécharger. Sur du temps
# réel, tout `max-age` ferait afficher des compteurs périmés.
CACHE_CONTROL = "no-cache"


@router.get("/")
@limiter.limit("60/minute")
async def get_bikeshare(request: Request):
    """Stations de vélos en libre-service (GBFS) sur la zone couverte, en GeoJSON.

    Sert l'instantané tenu à jour par la tâche de fond : aucun appel sortant n'est
    fait ici, la réponse est immédiate même au premier appel.

    Pas de paramètre `bbox`, contrairement aux POI et aux accidents : le profil
    courant tient dans quelques kilo-octets une fois compressé. À reconsidérer le
    jour où un profil dépassera le millier de stations (Paris) — il faudra alors
    faire entrer le bbox demandé dans le calcul de l'ETag.
    """
    etag = service.etag()
    headers = {"Cache-Control": CACHE_CONTROL}
    if etag:
        headers["ETag"] = etag
        if request.headers.get("if-none-match") == etag:
            return Response(status_code=304, headers=headers)
    return JSONResponse(service.snapshot(), headers=headers)
