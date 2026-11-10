from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.pagination import Page, PageParams, fetch, page_params
from app.core.security import require_read, require_write
from app.db.session import get_db
from app.models import User
from app.repositories import clients as repo
from app.schemas.operations import ClientInput, ClientOut
from app.services import clients as service

router = APIRouter(prefix="/api/v1/clientes", tags=["Clientes"])


@router.get("", response_model=list[ClientOut] | Page[ClientOut])
def list_all(activo: bool | None = None, params: PageParams = Depends(page_params), db: Session = Depends(get_db), user: User = Depends(require_read)):
    return fetch(db, repo.list_query(activo), params)


@router.post("", response_model=ClientOut, status_code=201)
def create(data: ClientInput, db: Session = Depends(get_db), user: User = Depends(require_write)):
    return service.create(db, user, data)


@router.get("/{client_id}", response_model=ClientOut)
def get(client_id: UUID, db: Session = Depends(get_db), user: User = Depends(require_read)):
    return service.get_client(db, client_id)


@router.put("/{client_id}", response_model=ClientOut)
def update(client_id: UUID, data: ClientInput, db: Session = Depends(get_db), user: User = Depends(require_write)):
    return service.update(db, user, client_id, data)
