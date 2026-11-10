from app.core.pagination import PageParams
from app.repositories.pagination import fetch
from uuid import UUID, uuid4

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models import Driver, User
from app.repositories import drivers as repo
from app.schemas.operations import DriverInput
from app.services.common import commit_change


def get_driver(db: Session, driver_id: UUID) -> Driver:
    driver = repo.get(db, driver_id)
    if driver is None:
        raise HTTPException(status_code=404, detail="Conductor no encontrado")
    return driver


def create(db: Session, user: User, data: DriverInput) -> Driver:
    if repo.license_exists(db, data.numero_licencia):
        raise HTTPException(status_code=409, detail="El número de licencia ya está registrado")
    driver = Driver(conductor_id=uuid4(), **data.model_dump())
    commit_change(db, user, driver, "CONDUCTOR", "REGISTRAR", driver.conductor_id)
    return driver


def update(db: Session, user: User, driver_id: UUID, data: DriverInput) -> Driver:
    driver = get_driver(db, driver_id)
    if driver.estado == "INACTIVO":
        raise HTTPException(status_code=409, detail="No se puede actualizar un conductor inactivo")
    if data.estado == "INACTIVO":
        raise HTTPException(status_code=409, detail="Use la acción de desactivación para inactivar al conductor")
    if repo.license_exists(db, data.numero_licencia, driver_id):
        raise HTTPException(status_code=409, detail="El número de licencia ya está registrado")
    previous_state = driver.estado
    for key, value in data.model_dump().items():
        setattr(driver, key, value)
    commit_change(
        db, user, driver, "CONDUCTOR", "ACTUALIZAR", driver_id,
        {"estado_anterior": previous_state, "estado_nuevo": driver.estado},
    )
    return driver


def deactivate(db: Session, user: User, driver_id: UUID) -> Driver:
    driver = get_driver(db, driver_id)
    if driver.estado == "INACTIVO":
        raise HTTPException(status_code=409, detail="El conductor ya está inactivo")
    if driver.estado == "ASIGNADO":
        raise HTTPException(status_code=409, detail="No se puede desactivar un conductor asignado")
    driver.estado = "INACTIVO"
    commit_change(db, user, driver, "CONDUCTOR", "DESACTIVAR", driver_id)
    return driver


def list_all(db: Session, params: PageParams, value: bool | None = None) -> list[dict] | dict:
    return fetch(db, repo.list_query(value), params)
