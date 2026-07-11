from fastapi import FastAPI
import asyncio
from datetime import timedelta
from sqlalchemy import select
from sqlalchemy.sql import func
from database import SessionLocal
from models.poi_sync import PoiSyncRun
from pois import runner as poi_runner
from routers import user
from routers import route
from routers import history
from routers import bike
from routers import report
from routers import poi
from routers import navigation
from routers import traffic
from routers import home_case
from routers import task
from routers import tag
from routers import graph as graph_router
from routers import contact
from routers import badge
from seed_home_cases import seed_home_cases
from seed_badges import seed_badges
from graph import builder as graph_builder
from graph.graph_manager import load_graph_with_ign, update_graph_with_traffic, load_graph_profile
from graph.route_cache import route_cache
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from limiter import limiter
import os


async def periodic_traffic_update(app: FastAPI):
    """
    Boucle infinie qui s'exécute en arrière-plan.
    Met à jour le trafic toutes les 5 minutes (300 secondes).
    """
    while True:
        await asyncio.sleep(300)
        if hasattr(app.state, 'G') and app.state.G is not None:
            print("[Background Task] Actualisation du trafic en cours...", flush=True)
            app.state.G = await asyncio.to_thread(update_graph_with_traffic, app.state.G)
            route_cache.invalidate()


POI_SYNC_CHECK_INTERVAL = 60


def poi_sync_is_due() -> bool:
    """La synchro auto est-elle activée et son échéance passée ?"""
    db = SessionLocal()
    try:
        interval_hours = poi_runner.get_settings(db).interval_hours
        if not interval_hours:
            return False
        if poi_runner.is_running(db):
            return False

        recent = db.execute(
            select(PoiSyncRun.id)
            .where(PoiSyncRun.started_at >= func.now() - timedelta(hours=interval_hours))
            .limit(1)
        ).first()
        return recent is None
    finally:
        db.close()


async def periodic_poi_sync():
    """
    Boucle infinie qui s'exécute en arrière-plan.
    Resynchronise les POI depuis OSM à l'intervalle réglé par les admins.
    """
    while True:
        await asyncio.sleep(POI_SYNC_CHECK_INTERVAL)
        try:
            if await asyncio.to_thread(poi_sync_is_due):
                print("[Background Task] Synchronisation automatique des POI...", flush=True)
                await asyncio.to_thread(poi_runner.run_sync, "auto")
        except Exception as exc:
            # Une erreur ici ne doit pas tuer la boucle : le prochain tour réessaiera.
            print(f"[Background Task] Échec de la synchro POI : {exc}", flush=True)

seed_home_cases()
seed_badges()
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Chargement du graphe...")

    profile = load_graph_profile()
    app.state.graph_profile = profile["name"]
    app.state.graph_loading = False
    app.state.G = load_graph_with_ign(
        profile["graph_file"], profile["ign_cache_file"], profile["communes"])

    print("Chargement initial du trafic...")

    app.state.G = await asyncio.to_thread(update_graph_with_traffic, app.state.G)

    print("Graphe chargé et prêt !")

    stale = await asyncio.to_thread(poi_runner.fail_stale_runs)
    if stale:
        print(f"{stale} synchro(s) POI interrompue(s) marquée(s) en échec.", flush=True)

    stale_builds = await asyncio.to_thread(graph_builder.fail_stale_runs)
    if stale_builds:
        print(f"{stale_builds} génération(s) de graphe interrompue(s) marquée(s) en échec.", flush=True)

    traffic_task = asyncio.create_task(periodic_traffic_update(app))
    poi_task = asyncio.create_task(periodic_poi_sync())

    yield

    print("Shutdown serveur en cours...")

    traffic_task.cancel()
    poi_task.cancel()
    for task in (traffic_task, poi_task):
        try:
            await task
        except asyncio.CancelledError:
            pass

    print("Shutdown terminé")

app = FastAPI(title="Sécu Cycle", lifespan=lifespan)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(GZipMiddleware, minimum_size=1000)


@app.get("/health")
def health():
    return {"status": "ok"}

app.include_router(user.router)
app.include_router(route.router)
app.include_router(history.router)
app.include_router(bike.router)
app.include_router(report.router)
app.include_router(poi.router)
app.include_router(navigation.router)
app.include_router(traffic.router)
app.include_router(home_case.router)
app.include_router(task.router)
app.include_router(tag.router)
app.include_router(graph_router.router)
app.include_router(contact.router)
app.include_router(badge.router)

origins_str = os.getenv("CORS_ORIGINS", "")
if origins_str:
    origins = origins_str.split(",")
else:
    print("Warning: CORS_ORIGINS n'est pas défini dans les variables d'environnement. Utilisation des valeurs par défaut.", flush=True)
    origins = [
        "http://localhost:5173", "http://127.0.0.1:5173",
        "http://localhost:5174", "http://127.0.0.1:5174",
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
