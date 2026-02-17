from fastapi import FastAPI
from routers import user
from database import Base, engine

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Bike Safe API")

app.include_router(user.router)
