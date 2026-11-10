"""Credenciales efímeras para un proyecto Compose de auditoría aislado."""
import argparse
from pathlib import Path
import secrets

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--output', required=True)
    parser.add_argument('--port', type=int, default=8180)
    parser.add_argument('--tls-port', type=int, default=8445)
    args = parser.parse_args()
    target = Path(args.output)
    if target.exists():
        raise SystemExit('El archivo ya existe; reutilícelo para conservar acceso al volumen.')
    password = secrets.token_hex(24)
    values = {
        'POSTGRES_DB': 'ecolog_green_test', 'POSTGRES_USER': 'ecolog_green',
        'POSTGRES_PASSWORD': password,
        'DATABASE_URL': f'postgresql+psycopg://ecolog_green:{password}@db:5432/ecolog_green_test',
        'JWT_SECRET': secrets.token_hex(32), 'BOOTSTRAP_OPERATOR_EMAIL': 'operador@example.test',
        'BOOTSTRAP_OPERATOR_PASSWORD': secrets.token_hex(24), 'STAGING_DOMAIN': 'localhost',
        'STAGING_HTTP_PORT': args.port, 'STAGING_HTTPS_PORT': args.tls_port,
    }
    target.touch(mode=0o600, exist_ok=False)
    target.write_text(''.join(f'{key}={value}\n' for key, value in values.items()))
    print(f'Configuración temporal creada: {target} (sin revelar credenciales).')

if __name__ == '__main__':
    main()
