from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from database import get_db
from models.tag import Tag
from models.user import User
from schemas.tag import TagCreate, TagUpdate, TagRead
from dependencies import require_admin

router = APIRouter(prefix="/tags", tags=["Tags"])


@router.get("/", response_model=list[TagRead])
def list_tags(db: Session = Depends(get_db), _admin: User = Depends(require_admin)):
    """Liste de toutes les étiquettes, triées par nom."""
    return db.query(Tag).order_by(Tag.name).all()


@router.post("/", response_model=TagRead, status_code=201)
def create_tag(
    data: TagCreate,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    name = data.name.strip()
    existing = db.query(Tag).filter(func.lower(Tag.name) == name.lower()).first()
    if existing is not None:
        raise HTTPException(status_code=400, detail="Une étiquette portant ce nom existe déjà.")

    tag = Tag(name=name, color=data.color)
    db.add(tag)
    db.commit()
    db.refresh(tag)
    return tag


@router.patch("/{tag_id}", response_model=TagRead)
def update_tag(
    tag_id: int,
    updates: TagUpdate,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    tag = db.query(Tag).filter(Tag.id == tag_id).first()
    if tag is None:
        raise HTTPException(status_code=404, detail="Étiquette introuvable.")

    update_data = updates.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="Aucun champ à mettre à jour.")

    if "name" in update_data:
        name = update_data["name"].strip()
        duplicate = (
            db.query(Tag)
            .filter(func.lower(Tag.name) == name.lower(), Tag.id != tag_id)
            .first()
        )
        if duplicate is not None:
            raise HTTPException(status_code=400, detail="Une étiquette portant ce nom existe déjà.")
        update_data["name"] = name

    for field, value in update_data.items():
        setattr(tag, field, value)
    db.commit()
    db.refresh(tag)
    return tag


@router.delete("/{tag_id}", status_code=204)
def delete_tag(
    tag_id: int,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    tag = db.query(Tag).filter(Tag.id == tag_id).first()
    if tag is None:
        raise HTTPException(status_code=404, detail="Étiquette introuvable.")
    db.delete(tag)
    db.commit()
