#!/bin/sh
set -eu

# Aceptar la URL interna entregada por Render sin exponer su contraseña.
case "${DATABASE_URL:?Configure DATABASE_URL en Render}" in
  postgresql+psycopg://*) ;;
  postgresql://*) DATABASE_URL="postgresql+psycopg://${DATABASE_URL#postgresql://}"; export DATABASE_URL ;;
  postgres://*) DATABASE_URL="postgresql+psycopg://${DATABASE_URL#postgres://}"; export DATABASE_URL ;;
  *) echo 'DATABASE_URL debe ser una conexión PostgreSQL válida' >&2; exit 1 ;;
esac

# No borrar tablas ni usar la carga Green IT en una base de despliegue.
python -m alembic upgrade head
python -m app.db.seed_demo
exec python -m uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-10000}"
