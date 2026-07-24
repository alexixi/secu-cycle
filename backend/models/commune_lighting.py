from sqlalchemy import Column, Integer, String, TIMESTAMP
from sqlalchemy.sql import func
from database import Base


class CommuneLighting(Base):
    """Horaires d'extinction de l'éclairage public, par commune.

    L'extinction nocturne est décidée **par la commune**, pas par le profil de
    graphe : un profil comme `bordeaux_metropole` couvre 43 communes aux
    politiques différentes. Stocker l'horaire ici le partage entre tous les
    profils qui contiennent la commune, au lieu de le dupliquer.

    Table distincte de `CommuneGeometry` à dessein : cette dernière est un cache
    Nominatim, qu'on doit pouvoir purger sans emporter des réglages saisis à la
    main.
    """

    __tablename__ = "commune_lighting"

    id = Column(Integer, primary_key=True, index=True)

    # La chaîne Nominatim telle que stockée dans `graph_profiles.communes`
    # (« Bordeaux, France ») : c'est la seule clé commune aux deux.
    commune = Column(String(255), nullable=False, unique=True)

    # Heures locales (0–24). NULL = pas d'horaire connu, on retombe sur le défaut
    # du profil puis sur NIGHT_EXTINCTION_WINDOW ; start == end = pas d'extinction.
    night_extinction_start = Column(Integer, nullable=True)
    night_extinction_end = Column(Integer, nullable=True)

    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())
