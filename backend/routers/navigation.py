from fastapi import APIRouter, HTTPException
from schemas.navigation import (
    NavigationUpdateRequest,
    NavigationUpdateResponse,
)
from services.guidance import navigation_update
from services.instruction_builder import build_instruction
from graph_manager import get_graph

router = APIRouter(prefix="/navigation", tags=["navigation"])


@router.post("/update", response_model=NavigationUpdateResponse)
def update_navigation(req: NavigationUpdateRequest):
    G = get_graph()

    maneuvers_as_dicts = [m.model_dump() for m in req.maneuvers]

    result = navigation_update(
        req.lat,
        req.lon,
        req.route_nodes,
        maneuvers_as_dicts,
        req.step_idx,
        G,
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