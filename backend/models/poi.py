from sqlalchemy import (
    Column, Integer, BigInteger, String, Float, JSON, TIMESTAMP,
    UniqueConstraint, Index,
)
from sqlalchemy.sql import func
from database import Base


POI_CATEGORIES = ("water", "toilets", "parking", "repair")

PARKING_TYPES = ("stands", "racks", "shelter", "other")

_PARKING_TYPE_BY_OSM_VALUE = {
    # Arceaux : le cadre peut être attaché.
    "stands": "stands",
    "wide_stands": "stands",
    "bollard": "stands",
    "anchors": "stands",
    "safe_loops": "stands",
    "staple": "stands",
    "crossbar": "stands",
    "arceau": "stands",
    "arceaux": "stands",
    "arceau_large": "stands",
    # Râteliers et pince-roues : seule la roue est tenue.
    "wall_loops": "racks",
    "wall_hoops": "racks",
    "loops": "racks",
    "rack": "racks",
    "ground_slots": "racks",
    "floor": "racks",
    "handlebar_holder": "racks",
    "two-tier": "racks",
    "streetpod": "racks",
    # Abris, vélostations et consignes.
    "shed": "shelter",
    "building": "shelter",
    "garage": "shelter",
    "lockers": "shelter",
    "lean_to": "shelter",
}


REPAIR_KINDS = ("shop", "selfservice")


def repair_kind_of(tags) -> str:
    """Distingue un atelier/magasin vélo (staffé) d'une borne en libre-service.

    Un `shop=bicycle` est un réparateur staffé ; les bornes de réparation et
    gonfleurs publics (`amenity=bicycle_repair_station` / `compressed_air`)
    sont en libre-service.
    """
    return "shop" if (tags or {}).get("shop") == "bicycle" else "selfservice"


TOILET_FEES = ("free", "paid", "unknown")

_FEE_FREE = ("no", "0", "false", "free")
_FEE_PAID = ("yes", "1", "true")


def toilet_fee_of(tags) -> str:
    """Gratuité d'une toilette, déduite du tag OSM `fee`.

    Renvoie "unknown" quand le tag est absent (~40 % des cas). Un montant
    explicite ("1 EUR", "0.50") vaut payant.
    """
    raw = (tags or {}).get("fee")
    if raw is None:
        return "unknown"
    val = str(raw).strip().lower()
    if val in _FEE_FREE:
        return "free"
    if val in _FEE_PAID:
        return "paid"
    return "paid" if any(c.isdigit() for c in val) else "unknown"


def parking_type_of(tags) -> str:
    """Famille d'aménagement d'un parking vélo, déduite du tag `bicycle_parking`.

    Ce tag est un champ libre : une trentaine de valeurs distinctes coexistent
    sur Bordeaux, dont des saisies fantaisistes. Tout ce qui n'est pas reconnu
    tombe dans "other" plutôt que de polluer les filtres.
    """
    raw = (tags or {}).get("bicycle_parking")
    if not isinstance(raw, str):
        return "other"
    first = raw.split(";")[0].strip().lower()
    return _PARKING_TYPE_BY_OSM_VALUE.get(first, "other")


class MapPoi(Base):
    __tablename__ = "map_pois"

    id = Column(Integer, primary_key=True, index=True)

    osm_type = Column(String(10), nullable=False)
    osm_id = Column(BigInteger, nullable=False)

    category = Column(String(20), nullable=False)
    name = Column(String(255), nullable=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)

    tags = Column(JSON, nullable=True)

    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        UniqueConstraint(
            "osm_type", "osm_id", "category",
            name="uq_map_pois_osm_object_category",
        ),
        Index("ix_map_pois_cat_lat_lon", "category", "latitude", "longitude"),
    )
