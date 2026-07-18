import os
from datetime import datetime, timedelta
from typing import Optional

from passlib.context import CryptContext
from jose import JWTError, jwt


SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise RuntimeError(
        "La variable d'environnement SECRET_KEY est manquante. "
        "Générez-en une avec `openssl rand -hex 32` et placez-la dans le fichier .env."
    )
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60  # 1 heure
REFRESH_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 jours (réduit avec la rotation des refresh tokens)

#pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
pwd_context = CryptContext(
    schemes=["argon2"],
    deprecated="auto"
)


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, hashed_password: str) -> bool:
    return pwd_context.verify(password, hashed_password)


def _create_token(data: dict, expires_delta: timedelta, token_type: str):
    to_encode = data.copy()
    expire = datetime.utcnow() + expires_delta
    to_encode.update({"exp": expire, "type": token_type})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    delta = expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    return _create_token(data, delta, "access")


def create_refresh_token(data: dict, expires_delta: Optional[timedelta] = None):
    delta = expires_delta or timedelta(minutes=REFRESH_TOKEN_EXPIRE_MINUTES)
    return _create_token(data, delta, "refresh")


def verify_token(token: str, expected_type: str = "access"):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        return None

    if payload.get("type") != expected_type:
        return None

    return payload
