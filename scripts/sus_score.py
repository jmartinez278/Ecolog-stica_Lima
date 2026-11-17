"""Calcular la System Usability Scale (SUS) y generar las tablas del informe 04.

Entradas aceptadas (una o varias, mezclables):
- JSON exportado del formulario: lista de objetos o un objeto por archivo con
  `participante`, `rol`, `experiencia`, `tareas` {t1..t5: si|ayuda|no} e `items` [10 valores 1-5].
- Códigos de respaldo del formulario, uno por línea: `SUS1|P1|Rol|Exp|SSASN|3241524152|sus|comentario`.

Fórmula (Brooke, 1996): ítems impares aportan (x - 1); pares, (5 - x). La suma (0-40) x 2,5 = 0-100.
Uso: python3 scripts/sus_score.py respuestas.json [codigos.txt ...] > tablas.md
"""
import json
import statistics
import sys
from pathlib import Path

TASK_LABEL = {'si': 'S', 'ayuda': 'A', 'no': 'N'}
CODE_TASK = {'S': 'si', 'A': 'ayuda', 'N': 'no'}


def contributions(items):
    if len(items) != 10 or any(not isinstance(x, int) or not 1 <= x <= 5 for x in items):
        raise ValueError(f'Se requieren 10 respuestas enteras entre 1 y 5: {items}')
    return [x - 1 if i % 2 == 0 else 5 - x for i, x in enumerate(items)]


def sus(items):
    return sum(contributions(items)) * 2.5


def grade(score):
    """Escala de Sauro-Lewis (curva de calificación): A ≥ 80,3; B ≥ 74; C ≥ 68; D ≥ 51; F < 51."""
    if score >= 80.3:
        return 'A', 'Excelente'
    if score >= 74:
        return 'B', 'Bueno'
    if score >= 68:
        return 'C', 'Aceptable (promedio de la industria)'
    if score >= 51:
        return 'D', 'Marginal'
    return 'F', 'Inaceptable'


def parse_code(line):
    parts = line.strip().split('|')
    if len(parts) < 7 or parts[0] != 'SUS1':
        raise ValueError(f'Código SUS inválido: {line[:40]}')
    tasks = {f't{i + 1}': CODE_TASK[c] for i, c in enumerate(parts[4])}
    return {'participante': parts[1], 'rol': parts[2], 'experiencia': parts[3], 'tareas': tasks,
            'items': [int(c) for c in parts[5]], 'comentario': '|'.join(parts[7:])}


def load(paths):
    rows = []
    for path in paths:
        text = Path(path).read_text(encoding='utf-8')
        if path.endswith('.json'):
            data = json.loads(text)
            rows += data if isinstance(data, list) else [data]
        else:
            rows += [parse_code(line) for line in text.splitlines() if line.strip()]
    seen = {}
    for row in rows:  # una respuesta por participante: la última prevalece
        seen[row['participante'].upper()] = row
    return list(seen.values())


def report(rows):
    out = ['| Participante | Rol | ' + ' | '.join(f'Q{i}' for i in range(1, 11)) + ' |',
           '|---|---|' + '---|' * 10]
    for r in rows:
        out.append(f"| {r['participante']} | {r['rol']} | " + ' | '.join(map(str, r['items'])) + ' |')
    out += ['', '| Participante | Contribuciones impares (x−1) | Contribuciones pares (5−x) | Suma | SUS = suma × 2,5 |',
            '|---|---|---|---|---|']
    scores = []
    for r in rows:
        c = contributions(r['items'])
        score = sus(r['items'])
        scores.append(score)
        out.append(f"| {r['participante']} | {' + '.join(map(str, c[0::2]))} = {sum(c[0::2])} | "
                   f"{' + '.join(map(str, c[1::2]))} = {sum(c[1::2])} | {sum(c)} | {score:.1f} |")
    mean = statistics.mean(scores)
    sd = statistics.stdev(scores) if len(scores) > 1 else 0.0
    letter, adjective = grade(mean)
    tasks = {f't{i}': {'si': 0, 'ayuda': 0, 'no': 0} for i in range(1, 6)}
    for r in rows:
        for k, v in r['tareas'].items():
            tasks[k][v] += 1
    out += ['', f'**n = {len(rows)} · SUS promedio = {mean:.1f} · desviación estándar = {sd:.1f} · '
                f'mínimo = {min(scores):.1f} · máximo = {max(scores):.1f} · grado {letter} ({adjective}) · '
                f"{'supera' if mean >= 68 else 'no alcanza'} el umbral de 68**", '',
            '| Tarea | Sin ayuda | Con ayuda | No completada | Éxito sin ayuda |', '|---|---|---|---|---|']
    for k, v in tasks.items():
        out.append(f"| {k.upper()} | {v['si']} | {v['ayuda']} | {v['no']} | {100 * v['si'] / len(rows):.0f} % |")
    item_means = [statistics.mean(r['items'][i] for r in rows) for i in range(10)]
    out += ['', '| Ítem | Promedio (1–5) | Contribución media (0–4) |', '|---|---|---|']
    for i, m in enumerate(item_means):
        contrib = m - 1 if i % 2 == 0 else 5 - m
        out.append(f'| Q{i + 1} | {m:.2f} | {contrib:.2f} |')
    return '\n'.join(out)


def main(argv=None):
    paths = (argv if argv is not None else sys.argv[1:])
    if not paths:
        print(__doc__)
        return 2
    rows = load(paths)
    if not rows:
        print('Sin respuestas')
        return 1
    print(report(rows))
    return 0


if __name__ == '__main__':
    sys.exit(main())
