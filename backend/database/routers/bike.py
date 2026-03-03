from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models.bike import Bike
from schemas.bike import BikeCreate, BikeRead

router = APIRouter(prefix="/bikes", tags=["Bikes"])

@router.post("/{user_id}", response_model=BikeRead)
def add_bike(user_id: int, bike: BikeCreate, db: Session = Depends(get_db)):
    db_bike = Bike(
        user_id=user_id,
        type=bike.type,
        is_electric=bike.is_electric
    )
    db.add(db_bike)
    db.commit()
    db.refresh(db_bike)
    return db_bike

# Récupérer tous les vélos d'un utilisateur
@router.get("/{user_id}", response_model=List[BikeRead])
def get_user_bikes(user_id: int, db: Session = Depends(get_db)):
    return db.query(Bike).filter(Bike.user_id == user_id).all()

# Récupérer un vélo par son ID
@router.get("/{user_id}/{bike_id}", response_model=BikeRead)
def get_bike(user_id: int, bike_id: int, db: Session = Depends(get_db)):
    bike = db.query(Bike).filter(Bike.id == bike_id, Bike.user_id == user_id).first()
    if not bike:
        raise HTTPException(status_code=404, detail="Vélo introuvable")
    return bike
