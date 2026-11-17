import base64
import hashlib
import hmac
import os
from datetime import datetime, timedelta, timezone
from uuid import UUID

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import get_db
from app.models import User

bearer = HTTPBearer(auto_error=False)
READ_ROLES = {"ADMINISTRADOR", "OPERADOR_LOGISTICO", "SUPERVISOR", "GERENCIA", "AUDITOR"}
WRITE_ROLES = {"ADMINISTRADOR", "OPERADOR_LOGISTICO"}


def hash_password(password: str) -> str:
    salt = os.urandom(16)
    digest = hashlib.scrypt(password.encode(), salt=salt, n=16384, r=8, p=1)
    return f"scrypt$16384$8$1${base64.b64encode(salt).decode()}${base64.b64encode(digest).decode()}"


def verify_password(password: str, encoded: str) -> bool:
    try:
        algorithm, n, r, p, salt, digest = encoded.split("$")
        if algorithm != "scrypt":
            return False
        actual = hashlib.scrypt(password.encode(), salt=base64.b64decode(salt), n=int(n), r=int(r), p=int(p))
        return hmac.compare_digest(actual, base64.b64decode(digest))
    except (ValueError, TypeError):
        return False


def create_token(user_id: UUID) -> str:
    if len(settings.jwt_secret) < 32 or "replace" in settings.jwt_secret.lower():
        raise RuntimeError("JWT_SECRET debe ser una clave aleatoria de al menos 32 caracteres")
    expires = datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_minutes)
    return jwt.encode({"sub": str(user_id), "exp": expires}, settings.jwt_secret, algorithm="HS256")


def user_from_token(token: str, db: Session) -> User | None:
    try:
        payload = jwt.decode(
            token, settings.jwt_secret, algorithms=["HS256"],
            options={"require": ["exp", "sub"]},
        )
        user_id = UUID(payload["sub"])
    except (jwt.PyJWTError, ValueError, KeyError):
        return None
    user = db.get(User, user_id)
    return user if user and user.estado == "ACTIVO" else None


def current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
    db: Session = Depends(get_db),
) -> User:
    user = user_from_token(credentials.credentials, db) if credentials else None
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Sesión inválida o vencida")
    return user


def require_read(user: User = Depends(current_user)) -> User:
    if not ({role.nombre for role in user.roles} & READ_ROLES):
        raise HTTPException(status_code=403, detail="Sin permiso de lectura")
    return user


def require_write(user: User = Depends(current_user)) -> User:
    if not ({role.nombre for role in user.roles} & WRITE_ROLES):
        raise HTTPException(status_code=403, detail="Sin permiso de escritura")
    return user
