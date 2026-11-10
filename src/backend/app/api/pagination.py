"""Validación de parámetros HTTP; la consulta se ejecuta en el repositorio."""
from fastapi import Query
from app.core.pagination import DEFAULT_LIMIT, MAX_LIMIT, PageParams
from app.schemas.pagination import Page


def page_params(
    page: int | None = Query(None, ge=1, description="Página; omitir conserva el contrato de lista anterior."),
    limit: int = Query(DEFAULT_LIMIT, ge=1, le=MAX_LIMIT, description="Registros por página (máximo 50)."),
) -> PageParams:
    return PageParams(page=page, limit=limit)
