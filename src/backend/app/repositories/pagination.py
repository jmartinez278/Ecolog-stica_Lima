"""Proyección y ejecución limitada de lecturas; sin dependencias de HTTP."""
from math import ceil
from typing import Any
from pydantic import BaseModel
from sqlalchemy import Select, func, select
from sqlalchemy.orm import Session
from app.core.pagination import PageParams


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
