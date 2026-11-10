"""Lanza la auditoría sin escribir credenciales en comandos ni reportes."""
import argparse
import os
from pathlib import Path
import subprocess
import time
import tempfile
from urllib.request import urlopen
from urllib.parse import urlparse

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('label', choices=['antes', 'despues'])
    parser.add_argument('output')
    parser.add_argument('--env-file', required=True)
    parser.add_argument('--url', default='http://localhost:8180')
    parser.add_argument('--revision', default='worktree')
    parser.add_argument('--verify-flow', action='store_true')
    args = parser.parse_args()
    if urlparse(args.url).hostname not in ('localhost', '127.0.0.1', '::1'):
        raise SystemExit('Este instrumento solo envía credenciales a localhost.')
    values = dict(line.split('=', 1) for line in Path(args.env_file).read_text().splitlines() if line and not line.startswith('#'))
    for attempt in range(60):
        try:
            with urlopen(args.url + '/health', timeout=2) as response:
                if response.status == 200: break
        except OSError:
            time.sleep(1)
    else:
        raise SystemExit('La API no está lista.')
    env = {**os.environ, 'TEMP': tempfile.gettempdir(), 'TMP': tempfile.gettempdir(), 'AUDIT_EMAIL': values['BOOTSTRAP_OPERATOR_EMAIL'],
           'AUDIT_PASSWORD': values['BOOTSTRAP_OPERATOR_PASSWORD'], 'AUDIT_BASE_URL': args.url,
           'AUDIT_PAGINATED': '1' if args.label == 'despues' else '0', 'AUDIT_REVISION': args.revision}
    script = Path(__file__).with_name('verify_flow.mjs' if args.verify_flow else 'measure.mjs')
    arguments = [args.output] if args.verify_flow else [args.label, args.output]
    subprocess.run(['node', str(script), *arguments], env=env, check=True)

if __name__ == '__main__':
    main()
