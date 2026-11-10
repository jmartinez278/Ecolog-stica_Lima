from app.core.pagination import PageParams
from app.repositories.pagination import fetch
from uuid import UUID, uuid4

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models import Order, User
from app.repositories import orders as repo
from app.schemas.operations import OrderInput
from app.services.common import commit_change


def get_order(db: Session, order_id: UUID) -> Order:
    order = repo.get(db, order_id)
    if order is None:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    return order


def validate_client(db: Session, client_id: UUID) -> None:
    if repo.active_client(db, client_id) is None:
        raise HTTPException(status_code=422, detail="cliente_id no corresponde a un cliente activo")


def create(db: Session, user: User, data: OrderInput) -> Order:
    validate_client(db, data.cliente_id)
    if repo.code_exists(db, data.codigo_pedido):
        raise HTTPException(status_code=409, detail="El código de pedido ya está registrado")
    order = Order(pedido_id=uuid4(), **data.model_dump(), estado="PENDIENTE")
    commit_change(db, user, order, "PEDIDO", "REGISTRAR", order.pedido_id)
    return order


def update(db: Session, user: User, order_id: UUID, data: OrderInput) -> Order:
    order = get_order(db, order_id)
    if order.estado != "PENDIENTE":
        raise HTTPException(status_code=409, detail="Solo se puede editar un pedido PENDIENTE")
    validate_client(db, data.cliente_id)
    if repo.code_exists(db, data.codigo_pedido, order_id):
        raise HTTPException(status_code=409, detail="El código de pedido ya está registrado")
    for key, value in data.model_dump().items():
        setattr(order, key, value)
    commit_change(db, user, order, "PEDIDO", "ACTUALIZAR", order_id)
    return order


def cancel(db: Session, user: User, order_id: UUID) -> Order:
    order = get_order(db, order_id)
    if order.estado != "PENDIENTE":
        raise HTTPException(status_code=409, detail="Solo se puede cancelar un pedido PENDIENTE")
    order.estado = "CANCELADO"
    commit_change(db, user, order, "PEDIDO", "CANCELAR", order_id)
    return order


def list_all(db: Session, params: PageParams, value: str | None = None) -> list[dict] | dict:
    return fetch(db, repo.list_query(value), params)
