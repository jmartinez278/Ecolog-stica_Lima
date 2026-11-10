"""Parámetros de aplicación compartidos por servicios y repositorios."""
from dataclasses import dataclass

DEFAULT_LIMIT = 12
MAX_LIMIT = 50

@dataclass(frozen=True)
class PageParams:
    page: int | None
    limit: int = DEFAULT_LIMIT
