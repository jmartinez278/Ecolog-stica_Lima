import logging
from uuid import UUID

from fastapi import FastAPI, Request
from fastapi.middleware.gzip import GZipMiddleware
from sqlalchemy import text

from app.api import auth, clients, drivers, orders, vehicles
from app.core.http_cache import ETagMiddleware
from app.core.security import user_from_token
from app.db.session import SessionLocal
from app.models import Audit

app = FastAPI(title="EcoLogística Lima", version="1.4.0")
logger = logging.getLogger(__name__)
for router in (auth.router, vehicles.router, drivers.router, orders.router, clients.router):
    app.include_router(router)


@app.get("/health", tags=["Sistema"])
def health():
    with SessionLocal() as db:
        db.execute(text("SELECT 1"))
    return {"status": "ok"}


@app.middleware("http")
async def audit_failed_writes(request: Request, call_next):
    response = await call_next(request)
    parts = request.url.path.split("/")
    if request.method not in {"POST", "PUT", "PATCH"} or response.status_code < 400:
        return response
    if len(parts) < 4 or parts[:3] != ["", "api", "v1"] or parts[3] not in {"vehiculos", "pedidos", "conductores", "clientes"}:
        return response
    try:
        with SessionLocal() as db:
            auth_header = request.headers.get("authorization", "")
            token = auth_header.split(" ", 1)[1] if auth_header.lower().startswith("bearer ") else ""
            user = user_from_token(token, db) if token else None
            entity_id = None
            if len(parts) > 4:
                try:
                    entity_id = UUID(parts[4])
                except ValueError:
                    pass
            db.add(Audit(
                usuario_id=user.usuario_id if user else None,
                entidad={"vehiculos": "VEHICULO", "pedidos": "PEDIDO", "conductores": "CONDUCTOR", "clientes": "CLIENTE"}[parts[3]],
                entidad_id=entity_id,
                accion=request.method,
                resultado="FALLIDO",
                detalle={"status": response.status_code},
            ))
            db.commit()
    except Exception:
        logger.exception("No se pudo auditar la operación fallida")
    return response


# Green IT (Inspección 04). Starlette ejecuta primero el último middleware registrado:
# GZip (externo) comprime lo que ETag (interno) ya validó; un 304 no lleva cuerpo.
app.add_middleware(ETagMiddleware)
app.add_middleware(GZipMiddleware, minimum_size=1000, compresslevel=6)
