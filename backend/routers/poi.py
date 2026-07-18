import asyncio
import hashlib

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import JSONResponse, Response
from sqlalchemy import func
from sqlalchemy.orm import Session

from database import get_db
from dependencies import require_admin
from models.poi import MapPoi, POI_CATEGORIES, parking_type_of, toilet_fee_of, repair_kind_of
from models.poi_sync import PoiSyncRun
from models.user import User
from pois import runner
from schemas.poi import (
    PoiStatsRead,
    PoiSyncRunRead,
    PoiSyncSettingsRead,
    PoiSyncSettingsUpdate,
)

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
        f"{count}-{last_sync}-{','.join(cats)}-{bbox}".encode(),
        usedforsecurity=False,
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


_background_tasks = set()


@router.get("/admin/stats", response_model=PoiStatsRead)
def get_poi_stats(
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    """Comptage des POI par catégorie et date de la dernière mise à jour."""
    counts = dict(
        db.query(MapPoi.category, func.count(MapPoi.id)).group_by(MapPoi.category).all()
    )
    by_category = {category: counts.get(category, 0) for category in POI_CATEGORIES}
    return PoiStatsRead(
        by_category=by_category,
        total=sum(by_category.values()),
        last_sync=db.query(func.max(MapPoi.updated_at)).scalar(),
    )


@router.post("/admin/sync", response_model=PoiSyncRunRead, status_code=202)
async def trigger_poi_sync(
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    """Déclenche une synchronisation OSM en tâche de fond.

    La réponse n'attend pas la fin (Overpass prend quelques minutes) : elle
    renvoie le run « en cours », dont l'issue se lit via `/pois/admin/runs`.

    `async def` est nécessaire : `asyncio.create_task` exige un event loop, or
    un endpoint synchrone s'exécuterait dans un thread du pool.
    """
    if runner.is_running(db):
        raise HTTPException(status_code=409, detail="Une synchronisation est déjà en cours.")

    run = runner.create_run(db, "manual")

    task = asyncio.create_task(asyncio.to_thread(runner.execute_run, run.id))
    _background_tasks.add(task)
    task.add_done_callback(_background_tasks.discard)

    return run


@router.get("/admin/runs", response_model=list[PoiSyncRunRead])
def list_poi_sync_runs(
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    """Historique des synchronisations, de la plus récente à la plus ancienne."""
    return (
        db.query(PoiSyncRun)
        .order_by(PoiSyncRun.started_at.desc(), PoiSyncRun.id.desc())
        .limit(limit)
        .all()
    )


@router.get("/admin/settings", response_model=PoiSyncSettingsRead)
def get_poi_sync_settings(
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    return runner.get_settings(db)


@router.patch("/admin/settings", response_model=PoiSyncSettingsRead)
def update_poi_sync_settings(
    updates: PoiSyncSettingsUpdate,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    """Règle l'intervalle de synchronisation automatique (0 ou null = désactivé)."""
    update_data = updates.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="Aucun champ à mettre à jour.")

    settings = runner.get_settings(db)
    for field, value in update_data.items():
        setattr(settings, field, value)
    db.commit()
    db.refresh(settings)
    return settings
