"""Arrancar la API real para la suite E2E de Playwright sobre una base de prueba aislada.

- PostgreSQL (CI): aplica las migraciones Alembic reales; la base debe llamarse *_test o test_*.
- SQLite (local): crea el esquema desde los modelos, igual que las pruebas pytest, porque
  las migraciones utilizan identidades propias de PostgreSQL.
Después ejecuta la semilla idempotente (roles, operador y cliente de ejemplo) e inicia uvicorn.
Nunca apunta a una base operativa: rechaza nombres que no sean de prueba.

Uso (desde src/backend): python ../../scripts/e2e_backend.py --port 8010
"""
import argparse
import os
import subprocess
import sys
from pathlib import Path

BACKEND = Path(__file__).resolve().parents[1] / 'src' / 'backend'


def test_database_name(url):
    from sqlalchemy.engine import make_url

    parsed = make_url(url)
    name = Path(parsed.database or '').stem if parsed.get_backend_name() == 'sqlite' else (parsed.database or '')
    if not (name.lower().startswith('test_') or name.lower().endswith('_test')):
        raise SystemExit('E2E requiere una base de prueba llamada test_* o *_test; no se usa una base operativa.')
    return parsed


def prepare_schema(url):
    parsed = test_database_name(url)
    if parsed.get_backend_name() == 'sqlite':
        database = Path(parsed.database)
        database.parent.mkdir(parents=True, exist_ok=True)
        database.unlink(missing_ok=True)  # solo se elimina un archivo test_* exclusivo de E2E
        from sqlalchemy import create_engine

        from app import models  # noqa: F401  (registra las tablas)
        from app.db.base import Base

        Base.metadata.create_all(create_engine(url))
    else:
        subprocess.run([sys.executable, '-m', 'alembic', 'upgrade', 'head'], cwd=BACKEND, check=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--port', type=int, default=8010)
    args = parser.parse_args()
    for name in ('DATABASE_URL', 'JWT_SECRET', 'BOOTSTRAP_OPERATOR_EMAIL', 'BOOTSTRAP_OPERATOR_PASSWORD'):
        if not os.environ.get(name):
            raise SystemExit(f'Falta la variable {name} para el entorno E2E.')
    sys.path.insert(0, str(BACKEND))
    os.chdir(BACKEND)
    prepare_schema(os.environ['DATABASE_URL'])
    from app.db.seed_demo import seed

    seed()
    # Proceso hijo bloqueante: Playwright vigila este proceso y lo finaliza junto con su árbol.
    sys.exit(subprocess.call([sys.executable, '-m', 'uvicorn', 'app.main:app', '--host', '127.0.0.1',
                              '--port', str(args.port)], cwd=BACKEND))


if __name__ == '__main__':
    main()
