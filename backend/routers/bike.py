from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models.bike import Bike
from schemas.bike import BikeCreate, BikeRead
from dependencies import get_current_user

router = APIRouter(prefix="/bikes", tags=["Bikes"])

@router.post("/", response_model=BikeRead)
def add_bike(bike: BikeCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    db_bike = Bike(
        user_id=current_user.id, 
        type=bike.type,
        is_electric=bike.is_electric
    )
    db.add(db_bike)
    db.commit()
    db.refresh(db_bike)
    return db_bike


@router.get("/", response_model=List[BikeRead])
def get_user_bikes(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return db.query(Bike).filter(Bike.user_id == current_user.id).all()


@router.get("/{bike_id}", response_model=BikeRead)
def get_bike(bike_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    bike = db.query(Bike).filter(Bike.id == bike_id, Bike.user_id == current_user.id).first()
    if not bike:
        raise HTTPException(status_code=404, detail="Vélo introuvable")
    return bike


@router.delete("/{bike_id}", status_code=204)
def delete_bike(bike_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    bike = db.query(Bike).filter(Bike.id == bike_id, Bike.user_id == current_user.id).first()
    if not bike:
        raise HTTPException(status_code=404, detail="Vélo introuvable")
    db.delete(bike)
    db.commit()
