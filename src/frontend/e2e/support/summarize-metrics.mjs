// Resume test-results/metrics/*.json en una tabla Markdown (GITHUB_STEP_SUMMARY o consola).
import { readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const folder = path.resolve(process.argv[2] || 'test-results/metrics')
const files = (await readdir(folder).catch(() => [])).filter(name => name.endsWith('.json')).sort()
const rows = []
for (const file of files) {
  const data = JSON.parse(await readFile(path.join(folder, file), 'utf8'))
  const { project } = data
  if (file.includes('web-vitals')) rows.push(`| ${project} | Acceso | TTFB ${data.ttfb} ms · FCP ${data.fcp ?? 'n/d'} ms · LCP ${data.lcp ?? 'no soportado'} ms · load ${data.load} ms |`)
  else if (file.includes('api-tiempos')) rows.push(`| ${project} | APIs | ${Object.entries(data).filter(([key]) => key.startsWith('/api')).map(([key, value]) => `${key.replace('/api/v1/', '')} ${value} ms`).join(' · ')} |`)
  else if (file.includes('disponibilidad')) rows.push(`| ${project} | Disponibilidad | ${['interfaz', 'api-proxy', 'api-health'].filter(key => data[key]).map(key => `${key} ${data[key].availabilityPct}% (p50 ${data[key].p50Ms} ms, p95 ${data[key].p95Ms} ms)`).join(' · ')} |`)
}
const markdown = ['### Métricas Playwright', '', '| Navegador | Escenario | Resultado |', '|---|---|---|', ...rows, ''].join('\n')
if (process.env.GITHUB_STEP_SUMMARY) await writeFile(process.env.GITHUB_STEP_SUMMARY, markdown, { flag: 'a' })
console.log(markdown)
