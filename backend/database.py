from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker, declarative_base

DATABASE_URL = "postgresql://bike_user:bike_password@localhost:5433/bike_app"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
