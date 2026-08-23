from fastapi import FastAPI
import asyncio
from datetime import timedelta
from sqlalchemy import select
from sqlalchemy.sql import func
from database import SessionLocal
from models.accident_sync import AccidentSyncRun
from models.poi_sync import PoiSyncRun
from models.street_lamp_sync import StreetLampSyncRun
from accidents import runner as accident_runner
from pois import runner as poi_runner
from lighting import runner as lighting_runner
from routers import accident
from routers import user
from routers import route
from routers import history
from routers import bike
from routers import report
from routers import poi
from routers import streetlight
from routers import navigation
from routers import traffic
from routers import air_quality
from routers import bikeshare
from routers import weather
from routers import home_case
from routers import faq
from routers import task
from routers import tag
from routers import graph as graph_router
from routers import geo
from routers import contact
from routers import badge
from seed_home_cases import seed_home_cases
from seed_faqs import seed_faqs
from seed_badges import seed_badges
from graph import builder as graph_builder
from graph.graph_manager import load_graph_with_ign, load_graph_profile
from graph.route_cache import route_cache
from traffic import config as traffic_config
from traffic import service as traffic_service
from air_quality import config as air_quality_config
from air_quality import service as air_quality_service
from bikeshare import config as bikeshare_config
from bikeshare import service as bikeshare_service
from weather import config as weather_config
from weather import service as weather_service
from vigilance import config as vigilance_config
from vigilance import service as vigilance_service
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
    Actualise le trafic au rythme de publication de la source.

    Le cache d'itinéraires n'est vidé que si l'ensemble des arêtes
    congestionnées a réellement changé : le purger à chaque tour le laissait
    froid en permanence.
    """
    while True:
        await asyncio.sleep(traffic_config.REFRESH_INTERVAL_S)
        if getattr(app.state, 'G', None) is None:
            continue
        try:
            changed = await traffic_service.refresh(app.state.G)
        except Exception as exc:
            # Une erreur ici ne doit pas tuer la boucle : le prochain tour réessaiera.
            print(f"[Background Task] Échec de l'actualisation du trafic : {exc}", flush=True)
            continue
        if changed:
            route_cache.invalidate()


async def periodic_air_quality_update(app: FastAPI):
    """
    Boucle infinie qui s'exécute en arrière-plan.
    Actualise la qualité de l'air au rythme de publication du CAMS.

    Le cache d'itinéraires n'est vidé que si l'intensité de modulation a
    réellement changé de palier : un frémissement de l'indice ne le purge pas.
    """
    while True:
        await asyncio.sleep(air_quality_config.REFRESH_INTERVAL_S)
        if getattr(app.state, 'G', None) is None:
            continue
        try:
            changed = await air_quality_service.refresh(app.state.G)
        except Exception as exc:
            # Une erreur ici ne doit pas tuer la boucle : le prochain tour réessaiera.
            print(f"[Background Task] Échec de l'actualisation de la qualité de l'air : {exc}", flush=True)
            continue
        if changed:
            route_cache.invalidate()


async def periodic_vigilance_update(app: FastAPI):
    """
    Boucle infinie qui s'exécute en arrière-plan.
    Actualise la vigilance officielle (Météo-France, IRM via MeteoAlarm).

    Cadence bien plus lente que la météo : ces instituts publient deux fois par
    jour et à chaque changement de situation, pas toutes les dix minutes.

    Les alertes ne sont pas servies par un endpoint dédié : elles sont fusionnées
    dans le résumé de `/weather/`, là où l'utilisateur les attend.
    """
    while True:
        await asyncio.sleep(vigilance_config.REFRESH_INTERVAL_S)
        if getattr(app.state, 'G', None) is None:
            continue
        try:
            await vigilance_service.refresh(app.state.G)
        except Exception as exc:
            # Une erreur ici ne doit pas tuer la boucle : le prochain tour réessaiera.
            print(f"[Background Task] Échec de l'actualisation de la vigilance : {exc}", flush=True)


async def periodic_weather_update(app: FastAPI):
    """
    Boucle infinie qui s'exécute en arrière-plan.
    Actualise la météo au rythme de publication des modèles (AROME, ICON-D2).

    Le cache d'itinéraires n'est jamais purgé : la météo n'entre pas dans le coût
    de routage. Le vent n'agit que sur la durée affichée, posée après le cache
    (cf. `routers/route.py`), et les alertes informent sans faire dévier de trajet.
    """
    while True:
        await asyncio.sleep(weather_config.REFRESH_INTERVAL_S)
        if getattr(app.state, 'G', None) is None:
            continue
        try:
            await weather_service.refresh(app.state.G)
        except Exception as exc:
            # Une erreur ici ne doit pas tuer la boucle : le prochain tour réessaiera.
            print(f"[Background Task] Échec de l'actualisation de la météo : {exc}", flush=True)


async def periodic_bikeshare_update(app: FastAPI):
    """
    Boucle infinie qui s'exécute en arrière-plan.
    Actualise les stations de vélos en libre-service (GBFS).

    Deux cadences en une : la boucle bat toutes les TICK_S secondes, et chaque
    système décide seul s'il doit recharger son statut (temps réel, au rythme du
    `ttl` publié) ou ses informations de stations (quasi statiques, toutes les
    6 h).

    Le cache d'itinéraires n'est jamais purgé : cette couche est informative,
    elle n'entre pas dans le calcul de trajet.
    """
    while True:
        await asyncio.sleep(bikeshare_config.TICK_S)
        try:
            # Pas de garde sur `app.state.G` : cette couche ne dépend plus du
            # graphe, elle suit l'emprise de données.
            await bikeshare_service.refresh()
        except Exception as exc:
            # Une erreur ici ne doit pas tuer la boucle : le prochain tour réessaiera.
            print(f"[Background Task] Échec de l'actualisation des vélos en libre-service : {exc}", flush=True)


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

ACCIDENT_SYNC_CHECK_INTERVAL = 3600


def accident_sync_is_due() -> bool:
    """La synchro auto des accidents est-elle activée et son échéance passée ?"""
    db = SessionLocal()
    try:
        interval_days = accident_runner.get_settings(db).interval_days
        if not interval_days:
            return False
        if accident_runner.is_running(db):
            return False

        recent = db.execute(
            select(AccidentSyncRun.id)
            .where(AccidentSyncRun.started_at >= func.now() - timedelta(days=interval_days))
            .limit(1)
        ).first()
        return recent is None
    finally:
        db.close()


async def periodic_accident_sync(app: FastAPI):
    """
    Boucle infinie qui s'exécute en arrière-plan.
    Reprend les accidents auprès des sources officielles à l'intervalle réglé
    par les admins. Contrôle horaire : ces bases ne bougent qu'une fois l'an.
    """
    while True:
        await asyncio.sleep(ACCIDENT_SYNC_CHECK_INTERVAL)
        try:
            if await asyncio.to_thread(accident_sync_is_due):
                print("[Background Task] Synchronisation automatique des accidents...", flush=True)
                await asyncio.to_thread(accident_runner.run_sync, "auto", app)
        except Exception as exc:
            print(f"[Background Task] Échec de la synchro accidents : {exc}", flush=True)


LIGHTING_SYNC_CHECK_INTERVAL = 3600


def lighting_sync_is_due() -> bool:
    """La synchro auto de l'éclairage est-elle activée et son échéance passée ?"""
    db = SessionLocal()
    try:
        interval_days = lighting_runner.get_settings(db).interval_days
        if not interval_days:
            return False
        if lighting_runner.is_running(db):
            return False

        recent = db.execute(
            select(StreetLampSyncRun.id)
            .where(StreetLampSyncRun.started_at >= func.now() - timedelta(days=interval_days))
            .limit(1)
        ).first()
        return recent is None
    finally:
        db.close()


async def periodic_lighting_sync(app: FastAPI):
    """
    Boucle infinie qui s'exécute en arrière-plan.
    Resynchronise l'éclairage public (OSM + open data) à l'intervalle réglé par
    les admins. Contrôle horaire : ces positions ne bougent qu'à la marge.
    """
    while True:
        await asyncio.sleep(LIGHTING_SYNC_CHECK_INTERVAL)
        try:
            if await asyncio.to_thread(lighting_sync_is_due):
                print("[Background Task] Synchronisation automatique de l'éclairage...", flush=True)
                await asyncio.to_thread(lighting_runner.run_sync, "auto", app)
        except Exception as exc:
            print(f"[Background Task] Échec de la synchro éclairage : {exc}", flush=True)


seed_home_cases()
seed_faqs()
seed_badges()
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Chargement du graphe...")

    profile = load_graph_profile()
    app.state.graph_profile = profile["name"]
    app.state.graph_communes = profile["communes"]
    app.state.graph_loading = False
    app.state.G = load_graph_with_ign(
        profile["graph_file"], profile["ign_cache_file"], profile["communes"],
        profile.get("night_extinction"), profile["cycleroutes_file"])

    print("Chargement initial du trafic...")

    try:
        await traffic_service.refresh(app.state.G)
    except Exception as exc:
        print(f"Trafic indisponible au démarrage : {exc}", flush=True)

    print("Chargement initial de la qualité de l'air...")

    try:
        await air_quality_service.refresh(app.state.G)
    except Exception as exc:
        print(f"Qualité de l'air indisponible au démarrage : {exc}", flush=True)

    print("Chargement initial de la météo...")

    try:
        # Borné : deux requêtes vers Open-Meteo, dont une multi-points. En cas de
        # dépassement, la boucle de fond rattrapera au tour suivant.
        await asyncio.wait_for(
            weather_service.refresh(app.state.G),
            timeout=weather_config.HTTP_TIMEOUT_S * 3,
        )
    except Exception as exc:
        print(f"Météo indisponible au démarrage : {exc}", flush=True)

    print("Chargement initial de la vigilance officielle...")

    try:
        await asyncio.wait_for(
            vigilance_service.refresh(app.state.G),
            timeout=vigilance_config.HTTP_TIMEOUT_S * 3,
        )
    except Exception as exc:
        print(f"Vigilance indisponible au démarrage : {exc}", flush=True)

    print("Chargement initial des vélos en libre-service...")

    try:
        # Borné : le premier cycle enchaîne quatre requêtes par système, sur des
        # portails open data parfois lents. En cas de dépassement, la boucle de
        # fond rattrapera au tour suivant.
        await asyncio.wait_for(
            bikeshare_service.refresh(),
            timeout=bikeshare_config.HTTP_TIMEOUT_S * 4,
        )
    except Exception as exc:
        print(f"Vélos en libre-service indisponibles au démarrage : {exc}", flush=True)

    print("Graphe chargé et prêt !")

    stale = await asyncio.to_thread(poi_runner.fail_stale_runs)
    if stale:
        print(f"{stale} synchro(s) POI interrompue(s) marquée(s) en échec.", flush=True)

    stale_builds = await asyncio.to_thread(graph_builder.fail_stale_runs)
    if stale_builds:
        print(f"{stale_builds} génération(s) de graphe interrompue(s) marquée(s) en échec.", flush=True)

    stale_accidents = await asyncio.to_thread(accident_runner.fail_stale_runs)
    if stale_accidents:
        print(f"{stale_accidents} synchro(s) d'accidents interrompue(s) marquée(s) en échec.", flush=True)

    stale_lighting = await asyncio.to_thread(lighting_runner.fail_stale_runs)
    if stale_lighting:
        print(f"{stale_lighting} synchro(s) d'éclairage interrompue(s) marquée(s) en échec.", flush=True)

    traffic_task = asyncio.create_task(periodic_traffic_update(app))
    air_quality_task = asyncio.create_task(periodic_air_quality_update(app))
    weather_task = asyncio.create_task(periodic_weather_update(app))
    vigilance_task = asyncio.create_task(periodic_vigilance_update(app))
    bikeshare_task = asyncio.create_task(periodic_bikeshare_update(app))
    poi_task = asyncio.create_task(periodic_poi_sync())
    accident_task = asyncio.create_task(periodic_accident_sync(app))
    lighting_task = asyncio.create_task(periodic_lighting_sync(app))

    yield

    print("Shutdown serveur en cours...")

    traffic_task.cancel()
    air_quality_task.cancel()
    weather_task.cancel()
    vigilance_task.cancel()
    bikeshare_task.cancel()
    poi_task.cancel()
    accident_task.cancel()
    lighting_task.cancel()
    for task in (traffic_task, air_quality_task, weather_task, vigilance_task,
                 bikeshare_task, poi_task, accident_task, lighting_task):
        try:
            await task
        except asyncio.CancelledError:
            pass

    print("Shutdown terminé")

_docs_enabled = os.getenv("ENABLE_DOCS", "").lower() in {"1", "true", "yes"}
app = FastAPI(
    title="Sécu Cycle",
    lifespan=lifespan,
    docs_url="/docs" if _docs_enabled else None,
    redoc_url="/redoc" if _docs_enabled else None,
    openapi_url="/openapi.json" if _docs_enabled else None,
)

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
app.include_router(streetlight.router)
app.include_router(accident.router)
app.include_router(navigation.router)
app.include_router(traffic.router)
app.include_router(air_quality.router)
app.include_router(weather.router)
app.include_router(bikeshare.router)
app.include_router(home_case.router)
app.include_router(faq.router)
app.include_router(task.router)
app.include_router(tag.router)
app.include_router(graph_router.router)
app.include_router(geo.router)
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
