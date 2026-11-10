from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.pagination import Page, PageParams, fetch, page_params
from app.core.security import require_read, require_write
from app.db.session import get_db
from app.models import User
from app.repositories import vehicles as repo
from app.schemas.operations import VehicleInput, VehicleOut
from app.services import vehicles as service

router = APIRouter(prefix="/api/v1/vehiculos", tags=["Vehículos"])


@router.post("", response_model=VehicleOut, status_code=201)
def create(data: VehicleInput, db: Session = Depends(get_db), user: User = Depends(require_write)):
    return service.create(db, user, data)


@router.get("", response_model=list[VehicleOut] | Page[VehicleOut])
def list_all(params: PageParams = Depends(page_params), db: Session = Depends(get_db), user: User = Depends(require_read)):
    return fetch(db, repo.list_query(), params)


@router.get("/{vehicle_id}", response_model=VehicleOut)
def get(vehicle_id: UUID, db: Session = Depends(get_db), user: User = Depends(require_read)):
    return service.get_vehicle(db, vehicle_id)


@router.put("/{vehicle_id}", response_model=VehicleOut)
def update(vehicle_id: UUID, data: VehicleInput, db: Session = Depends(get_db), user: User = Depends(require_write)):
    return service.update(db, user, vehicle_id, data)


@router.patch("/{vehicle_id}/desactivar", response_model=VehicleOut)
def deactivate(vehicle_id: UUID, db: Session = Depends(get_db), user: User = Depends(require_write)):
    return service.deactivate(db, user, vehicle_id)
