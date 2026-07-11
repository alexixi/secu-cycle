import hashlib

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import JSONResponse, Response
from sqlalchemy import func
from sqlalchemy.orm import Session

from database import get_db
from models.poi import MapPoi, POI_CATEGORIES, parking_type_of, toilet_fee_of, repair_kind_of

router = APIRouter(prefix="/pois", tags=["POIs"])

CACHE_CONTROL = "public, max-age=3600"


def _parse_categories(categories: str | None) -> list[str]:
    if not categories:
        return []
    requested = [c.strip() for c in categories.split(",") if c.strip()]
    unknown = [c for c in requested if c not in POI_CATEGORIES]
    if unknown:
        raise HTTPException(
            status_code=400,
            detail=f"Catégories inconnues : {', '.join(unknown)}. "
                   f"Valeurs acceptées : {', '.join(POI_CATEGORIES)}.",
        )
    return requested


def _parse_bbox(bbox: str | None) -> tuple[float, float, float, float] | None:
    if not bbox:
        return None
    try:
        lon_min, lat_min, lon_max, lat_max = (float(v) for v in bbox.split(","))
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="bbox attendu au format lon_min,lat_min,lon_max,lat_max.",
        )
    if lon_min > lon_max or lat_min > lat_max:
        raise HTTPException(status_code=400, detail="bbox : les bornes min dépassent les max.")
    return lon_min, lat_min, lon_max, lat_max


@router.get("/")
def get_pois(
    request: Request,
    categories: str | None = Query(None, description="Liste séparée par des virgules : water,toilets,parking,repair"),
    bbox: str | None = Query(None, description="lon_min,lat_min,lon_max,lat_max"),
    db: Session = Depends(get_db),
):
    """Points d'intérêt cyclables, en GeoJSON FeatureCollection. Public, sans authentification."""
    cats = _parse_categories(categories)
    bounds = _parse_bbox(bbox)

    def apply_filters(query):
        if cats:
            query = query.filter(MapPoi.category.in_(cats))
        if bounds:
            lon_min, lat_min, lon_max, lat_max = bounds
            query = query.filter(
                MapPoi.longitude.between(lon_min, lon_max),
                MapPoi.latitude.between(lat_min, lat_max),
            )
        return query

    count, last_sync = apply_filters(
        db.query(func.count(MapPoi.id), func.max(MapPoi.updated_at))
    ).one()
    etag = 'W/"' + hashlib.md5(
        f"{count}-{last_sync}-{','.join(cats)}-{bbox}".encode()
    ).hexdigest() + '"'
    headers = {"ETag": etag, "Cache-Control": CACHE_CONTROL}

    if request.headers.get("if-none-match") == etag:
        return Response(status_code=304, headers=headers)

    pois = apply_filters(db.query(MapPoi)).all()
    features = []
    for poi in pois:
        properties = {
            **(poi.tags or {}),
            "id": poi.id,
            "category": poi.category,
            "name": poi.name,
        }
        if poi.category == "parking":
            properties["parking_type"] = parking_type_of(poi.tags)
        elif poi.category == "toilets":
            properties["toilet_fee"] = toilet_fee_of(poi.tags)
        elif poi.category == "repair":
            properties["repair_kind"] = repair_kind_of(poi.tags)
        features.append({
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [poi.longitude, poi.latitude]},
            "properties": properties,
        })
    return JSONResponse(
        {"type": "FeatureCollection", "features": features},
        headers=headers,
    )
