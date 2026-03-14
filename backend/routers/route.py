from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from schemas.route import RouteCreate, RouteRead
from models.route import Route
from dependencies import get_current_user
from graph.routing import get_optimal_routes

router = APIRouter(prefix="/routes", tags=["Routes"])


@router.post("/", response_model=RouteRead)
def create_route(route_data: RouteCreate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    new_route = Route(**route_data.dict(), user_id=current_user.id)
    db.add(new_route)
    db.commit()
    db.refresh(new_route)
    return new_route

@router.get("/", response_model=List[RouteRead])
def get_my_routes(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return db.query(Route).filter(Route.user_id == current_user.id).order_by(Route.created_at.desc()).all()

@router.get("/{route_id}", response_model=RouteRead)
def get_route(route_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    route = db.query(Route).filter(Route.id == route_id, Route.user_id == current_user.id).first()
    if not route:
        raise HTTPException(status_code=404, detail="Route introuvable")
    return route

@router.post("/route")
async def compute_route(request: Request, data: dict):
    G = request.app.state.G
    if G is None:
        raise HTTPException(status_code=500, detail="Graphe non chargé")

    try:
        # Coordonnées obligatoires
        start = (data["start_lat"], data["start_lon"])
        end = (data["end_lat"], data["end_lon"])

        # Paramètres optionnels
        temps_max_min = data.get("temps_max_min")  # None si pas fourni
        iterations = data.get("iterations", 6)    # 6 par défaut

        result = get_optimal_routes(
            G,
            start_coords=start,
            end_coords=end,
            temps_max_min=temps_max_min,
            iterations=iterations
        )
        return result

    except KeyError as e:
        raise HTTPException(status_code=422, detail=f"Missing required field: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    