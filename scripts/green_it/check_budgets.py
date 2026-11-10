"""Presupuestos de la rúbrica en unidades decimales; salida distinta de cero ante fallos."""
import json
import sys

LIMITS = {'fcp_ms': 1000, 'lcp_ms': 1400, 'tbt_ms': 85, 'cls': .02, 'bytes': 1_100_000}

def failures(metrics):
    errors = []
    for mode in ('desktop', 'mobile'):
        group = metrics.get('lighthouse_' + mode, {})
        if len(group.get('runs', [])) < 3:
            errors.append(f'{mode}: faltan tres corridas')
        data = group.get('median', {})
        if data.get('score', -1) < 90:
            errors.append(f'{mode}: score <90')
        for name, maximum in LIMITS.items():
            value = data.get(name)
            if not isinstance(value, (int, float)) or not 0 <= value <= maximum:
                errors.append(f'{mode}: {name}={value}, máximo {maximum}')
    flow = metrics.get('flujo_autenticado', {})
    if len(flow.get('runs', [])) < 3:
        errors.append('flujo: faltan tres recorridos autenticados')
    for name, maximum in {'session_bytes': 1_100_000, 'timespan_tbt_ms': 85, 'timespan_cls': .02}.items():
        value = flow.get(name)
        if not isinstance(value, (int, float)) or not 0 <= value <= maximum:
            errors.append(f'flujo: {name}={value}, máximo {maximum}')
    return errors

if __name__ == '__main__':
    with open(sys.argv[1], encoding='utf8') as source:
        errors = failures(json.load(source))
    print('\n'.join(errors) if errors else 'Todos los presupuestos de la rúbrica cumplen (móvil, escritorio y flujo).')
    raise SystemExit(bool(errors))
