from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
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
