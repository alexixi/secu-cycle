from sqlalchemy import Column, Integer, String, TIMESTAMP, ForeignKey, UniqueConstraint
from sqlalchemy.sql import func
from database import Base


# Motifs proposés au dénonciateur. Volontairement courts et non extensibles côté
# client : la liste sert au tri de la file de modération, pas à recueillir un
# récit — le champ libre serait un second vecteur de contenu répréhensible.
ABUSE_REASONS = ("offensive", "spam", "wrong_place", "other")


class ReportAbuse(Base):
    """Dénonciation d'un signalement pour contenu répréhensible.

    À ne pas confondre avec `ReportVote` : « Pas là » juge l'exactitude d'un
    signalement, cette table juge sa décence. Un signalement peut être exact et
    inacceptable, l'inverse aussi ; les deux mécanismes doivent donc rester
    distincts, y compris dans l'interface.

    Une dénonciation par (signalement, utilisateur) : sans quoi une seule
    personne atteindrait à elle seule le seuil de masquage.
    """

    __tablename__ = "report_abuses"
    __table_args__ = (
        UniqueConstraint("report_id", "user_id", name="uq_report_abuses_report_user"),
    )

    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("reports.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    reason = Column(String(20), nullable=False, server_default="other")
    created_at = Column(TIMESTAMP, server_default=func.now())
