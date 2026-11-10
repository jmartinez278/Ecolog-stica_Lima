from uuid import UUID

from sqlalchemy import Select, select
from sqlalchemy.orm import Session

from app.repositories.pagination import projected_columns
from app.models import Client, Order
from app.schemas.operations import OrderOut


def get(db: Session, order_id: UUID) -> Order | None:
    return db.get(Order, order_id)


def list_query(state: str | None = None) -> Select:
    query = select(*projected_columns(Order, OrderOut)).order_by(Order.creado_en, Order.pedido_id)
    if state:
        query = query.where(Order.estado == state)
    return query


def code_exists(db: Session, code: str, exclude_id: UUID | None = None) -> bool:
    query = select(Order.pedido_id).where(Order.codigo_pedido == code)
    if exclude_id:
        query = query.where(Order.pedido_id != exclude_id)
    return db.scalar(query) is not None


def active_client(db: Session, client_id: UUID) -> Client | None:
    client = db.get(Client, client_id)
    return client if client and client.estado == "ACTIVO" else None


def list_clients(db: Session) -> list[Client]:
    return list(db.scalars(select(Client).where(Client.estado == "ACTIVO").order_by(Client.nombre)))
