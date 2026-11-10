from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.pagination import Page, PageParams, page_params
from app.core.security import require_read, require_write
from app.db.session import get_db
from app.models import User
from app.schemas.operations import OrderInput, OrderOut, OrderState
from app.services import orders as service

router = APIRouter(prefix="/api/v1/pedidos", tags=["Pedidos"])


@router.post("", response_model=OrderOut, status_code=201)
def create(data: OrderInput, db: Session = Depends(get_db), user: User = Depends(require_write)):
    return service.create(db, user, data)


@router.get("", response_model=list[OrderOut] | Page[OrderOut])
def list_all(estado: OrderState | None = None, params: PageParams = Depends(page_params), db: Session = Depends(get_db), user: User = Depends(require_read)):
    return service.list_all(db, params, estado)


@router.get("/{order_id}", response_model=OrderOut)
def get(order_id: UUID, db: Session = Depends(get_db), user: User = Depends(require_read)):
    return service.get_order(db, order_id)


@router.put("/{order_id}", response_model=OrderOut)
def update(order_id: UUID, data: OrderInput, db: Session = Depends(get_db), user: User = Depends(require_write)):
    return service.update(db, user, order_id, data)


@router.patch("/{order_id}/cancelar", response_model=OrderOut)
def cancel(order_id: UUID, db: Session = Depends(get_db), user: User = Depends(require_write)):
    return service.cancel(db, user, order_id)
