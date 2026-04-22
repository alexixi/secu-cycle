from fastapi import FastAPI
import asyncio
from routers import user
from database import Base, engine
from routers import route
from routers import history
from routers import bike 
from routers import report  
from graph.graph_manager import create_graph, load_graph_with_ign, update_graph_with_traffic
from contextlib import asynccontextmanager
#from fastapi.middleware.cors import CORSMiddleware


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

Base.metadata.create_all(bind=engine)
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Chargement du graphe...")
    
    app.state.G = load_graph_with_ign("victoire_campus.graphml", "ign_bordeaux_cache.json")

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

app = FastAPI(title="Bike Safe API", lifespan=lifespan)

app.include_router(user.router)
app.include_router(route.router)
app.include_router(history.router)
app.include_router(bike.router)
app.include_router(report.router)
##### Si le frontend n'est pas hébergé au meme endroit #########
""" app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000" ### adresse du front
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
) """
##################################################################
