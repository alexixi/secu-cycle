from sqlalchemy import Boolean, Column, Index, Integer, String, Float, ForeignKey, DateTime, Text, JSON
from sqlalchemy.sql import func, text
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
    path = Column(JSON, nullable=True)
    bike_type = Column(String(50), nullable=True)
    is_electric = Column(String(5), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    # Renseigné à l'arrivée via POST /routes/{id}/complete. Une ligne est créée dès le
    # calcul (2-3 variantes par recherche) : seule celle réellement parcourue est complétée.
    completed_at = Column(DateTime(timezone=True), nullable=True)
    # Temps qu'il faisait au point de départ, figé au calcul (cf. `_apply_weather`).
    # Alimente le badge « Rouleur sous la pluie ». Reste à false si la météo était
    # indisponible : on n'invente pas une condition qu'on n'a pas mesurée.
    was_rainy = Column(Boolean, nullable=False, server_default="false")
    # Dénivelé du tracé, figé au calcul comme `was_rainy` : c'est le seul moment
    # où le graphe est sous la main. NULL signifie « non mesuré » et se distingue
    # d'un 0 qui, lui, veut dire « plat » — la reprise de l'historique ne comble
    # que les lignes dont le `path` porte des altitudes exploitables.
    elevation_gain_m = Column(Float, nullable=True)
    elevation_loss_m = Column(Float, nullable=True)

    __table_args__ = (
        # Sert les compteurs de badges et l'agrégation des récapitulatifs, qui
        # partent tous d'un utilisateur et ne regardent que les trajets terminés.
        # Partiel : `routes` grossit de 2 à 3 lignes par recherche d'itinéraire et
        # seule une minorité est complétée — inutile d'indexer le reste.
        Index(
            "ix_routes_user_completed",
            "user_id",
            "completed_at",
            postgresql_where=text("completed_at IS NOT NULL"),
        ),
    )
