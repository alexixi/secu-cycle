from sqlalchemy.exc import IntegrityError

from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from database import get_db
from models.user import User
from schemas.user import UserCreate, UserRead, UserLogin, UserUpdate, UserAdminUpdate, PasswordChange, TokenRefresh
from fastapi import HTTPException
from utils.security import verify_password, hash_password, create_access_token, create_refresh_token, verify_token
from dependencies import get_current_user, require_admin
from admin_emails import is_user_admin
from fastapi.security import OAuth2PasswordRequestForm
from limiter import limiter

router = APIRouter(prefix="/users", tags=["Users"])


def _with_effective_admin(db: Session, user: User) -> User:
    """Reflète `ADMIN_EMAILS` dans le champ `is_admin` renvoyé, sans persister.

    L'instance est détachée de la session pour garantir qu'aucune écriture ne
    parte en base (les endpoints concernés sont en lecture seule).
    """
    db.expunge(user)
    user.is_admin = is_user_admin(user)
    return user

@router.post("/", response_model=UserRead)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    db_user = User(
        email=user.email,
        password_hash= hash_password(user.password),
        first_name=user.first_name,
        last_name=user.last_name,
        birth_date=user.birth_date,
        sport_level=user.sport_level,
        home_address=user.home_address,
        work_address=user.work_address
    )
   # print("TYPE PASSWORD:", type(user.password))
   # print("VALUE PASSWORD:", user.password)
    db.add(db_user)
    try:
        db.commit()
        db.refresh(db_user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Cette adresse e-mail est déjà associée à un compte."
        )
    return db_user

@router.post("/login")
@limiter.limit("5/minute")
def login(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    db_user = db.query(User).filter(User.email == form_data.username).first()

    if not db_user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not verify_password(form_data.password, db_user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access_token = create_access_token(data={"sub": str(db_user.id)})
    refresh_token = create_refresh_token(data={"sub": str(db_user.id)})

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }


@router.post("/refresh")
def refresh_access_token(data: TokenRefresh, db: Session = Depends(get_db)):
    payload = verify_token(data.refresh_token, expected_type="refresh")
    if payload is None:
        raise HTTPException(status_code=401, detail="Refresh token invalide ou expiré")

    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=401, detail="Refresh token invalide")

    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise HTTPException(status_code=401, detail="Utilisateur introuvable")

    access_token = create_access_token(data={"sub": str(user.id)})

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }



@router.get("/me", response_model=UserRead)
def get_me(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return _with_effective_admin(db, current_user)


@router.patch("/me", response_model=UserRead)
def update_me(
    updates: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    update_data = updates.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="Aucun champ à mettre à jour.")
    for field, value in update_data.items():
        setattr(current_user, field, value)
    db.commit()
    db.refresh(current_user)
    return current_user


@router.patch("/me/password", status_code=204)
def update_password(
    data: PasswordChange,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not verify_password(data.old_password, current_user.password_hash):
        raise HTTPException(status_code=401, detail="Ancien mot de passe incorrect.")
    current_user.password_hash = hash_password(data.new_password)
    db.commit()


# --- Administration des utilisateurs (réservé aux admins) ---

@router.get("/", response_model=list[UserRead])
def list_users(
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    users = db.query(User).order_by(User.created_at.desc()).all()
    return [_with_effective_admin(db, u) for u in users]


@router.get("/admins", response_model=list[UserRead])
def list_admins(
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    """Liste des administrateurs effectifs (utilisée pour assigner les tâches)."""
    users = db.query(User).order_by(User.first_name, User.last_name, User.email).all()
    return [_with_effective_admin(db, u) for u in users if is_user_admin(u)]


@router.get("/{user_id}", response_model=UserRead)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable.")
    return _with_effective_admin(db, user)


@router.patch("/{user_id}", response_model=UserRead)
def admin_update_user(
    user_id: int,
    updates: UserAdminUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable.")

    update_data = updates.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="Aucun champ à mettre à jour.")

    # Un admin ne peut pas se retirer à lui-même ses propres droits (évite de se verrouiller dehors).
    if user.id == admin.id and update_data.get("is_admin") is False:
        raise HTTPException(
            status_code=400,
            detail="Vous ne pouvez pas retirer vos propres droits d'administrateur.",
        )

    for field, value in update_data.items():
        setattr(user, field, value)
    db.commit()
    db.refresh(user)
    return _with_effective_admin(db, user)


@router.delete("/{user_id}", status_code=204)
def admin_delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    if user_id == admin.id:
        raise HTTPException(
            status_code=400,
            detail="Vous ne pouvez pas supprimer votre propre compte.",
        )
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable.")
    db.delete(user)
    db.commit()