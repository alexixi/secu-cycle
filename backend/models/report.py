from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, TIMESTAMP
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func, expression
from database import Base

class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    report_type = Column(String(50))
    report_description = Column(String)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())
    is_verified = Column(Boolean, nullable=False, server_default=expression.false())

    votes = relationship(
        "ReportVote",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
