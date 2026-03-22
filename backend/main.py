from fastapi import FastAPI
from routers import user
from database import Base, engine
from routers import route
from routers import history
from routers import bike 
from routers import report  
from graph.graph_manager import create_graph
from contextlib import asynccontextmanager
#from fastapi.middleware.cors import CORSMiddleware


Base.metadata.create_all(bind=engine)
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Chargement du graphe...")
    
    app.state.G = create_graph("victoire_campus.graphml")

    print("Graphe chargé")
    yield

    print("Shutdown serveur")

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
