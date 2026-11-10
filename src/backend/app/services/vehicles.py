from app.core.pagination import PageParams
from app.repositories.pagination import fetch
from uuid import UUID, uuid4

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models import User, Vehicle
from app.repositories import vehicles as repo
from app.schemas.operations import VehicleInput
from app.services.common import commit_change


def get_vehicle(db: Session, vehicle_id: UUID) -> Vehicle:
    vehicle = repo.get(db, vehicle_id)
    if vehicle is None:
        raise HTTPException(status_code=404, detail="Vehículo no encontrado")
    return vehicle


def create(db: Session, user: User, data: VehicleInput) -> Vehicle:
    if repo.plate_exists(db, data.placa):
        raise HTTPException(status_code=409, detail="La placa ya está registrada")
    vehicle = Vehicle(vehiculo_id=uuid4(), **data.model_dump())
    commit_change(db, user, vehicle, "VEHICULO", "REGISTRAR", vehicle.vehiculo_id)
    return vehicle


def update(db: Session, user: User, vehicle_id: UUID, data: VehicleInput) -> Vehicle:
    vehicle = get_vehicle(db, vehicle_id)
    if repo.plate_exists(db, data.placa, vehicle_id):
        raise HTTPException(status_code=409, detail="La placa ya está registrada")
    before = vehicle.estado
    for key, value in data.model_dump().items():
        setattr(vehicle, key, value)
    commit_change(db, user, vehicle, "VEHICULO", "ACTUALIZAR", vehicle_id, {"estado_anterior": before, "estado_nuevo": vehicle.estado})
    return vehicle


def deactivate(db: Session, user: User, vehicle_id: UUID) -> Vehicle:
    vehicle = get_vehicle(db, vehicle_id)
    if vehicle.estado == "INACTIVO":
        raise HTTPException(status_code=409, detail="El vehículo ya está inactivo")
    vehicle.estado = "INACTIVO"
    commit_change(db, user, vehicle, "VEHICULO", "DESACTIVAR", vehicle_id)
    return vehicle


def list_all(db: Session, params: PageParams) -> list[dict] | dict:
    return fetch(db, repo.list_query(), params)
