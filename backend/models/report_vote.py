from sqlalchemy import Column, Integer, Boolean, TIMESTAMP, ForeignKey, UniqueConstraint
from sqlalchemy.sql import func
from database import Base


class ReportVote(Base):
    """Vote « Là / Pas là » d'un utilisateur sur un signalement.

    Un utilisateur ne peut avoir qu'un seul vote par signalement (contrainte
    unique) : re-voter met à jour la ligne existante (`is_present` + `created_at`).
    Les compteurs et le statut du signalement ne sont pas stockés ; ils sont
    recalculés à la lecture à partir des votes encore valides (cf.
    `reports_lifecycle.compute_status`).
    """

    __tablename__ = "report_votes"
    __table_args__ = (
        UniqueConstraint("report_id", "user_id", name="uq_report_votes_report_user"),
    )

    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("reports.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    is_present = Column(Boolean, nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())
