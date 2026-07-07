from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from database import get_db
from models.home_case import HomeCase
from models.user import User
from schemas.home_case import (
    HomeCaseCreate,
    HomeCaseUpdate,
    HomeCaseRead,
    HomeCaseReorder,
)
from dependencies import require_admin

router = APIRouter(prefix="/home-cases", tags=["HomeCases"])


@router.get("/", response_model=list[HomeCaseRead])
def list_home_cases(db: Session = Depends(get_db)):
    """Liste publique des cases de la page d'accueil, triées par position."""
    return db.query(HomeCase).order_by(HomeCase.position, HomeCase.id).all()


@router.post("/", response_model=HomeCaseRead, status_code=201)
def create_home_case(
    data: HomeCaseCreate,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    position = data.position
    if position is None:
        max_position = db.query(func.max(HomeCase.position)).scalar()
        position = (max_position + 1) if max_position is not None else 0

    case = HomeCase(title=data.title, text=data.text, position=position)
    db.add(case)
    db.commit()
    db.refresh(case)
    return case


@router.patch("/{case_id}", response_model=HomeCaseRead)
def update_home_case(
    case_id: int,
    updates: HomeCaseUpdate,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    case = db.query(HomeCase).filter(HomeCase.id == case_id).first()
    if case is None:
        raise HTTPException(status_code=404, detail="Case introuvable.")

    update_data = updates.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="Aucun champ à mettre à jour.")

    for field, value in update_data.items():
        setattr(case, field, value)
    db.commit()
    db.refresh(case)
    return case


@router.delete("/{case_id}", status_code=204)
def delete_home_case(
    case_id: int,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    case = db.query(HomeCase).filter(HomeCase.id == case_id).first()
    if case is None:
        raise HTTPException(status_code=404, detail="Case introuvable.")
    db.delete(case)
    db.commit()


@router.put("/reorder", response_model=list[HomeCaseRead])
def reorder_home_cases(
    data: HomeCaseReorder,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    """Réordonne les cases : la position de chaque case devient son index dans `ids`."""
    cases = {c.id: c for c in db.query(HomeCase).all()}
    for index, case_id in enumerate(data.ids):
        case = cases.get(case_id)
        if case is not None:
            case.position = index
    db.commit()
    return db.query(HomeCase).order_by(HomeCase.position, HomeCase.id).all()
