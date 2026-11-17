"""Evaluar un reporte `npm audit --json` con excepciones explícitas y caducables.

Falla ante cualquier vulnerabilidad high/critical cuyo origen no esté registrado en
`.github/npm-audit-exceptions.json`. Una excepción solo es válida hasta `review_by`;
al vencer, el pipeline vuelve a fallar y obliga a revisar si existe un parche.

Uso: python3 scripts/check_npm_audit.py <reporte.json> [--exceptions <ruta>] [--today AAAA-MM-DD]
"""
import argparse
import datetime as dt
import json
import sys
from pathlib import Path

BLOCKING = {'high', 'critical'}
DEFAULT_EXCEPTIONS = Path(__file__).resolve().parents[1] / '.github' / 'npm-audit-exceptions.json'


def advisory_id(url):
    return url.rstrip('/').rsplit('/', 1)[-1]


def root_advisories(name, vulnerabilities, seen=None):
    """Resolver la cadena `via` hasta los advisories que originan el hallazgo."""
    seen = set() if seen is None else seen
    if name in seen or name not in vulnerabilities:
        return set()
    seen.add(name)
    found = set()
    for via in vulnerabilities[name].get('via', []):
        if isinstance(via, dict):
            found.add(advisory_id(via.get('url', '')) or str(via.get('source')))
        else:
            found |= root_advisories(via, vulnerabilities, seen)
    return found


def active_exceptions(exceptions, today):
    active = {}
    for key, value in exceptions.items():
        if dt.date.fromisoformat(value['review_by']) >= today and value.get('reason', '').strip():
            active[key] = value
    return active


def evaluate(report, exceptions, today):
    vulnerabilities = report.get('vulnerabilities', {})
    allowed = active_exceptions(exceptions, today)
    blocking, accepted = [], []
    for name, item in sorted(vulnerabilities.items()):
        if item.get('severity') not in BLOCKING:
            continue
        roots = root_advisories(name, vulnerabilities)
        if roots and roots <= allowed.keys():
            accepted.append((name, sorted(roots)))
        else:
            blocking.append((name, sorted(roots - allowed.keys()) or ['sin advisory']))
    return blocking, accepted


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('report')
    parser.add_argument('--exceptions', default=str(DEFAULT_EXCEPTIONS))
    parser.add_argument('--today', default=dt.date.today().isoformat())
    args = parser.parse_args(argv)
    report = json.loads(Path(args.report).read_text(encoding='utf-8'))
    exceptions = json.loads(Path(args.exceptions).read_text(encoding='utf-8'))
    blocking, accepted = evaluate(report, exceptions, dt.date.fromisoformat(args.today))
    for name, roots in accepted:
        print(f'Aceptado temporalmente: {name} ({", ".join(roots)})')
    for name, roots in blocking:
        print(f'BLOQUEANTE: {name} ({", ".join(roots)})')
    if blocking:
        print(f'{len(blocking)} vulnerabilidades high/critical sin excepción vigente.')
        return 1
    print('Sin vulnerabilidades high/critical pendientes fuera de las excepciones vigentes.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
