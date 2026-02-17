from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models.user import User
from schemas.user import UserCreate, UserRead
#from utils.security import hash_password

router = APIRouter(prefix="/users", tags=["Users"])

@router.post("/", response_model=UserRead)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    db_user = User(
        email=user.email,
        password_hash= user.password, #hash_password(user.password),
        first_name=user.first_name,
        last_name=user.last_name,
        birth_date=user.birth_date,
        sport_level=user.sport_level,
        home_address=user.home_address,
        work_address=user.work_address
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user
