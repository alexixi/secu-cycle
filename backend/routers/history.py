from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List
from database import get_db
from schemas.history import UserHistoryCreate, UserHistoryRead
from models.history import UserHistory
from dependencies import get_current_user

router = APIRouter(prefix="/history", tags=["History"])

@router.post("/", response_model=UserHistoryRead)
def create_history_entry(entry: UserHistoryCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    new_entry = UserHistory(**entry.dict(), user_id=current_user.id)
    db.add(new_entry)
    db.commit()
    db.refresh(new_entry)
    return new_entry

# Récupérer tout l'historique de l'utilisateur connecté
@router.get("/", response_model=List[UserHistoryRead])
def get_my_history(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return (
        db.query(UserHistory)
        .options(joinedload(UserHistory.route))
        .filter(UserHistory.user_id == current_user.id)
        .order_by(UserHistory.created_at.desc())
        .all()
    )

# Récupérer une entrée d'historique par son ID
@router.get("/{history_id}", response_model=UserHistoryRead)
def get_history_entry(history_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    entry = (
        db.query(UserHistory)
        .options(joinedload(UserHistory.route))
        .filter(UserHistory.id == history_id, UserHistory.user_id == current_user.id)
        .first()
    )
    if not entry:
        raise HTTPException(status_code=404, detail="Entrée d'historique introuvable")
    return entry

