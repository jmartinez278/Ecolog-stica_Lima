from uuid import UUID

from sqlalchemy import Select, select
from sqlalchemy.orm import Session

from app.api.pagination import projected_columns
from app.models import Vehicle
from app.schemas.operations import VehicleOut


def get(db: Session, vehicle_id: UUID) -> Vehicle | None:
    return db.get(Vehicle, vehicle_id)


def list_query() -> Select:
    return select(*projected_columns(Vehicle, VehicleOut)).order_by(Vehicle.creado_en, Vehicle.vehiculo_id)


def plate_exists(db: Session, plate: str, exclude_id: UUID | None = None) -> bool:
    query = select(Vehicle.vehiculo_id).where(Vehicle.placa == plate)
    if exclude_id:
        query = query.where(Vehicle.vehiculo_id != exclude_id)
    return db.scalar(query) is not None
