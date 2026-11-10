"""Consultas de listado ligeras y paginadas (Green IT, Inspección 04).

- Proyección: solo se seleccionan las columnas que expone el esquema de salida.
- Sin hidratación ORM: las filas se leen como diccionarios (equivalente a ``.lean()``).
- Paginación opcional: con ``?page=`` se devuelven bloques de 12 registros por defecto;
  sin ``page`` se conserva la lista completa por compatibilidad con clientes anteriores.
"""
from dataclasses import dataclass
from math import ceil
from typing import Any, Generic, TypeVar

from fastapi import Query
from pydantic import BaseModel
from sqlalchemy import Select, func, select
from sqlalchemy.orm import Session

T = TypeVar("T")
DEFAULT_LIMIT = 12
MAX_LIMIT = 50


class Page(BaseModel, Generic[T]):
    items: list[T]
    total: int
    page: int
    limit: int
    pages: int


@dataclass(frozen=True)
class PageParams:
    page: int | None
    limit: int


def page_params(
    page: int | None = Query(None, ge=1, description="Página solicitada; si se omite se devuelve la lista completa."),
    limit: int = Query(DEFAULT_LIMIT, ge=1, le=MAX_LIMIT, description="Registros por página (máximo 50)."),
) -> PageParams:
    return PageParams(page=page, limit=limit)


def projected_columns(model: Any, schema: type[BaseModel]) -> list[Any]:
    """Columnas de la tabla requeridas por el esquema de salida, en su orden declarado."""
    table = model.__table__
    return [table.c[name] for name in schema.model_fields if name in table.c]


def fetch(db: Session, query: Select, params: PageParams) -> list[dict] | dict:
    if params.page is None:
        return [dict(row) for row in db.execute(query).mappings()]
    total = db.scalar(select(func.count()).select_from(query.order_by(None).subquery())) or 0
    offset = (params.page - 1) * params.limit
    rows = db.execute(query.offset(offset).limit(params.limit)).mappings()
    return {
        "items": [dict(row) for row in rows],
        "total": total,
        "page": params.page,
        "limit": params.limit,
        "pages": ceil(total / params.limit) if total else 0,
    }
