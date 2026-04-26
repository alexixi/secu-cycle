from pydantic import BaseModel
from typing import Optional


class ManeuverOut(BaseModel):
    lat: float
    lon: float
    turn_type: str
    street_name: Optional[str] = None
    bearing_after: Optional[float] = None
    exit_number: Optional[int] = None


class InstructionOut(BaseModel):
    icon: str
    text: str
    distance_label: str
    turn_type: str
    bearing: Optional[float] = None
    exit_number: Optional[int] = None


class NavigationUpdateRequest(BaseModel):
    lat: float
    lon: float
    step_idx: int
    route_nodes: list[int]
    maneuvers: list[ManeuverOut]


class NavigationUpdateResponse(BaseModel):
    status: str
    snap_distance_m: float
    snapped_lat: float
    snapped_lon: float
    current_step_idx: int
    distance_to_next_m: Optional[int] = None
    instruction: Optional[InstructionOut] = None
    next_instruction: Optional[InstructionOut] = None
    recalculate: bool