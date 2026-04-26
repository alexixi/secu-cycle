from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List, Any
from schemas.navigation import ManeuverOut

class RouteBase(BaseModel):
    start_address: str
    end_address: str
    route_type: str
    distance_km: Optional[float] = None
    duration_min: Optional[float] = None
    safety_score: Optional[float] = None

class RouteCreate(RouteBase):
    pass

class RouteRead(RouteBase):
    id: int
    user_id: Optional[int] = None
    path: Optional[List[Any]] = None
    bike_type: Optional[str] = None
    is_electric: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
        
class ComputedRoute(BaseModel):
    """Une route calculée par get_optimal_routes, jamais persistée telle quelle."""
    id: str                          # "fast" | "safe" | "compromise"
    name: str
    path: List[Any]                  # liste de coordonnées GeoJSON
    nodes: List[int]                 # route_nodes OSMnx, utile côté front pour /nav/update
    distance: float
    duration: float
    height_difference: Any
    score: float
    maneuvers: List[ManeuverOut] = []

class ComputeRoutesResponse(BaseModel):
    """Réponse complète de ton endpoint POST /routes/compute."""
    success: bool
    routes: List[ComputedRoute] = []
    bounded_error: Optional[str] = None
    error: Optional[str] = None