from fastapi import FastAPI
from routers import user
from database import Base, engine
from routers import route
from routers import history
from routers import bike
from routers import report
from graph.graph_manager import load_graph_with_ign
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware


Base.metadata.create_all(bind=engine)
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Chargement du graphe...")

    app.state.G = load_graph_with_ign("victoire_campus.graphml", "ign_bordeaux_cache.json")

    print("Graphe chargé")
    yield

    print("Shutdown serveur")

app = FastAPI(title="Bike Safe API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(user.router)
app.include_router(route.router)
app.include_router(history.router)
app.include_router(bike.router)
app.include_router(report.router)
