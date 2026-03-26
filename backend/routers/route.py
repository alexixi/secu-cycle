from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
import osmnx as ox
from typing import List
from database import get_db
from schemas.route import RouteCreate, RouteRead
from models.route import Route
from dependencies import get_current_user, get_current_user_optional
from graph.routing import get_optimal_routes
from models.bike import Bike
from models.history import UserHistory

router = APIRouter(prefix="/routes", tags=["Routes"])



VITESSE_PAR_AMENAGEMENT = {
    #                  (standard, électrique, vtt,  route)
    "none":          (    18,        21,       14,   22  ),  # Aucune infrastructure
    "opposite":      (    16,        18,       13,   19  ),  # Contresens
    "shared":        (    17,        18,       13,   20  ),  # Voie partagée piétons/vélos
    "shared_busway": (    20,        23,       15,   23  ),  # Voie bus+vélo
    "lane":          (    20,        23,       15,   25  ),  # Bande cyclable
    "track":         (    19,        21,       16,   24  ),  # Piste cyclable séparée
}
VITESSE_DEFAUT = (18, 21, 14, 22)  # fallback si tag inconnu

BIKE_TYPE_INDEX = {
    "standard": 0,
    "ville":    0,
    "vtt":      2,
    "route":    3,
}


def _vitesse_segment(cycleway_tag: str, bike_type: str, is_electric: bool) -> float:
    vitesses = VITESSE_PAR_AMENAGEMENT.get(cycleway_tag, VITESSE_DEFAUT)
    if is_electric:
        return vitesses[1]
    return vitesses[BIKE_TYPE_INDEX.get(bike_type.lower() if bike_type else "standard", 0)]


def _calculer_vitesse_moyenne(G, route_nodes: list, bike_type: str, is_electric: bool) -> float:
    vitesses = []
    for i in range(len(route_nodes) - 1):
        u, v = route_nodes[i], route_nodes[i + 1]
        edge_data = G.get_edge_data(u, v)
        if edge_data:
            data = edge_data[0] if 0 in edge_data else edge_data
            cycleway = data.get("cycleway", "none")
            if isinstance(cycleway, list):
                cycleway = cycleway[0]
            vitesses.append(_vitesse_segment(cycleway, bike_type, is_electric))

    if not vitesses:
        idx = 1 if is_electric else BIKE_TYPE_INDEX.get(bike_type.lower() if bike_type else "standard", 0)
        return VITESSE_DEFAUT[idx] / 60

    vitesse_kmh = sum(vitesses) / len(vitesses)
    return vitesse_kmh / 60



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
async def compute_route(request: Request, data: dict, db: Session = Depends(get_db), current_user=Depends(get_current_user_optional)):
    G = request.app.state.G
    if G is None:
        raise HTTPException(status_code=500, detail="Graphe non chargé")

    try:
        start = (data["start_lat"], data["start_lon"])
        end = (data["end_lat"], data["end_lon"])
    except KeyError as e:
        raise HTTPException(status_code=422, detail=f"Champ manquant : {e}")
    
    is_electric = bool(data.get("is_electric", False))
    bike_type = data.get("bike_type", "standard") or "standard"

    if current_user:
        bike_id = data.get("bike_id")
        if bike_id and str(bike_id).lstrip('-').isdigit():
            bike = db.query(Bike).filter(
                Bike.id == int(bike_id),
                Bike.user_id == current_user.id
            ).first()
            if bike:
                is_electric = bike.is_electric
                bike_type = bike.type or "standard"

    idx = 1 if is_electric else BIKE_TYPE_INDEX.get(bike_type.lower(), 0)
    vitesse_m_min = VITESSE_DEFAUT[idx] / 60
    try:
        result = get_optimal_routes(
            G,
            start_coords=start,
            end_coords=end,
            temps_max_min=data.get("temps_max_min"),
            iterations=data.get("iterations", 6),
            vitesse_m_min=vitesse_m_min
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

    if not result.get("success"):
        raise HTTPException(status_code=404, detail=result.get("error", "Calcul échoué."))
    for route_info in result.get("routes", []):
        coords = route_info["path"]
        nodes = list(ox.distance.nearest_nodes(
            G,
            [p[1] for p in coords],
            [p[0] for p in coords]
        ))
        vitesse_segment = _calculer_vitesse_moyenne(G, nodes, bike_type, is_electric)
        route_info["duration"] = route_info["distance"] / vitesse_segment

    if current_user:
        start_address = data.get("start_address", f"{start[0]}, {start[1]}")
        end_address = data.get("end_address", f"{end[0]}, {end[1]}")

        for route_info in result.get("routes", []):
            db_route = Route(
                user_id=current_user.id,
                start_address=start_address,
                end_address=end_address,
                route_type=route_info["id"],
                distance_km=route_info["distance"],
                duration_min=route_info["duration"],
            )
            db.add(db_route)
            db.flush()
            db.add(UserHistory(
                user_id=current_user.id,
                route_id=db_route.id,
                action_type="trajet",
            ))

        db.commit()

    return result
