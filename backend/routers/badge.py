from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from dependencies import get_current_user, require_admin
from i18n import get_locale, t
from schemas.badge import BadgeProgress, BadgeObtained
from utils.badges import count_all_criteria

router = APIRouter(prefix="/badges", tags=["Badges"])


@router.get("/", response_model=List[BadgeProgress])
def list_badges(db: Session = Depends(get_db), current_user=Depends(get_current_user),
                locale: str = Depends(get_locale)):
    """Catalogue complet, avec pour chaque badge son état et la progression de l'utilisateur."""
    # Sans `criteria` aucun compteur ne s'applique : le badge resterait affiché à 0/N et
    # ne pourrait jamais être débloqué. Les bases héritées d'init_db.sql en contiennent.
    badges = db.execute(text("""
        SELECT b.id, b.code, b.name, b.description, b.criteria, b.icon, b.goal_value,
               ub.obtained_at
        FROM badges b
        LEFT JOIN user_badges ub ON ub.badge_id = b.id AND ub.user_id = :uid
        WHERE b.criteria IS NOT NULL
        ORDER BY b.goal_value NULLS LAST, b.id
    """), {"uid": current_user.id}).mappings().all()

    counts = count_all_criteria(db, badges, current_user.id)
    # Le `code` est la clé stable ; `name` et `description` restent en base pour
    # le dashboard admin et comme repli, mais ce qui est servi vient du catalogue,
    # dans la langue de la requête. Un badge ajouté sans clé garde son texte de base.
    def libelle(badge, champ):
        cle = f"badge.{badge['code']}.{champ}"
        rendu = t(cle, locale)
        return badge[champ] if rendu == cle else rendu

    return [{**badge,
             "name": libelle(badge, "name"),
             "description": libelle(badge, "description"),
             "progress": counts.get(badge["criteria"], 0)}
            for badge in badges]


@router.get("/user/{user_id}", response_model=List[BadgeObtained])
def list_user_badges(user_id: int, db: Session = Depends(get_db), _admin=Depends(require_admin)):
    """Badges débloqués par un utilisateur donné, pour la fiche du dashboard admin."""
    exists = db.execute(text("SELECT 1 FROM users WHERE id = :uid"), {"uid": user_id}).first()
    if exists is None:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")

    # Pas de filtre sur `criteria` ici, contrairement à list_badges : celui-ci écarte les
    # badges non débloquables, alors qu'on répond ici à « qu'a-t-il réellement obtenu ».
    return db.execute(text("""
        SELECT b.id, b.code, b.name, b.description, b.criteria, b.icon, b.goal_value,
               ub.obtained_at
        FROM user_badges ub
        JOIN badges b ON b.id = ub.badge_id
        WHERE ub.user_id = :uid
        ORDER BY ub.obtained_at DESC, b.id
    """), {"uid": user_id}).mappings().all()
