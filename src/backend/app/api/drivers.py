from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.pagination import Page, PageParams, page_params
from app.core.security import require_read, require_write
from app.db.session import get_db
from app.models import User
from app.schemas.operations import DriverInput, DriverOut
from app.services import drivers as service

router = APIRouter(prefix="/api/v1/conductores", tags=["Conductores"])


@router.post("", response_model=DriverOut, status_code=201)
def create(data: DriverInput, db: Session = Depends(get_db), user: User = Depends(require_write)):
    return service.create(db, user, data)


@router.get("", response_model=list[DriverOut] | Page[DriverOut])
def list_all(disponible: bool | None = None, params: PageParams = Depends(page_params), db: Session = Depends(get_db), user: User = Depends(require_read)):
    return service.list_all(db, params, disponible)


@router.get("/{driver_id}", response_model=DriverOut)
def get(driver_id: UUID, db: Session = Depends(get_db), user: User = Depends(require_read)):
    return service.get_driver(db, driver_id)


@router.put("/{driver_id}", response_model=DriverOut)
def update(driver_id: UUID, data: DriverInput, db: Session = Depends(get_db), user: User = Depends(require_write)):
    return service.update(db, user, driver_id, data)


@router.patch("/{driver_id}/desactivar", response_model=DriverOut)
def deactivate(driver_id: UUID, db: Session = Depends(get_db), user: User = Depends(require_write)):
    return service.deactivate(db, user, driver_id)
