// Convierte test-results/results.json en un resumen versionable (sin trazas ni credenciales).
// Uso: node e2e/support/export-results.mjs <destino.json> [descripción del objetivo]
import { readFile, writeFile } from 'node:fs/promises'

const [destination, target = 'local'] = process.argv.slice(2)
if (!destination) throw new Error('Indique el archivo de destino')
const report = JSON.parse(await readFile('test-results/results.json', 'utf8'))
const tests = []
const walk = (suite, parents) => {
  for (const spec of suite.specs ?? []) {
    for (const test of spec.tests) {
      const result = test.results.at(-1) ?? {}
      tests.push({
        archivo: spec.file,
        prueba: [...parents, spec.title].join(' › '),
        navegador: test.projectName,
        estado: result.status ?? 'skipped',
        duracionMs: result.duration ?? 0,
        // eslint-disable-next-line no-control-regex -- elimina los códigos de color ANSI del mensaje
        error: result.error?.message?.split('\n')[0].replace(/\u001b\[[0-9;]*m/g, '').slice(0, 200) ?? null,
      })
    }
  }
  for (const child of suite.suites ?? []) walk(child, [...parents, child.title])
}
for (const suite of report.suites) walk(suite, [])
const byBrowser = {}
for (const test of tests) {
  byBrowser[test.navegador] ??= { passed: 0, failed: 0, skipped: 0 }
  byBrowser[test.navegador][test.estado === 'passed' ? 'passed' : test.estado === 'skipped' ? 'skipped' : 'failed']++
}
const { stats } = report
await writeFile(destination, JSON.stringify({
  objetivo: target,
  ejecutado: stats.startTime,
  duracionMs: Math.round(stats.duration),
  aprobadas: stats.expected,
  fallidas: stats.unexpected,
  inestables: stats.flaky,
  omitidas: stats.skipped,
  porNavegador: byBrowser,
  pruebas: tests,
}, null, 2) + '\n')
console.log(`Exportado ${destination}:`, JSON.stringify(byBrowser))
