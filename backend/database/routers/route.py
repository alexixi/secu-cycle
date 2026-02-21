from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from schemas.route import RouteCreate, RouteRead
from models.route import Route
from dependencies import get_current_user

router = APIRouter(prefix="/routes", tags=["Routes"])

@router.post("/", response_model=RouteRead)
def create_route(route_data: RouteCreate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    new_route = Route(**route_data.dict(), user_id=current_user.id)
    db.add(new_route)
    db.commit()
    db.refresh(new_route)
    return new_route