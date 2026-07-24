import asyncio
import hashlib

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import JSONResponse, Response
from sqlalchemy import func
from sqlalchemy.orm import Session

from database import get_db
from dependencies import require_admin
from lighting import runner
from models.street_lamp import StreetLamp, SOURCE_ATTRIBUTIONS
from models.street_lamp_sync import StreetLampSyncRun
from models.user import User
from schemas.street_lamp import (
    StreetLampStatsRead,
    StreetLampSyncRunRead,
    StreetLampSyncSettingsRead,
    StreetLampSyncSettingsUpdate,
)

router = APIRouter(prefix="/streetlights", tags=["Éclairage"])

CACHE_CONTROL = "public, max-age=3600"


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
def get_streetlights(
    request: Request,
    bbox: str | None = Query(None, description="lon_min,lat_min,lon_max,lat_max"),
    db: Session = Depends(get_db),
):
    """Points lumineux d'éclairage public, en GeoJSON FeatureCollection. Public.

    Volumineux (dizaines de milliers de points) : passer `bbox` pour ne charger
    que l'emprise visible.
    """
    bounds = _parse_bbox(bbox)

    def apply_filters(query):
        if bounds:
            lon_min, lat_min, lon_max, lat_max = bounds
            query = query.filter(
                StreetLamp.longitude.between(lon_min, lon_max),
                StreetLamp.latitude.between(lat_min, lat_max),
            )
        return query

    count, last_sync = apply_filters(
        db.query(func.count(StreetLamp.id), func.max(StreetLamp.updated_at))
    ).one()

    etag = 'W/"' + hashlib.md5(
        f"{count}-{last_sync}-{bbox}".encode(),
        usedforsecurity=False,
    ).hexdigest() + '"'
    headers = {"ETag": etag, "Cache-Control": CACHE_CONTROL}

    if request.headers.get("if-none-match") == etag:
        return Response(status_code=304, headers=headers)

    lamps = apply_filters(
        db.query(StreetLamp.latitude, StreetLamp.longitude, StreetLamp.source)
    ).all()
    features = [
        {
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [lamp.longitude, lamp.latitude]},
            "properties": {"source": lamp.source},
        }
        for lamp in lamps
    ]
    return JSONResponse(
        {"type": "FeatureCollection", "features": features},
        headers=headers,
    )


@router.get("/sources")
def get_streetlight_sources(db: Session = Depends(get_db)):
    """Sources de points lumineux réellement présentes pour l'emprise chargée.

    OpenStreetMap couvre tous les profils, mais les jeux open data
    métropolitains n'existent que sur certaines villes : la liste est donc
    calculée en base (la table ne contient que le profil synchronisé) plutôt que
    figée côté client, sans quoi on afficherait des sources absentes de la zone.
    """
    rows = (
        db.query(StreetLamp.source, func.count(StreetLamp.id))
        .group_by(StreetLamp.source)
        .all()
    )
    sources = [
        {
            "source": source,
            "attribution": SOURCE_ATTRIBUTIONS.get(source, source),
            "count": count,
        }
        for source, count in sorted(rows)
    ]
    return JSONResponse({"sources": sources}, headers={"Cache-Control": CACHE_CONTROL})


@router.get("/lit-roads")
def get_lit_roads(request: Request):
    """Voies éclairées du graphe actif, en GeoJSON (LineString). Public.

    Un segment est éclairé s'il porte `lit=yes` (OSM) ou s'il est inféré éclairé
    d'après la densité de lampadaires (cf. `graph.lighting.attach_lighting`).
    """
    G = getattr(request.app.state, "G", None)
    if G is None:
        raise HTTPException(status_code=503, detail="Graphe indisponible.")

    from graph.lighting import lit_roads_geojson

    collection = lit_roads_geojson(G)
    profile = getattr(request.app.state, "graph_profile", None)

    etag = 'W/"' + hashlib.md5(
        f"lit-{profile}-{len(collection['features'])}".encode(),
        usedforsecurity=False,
    ).hexdigest() + '"'
    headers = {"ETag": etag, "Cache-Control": CACHE_CONTROL}

    if request.headers.get("if-none-match") == etag:
        return Response(status_code=304, headers=headers)

    return JSONResponse(collection, headers=headers)


_background_tasks = set()


@router.get("/admin/stats", response_model=StreetLampStatsRead)
def get_streetlight_stats(
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    """Comptage des points lumineux par source, et date de la dernière synchro."""
    by_source = dict(
        db.query(StreetLamp.source, func.count(StreetLamp.id))
        .group_by(StreetLamp.source).all()
    )
    return StreetLampStatsRead(
        by_source=by_source,
        total=sum(by_source.values()),
        last_sync=db.query(func.max(StreetLamp.updated_at)).scalar(),
    )


@router.post("/admin/sync", response_model=StreetLampSyncRunRead, status_code=202)
async def trigger_streetlight_sync(
    request: Request,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    """Déclenche une synchronisation de l'éclairage en tâche de fond.

    La réponse n'attend pas la fin (Overpass + portails open data) : elle renvoie
    le run « en cours », dont l'issue se lit via `/streetlights/admin/runs`.
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


@router.get("/admin/runs", response_model=list[StreetLampSyncRunRead])
def list_streetlight_sync_runs(
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    """Historique des synchronisations, de la plus récente à la plus ancienne."""
    return (
        db.query(StreetLampSyncRun)
        .order_by(StreetLampSyncRun.started_at.desc(), StreetLampSyncRun.id.desc())
        .limit(limit)
        .all()
    )


@router.get("/admin/settings", response_model=StreetLampSyncSettingsRead)
def get_streetlight_sync_settings(
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    return runner.get_settings(db)


@router.patch("/admin/settings", response_model=StreetLampSyncSettingsRead)
def update_streetlight_sync_settings(
    updates: StreetLampSyncSettingsUpdate,
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
