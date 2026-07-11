"""Comptage des critères de badges et déblocage.

Un badge se débloque quand le compteur associé à son `criteria` atteint son `goal_value`.
Tous les compteurs ne portent que sur les trajets *terminés* (`completed_at IS NOT NULL`) :
`compute_route` insère 2 à 3 lignes `routes` par recherche (fast / safe / compromise), et
seule la variante réellement parcourue est complétée.
"""

from sqlalchemy import text
from sqlalchemy.orm import Session

COUNTERS = {
    "routes_completed": (
        "SELECT count(*) FROM routes "
        "WHERE user_id = :uid AND completed_at IS NOT NULL"
    ),
    "safe_routes_completed": (
        "SELECT count(*) FROM routes "
        "WHERE user_id = :uid AND completed_at IS NOT NULL AND route_type = 'safe'"
    ),
    "total_distance_km": (
        "SELECT COALESCE(SUM(distance_km), 0) FROM routes "
        "WHERE user_id = :uid AND completed_at IS NOT NULL"
    ),
}

BADGE_FIELDS = "id, code, name, description, criteria, icon, goal_value"


def count_criteria(db: Session, criteria: str, user_id: int) -> float:
    """Valeur courante du compteur, ou 0 si le critère est inconnu."""
    sql = COUNTERS.get(criteria)
    if not sql:
        return 0
    return db.execute(text(sql), {"uid": user_id}).scalar() or 0


def count_all_criteria(db: Session, badges, user_id: int) -> dict:
    """Calcule chaque critère une seule fois, même s'il est partagé par plusieurs badges."""
    counts = {}
    for badge in badges:
        criteria = badge["criteria"]
        if criteria not in counts:
            counts[criteria] = count_criteria(db, criteria, user_id)
    return counts


def evaluate_badges(db: Session, user) -> list[dict]:
    """Débloque les badges atteints et renvoie ceux qui viennent de l'être."""
    badges = db.execute(text(f"SELECT {BADGE_FIELDS} FROM badges")).mappings().all()
    counts = count_all_criteria(db, badges, user.id)

    newly_unlocked = []
    for badge in badges:
        goal = badge["goal_value"]
        if goal is None or counts.get(badge["criteria"], 0) < goal:
            continue
        # ON CONFLICT DO NOTHING + RETURNING : seule l'insertion réellement effectuée
        # renvoie une ligne, ce qui neutralise deux POST /complete concurrents.
        inserted = db.execute(text("""
            INSERT INTO user_badges (user_id, badge_id)
            VALUES (:uid, :bid)
            ON CONFLICT (user_id, badge_id) DO NOTHING
            RETURNING badge_id
        """), {"uid": user.id, "bid": badge["id"]}).first()
        if inserted is not None:
            newly_unlocked.append(dict(badge))

    db.commit()
    return newly_unlocked
