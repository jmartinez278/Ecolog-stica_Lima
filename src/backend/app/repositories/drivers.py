from uuid import UUID

from sqlalchemy import Select, select
from sqlalchemy.orm import Session

from app.api.pagination import projected_columns
from app.models import Driver
from app.schemas.operations import DriverOut


def get(db: Session, driver_id: UUID) -> Driver | None:
    return db.get(Driver, driver_id)


def list_query(available: bool | None = None) -> Select:
    query = select(*projected_columns(Driver, DriverOut)).order_by(Driver.creado_en, Driver.conductor_id)
    if available is True:
        query = query.where(Driver.estado == "DISPONIBLE")
    elif available is False:
        query = query.where(Driver.estado != "DISPONIBLE")
    return query


def license_exists(db: Session, license_number: str, exclude_id: UUID | None = None) -> bool:
    query = select(Driver.conductor_id).where(Driver.numero_licencia == license_number)
    if exclude_id:
        query = query.where(Driver.conductor_id != exclude_id)
    return db.scalar(query) is not None
