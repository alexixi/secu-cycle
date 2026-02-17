from sqlalchemy import Column, Integer, String, Boolean, Date, Text, TIMESTAMP
from sqlalchemy.sql import func
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(Text, nullable=False)

    first_name = Column(String(100))
    last_name = Column(String(100))
    birth_date = Column(Date)

    sport_level = Column(String(50))
    home_address = Column(Text)
    work_address = Column(Text)

    is_admin = Column(Boolean, default=False)
    created_at = Column(TIMESTAMP, server_default=func.now())
