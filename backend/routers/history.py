from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List
from database import get_db
from schemas.history import UserHistoryRead
from models.history import UserHistory
from models.route import Route
from dependencies import get_current_user
from i18n import get_locale, t

# L'historique n'est plus écrit par le client : la seule source d'entrées est
# POST /routes/{id}/complete, appelé à l'arrivée d'un guidage.
router = APIRouter(prefix="/history", tags=["History"])

# Récupérer tout l'historique de l'utilisateur connecté : uniquement les trajets
# réellement parcourus en guidage, jamais les itinéraires simplement recherchés.
@router.get("/", response_model=List[UserHistoryRead])
def get_my_history(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return (
        db.query(UserHistory)
        .join(UserHistory.route)
        .options(joinedload(UserHistory.route))
        .filter(UserHistory.user_id == current_user.id)
        .filter(Route.completed_at.isnot(None))
        .order_by(UserHistory.created_at.desc())
        .all()
    )

@router.delete("/", status_code=204)
def delete_all_history(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    db.query(UserHistory).filter(UserHistory.user_id == current_user.id).delete()
    db.commit()


@router.delete("/{history_id}", status_code=204)
def delete_history_entry(history_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user),
                         locale: str = Depends(get_locale)):
    entry = db.query(UserHistory).filter(UserHistory.id == history_id, UserHistory.user_id == current_user.id).first()
    if not entry:
        raise HTTPException(status_code=404, detail=t("error.history.not_found", locale))
    db.delete(entry)
    db.commit()


# Récupérer une entrée d'historique par son ID
@router.get("/{history_id}", response_model=UserHistoryRead)
def get_history_entry(history_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user),
                      locale: str = Depends(get_locale)):
    entry = (
        db.query(UserHistory)
        .join(UserHistory.route)
        .options(joinedload(UserHistory.route))
        .filter(UserHistory.id == history_id, UserHistory.user_id == current_user.id)
        .filter(Route.completed_at.isnot(None))
        .first()
    )
    if not entry:
        raise HTTPException(status_code=404, detail=t("error.history.not_found", locale))
    return entry

