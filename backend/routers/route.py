from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
import osmnx as ox
from typing import List
from database import get_db
from schemas.route import RouteCreate, RouteRead, ComputeRoutesResponse
from models.route import Route
from dependencies import get_current_user, get_current_user_optional
from graph.routing import get_optimal_routes
from models.bike import Bike
from models.history import UserHistory
from models.report import Report
from datetime import datetime, timedelta
from services.guidance import build_maneuvers
router = APIRouter(prefix="/routes", tags=["Routes"])

@router.get("/debug/traffic")
async def get_current_traffic(request: Request):
    """
    Renvoie la liste des rues actuellement embouteillées avec leur nom et coordonnées.
    """
    G = request.app.state.G
    congested_segments = []
    rues_bouchonnees_uniques = set()
    
    for u, v, k, data in G.edges(keys=True, data=True):
        if data.get('traffic_jam'):
            street_name = data.get('name', 'Rue sans nom')
            if isinstance(street_name, list):
                street_name = " / ".join(street_name)
                
            rues_bouchonnees_uniques.add(street_name)
            
            u_node = G.nodes[u]
            v_node = G.nodes[v]
            
            congested_segments.append({
                "street": street_name,
                "coords": [
                    [u_node['y'], u_node['x']], # [latitude, longitude]
                    [v_node['y'], v_node['x']]
                ]
            })
            
    return {
        "status": "success",
        "total_segments_impactes": len(congested_segments),
        "rues_principales_impactees": list(rues_bouchonnees_uniques),
        "details": congested_segments
    }

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

@router.post("/route", response_model=ComputeRoutesResponse)
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
    cyclist_level = "intermediaire" 
    
    if current_user:
        niveau_db = getattr(current_user, "sport_level", None)
        if niveau_db:
            cyclist_level = niveau_db.lower()

        bike_id = data.get("bike_id")
        if bike_id and str(bike_id).lstrip('-').isdigit():
            bike = db.query(Bike).filter(Bike.id == int(bike_id), Bike.user_id == current_user.id).first()
            if bike:
                is_electric = bike.is_electric
                bike_type = bike.type or "standard"

    limite_temps = datetime.now() - timedelta(hours=48)
    recent_reports = db.query(Report).filter(Report.created_at >= limite_temps).all()
    
    reported_edges = {}

    if recent_reports:
        lons = [r.longitude for r in recent_reports]
        lats = [r.latitude for r in recent_reports]
        nearest_edges = ox.distance.nearest_edges(G, X=lons, Y=lats)
        
        for i, (u, v, k) in enumerate(nearest_edges):
            r_type = recent_reports[i].report_type.lower()
            
            edges_to_penalize = [(u, v), (v, u)]
            
            if G.has_node(u):
                for neighbor in G.successors(u):
                    edges_to_penalize.extend([(u, neighbor), (neighbor, u)])
            if G.has_node(v):
                for neighbor in G.successors(v):
                    edges_to_penalize.extend([(v, neighbor), (neighbor, v)])
                    
            for edge in edges_to_penalize:
                if reported_edges.get(edge) != "accident":
                    reported_edges[edge] = r_type

    try:
        result = get_optimal_routes(
            G,
            start_coords=start,
            end_coords=end,
            bike_type=bike_type,          
            is_electric=is_electric,      
            cyclist_level=cyclist_level,  
            max_time_min=data.get("temps_max_min"),
            iterations=data.get("iterations", 6),
            reported_edges=reported_edges
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
    
    for route in result.get("routes", []):
        route["maneuvers"] = build_maneuvers(route["nodes"], G)

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
                path=route_info.get("path"),
                bike_type=bike_type,
                is_electric=str(is_electric),
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
