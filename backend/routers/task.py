from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from database import get_db
from models.task import Task
from models.tag import Tag
from models.user import User
from schemas.task import TaskCreate, TaskUpdate, TaskRead, TaskReorder
from dependencies import require_admin
from admin_emails import is_user_admin

router = APIRouter(prefix="/tasks", tags=["Tasks"])


def _ensure_assignee_is_admin(db: Session, assignee_id):
    """Vérifie que l'assigné existe et est bien administrateur (ou None)."""
    if assignee_id is None:
        return
    user = db.query(User).filter(User.id == assignee_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="Utilisateur assigné introuvable.")
    if not is_user_admin(user):
        raise HTTPException(status_code=400, detail="Une tâche ne peut être assignée qu'à un administrateur.")


def _resolve_tags(db: Session, tag_ids):
    """Renvoie les étiquettes correspondant aux ids fournis (404 si l'une manque)."""
    if not tag_ids:
        return []
    unique_ids = list(dict.fromkeys(tag_ids))
    tags = db.query(Tag).filter(Tag.id.in_(unique_ids)).all()
    if len(tags) != len(unique_ids):
        raise HTTPException(status_code=404, detail="Une ou plusieurs étiquettes sont introuvables.")
    return tags


@router.get("/", response_model=list[TaskRead])
def list_tasks(db: Session = Depends(get_db), _admin: User = Depends(require_admin)):
    """Liste de toutes les tâches, triées par colonne puis position."""
    return (
        db.query(Task)
        .order_by(Task.status, Task.position, Task.id)
        .all()
    )


@router.post("/", response_model=TaskRead, status_code=201)
def create_task(
    data: TaskCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    _ensure_assignee_is_admin(db, data.assignee_id)

    # La nouvelle tâche se place en fin de sa colonne.
    max_position = (
        db.query(func.max(Task.position)).filter(Task.status == data.status).scalar()
    )
    position = (max_position + 1) if max_position is not None else 0

    task = Task(
        title=data.title,
        description=data.description,
        status=data.status,
        assignee_id=data.assignee_id,
        created_by_id=admin.id,
        position=position,
    )
    if data.tag_ids is not None:
        task.tags = _resolve_tags(db, data.tag_ids)
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@router.patch("/{task_id}", response_model=TaskRead)
def update_task(
    task_id: int,
    updates: TaskUpdate,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if task is None:
        raise HTTPException(status_code=404, detail="Tâche introuvable.")

    update_data = updates.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="Aucun champ à mettre à jour.")

    if "assignee_id" in update_data:
        _ensure_assignee_is_admin(db, update_data["assignee_id"])

    # tag_ids n'est pas une colonne : on remplace la relation à part.
    if "tag_ids" in update_data:
        task.tags = _resolve_tags(db, update_data.pop("tag_ids"))

    # Si la colonne change sans position explicite, on place la tâche en fin de
    # sa nouvelle colonne.
    if "status" in update_data and update_data["status"] != task.status and "position" not in update_data:
        max_position = (
            db.query(func.max(Task.position))
            .filter(Task.status == update_data["status"])
            .scalar()
        )
        update_data["position"] = (max_position + 1) if max_position is not None else 0

    for field, value in update_data.items():
        setattr(task, field, value)
    db.commit()
    db.refresh(task)
    return task


@router.delete("/{task_id}", status_code=204)
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if task is None:
        raise HTTPException(status_code=404, detail="Tâche introuvable.")
    db.delete(task)
    db.commit()


@router.put("/reorder", response_model=list[TaskRead])
def reorder_tasks(
    data: TaskReorder,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    """Applique en une fois le statut et la position de chaque tâche déplacée.

    Gère à la fois le réordonnancement dans une colonne et le passage d'une
    colonne à l'autre (glisser-déposer du planning).
    """
    tasks = {t.id: t for t in db.query(Task).all()}
    for item in data.items:
        task = tasks.get(item.id)
        if task is not None:
            task.status = item.status
            task.position = item.position
    db.commit()
    return db.query(Task).order_by(Task.status, Task.position, Task.id).all()
