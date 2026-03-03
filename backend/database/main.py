from fastapi import FastAPI
from routers import user
from database import Base, engine
from routers import route
from routers import history


Base.metadata.create_all(bind=engine)

app = FastAPI(title="Bike Safe API")

app.include_router(user.router)
app.include_router(route.router)
app.include_router(history.router)