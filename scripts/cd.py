"""CD: comprobar el commit aprobado, desplegar Render y preparar Vercel.

Solo biblioteca estándar. Los tokens llegan por entorno y nunca se imprimen.
"""
import argparse
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import tempfile
import time
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode, urlsplit
from urllib.request import HTTPRedirectHandler, Request, build_opener

WORKFLOWS = ('ci.yml', 'dependency-audit.yml', 'codeql.yml', 'green-audit.yml')
REPOSITORY = 'jmartinez278/Ecolog-stica_Lima'


class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def request(url, token=None, payload=None, headers=None):
    """No reenviar credenciales mediante redirects ni mostrar cuerpos de error."""
    values = {'Accept': 'application/json', **(headers or {})}
    if token:
        values['Authorization'] = 'Bearer ' + token
    data = None
    if payload is not None:
        data = json.dumps(payload).encode()
        values['Content-Type'] = 'application/json'
    req = Request(url, data=data, headers=values)
    try:
        with build_opener(NoRedirect).open(req, timeout=30) as response:
            return response.status, response.read(), response.headers
    except HTTPError as error:
        try:
            # Solo el smoke público necesita interpretar el 401 esperado.
            if not token and error.code == 401:
                return error.code, error.read(), error.headers
            raise RuntimeError(f'HTTP {error.code} en {urlsplit(url).hostname}') from None
        finally:
            error.close()
    except URLError:
        raise RuntimeError(f'No se pudo conectar con {urlsplit(url).hostname}') from None


def api(url, token, payload=None):
    return json.loads(request(url, token, payload)[1])


def origin(value):
    parsed = urlsplit(value)
    if (parsed.scheme != 'https' or not parsed.hostname or parsed.username
            or parsed.password or parsed.port not in (None, 443)
            or parsed.path not in ('', '/') or parsed.query or parsed.fragment
            or any(char.isspace() for char in value)):
        raise ValueError('Se requiere un origen HTTPS sin credenciales, ruta ni parámetros')
    return value.rstrip('/')


def sha(value):
    if not re.fullmatch(r'[0-9a-f]{40}', value):
        raise ValueError('El commit debe ser un SHA completo')
    return value


def output(**values):
    target = os.environ.get('GITHUB_OUTPUT')
    if target:
        with open(target, 'a', encoding='utf-8') as handle:
            for key, value in values.items():
                handle.write(f'{key}={value}\n')


def approved_runs(revision, get):
    """Exigir los cuatro workflows push/main del SHA; nunca usar otro commit."""
    if get('/git/ref/heads/main')['object']['sha'] != revision:
        return None
    approved = {}
    query = urlencode({'head_sha': revision, 'branch': 'main', 'event': 'push', 'per_page': 100})
    for workflow in WORKFLOWS:
        runs = get(f'/actions/workflows/{workflow}/runs?{query}')['workflow_runs']
        candidates = [run for run in runs if (
            run['head_sha'] == revision and run['head_branch'] == 'main'
            and run['event'] == 'push'
            and run.get('head_repository', {}).get('full_name') == REPOSITORY)]
        if not candidates:
            return None
        latest = max(candidates, key=lambda run: run['id'])
        if latest['status'] != 'completed' or latest['conclusion'] != 'success':
            return None
        approved[workflow] = latest['id']
    return approved


def already_released(revision, get):
    query = urlencode({'sha': revision, 'environment': 'production', 'per_page': 100})
    for deployment in get('/deployments?' + query):
        statuses = get(f"/deployments/{deployment['id']}/statuses?per_page=1")
        if statuses and statuses[0]['state'] == 'success':
            return True
    return False


def gate(required=False):
    if os.environ['GITHUB_REPOSITORY'] != REPOSITORY:
        raise ValueError('Repositorio de despliegue no autorizado')
    revision = sha(os.environ['TARGET_SHA'])
    root = 'https://api.github.com/repos/' + REPOSITORY
    get = lambda path: api(root + path, os.environ['GH_TOKEN'])
    runs = approved_runs(revision, get)
    if not runs:
        output(deploy='false')
        message = 'No se publica: falta un control aprobado o el commit ya no es main actual.'
        if required:
            raise RuntimeError(message)
        print(message)
        return
    if not required and already_released(revision, get):
        output(deploy='false')
        print('El commit ya tiene una liberación production completada; no se duplica.')
        return
    output(deploy='true', revision=revision, ci_run_id=runs['ci.yml'])
    print('Los cuatro controles del commit actual están aprobados.')


def wait_render(service, deploy, revision, get, timeout=1200):
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        result = get(f'/services/{service}/deploys/{deploy}')
        status = result['status']
        commit = result.get('commit', {}).get('id')
        if commit and commit != revision:
            raise RuntimeError('Render devolvió un commit diferente al aprobado')
        if status == 'live':
            if commit != revision:
                raise RuntimeError('Render no acredita el commit publicado')
            return
        if status not in {'created', 'build_in_progress', 'pre_deploy_in_progress', 'update_in_progress'}:
            raise RuntimeError('Render no completó el despliegue: ' + status)
        time.sleep(10)
    raise RuntimeError('Render excedió el tiempo máximo de despliegue')


def render():
    service = os.environ['RENDER_SERVICE_ID']
    if not re.fullmatch(r'srv-[a-zA-Z0-9]+', service):
        raise ValueError('RENDER_SERVICE_ID no es válido')
    revision = sha(os.environ['TARGET_SHA'])
    token = os.environ['RENDER_API_KEY']
    root = 'https://api.render.com/v1'
    details = api(root + '/services/' + service, token)
    repo = details.get('repo', '').removesuffix('.git').lower()
    if (details.get('type') != 'web_service' or details.get('branch') != 'main'
            or details.get('autoDeploy') != 'no'
            or repo != ('https://github.com/' + REPOSITORY).lower()):
        raise RuntimeError('Render debe usar este repositorio, main y Auto-Deploy Off')
    if origin(details['serviceDetails']['url']) != origin(os.environ['BACKEND_URL']):
        raise RuntimeError('BACKEND_URL no corresponde al servicio Render seleccionado')
    result = api(root + '/services/' + service + '/deploys', token, {'commitId': revision})
    deploy = result['id']
    if not re.fullmatch(r'dep-[a-zA-Z0-9]+', deploy):
        raise RuntimeError('Render no devolvió un identificador de despliegue válido')
    wait_render(service, deploy, revision, lambda path: api(root + path, token))
    health(origin(os.environ['BACKEND_URL']))
    output(render_deploy_id=deploy)
    print('Render publicó el commit aprobado y PostgreSQL responde al health check.')


def package(dist, workspace):
    """Convertir el artefacto aprobado al Build Output API estático de Vercel."""
    backend = origin(os.environ['BACKEND_URL'])
    project = {'projectId': os.environ['VERCEL_PROJECT_ID'], 'orgId': os.environ['VERCEL_ORG_ID']}
    if not re.fullmatch(r'prj_[A-Za-z0-9]+', project['projectId']) or not re.fullmatch(r'(?:team_)?[A-Za-z0-9]+', project['orgId']):
        raise ValueError('Configurar IDs válidos de proyecto y equipo Vercel antes de publicar')
    if not (dist / 'index.html').is_file():
        raise ValueError('Falta index.html en el artefacto de CI')
    if any(p.is_symlink() or p.name.startswith('.') for p in dist.rglob('*')):
        raise ValueError('El artefacto contiene enlaces o archivos ocultos inesperados')
    workspace.mkdir(parents=True, exist_ok=False)
    # La CLI valida el Root Directory del monorepo incluso para --prebuilt.
    (workspace / 'src' / 'frontend').mkdir(parents=True)
    output_dir = workspace / '.vercel' / 'output'
    output_dir.mkdir(parents=True)
    shutil.copytree(dist, output_dir / 'static')
    config = {'version': 3, 'routes': [
        {'src': '/api/(.*)', 'dest': backend + '/api/$1'},
        {'src': '/health', 'dest': backend + '/health'},
        {'src': '/assets/(.*)', 'headers': {'Cache-Control': 'public, max-age=31536000, immutable'}, 'continue': True},
        {'src': '/(?!assets/)(.*)', 'headers': {'Cache-Control': 'no-cache'}, 'continue': True},
        {'handle': 'filesystem'},
        {'src': '/(.*)', 'dest': '/index.html'},
    ]}
    (output_dir / 'config.json').write_text(json.dumps(config, indent=2) + '\n')
    (workspace / '.vercel' / 'project.json').write_text(json.dumps(project) + '\n')
    print('Artefacto de CI preparado para Vercel; rutas API enviadas a Render.')


def health(base, headers=None, requester=None):
    status, body, _ = (requester or request)(base + '/health', headers=headers)
    if status != 200 or json.loads(body).get('status') != 'ok':
        raise RuntimeError('El health check no confirma API y PostgreSQL disponibles')


def deployment_url(file):
    raw = file.read_text().strip()
    if raw.startswith('{'):
        data = json.loads(raw)
        data = data.get('deployment', data)
        raw = data['url']
        if not raw.startswith('https://'):
            raw = 'https://' + raw
    value = origin(raw)
    if not urlsplit(value).hostname.endswith('.vercel.app'):
        raise ValueError('Vercel no devolvió una URL de deployment válida')
    output(url=value)
    return value


def vercel_request(url, headers=None):
    """La CLI usa la sesión Vercel para acceder al deployment protegido."""
    with tempfile.TemporaryDirectory(prefix='ecolog-cd-smoke-') as directory:
        body = Path(directory) / 'body'
        command = ['vercel', 'curl', url, '--', '--silent', '--show-error', '--max-time', '30',
                   '--output', str(body), '--write-out', '%{http_code}']
        result = subprocess.run(command, cwd=os.environ['VERCEL_RELEASE_WORKSPACE'], capture_output=True, text=True)
        if result.returncode or not re.fullmatch(r'[0-9]{3}', result.stdout.strip()):
            raise RuntimeError('No se pudo verificar el deployment protegido mediante Vercel CLI')
        return int(result.stdout.strip()), body.read_bytes(), {}


def smoke(value, via_cli=False):
    base = origin(value)
    if not urlsplit(base).hostname.endswith('.vercel.app'):
        raise ValueError('El smoke con bypass solo acepta deployments de Vercel')
    bypass = os.environ.get('VERCEL_AUTOMATION_BYPASS_SECRET') if not via_cli else None
    headers = {'x-vercel-protection-bypass': bypass} if bypass else {}
    get = vercel_request if via_cli else request
    status, html, _ = get(base + '/', headers=headers)
    if status != 200 or b'id="root"' not in html or 'Bienvenido' not in html.decode():
        raise RuntimeError('Vercel no sirve la interfaz prerenderizada esperada')
    health(base, headers, get)
    status, body, _ = get(base + '/api/v1/vehiculos?page=1&limit=12', headers=headers)
    if status != 401 or not isinstance(json.loads(body).get('detail'), str):
        raise RuntimeError('La API debe responder JSON 401 sin sesión, a través de Vercel')
    print('Smoke aprobado: interfaz, proxy API, autenticación requerida y PostgreSQL.')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest='command', required=True)
    sub.add_parser('gate')
    sub.add_parser('guard')
    sub.add_parser('render')
    pack = sub.add_parser('package')
    pack.add_argument('--dist', type=Path, required=True)
    pack.add_argument('--workspace', type=Path, required=True)
    url = sub.add_parser('url')
    url.add_argument('--file', type=Path, required=True)
    check = sub.add_parser('smoke')
    check.add_argument('--url', required=True)
    check.add_argument('--via-vercel-cli', action='store_true')
    args = parser.parse_args()
    if args.command in ('gate', 'guard'):
        gate(required=args.command == 'guard')
    elif args.command == 'render':
        render()
    elif args.command == 'package':
        package(args.dist, args.workspace)
    elif args.command == 'url':
        deployment_url(args.file)
    else:
        smoke(args.url, args.via_vercel_cli)


if __name__ == '__main__':
    try:
        main()
    except (KeyError, ValueError, RuntimeError, OSError) as error:
        # Los errores propios no incluyen tokens ni respuestas remotas completas.
        raise SystemExit(str(error)) from None
