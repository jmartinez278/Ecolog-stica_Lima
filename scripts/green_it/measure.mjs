// Medición Green IT: Lighthouse (navegación + flujo autenticado) y benchmark de API.
// Uso: node measure.mjs <etiqueta> <dir_salida>
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import lighthouse, { startFlow, desktopConfig } from 'lighthouse'
import * as chromeLauncher from 'chrome-launcher'
import puppeteer from 'puppeteer-core'

const BASE = 'http://127.0.0.1:8080'
const CHROME = process.env.CHROME_PATH || '/usr/bin/chromium'
const [label, outDir] = process.argv.slice(2)
fs.mkdirSync(outDir, { recursive: true })
const EMAIL = 'operador@example.test', PASS = 'Operador#2026'
const RUNS = 5
const median = a => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)] }

function pick(lhr) {
  const a = lhr.audits
  const reqs = a['network-requests']?.details?.items || []
  return {
    score: Math.round(lhr.categories.performance.score * 100),
    fcp_ms: a['first-contentful-paint'].numericValue,
    lcp_ms: a['largest-contentful-paint'].numericValue,
    tbt_ms: a['total-blocking-time'].numericValue,
    cls: a['cumulative-layout-shift'].numericValue,
    si_ms: a['speed-index'].numericValue,
    bytes: a['total-byte-weight'].numericValue,
    requests: reqs.length,
  }
}

async function navRuns(formFactor) {
  const runs = []
  for (let i = 0; i < RUNS; i++) {
    const chrome = await chromeLauncher.launch({ chromePath: CHROME, chromeFlags: ['--headless=new', '--no-sandbox'] })
    const flags = { port: chrome.port, output: 'html', onlyCategories: ['performance', 'accessibility', 'best-practices'] }
    const res = await lighthouse(BASE + '/', flags, formFactor === 'desktop' ? desktopConfig : undefined)
    const m = pick(res.lhr)
    m.accessibility = Math.round(res.lhr.categories.accessibility.score * 100)
    m.best_practices = Math.round(res.lhr.categories['best-practices'].score * 100)
    runs.push(m)
    if (i === 0) fs.writeFileSync(path.join(outDir, `lighthouse-${label}-${formFactor}.html`), res.report)
    await chrome.kill()
  }
  const keys = Object.keys(runs[0])
  const med = Object.fromEntries(keys.map(k => [k, median(runs.map(r => r[k]))]))
  return { median: med, runs }
}

const FLOW_RUNS = 3
const LISTS = ['Pedidos', 'Vehículos', 'Conductores', 'Clientes']

function summarize(lhr) {
  const a = lhr.audits
  const items = a['network-requests']?.details?.items || []
  const api = items.filter(r => r.url.includes('/api/'))
  return {
    tbt_ms: a['total-blocking-time']?.numericValue ?? 0,
    cls: a['cumulative-layout-shift']?.numericValue ?? 0,
    bytes: items.reduce((s, r) => s + (r.transferSize || 0), 0),
    requests: items.length,
    api_requests: api.length,
    api_bytes: api.reduce((s, r) => s + (r.transferSize || 0), 0),
    api_304: api.filter(r => r.statusCode === 304).length,
  }
}

async function visitLists(page) {
  for (const target of LISTS) {
    await page.locator(`nav ::-p-text(${target})`).click()
    await page.waitForNetworkIdle({ idleTime: 500 })
  }
}

// Cada corrida usa un navegador nuevo (caché fría). Paso 1: acceso; paso 2: login y
// primera visita a los cuatro listados (caché fría); paso 3: segunda visita en la misma
// sesión (caché caliente: assets en memoria y revalidación de la API).
async function flowRun(index) {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox'] })
  const page = await browser.newPage()
  const flow = await startFlow(page, { name: `EcoLogística ${label} #${index + 1}`, config: desktopConfig })
  await flow.navigate(BASE + '/')
  await flow.startTimespan({ name: 'Caché fría: login y primera visita a los cuatro listados' })
  await page.type('input[type=email]', EMAIL)
  await page.type('input[type=password]', PASS)
  await page.click('button[type=submit]')
  await page.waitForSelector('nav')
  await visitLists(page)
  await flow.endTimespan()
  await flow.startTimespan({ name: 'Caché caliente: segunda visita a los cuatro listados' })
  await visitLists(page)
  await flow.endTimespan()
  const result = await flow.createFlowResult()
  if (index === 0) fs.writeFileSync(path.join(outDir, `flow-${label}.html`), await flow.generateReport())
  await browser.close()
  return { fria: summarize(result.steps[1].lhr), caliente: summarize(result.steps[2].lhr) }
}

async function flowRuns() {
  const runs = []
  for (let i = 0; i < FLOW_RUNS; i++) runs.push(await flowRun(i))
  const med = scope => Object.fromEntries(Object.keys(runs[0][scope]).map(k => [k, median(runs.map(r => r[scope][k]))]))
  const fria = med('fria'), caliente = med('caliente')
  return {
    corridas: runs,
    mediana_cache_fria: fria,
    mediana_cache_caliente: caliente,
    // Compatibilidad con swdm.py: la sesión se calcula con caché fría (escenario conservador).
    timespan_bytes: fria.bytes,
    timespan_requests: fria.requests,
    timespan_tbt_ms: fria.tbt_ms,
    timespan_cls: fria.cls,
    api_requests: fria.api_requests,
    api_bytes: fria.api_bytes,
  }
}

async function apiBench(query = '') {
  const login = await fetch(BASE + '/api/v1/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: EMAIL, password: PASS }) })
  const { access_token } = await login.json()
  const out = {}
  for (const res of ['pedidos', 'vehiculos', 'conductores', 'clientes']) {
    const times = []; let wire = 0, raw = 0, encoding = 'none', count = 0
    for (let i = 0; i < 30; i++) {
      const t0 = performance.now()
      const r = await fetch(`${BASE}/api/v1/${res}${query}`, { headers: { Authorization: `Bearer ${access_token}`, 'Accept-Encoding': 'br, gzip' } })
      const buf = Buffer.from(await r.arrayBuffer()) // fetch decodifica; medimos tamaño crudo
      times.push(performance.now() - t0)
      raw = buf.length
      encoding = r.headers.get('content-encoding') || 'none'
      const body = JSON.parse(buf.toString())
      count = Array.isArray(body) ? body.length : (body.items?.length ?? 0)
    }
    // Bytes en el cable (sin decodificar). execFileSync no usa shell: el token y la URL
    // se pasan como argumentos separados y no pueden inyectar comandos.
    wire = Number(execFileSync('curl', ['-s', '-o', '/dev/null', '-w', '%{size_download}',
      '-H', `Authorization: Bearer ${access_token}`, '-H', 'Accept-Encoding: br, gzip',
      `${BASE}/api/v1/${res}${query}`]).toString())
    out[res] = { registros_devueltos: count, bytes_json: raw, bytes_transferidos: wire, content_encoding: encoding, mediana_ms: Number(median(times).toFixed(1)), p95_ms: Number([...times].sort((a, b) => a - b)[Math.floor(times.length * 0.95)].toFixed(1)) }
  }
  return out
}

const cpus = os.cpus()
const result = {
  etiqueta: label,
  fecha: new Date().toISOString(),
  entorno: 'localhost: Caddy 2.10.2 (build Vite) + FastAPI/uvicorn (1 worker) + PostgreSQL 16; carga 50 vehículos, 60 conductores, 200 clientes, 1000 pedidos; Chromium headless',
  hardware: { cpu: cpus[0]?.model, nucleos: cpus.length, memoria_gb: Math.round(os.totalmem() / 1e9), so: `${os.type()} ${os.release()}` },
  herramientas: { node: process.version, lighthouse: JSON.parse(fs.readFileSync(new URL('./node_modules/lighthouse/package.json', import.meta.url))).version },
  unidades: 'bytes; 1 KB = 1000 bytes; transferSize = bytes en el cable (comprimidos)',
  corridas_por_modo: RUNS,
  corridas_recorrido: FLOW_RUNS,
}
result.lighthouse_desktop = await navRuns('desktop')
result.lighthouse_mobile = await navRuns('mobile')
result.flujo_autenticado = await flowRuns()
result.api = await apiBench()
const probe = await fetch(`${BASE}/api/v1/vehiculos?page=1`, { headers: { Authorization: 'Bearer x' } })
if (probe.status !== 404) {
  const paged = await apiBench('?page=1&limit=12')
  if (Object.values(paged).every(v => v.registros_devueltos <= 12)) result.api_paginada = paged
}
fs.writeFileSync(path.join(outDir, `metricas-${label}.json`), JSON.stringify(result, null, 2))
console.log(JSON.stringify({ desktop: result.lighthouse_desktop.median, mobile: result.lighthouse_mobile.median, fria: result.flujo_autenticado.mediana_cache_fria, caliente: result.flujo_autenticado.mediana_cache_caliente, api: result.api, api_paginada: result.api_paginada }, null, 1))
