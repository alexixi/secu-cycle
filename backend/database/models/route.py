from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Text
from sqlalchemy.sql import func
from database import Base

class Route(Base):
    __tablename__ = "routes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    start_address = Column(Text, nullable=False)
    end_address = Column(Text, nullable=False)
    route_type = Column(String(50)) 
    distance_km = Column(Float)
    duration_min = Column(Float)
    safety_score = Column(Float)
    created_at = Column(DateTime(timezone=True), server_default=func.now())