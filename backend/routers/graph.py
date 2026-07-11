import asyncio
import gc
import os

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from database import get_db, SessionLocal
from dependencies import require_admin
from graph import builder, communes as communes_service
from graph.communes import CommuneNotFound
from graph.graph_manager import load_graph_with_ign, profile_paths, update_graph_with_traffic
from graph.route_cache import route_cache
from models.graph_profile import GraphBuildRun, GraphProfile
from models.user import User
from schemas.graph_profile import (
    GraphBuildRunRead,
    GraphProfileCreate,
    GraphProfileRead,
    GraphProfileUpdate,
    GraphStatsRead,
)

router = APIRouter(prefix="/graph", tags=["Graph"])

_background_tasks = set()


def _active_name(request: Request) -> str | None:
    """Nom du profil effectivement chargé en mémoire."""
    return getattr(request.app.state, "graph_profile", None)


def _backfill_counts(db: Session, profile: GraphProfile) -> None:
    """Renseigne les compteurs d'un graphe présent sur disque mais jamais généré ici.

    Les profils repris de l'ancienne configuration ont un `.graphml` sans aucun
    compteur en base. On les compte une fois, puis on les mémorise.
    """
    graph_file = profile_paths(profile.name)["graph_file"]
    try:
        profile.nodes, profile.edges = builder.count_graphml(graph_file)
        db.commit()
    except OSError as exc:
        db.rollback()
        print(f"[Graphe] Comptage impossible pour '{profile.name}' : {exc}", flush=True)


def _to_read(db: Session, profile: GraphProfile, active_name: str | None) -> GraphProfileRead:
    stats = builder.graph_stats(profile.name)
    communes = list(profile.communes or [])
    built = profile.built_communes

    if stats["exists"] and profile.nodes is None:
        _backfill_counts(db, profile)

    return GraphProfileRead(
        id=profile.id,
        name=profile.name,
        communes=communes,
        is_default=profile.is_default,
        is_active=profile.name == active_name,
        graph_exists=stats["exists"],
        is_stale=stats["exists"] and built is not None and list(built) != communes,
        is_contiguous=communes_service.is_contiguous(db, communes),
        nodes=profile.nodes,
        edges=profile.edges,
        size_bytes=stats["size_bytes"],
        built_at=profile.built_at,
    )


def _get_profile(db: Session, profile_id: int) -> GraphProfile:
    profile = db.get(GraphProfile, profile_id)
    if profile is None:
        raise HTTPException(status_code=404, detail="Profil introuvable.")
    return profile


async def _validate_communes(db: Session, names) -> None:
    """Rejette les communes que Nominatim ne connaît pas.

    Mieux vaut refuser tout de suite qu'échouer après plusieurs minutes de
    génération. Le géocodage est lent (~1 s par commune) : hors de l'event loop.
    """
    try:
        await asyncio.to_thread(communes_service.validate, db, names)
    except CommuneNotFound as exc:
        raise HTTPException(status_code=400, detail=str(exc))


# --- Administration du graphe ---

@router.get("/admin/stats", response_model=GraphStatsRead)
def get_graph_stats(
    request: Request,
    _admin: User = Depends(require_admin),
):
    """État du graphe chargé en mémoire par l'API."""
    G = getattr(request.app.state, "G", None)
    name = _active_name(request)
    return GraphStatsRead(
        profile_name=name,
        loaded=G is not None,
        loading=bool(getattr(request.app.state, "graph_loading", False)),
        nodes=G.number_of_nodes() if G is not None else None,
        edges=G.number_of_edges() if G is not None else None,
        size_bytes=builder.graph_stats(name)["size_bytes"] if name else None,
    )


@router.get("/admin/profiles", response_model=list[GraphProfileRead])
def list_profiles(
    request: Request,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    active = _active_name(request)
    profiles = db.query(GraphProfile).order_by(GraphProfile.name).all()
    return [_to_read(db, profile, active) for profile in profiles]


@router.post("/admin/profiles", response_model=GraphProfileRead, status_code=201)
async def create_profile(
    data: GraphProfileCreate,
    request: Request,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    """Crée un profil, éventuellement en composant des profils existants.

    Les communes des profils de base sont recopiées telles quelles : elles sont
    déjà en service, donc **on ne les revalide pas**. Les géocoder de nouveau
    coûterait une seconde chacune (limite de Nominatim), soit près d'une minute
    pour un « Bordeaux + Tournai ». Seules les communes saisies à la main sont
    vérifiées.
    """
    existing = db.query(GraphProfile).filter(GraphProfile.name == data.name).first()
    if existing is not None:
        raise HTTPException(status_code=400, detail="Un profil porte déjà ce nom.")

    inherited = []
    for profile_id in data.base_profile_ids:
        base = db.get(GraphProfile, profile_id)
        if base is None:
            raise HTTPException(
                status_code=404, detail=f"Profil de base introuvable (id {profile_id})."
            )
        inherited.extend(base.communes or [])

    communes = list(dict.fromkeys([*inherited, *data.communes]))
    if not communes:
        raise HTTPException(
            status_code=400,
            detail="Un profil doit contenir au moins une commune : "
                   "sélectionnez un profil de base ou ajoutez une commune.",
        )

    await _validate_communes(db, data.communes)

    profile = GraphProfile(name=data.name, communes=communes, is_default=False)
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return _to_read(db, profile, _active_name(request))


@router.patch("/admin/profiles/{profile_id}", response_model=GraphProfileRead)
async def update_profile(
    profile_id: int,
    updates: GraphProfileUpdate,
    request: Request,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    profile = _get_profile(db, profile_id)
    update_data = updates.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="Aucun champ à mettre à jour.")

    new_communes = update_data.get("communes")
    if new_communes is not None:
        added = [c for c in new_communes if c not in (profile.communes or [])]
        await _validate_communes(db, added)

    new_name = update_data.get("name")
    if new_name is not None and new_name != profile.name:
        if db.query(GraphProfile).filter(GraphProfile.name == new_name).first() is not None:
            raise HTTPException(status_code=400, detail="Un profil porte déjà ce nom.")
        if profile.name == _active_name(request):
            raise HTTPException(
                status_code=409,
                detail="Impossible de renommer le profil actif : activez-en un autre d'abord.",
            )
        _rename_files(profile.name, new_name)

    if update_data.get("is_default"):
        db.query(GraphProfile).filter(GraphProfile.id != profile.id).update(
            {"is_default": False}
        )

    for field, value in update_data.items():
        setattr(profile, field, value)
    db.commit()
    db.refresh(profile)
    return _to_read(db, profile, _active_name(request))


def _rename_files(old_name: str, new_name: str) -> None:
    old = profile_paths(old_name)
    new = profile_paths(new_name)
    for key in ("graph_file", "ign_cache_file"):
        if os.path.exists(old[key]):
            os.rename(old[key], new[key])


@router.delete("/admin/profiles/{profile_id}", status_code=204)
def delete_profile(
    profile_id: int,
    request: Request,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    profile = _get_profile(db, profile_id)

    if profile.name == _active_name(request):
        raise HTTPException(
            status_code=409,
            detail="Impossible de supprimer le profil actif : activez-en un autre d'abord.",
        )
    if profile.is_default:
        raise HTTPException(
            status_code=409,
            detail="Impossible de supprimer le profil par défaut : désignez-en un autre d'abord.",
        )

    paths = profile_paths(profile.name)
    for path in paths.values():
        if os.path.exists(path):
            os.remove(path)

    db.delete(profile)
    db.commit()


@router.get("/admin/profiles/{profile_id}/extent")
async def get_profile_extent(
    profile_id: int,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    """Emprise du profil : les contours de ses communes, en GeoJSON."""
    profile = _get_profile(db, profile_id)
    geojson = await asyncio.to_thread(
        communes_service.extent, db, list(profile.communes or [])
    )
    return JSONResponse(geojson)


@router.post("/admin/profiles/{profile_id}/build", response_model=GraphBuildRunRead, status_code=202)
async def build_profile(
    profile_id: int,
    wipe_ign: bool = Query(False, description="Purger aussi le cache d'altitudes IGN"),
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    """Régénère le graphe d'un profil, en tâche de fond (plusieurs minutes)."""
    profile = _get_profile(db, profile_id)

    if builder.is_running(db):
        raise HTTPException(status_code=409, detail="Une génération est déjà en cours.")

    run = builder.create_run(db, profile)

    task = asyncio.create_task(asyncio.to_thread(builder.execute_build, run.id, wipe_ign))
    _background_tasks.add(task)
    task.add_done_callback(_background_tasks.discard)

    return run


@router.get("/admin/builds", response_model=list[GraphBuildRunRead])
def list_builds(
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    """Historique des générations, de la plus récente à la plus ancienne."""
    return (
        db.query(GraphBuildRun)
        .order_by(GraphBuildRun.started_at.desc(), GraphBuildRun.id.desc())
        .limit(limit)
        .all()
    )


@router.post("/admin/profiles/{profile_id}/activate", status_code=202)
async def activate_profile(
    profile_id: int,
    request: Request,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    """Recharge l'API sur ce profil, sans redémarrage.

    Le routage répond 503 pendant le rechargement (1 à 2 minutes selon
    l'emprise) : l'ancien graphe est libéré *avant* de charger le nouveau, pour
    ne pas tenir deux graphes en mémoire à la fois.
    """
    profile = _get_profile(db, profile_id)
    app = request.app

    if not builder.graph_stats(profile.name)["exists"]:
        raise HTTPException(
            status_code=409,
            detail="Le graphe de ce profil n'a pas encore été généré.",
        )
    if getattr(app.state, "graph_loading", False):
        raise HTTPException(status_code=409, detail="Un rechargement est déjà en cours.")
    if builder.is_running(db):
        raise HTTPException(
            status_code=409,
            detail="Une génération est en cours : attendez sa fin avant d'activer un profil.",
        )
    if profile.name == _active_name(request):
        raise HTTPException(status_code=409, detail="Ce profil est déjà actif.")

    # Le prochain démarrage doit repartir sur ce profil.
    db.query(GraphProfile).filter(GraphProfile.id != profile.id).update({"is_default": False})
    profile.is_default = True
    db.commit()

    task = asyncio.create_task(_reload_graph(app, profile.name))
    _background_tasks.add(task)
    task.add_done_callback(_background_tasks.discard)

    return {"status": "loading", "profile_name": profile.name}


async def _reload_graph(app, name: str) -> None:
    """Remplace `app.state.G` par le graphe de `name`."""
    app.state.graph_loading = True
    paths = profile_paths(name)

    db = SessionLocal()
    try:
        profile = db.query(GraphProfile).filter(GraphProfile.name == name).first()
        communes = list(profile.communes or []) if profile else []
    finally:
        db.close()

    try:
        # Libérer avant de charger : sinon les deux graphes coexistent en mémoire
        # (~2 Go pour Bordeaux, au-delà de ce que le VPS encaisse).
        app.state.G = None
        gc.collect()
        route_cache.invalidate()

        print(f"[Graphe] Rechargement sur le profil '{name}'...", flush=True)
        G = await asyncio.to_thread(
            load_graph_with_ign, paths["graph_file"], paths["ign_cache_file"], communes
        )
        G = await asyncio.to_thread(update_graph_with_traffic, G)

        app.state.G = G
        app.state.graph_profile = name
        route_cache.invalidate()
        print(f"[Graphe] Profil '{name}' actif : {G.number_of_nodes()} nœuds.", flush=True)
    except Exception as exc:
        # `app.state.G` reste None : le routage répond 503 plutôt que de servir
        # un graphe incohérent. Un redémarrage rechargera le profil par défaut.
        print(f"[Graphe] Échec du rechargement sur '{name}' : {exc}", flush=True)
    finally:
        app.state.graph_loading = False
