from fastapi import APIRouter, Depends, Request
from fastapi.responses import JSONResponse, Response

from limiter import limiter
from i18n import get_locale
from weather import service

router = APIRouter(prefix="/weather", tags=["Weather"])

# « no-cache » = revalider avant de servir, pas « ne pas mettre en cache » : le
# navigateur garde la réponse, l'ETag lui évite de la retélécharger. Sur du temps
# réel, tout `max-age` ferait afficher une averse déjà passée.
CACHE_CONTROL = "no-cache"


@router.get("/")
@limiter.limit("60/minute")
async def get_weather(request: Request, locale: str = Depends(get_locale)):
    """Météo, nowcast pluie 15 min et vigilance sur l'emprise couverte.

    Sert l'instantané tenu à jour par la tâche de fond : aucun appel sortant n'est
    fait ici, la réponse est immédiate même au premier appel.

    Le payload porte **tous** les points de mesure (`points[]`), à charge pour le
    front de retenir le plus proche de ce qu'il regarde. C'est délibéré : un
    paramètre `?lat=&lon=` obligerait à un aller-retour réseau à chaque
    déplacement de carte, alors que l'instantané entier tient en quelques kilo-
    octets une fois compressé.

    C'est la **seule** source météo des fronts : ni l'un ni l'autre n'appelle de
    service tiers. Ce qui est servi ici est donc tout ce que l'utilisateur verra.

    Dégradation, sans jamais renvoyer d'erreur (le front teste `available` et
    masque son bandeau, comme pour les vélos en libre-service) :

    | Situation                     | `available` | `stale` | Servi                          |
    |-------------------------------|-------------|---------|--------------------------------|
    | Nominal                       | `true`      | `false` | tout                           |
    | Panne < 30 min                | `true`      | `false` | tout                           |
    | Panne 30 min – 3 h            | `true`      | `true`  | tout, bandeau atténué          |
    | Panne > 3 h                   | `true`      | `true`  | sans alertes, équipement, hint |
    | Panne au démarrage, ou coupé  | `false`     | `false` | listes vides, `summary: null`  |
    """
    etag = service.etag(locale)
    headers = {"Cache-Control": CACHE_CONTROL}
    if etag:
        headers["ETag"] = etag
        if request.headers.get("if-none-match") == etag:
            return Response(status_code=304, headers=headers)
    return JSONResponse(service.snapshot(locale), headers=headers)
