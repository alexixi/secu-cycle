from fastapi import FastAPI
import asyncio
from routers import user
from database import Base, engine
from routers import route
from routers import history
from routers import bike
from routers import report
from routers import navigation
from routers import traffic
from routers import home_case
from routers import task
from seed_home_cases import seed_home_cases
from graph.graph_manager import load_graph_with_ign, update_graph_with_traffic, load_graph_profile
from graph.route_cache import route_cache
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
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

Base.metadata.create_all(bind=engine)
seed_home_cases()
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Chargement du graphe...")

    profile = load_graph_profile()
    app.state.G = load_graph_with_ign(
        profile["graph_file"], profile["ign_cache_file"], profile["communes"])

    print("Chargement initial du trafic...")

    app.state.G = await asyncio.to_thread(update_graph_with_traffic, app.state.G)

    print("Graphe chargé et prêt !")

    traffic_task = asyncio.create_task(periodic_traffic_update(app))

    yield

    print("Shutdown serveur en cours...")

    traffic_task.cancel()
    try:
        await traffic_task
    except asyncio.CancelledError:
        pass

    print("Shutdown terminé")

app = FastAPI(title="Sécu Cycle", lifespan=lifespan)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.include_router(user.router)
app.include_router(route.router)
app.include_router(history.router)
app.include_router(bike.router)
app.include_router(report.router)
app.include_router(navigation.router)
app.include_router(traffic.router)
app.include_router(home_case.router)
app.include_router(task.router)

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
