from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import text
from sqlalchemy.orm import Session
import asyncio
import osmnx as ox
from typing import List
from database import get_db
from schemas.route import RouteCreate, RouteRead, ComputeRoutesResponse, ComputeRouteRequest
from schemas.badge import CompleteRouteResponse
from models.route import Route
from utils.badges import evaluate_badges
from dependencies import get_current_user, get_current_user_optional
from graph.routing import get_optimal_routes
from models.bike import Bike
from models.history import UserHistory
from models.report import Report
from datetime import datetime, timedelta
from graph.guidance import build_maneuvers
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

@router.post("/route", response_model=ComputeRoutesResponse)
async def compute_route(request: Request, data: ComputeRouteRequest, db: Session = Depends(get_db), current_user=Depends(get_current_user_optional)):
    G = request.app.state.G
    if G is None:
        raise HTTPException(status_code=503, detail="Graphe non chargé")

    start = (data.start_lat, data.start_lon)
    end = (data.end_lat, data.end_lon)

    is_electric = data.is_electric
    bike_type = data.bike_type or "standard"
    cyclist_level = "intermediaire"

    if current_user:
        niveau_db = getattr(current_user, "sport_level", None)
        if niveau_db:
            cyclist_level = niveau_db.lower()

        if data.bike_id is not None:
            bike = db.query(Bike).filter(Bike.id == data.bike_id, Bike.user_id == current_user.id).first()
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
        # Calcul CPU-bound déporté hors de l'event loop pour ne pas bloquer le worker.
        result = await asyncio.to_thread(
            get_optimal_routes,
            G,
            start,
            end,
            bike_type,
            is_electric,
            cyclist_level,
            data.temps_max_min,
            data.iterations,
            reported_edges,
        )
    except Exception:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Erreur lors du calcul de l'itinéraire.")


    if not result.get("success"):
        raise HTTPException(status_code=404, detail={
            "code": result.get("error_code"),
            "message": result.get("error", "Calcul échoué."),
        })

    for route in result.get("routes", []):
            maneuvers = build_maneuvers(route["nodes"], G)

            # Nettoyage : si OSMnx a renvoyé une liste pour le nom de la rue, on la fusionne en string
            for m in maneuvers:
                if isinstance(m.get("street_name"), list):
                    m["street_name"] = " / ".join(m["street_name"])

            route["maneuvers"] = maneuvers

    if current_user:
        start_address = data.start_address or f"{start[0]}, {start[1]}"
        end_address = data.end_address or f"{end[0]}, {end[1]}"

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
            # Le front en a besoin pour appeler /complete sur la variante réellement suivie.
            # Muter route_info est sans risque : route_cache deepcopy en get comme en set.
            route_info["route_id"] = db_route.id
            db.add(UserHistory(
                user_id=current_user.id,
                route_id=db_route.id,
                action_type="trajet",
            ))

        db.commit()

    return result


@router.post("/{route_id}/complete", response_model=CompleteRouteResponse)
def complete_route(route_id: int, db: Session = Depends(get_db),
                   current_user=Depends(get_current_user)):
    """Marque un trajet comme terminé (appelé à l'arrivée) et débloque les badges atteints."""
    # Un seul UPDATE : appartenance (anti-IDOR), idempotence et pose du timestamp.
    updated = db.execute(text("""
        UPDATE routes SET completed_at = now()
        WHERE id = :rid AND user_id = :uid AND completed_at IS NULL
        RETURNING id
    """), {"rid": route_id, "uid": current_user.id}).first()

    if updated is None:
        # Aucune ligne touchée : soit la route n'existe pas / n'est pas la sienne,
        # soit elle était déjà terminée (rejeu du même appel).
        already_mine = db.execute(text(
            "SELECT 1 FROM routes WHERE id = :rid AND user_id = :uid"
        ), {"rid": route_id, "uid": current_user.id}).first()
        db.commit()
        if already_mine is None:
            raise HTTPException(status_code=404, detail="Route introuvable")
        return CompleteRouteResponse(completed=False, newly_unlocked=[])

    db.commit()
    return CompleteRouteResponse(
        completed=True,
        newly_unlocked=evaluate_badges(db, current_user),
    )
