from pydantic import BaseModel, ConfigDict, Field
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
    model_config = ConfigDict(allow_inf_nan=False)
    lat: float = Field(ge=-90, le=90)
    lon: float = Field(ge=-180, le=180)
    step_idx: int = Field(ge=0)
    route_nodes: list[int] = Field(max_length=100_000)
    maneuvers: list[ManeuverOut] = Field(max_length=10_000)
    path: Optional[list] = Field(default=None, max_length=100_000)


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
