import asyncio

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import JSONResponse, Response
from sqlalchemy import func
from sqlalchemy.orm import Session

from accidents import runner
from database import get_db
from i18n import etag_for, get_locale
from dependencies import require_admin
from models.accident import RoadAccident, SEVERITY_LABELS, SOURCE_ATTRIBUTIONS
from models.accident_sync import AccidentSyncRun
from models.user import User
from schemas.accident import (
    AccidentStatsRead,
    AccidentSyncRunRead,
    AccidentSyncSettingsRead,
    AccidentSyncSettingsUpdate,
)

router = APIRouter(prefix="/accidents", tags=["Accidents"])

# `no-cache` ne veut pas dire « ne pas mettre en cache » mais « revalider avant
# de servir » : le navigateur garde la réponse et l'ETag ci-dessous lui évite de
# la retélécharger (304 sans corps).
CACHE_CONTROL = "no-cache"


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
def get_accidents(
    request: Request,
    bbox: str | None = Query(None, description="lon_min,lat_min,lon_max,lat_max"),
    since_year: int | None = Query(None, ge=1990, le=2100),
    severity_min: int | None = Query(None, ge=0, le=10),
    db: Session = Depends(get_db),
    locale: str = Depends(get_locale),
):
    """Accidents corporels recensés, en GeoJSON FeatureCollection. Public, sans authentification."""
    bounds = _parse_bbox(bbox)

    def apply_filters(query):
        if bounds:
            lon_min, lat_min, lon_max, lat_max = bounds
            query = query.filter(
                RoadAccident.longitude.between(lon_min, lon_max),
                RoadAccident.latitude.between(lat_min, lat_max),
            )
        if since_year is not None:
            query = query.filter(func.extract("year", RoadAccident.occurred_on) >= since_year)
        if severity_min is not None:
            query = query.filter(RoadAccident.severity >= severity_min)
        return query

    count, last_sync = apply_filters(
        db.query(func.count(RoadAccident.id), func.max(RoadAccident.updated_at))
    ).one()

    etag = etag_for(f"{count}-{last_sync}-{bbox}-{since_year}-{severity_min}", locale)
    headers = {"ETag": etag, "Cache-Control": CACHE_CONTROL}

    if request.headers.get("if-none-match") == etag:
        return Response(status_code=304, headers=headers)

    accidents = apply_filters(db.query(RoadAccident)).all()
    features = []
    sources = set()
    for accident in accidents:
        sources.add(accident.source)
        features.append({
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [accident.longitude, accident.latitude],
            },
            "properties": {
                **(accident.properties or {}),
                "id": accident.id,
                "source": accident.source,
                "severity": accident.severity,
                "severity_label": SEVERITY_LABELS.get(accident.severity),
                "date": accident.occurred_on.isoformat() if accident.occurred_on else None,
            },
        })

    return JSONResponse(
        {
            "type": "FeatureCollection",
            "features": features,
            "attributions": [SOURCE_ATTRIBUTIONS[s] for s in sorted(sources)
                             if s in SOURCE_ATTRIBUTIONS],
        },
        headers=headers,
    )


_background_tasks = set()


@router.get("/admin/stats", response_model=AccidentStatsRead)
def get_accident_stats(
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    """Comptage des accidents par source et par gravité, et millésimes couverts."""
    by_source = dict(
        db.query(RoadAccident.source, func.count(RoadAccident.id))
        .group_by(RoadAccident.source).all()
    )
    by_severity = {
        SEVERITY_LABELS.get(severity, str(severity)): count
        for severity, count in db.query(RoadAccident.severity, func.count(RoadAccident.id))
        .group_by(RoadAccident.severity).all()
    }
    first_year, last_year = db.query(
        func.min(func.extract("year", RoadAccident.occurred_on)),
        func.max(func.extract("year", RoadAccident.occurred_on)),
    ).one()

    return AccidentStatsRead(
        by_source=by_source,
        by_severity=by_severity,
        total=sum(by_source.values()),
        first_year=int(first_year) if first_year is not None else None,
        last_year=int(last_year) if last_year is not None else None,
        last_sync=db.query(func.max(RoadAccident.updated_at)).scalar(),
    )


@router.post("/admin/sync", response_model=AccidentSyncRunRead, status_code=202)
async def trigger_accident_sync(
    request: Request,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    """Déclenche une récupération des accidents en tâche de fond.

    La réponse n'attend pas la fin (téléchargement des sources amont) : elle
    renvoie le run « en cours », dont l'issue se lit via `/accidents/admin/runs`.
    """
    if runner.is_running(db):
        raise HTTPException(status_code=409, detail="Une synchronisation est déjà en cours.")

    run = runner.create_run(db, "manual")

    task = asyncio.create_task(
        asyncio.to_thread(runner.execute_run, run.id, request.app)
    )
    _background_tasks.add(task)
    task.add_done_callback(_background_tasks.discard)

    return run


@router.get("/admin/runs", response_model=list[AccidentSyncRunRead])
def list_accident_sync_runs(
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    """Historique des synchronisations, de la plus récente à la plus ancienne."""
    return (
        db.query(AccidentSyncRun)
        .order_by(AccidentSyncRun.started_at.desc(), AccidentSyncRun.id.desc())
        .limit(limit)
        .all()
    )


@router.get("/admin/settings", response_model=AccidentSyncSettingsRead)
def get_accident_sync_settings(
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    return runner.get_settings(db)


@router.patch("/admin/settings", response_model=AccidentSyncSettingsRead)
def update_accident_sync_settings(
    updates: AccidentSyncSettingsUpdate,
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
