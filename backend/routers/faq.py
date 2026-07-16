from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from database import get_db
from models.faq import Faq
from models.user import User
from schemas.faq import (
    FaqCreate,
    FaqUpdate,
    FaqRead,
    FaqReorder,
)
from dependencies import require_admin

router = APIRouter(prefix="/faqs", tags=["FAQ"])


@router.get("/", response_model=list[FaqRead])
def list_faqs(db: Session = Depends(get_db)):
    """Liste publique des questions/réponses publiées, triées par position."""
    return (
        db.query(Faq)
        .filter(Faq.is_published.is_(True))
        .order_by(Faq.position, Faq.id)
        .all()
    )


@router.get("/admin", response_model=list[FaqRead])
def list_faqs_admin(
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    """Liste complète (brouillons compris) pour la gestion admin."""
    return db.query(Faq).order_by(Faq.position, Faq.id).all()


@router.post("/", response_model=FaqRead, status_code=201)
def create_faq(
    data: FaqCreate,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    position = data.position
    if position is None:
        max_position = db.query(func.max(Faq.position)).scalar()
        position = (max_position + 1) if max_position is not None else 0

    faq = Faq(
        question=data.question,
        answer=data.answer,
        position=position,
        is_published=data.is_published if data.is_published is not None else True,
    )
    db.add(faq)
    db.commit()
    db.refresh(faq)
    return faq


@router.patch("/{faq_id}", response_model=FaqRead)
def update_faq(
    faq_id: int,
    updates: FaqUpdate,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    faq = db.query(Faq).filter(Faq.id == faq_id).first()
    if faq is None:
        raise HTTPException(status_code=404, detail="Question introuvable.")

    update_data = updates.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="Aucun champ à mettre à jour.")

    for field, value in update_data.items():
        setattr(faq, field, value)
    db.commit()
    db.refresh(faq)
    return faq


@router.delete("/{faq_id}", status_code=204)
def delete_faq(
    faq_id: int,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    faq = db.query(Faq).filter(Faq.id == faq_id).first()
    if faq is None:
        raise HTTPException(status_code=404, detail="Question introuvable.")
    db.delete(faq)
    db.commit()


@router.put("/reorder", response_model=list[FaqRead])
def reorder_faqs(
    data: FaqReorder,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    """Réordonne les questions : la position de chaque entrée devient son index dans `ids`."""
    faqs = {f.id: f for f in db.query(Faq).all()}
    for index, faq_id in enumerate(data.ids):
        faq = faqs.get(faq_id)
        if faq is not None:
            faq.position = index
    db.commit()
    return db.query(Faq).order_by(Faq.position, Faq.id).all()
