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
    is_verified = Column(Boolean, nullable=False, default=False, server_default="false")

    is_banned = Column(Boolean, nullable=False, default=False, server_default="false")
    reports_blocked = Column(Boolean, nullable=False, default=False, server_default="false")
    ban_reason = Column(Text, nullable=True)
    token_version = Column(Integer, nullable=False, server_default="0", default=0)

    # Réception du récapitulatif périodique d'activité. Activé par défaut : c'est
    # le résumé de ses propres trajets, pas de la prospection, et il se coupe en
    # un clic depuis l'e-mail comme depuis les réglages.
    recap_emails = Column(Boolean, nullable=False, default=True, server_default="true")
    # Révoque d'un coup tous les liens de désabonnement déjà envoyés. Distinct de
    # `token_version`, qui est incrémenté au changement de mot de passe : un lien
    # de désabonnement doit survivre à ce changement — « je change mon mot de
    # passe puis je me désabonne » est un enchaînement banal.
    recap_unsub_version = Column(Integer, nullable=False, server_default="0", default=0)

    created_at = Column(TIMESTAMP, server_default=func.now())
