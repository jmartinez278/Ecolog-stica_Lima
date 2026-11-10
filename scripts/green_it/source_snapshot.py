"""Identifica el código auditado sin incluir archivos de entorno ni credenciales."""
import hashlib
import json
from pathlib import Path
import subprocess
import sys

root = Path(__file__).resolve().parents[2]
folders = ['src/backend/app', 'src/backend/alembic', 'src/frontend/src', 'src/frontend/public', 'src/frontend/scripts', 'scripts/green_it']
files = [path for folder in folders for path in (root / folder).rglob('*')
         if path.is_file() and not any(part in ('node_modules', '__pycache__', 'dist') for part in path.parts)
         and path.suffix not in ('.pyc',)]
files += [root / name for name in ['src/frontend/package-lock.json', 'src/frontend/Dockerfile.staging', 'src/frontend/Caddyfile.staging', 'src/backend/requirements.lock', 'docker-compose.staging.yml', '.github/workflows/green-audit.yml', 'lighthouserc.json']]
digests = {str(path.relative_to(root)): hashlib.sha256(path.read_bytes()).hexdigest() for path in sorted(set(files))}
manifest = {'base_commit': subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=root, text=True).strip(),
            'working_tree': True, 'files': digests,
            'source_sha256': hashlib.sha256(json.dumps(digests, sort_keys=True).encode()).hexdigest()}
Path(sys.argv[1]).write_text(json.dumps(manifest, indent=2) + '\n')
print('Código auditado SHA-256:', manifest['source_sha256'])
