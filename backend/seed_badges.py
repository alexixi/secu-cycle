"""Seed idempotent du catalogue de badges.

Idempotent par `code` (et non par « table vide » comme seed_faqs) : un badge
déjà présent voit ses libellés, icône et seuil mis à jour, ce qui permet d'ajuster le
catalogue au fil des déploiements sans dupliquer.

`icon` est un nom d'icône Ionicons, consommé tel quel par l'application mobile.
"""

from database import SessionLocal
from models.badge import Badge

DEFAULT_BADGES = [
    {
        "code": "first_route",
        "name": "Premier itinéraire",
        "description": "Terminer votre premier trajet.",
        "criteria": "routes_completed",
        "icon": "bicycle",
        "goal_value": 1,
    },
    {
        "code": "routes_10",
        "name": "10 itinéraires",
        "description": "Terminer 10 trajets.",
        "criteria": "routes_completed",
        "icon": "trophy",
        "goal_value": 10,
    },
    {
        "code": "rain_rider",
        "name": "Rouleur sous la pluie",
        "description": "Terminer 5 trajets partis sous la pluie.",
        "criteria": "rainy_routes_completed",
        "icon": "rainy",
        "goal_value": 5,
    },
    {
        "code": "safe_routes_10",
        "name": "10 itinéraires sécurisés",
        "description": "Terminer 10 trajets en suivant l'itinéraire sécurisé.",
        "criteria": "safe_routes_completed",
        "icon": "shield-checkmark",
        "goal_value": 10,
    },
    {
        "code": "distance_50",
        "name": "50 km parcourus",
        "description": "Cumuler 50 km sur vos trajets terminés.",
        "criteria": "total_distance_km",
        "icon": "speedometer",
        "goal_value": 50,
    },
    {
        "code": "distance_200",
        "name": "200 km parcourus",
        "description": "Cumuler 200 km sur vos trajets terminés.",
        "criteria": "total_distance_km",
        "icon": "earth",
        "goal_value": 200,
    },
]


def seed_badges():
    """Insère ou met à jour les badges par défaut (idempotent, clé = code)."""
    db = SessionLocal()
    try:
        for data in DEFAULT_BADGES:
            badge = db.query(Badge).filter(Badge.code == data["code"]).first()
            if badge is None:
                db.add(Badge(**data))
            else:
                for field, value in data.items():
                    setattr(badge, field, value)
        db.commit()
    finally:
        db.close()
