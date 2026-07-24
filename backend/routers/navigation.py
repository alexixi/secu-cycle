from fastapi import APIRouter, HTTPException, Request
from schemas.navigation import (
    NavigationUpdateRequest,
    NavigationUpdateResponse,
)
from graph.guidance import navigation_update
from graph.instruction_builder import build_instruction
from limiter import limiter

router = APIRouter(prefix="/navigation", tags=["navigation"])


@router.post("/update", response_model=NavigationUpdateResponse)
@limiter.limit("300/minute")
def update_navigation(req: NavigationUpdateRequest, request: Request):
    G = request.app.state.G
    if G is None:
        raise HTTPException(status_code=503, detail="Graphe non chargé")

    maneuvers_as_dicts = [m.model_dump() for m in req.maneuvers]

    result = navigation_update(
        req.lat,
        req.lon,
        req.route_nodes,
        maneuvers_as_dicts,
        req.step_idx,
        G,
        req.path,
    )

    if result["status"] == "on_route":
        result["instruction"] = build_instruction(
            result["current_maneuver"],
            result["distance_to_next_m"],
        )
        result["next_instruction"] = (
            build_instruction(result["next_maneuver"], 0)
            if result["next_maneuver"]
            else None
        )
    else:
        result["instruction"] = None
        result["next_instruction"] = None

    return result
