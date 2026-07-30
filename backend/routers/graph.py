import asyncio
import gc
import os
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from air_quality import service as air_quality_service
from database import get_db, SessionLocal
from dependencies import require_admin
from graph import builder, communes as communes_service, routing
from graph.communes import CommuneNotFound
from graph.config import MAX_SNAP_DISTANCE_M
from graph.graph_manager import load_graph_with_ign, profile_paths
from graph.route_cache import route_cache
from traffic import service as traffic_service
from bikeshare import service as bikeshare_service
from limiter import limiter
from models.commune_lighting import CommuneLighting
from models.graph_profile import GraphBuildRun, GraphProfile
from models.user import User
from schemas.graph_profile import (
    CommuneLightingItem,
    CommuneLightingUpdate,
    GraphBuildRunRead,
    GraphProfileBundle,
    GraphProfileCreate,
    GraphProfileExportItem,
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
        night_extinction_start=profile.night_extinction_start,
        night_extinction_end=profile.night_extinction_end,
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


# --- Couverture (public) ---

@router.get("/coverage")
@limiter.limit("120/minute")
def get_coverage(
    request: Request,
    lat: float = Query(..., ge=-90, le=90),
    lon: float = Query(..., ge=-180, le=180),
):
    """Ce point est-il desservi par le graphe chargé ?

    Permet aux frontends d'avertir dès la saisie d'une adresse, plutôt que de
    laisser le calcul d'itinéraire échouer (ou pire, réussir de travers).
    """
    G = getattr(request.app.state, "G", None)
    if G is None:
        raise HTTPException(status_code=503, detail="Graphe indisponible.")

    distance = routing.snap_distance_m(G, lat, lon)
    if distance is None:
        raise HTTPException(status_code=503, detail="Graphe indisponible.")

    return {
        "covered": distance <= MAX_SNAP_DISTANCE_M,
        "distance_m": round(distance, 1),
        "profile": _active_name(request),
    }


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

    profile = GraphProfile(
        name=data.name, communes=communes, is_default=False,
        night_extinction_start=data.night_extinction_start,
        night_extinction_end=data.night_extinction_end,
    )
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

    # La fenêtre par défaut de l'emprise s'applique tout de suite, comme les
    # horaires par commune : inutile de régénérer le graphe pour un horaire.
    touched_extinction = (
        "night_extinction_start" in update_data or "night_extinction_end" in update_data
    )
    if touched_extinction and profile.name == _active_name(request):
        G = getattr(request.app.state, "G", None)
        if G is not None:
            G.graph["_extinction_window"] = (
                profile.night_extinction_start, profile.night_extinction_end
            )
        _reapply_extinction(request)

    return _to_read(db, profile, _active_name(request))


def _rename_files(old_name: str, new_name: str) -> None:
    old = profile_paths(old_name)
    new = profile_paths(new_name)
    for key in ("graph_file", "ign_cache_file", "cycleroutes_file"):
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


# --- Import / export de profils ---

@router.get("/admin/profiles/export", response_model=GraphProfileBundle)
def export_profiles(
    profile_id: int | None = Query(None, description="Profil à exporter ; tous si absent"),
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    """Emprises et horaires d'éclairage, dans un fichier d'échange JSON.

    Le graphe généré n'en fait pas partie : un `.graphml` pèse plusieurs
    centaines de mégaoctets et se reconstruit à partir de l'emprise. Un profil
    importé ailleurs arrive donc « graphe non généré ».

    Les horaires joints sont ceux des seules communes exportées : la table est
    globale, mais réimporter les horaires d'une autre emprise n'aurait pas de sens.
    """
    if profile_id is None:
        profiles = db.query(GraphProfile).order_by(GraphProfile.name).all()
    else:
        profiles = [_get_profile(db, profile_id)]

    communes = list(dict.fromkeys(
        commune for profile in profiles for commune in (profile.communes or [])
    ))
    lighting = (
        db.query(CommuneLighting)
        .filter(CommuneLighting.commune.in_(communes))
        .order_by(CommuneLighting.commune)
        .all()
    ) if communes else []

    return GraphProfileBundle(
        exported_at=datetime.now(),
        profiles=[GraphProfileExportItem.model_validate(p) for p in profiles],
        commune_lighting=[CommuneLightingItem.model_validate(row) for row in lighting],
    )


@router.post("/admin/profiles/import", response_model=list[GraphProfileRead], status_code=201)
def import_profiles(
    bundle: GraphProfileBundle,
    request: Request,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    """Crée les profils d'un fichier d'échange, **sans géocoder** leurs communes.

    Les vérifier auprès de Nominatim coûterait une seconde chacune, soit près
    d'une minute pour une emprise bordelaise : plus que ce qu'une requête HTTP
    peut tenir. Le fichier provient d'un profil déjà en service, dont les
    communes ont été validées à la saisie ; l'emprise se géocode ensuite
    paresseusement à l'affichage de la carte. Une commune inventée à la main
    dans le fichier ne se signalera donc qu'à la génération.

    Un profil importé n'est jamais « par défaut » : un import ne doit pas
    changer en douce le profil chargé au démarrage.
    """
    if not bundle.profiles:
        raise HTTPException(status_code=400, detail="Ce fichier ne contient aucun profil.")

    seen = set()
    for item in bundle.profiles:
        if item.name in seen:
            raise HTTPException(
                status_code=400,
                detail=f"Le fichier contient deux profils nommés « {item.name} ».",
            )
        seen.add(item.name)

    taken = db.query(GraphProfile).filter(GraphProfile.name.in_(list(seen))).first()
    if taken is not None:
        raise HTTPException(
            status_code=400, detail=f"Un profil porte déjà ce nom : « {taken.name} »."
        )

    created = []
    for item in bundle.profiles:
        profile = GraphProfile(
            name=item.name,
            communes=item.communes,
            is_default=False,
            night_extinction_start=item.night_extinction_start,
            night_extinction_end=item.night_extinction_end,
        )
        db.add(profile)
        created.append(profile)

    _upsert_lighting(db, bundle.commune_lighting)
    db.commit()

    # Les horaires importés valent pour toutes les emprises, y compris celle
    # déjà chargée : autant les appliquer tout de suite, comme le fait l'éditeur.
    if bundle.commune_lighting:
        _reapply_extinction(request)

    active = _active_name(request)
    return [_to_read(db, profile, active) for profile in created]


# --- Éclairage par commune ---

@router.get("/admin/communes/lighting", response_model=list[CommuneLightingItem])
def list_commune_lighting(
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    """Horaires d'extinction saisis, toutes communes confondues.

    Renvoie toutes les lignes plutôt que celles d'un profil : une commune est
    partagée entre profils, et l'éditeur filtre lui-même sur celles qu'il affiche.
    """
    return (
        db.query(CommuneLighting)
        .order_by(CommuneLighting.commune)
        .all()
    )


@router.put("/admin/communes/lighting", response_model=list[CommuneLightingItem])
def update_commune_lighting(
    payload: CommuneLightingUpdate,
    request: Request,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    """Enregistre les horaires d'extinction par commune (envoi groupé).

    Les deux heures à None effacent l'horaire : la commune retombe alors sur le
    défaut de l'emprise. La résolution est rejouée immédiatement sur le graphe
    chargé — pas besoin de le régénérer ni de redémarrer l'API.
    """
    _upsert_lighting(db, payload.schedules)
    db.commit()

    _reapply_extinction(request)

    return (
        db.query(CommuneLighting)
        .order_by(CommuneLighting.commune)
        .all()
    )


def _upsert_lighting(db: Session, items) -> None:
    """Écrit des horaires d'extinction par commune, sans commiter.

    Les deux heures à None effacent l'horaire ; sur une commune qui n'en avait
    pas, il n'y a alors rien à écrire.
    """
    for item in items:
        row = (
            db.query(CommuneLighting)
            .filter(CommuneLighting.commune == item.commune)
            .first()
        )
        cleared = (
            item.night_extinction_start is None and item.night_extinction_end is None
        )
        if row is None:
            if cleared:
                continue
            row = CommuneLighting(commune=item.commune)
            db.add(row)
        row.night_extinction_start = item.night_extinction_start
        row.night_extinction_end = item.night_extinction_end


def _reapply_extinction(request: Request) -> None:
    """Rejoue la cascade des horaires sur le graphe en mémoire.

    Ne refait ni la jointure spatiale (`_commune_idx` est déjà posé) ni le
    précalcul des coûts : `_s_on`/`_s_off` ne dépendent pas de l'horaire, seul le
    choix entre les deux en dépend. Le cache d'itinéraires, lui, a été calculé
    avec les anciennes fenêtres : il faut le vider.
    """
    G = getattr(request.app.state, "G", None)
    if G is None:
        return
    from graph.lighting import resolve_extinction_windows

    resolve_extinction_windows(G)
    route_cache.invalidate()


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
        night_extinction = (
            (profile.night_extinction_start, profile.night_extinction_end)
            if profile else None
        )
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
            load_graph_with_ign, paths["graph_file"], paths["ign_cache_file"], communes,
            night_extinction, paths["cycleroutes_file"]
        )
        await traffic_service.refresh(G)

        try:
            await bikeshare_service.refresh(G)
        except Exception as exc:
            print(f"[Graphe] Vélos en libre-service indisponibles : {exc}", flush=True)

        try:
            await air_quality_service.refresh(G)
        except Exception as exc:
            print(f"[Graphe] Qualité de l'air indisponible : {exc}", flush=True)

        app.state.G = G
        app.state.graph_profile = name
        app.state.graph_communes = communes
        route_cache.invalidate()
        print(f"[Graphe] Profil '{name}' actif : {G.number_of_nodes()} nœuds.", flush=True)
    except Exception as exc:
        # `app.state.G` reste None : le routage répond 503 plutôt que de servir
        # un graphe incohérent. Un redémarrage rechargera le profil par défaut.
        print(f"[Graphe] Échec du rechargement sur '{name}' : {exc}", flush=True)
    finally:
        app.state.graph_loading = False
