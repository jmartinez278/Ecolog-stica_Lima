from app.core.pagination import PageParams
from app.repositories.pagination import fetch
from uuid import UUID, uuid4

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models import Client, User
from app.repositories import clients as repo
from app.schemas.operations import ClientInput
from app.services.common import commit_change


def get_client(db: Session, client_id: UUID) -> Client:
    client = repo.get(db, client_id)
    if client is None:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return client


def create(db: Session, user: User, data: ClientInput) -> Client:
    if data.email and repo.email_exists(db, data.email):
        raise HTTPException(status_code=409, detail="El correo del cliente ya está registrado")
    client = Client(cliente_id=uuid4(), **data.model_dump())
    commit_change(db, user, client, "CLIENTE", "REGISTRAR", client.cliente_id)
    return client


def update(db: Session, user: User, client_id: UUID, data: ClientInput) -> Client:
    client = get_client(db, client_id)
    if data.email and repo.email_exists(db, data.email, client_id):
        raise HTTPException(status_code=409, detail="El correo del cliente ya está registrado")
    previous_state = client.estado
    for key, value in data.model_dump().items():
        setattr(client, key, value)
    commit_change(
        db, user, client, "CLIENTE", "ACTUALIZAR", client_id,
        {"estado_anterior": previous_state, "estado_nuevo": client.estado},
    )
    return client


def list_all(db: Session, params: PageParams, value: bool | None = None) -> list[dict] | dict:
    return fetch(db, repo.list_query(value), params)
