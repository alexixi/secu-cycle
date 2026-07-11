from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List, Any, Dict
from schemas.navigation import ManeuverOut

class ComputeRouteRequest(BaseModel):
    """Entrée validée du calcul d'itinéraire POST /routes/route."""
    start_lat: float = Field(ge=-90, le=90)
    start_lon: float = Field(ge=-180, le=180)
    end_lat: float = Field(ge=-90, le=90)
    end_lon: float = Field(ge=-180, le=180)
    is_electric: bool = False
    bike_type: Optional[str] = Field(default="standard", max_length=50)
    bike_id: Optional[int] = None
    temps_max_min: Optional[float] = Field(default=None, ge=1, le=1440)
    iterations: int = Field(default=6, ge=1, le=20)
    start_address: Optional[str] = Field(default=None, max_length=255)
    end_address: Optional[str] = Field(default=None, max_length=255)

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
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ComputedRoute(BaseModel):
    """Une route calculée par get_optimal_routes, jamais persistée telle quelle."""
    id: str                          # "fast" | "safe" | "compromise"
    name: str
    route_id: Optional[int] = None   # id en base, None si utilisateur anonyme
    path: List[Any]                  # liste de coordonnées GeoJSON
    nodes: List[int]                 # route_nodes OSMnx, utile côté front pour /nav/update
    distance: float
    duration: float
    height_difference: Any
    score: float
    maneuvers: List[ManeuverOut] = []
    infra_stats: Optional[Dict[str, Any]] = None

class ComputeRoutesResponse(BaseModel):
    """Réponse complète de ton endpoint POST /routes/compute."""
    success: bool
    routes: List[ComputedRoute] = []
    bounded_error: Optional[str] = None
    error: Optional[str] = None