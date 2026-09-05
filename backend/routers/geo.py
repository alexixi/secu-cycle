"""Géocodage : recherche d'adresses et de lieux, et géocodage inverse."""

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session

from database import get_db
from geocoding import config, service, shortlink
from i18n import get_locale, t
from limiter import limiter
from models.graph_profile import GraphProfile

router = APIRouter(prefix="/geo", tags=["Géocodage"])


def _context(request: Request, db: Session, locale: str):
    """Graphe chargé, nom du profil actif et ses communes."""
    G = getattr(request.app.state, "G", None)
    profile_name = getattr(request.app.state, "graph_profile", None)
    if G is None or profile_name is None:
        raise HTTPException(status_code=503, detail=t("error.common.graph_unavailable", locale))

    profile = db.query(GraphProfile).filter(GraphProfile.name == profile_name).first()
    communes = list(profile.communes or []) if profile is not None else []
    return G, profile_name, communes


@router.get("/search")
@limiter.limit("120/minute")
def search_addresses(
    request: Request,
    q: str = Query(..., min_length=config.MIN_QUERY_LENGTH, max_length=200),
    db: Session = Depends(get_db),
    locale: str = Depends(get_locale),
):
    """Adresses et lieux correspondant à `q`, dans l'emprise du graphe chargé."""
    G, profile_name, communes = _context(request, db, locale)
    return service.search(db, G, profile_name, communes, q)


@router.get("/reverse")
@limiter.limit("60/minute")
def reverse_geocode(
    request: Request,
    lat: float = Query(..., ge=-90, le=90),
    lon: float = Query(..., ge=-180, le=180),
    db: Session = Depends(get_db),
    locale: str = Depends(get_locale),
):
    """Adresse ou lieu le plus proche du point. 404 si rien n'est trouvé."""
    G, profile_name, communes = _context(request, db, locale)
    result = service.reverse(db, G, profile_name, communes, lat, lon)
    if result is None:
        raise HTTPException(status_code=404, detail=t("error.geo.no_address", locale))
    return result

@router.get("/resolve")
@limiter.limit("30/minute")
def resolve_shortlink(
    request: Request,
    url: str = Query(..., max_length=500),
    db: Session = Depends(get_db),
    locale: str = Depends(get_locale),
):
    """Point désigné par un lien court de cartographie partagé par l'utilisateur.

    Limite basse : chaque appel déclenche une requête sortante vers Google
    depuis notre IP. Un débit libre ferait du serveur un relais.
    """
    G, profile_name, communes = _context(request, db, locale)

    resolved = shortlink.resolve(url)
    if resolved is None:
        raise HTTPException(status_code=404, detail=t("error.geo.no_address", locale))

    if resolved["lat"] is None:
        results = service.search(db, G, profile_name, communes, resolved["label"])
        if not results:
            raise HTTPException(status_code=404, detail=t("error.geo.no_address", locale))
        return results[0]

    if not service._within_extent(G, resolved):
        raise HTTPException(status_code=404, detail=t("error.geo.out_of_zone", locale))

    return resolved
