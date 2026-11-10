"""Plan y volumen de la base de auditoría; no conecta a bases operativas."""
import json
import os
import sys
from pathlib import Path
import importlib.metadata
sys.path.insert(0, str(Path.cwd()))
from sqlalchemy import text
from sqlalchemy.engine import make_url
from app.core.config import settings
from app.db.session import SessionLocal

if os.getenv('GREEN_AUDIT_SEED') != '1' or not (make_url(settings.database_url).database or '').endswith('_test'):
    raise SystemExit('Solo bases aisladas *_test con GREEN_AUDIT_SEED=1')
with SessionLocal() as db:
    db.execute(text('ANALYZE pedidos'))
    counts = {name: db.scalar(text(f'SELECT count(*) FROM {name}')) for name in ['vehiculos','conductores','clientes','pedidos']}
    plan = db.scalar(text('EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) SELECT * FROM pedidos ORDER BY creado_en, pedido_id LIMIT 12'))
    version = db.scalar(text('SELECT version()'))
    db.commit()
packages = {item.metadata['Name']: item.version for item in importlib.metadata.distributions()}
print(json.dumps({'database_version': version, 'counts': counts, 'query': 'SELECT * FROM pedidos ORDER BY creado_en, pedido_id LIMIT 12', 'explain': plan, 'packages': packages}, indent=2))
