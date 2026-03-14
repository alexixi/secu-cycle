from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, TIMESTAMP
from sqlalchemy.sql import func
from database import Base

class Bike(Base):
    __tablename__ = "bikes"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))

    type = Column(String(50))
    is_electric = Column(Boolean, default=False)
    created_at = Column(TIMESTAMP, server_default=func.now())
