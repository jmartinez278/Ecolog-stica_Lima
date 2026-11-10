// Medición Green IT: Lighthouse (navegación + flujo autenticado) y benchmark de API.
// Uso: node measure.mjs <etiqueta> <dir_salida>
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { median, mean } from './math.mjs'
import { redact } from './redact.mjs'
import lighthouse, { startFlow, desktopConfig } from 'lighthouse'
import * as chromeLauncher from 'chrome-launcher'
import puppeteer from 'puppeteer-core'

const BASE = process.env.AUDIT_BASE_URL || 'http://localhost:8180'
const CHROME = process.env.CHROME_PATH || '/usr/bin/chromium'
const [label, outDir] = process.argv.slice(2)
fs.mkdirSync(outDir, { recursive: true })
const EMAIL = process.env.AUDIT_EMAIL, PASS = process.env.AUDIT_PASSWORD
if (!EMAIL || !PASS) throw new Error('Configure AUDIT_EMAIL y AUDIT_PASSWORD')
const writeReport = (file, content) => fs.writeFileSync(file, redact(content, [PASS]))
const RUNS = Number(process.env.AUDIT_RUNS || 3)
if (!Number.isInteger(RUNS) || RUNS < 3) throw new Error('Se requieren al menos tres corridas')

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
    const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'ecolog-lighthouse-'))
    // Evitar que chrome-launcher convierta la ruta a UNC al usar Chrome Linux en WSL.
    const chrome = await chromeLauncher.launch({ chromePath: CHROME, userDataDir: false, chromeFlags: ['--headless=new', '--no-sandbox', `--user-data-dir=${profile}`] })
    try {
    const flags = { port: chrome.port, output: ['html', 'json'], onlyCategories: ['performance', 'accessibility', 'best-practices'] }
    const res = await lighthouse(BASE + '/', flags, formFactor === 'desktop' ? desktopConfig : undefined)
    const m = pick(res.lhr)
    m.accessibility = Math.round(res.lhr.categories.accessibility.score * 100)
    m.best_practices = Math.round(res.lhr.categories['best-practices'].score * 100)
    runs.push(m)
    for (const [index, ext] of ['html', 'json'].entries()) writeReport(path.join(outDir, `lighthouse-${label}-${formFactor}-${i + 1}.${ext}`), res.report[index])
    } finally { await chrome.kill(); fs.rmSync(profile, { recursive: true, force: true }) }
  }
  const keys = Object.keys(runs[0])
  const med = Object.fromEntries(keys.map(k => [k, median(runs.map(r => r[k]))]))
  return { median: med, runs }
}

async function flowRun(flowIndex) {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox'] })
  try {
  const page = await browser.newPage()
  const flow = await startFlow(page, { name: `EcoLogística ${label}`, config: desktopConfig })
  await flow.navigate(BASE + '/')
  await flow.startTimespan({ name: 'Login y recorrido por los cuatro listados' })
  await page.waitForSelector('input[type=email]')
  await page.type('input[type=email]', EMAIL)
  await page.type('input[type=password]', PASS)
  await page.click('button[type=submit]')
  await page.waitForSelector('nav')
  await page.waitForNetworkIdle({ idleTime: 500 })
  for (const target of ['Pedidos', 'Vehículos', 'Conductores', 'Clientes']) {
    await page.locator(`nav ::-p-text(${target})`).click()
    await page.waitForNetworkIdle({ idleTime: 500 })
  }
  await flow.endTimespan()
  const result = await flow.createFlowResult()
  writeReport(path.join(outDir, `flow-${label}-${flowIndex}.html`), await flow.generateReport())
  writeReport(path.join(outDir, `flow-${label}-${flowIndex}.json`), JSON.stringify(result))
  const ts = result.steps[1].lhr.audits
  const items = ts['network-requests']?.details?.items || []
  const api = items.filter(r => r.url.includes('/api/'))
  return {
    navigation_bytes: result.steps[0].lhr.audits['total-byte-weight'].numericValue,
    session_bytes: result.steps[0].lhr.audits['total-byte-weight'].numericValue + items.reduce((sum, item) => sum + (item.transferSize || 0), 0),
    timespan_tbt_ms: ts['total-blocking-time']?.numericValue,
    timespan_cls: ts['cumulative-layout-shift']?.numericValue,
    timespan_bytes: items.reduce((s, r) => s + (r.transferSize || 0), 0),
    timespan_requests: items.length,
    api_requests: api.length,
    api_bytes: api.reduce((s, r) => s + (r.transferSize || 0), 0),
  }
  } finally { await browser.close() }
}

async function apiBench() {
  const login = await fetch(BASE + '/api/v1/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: EMAIL, password: PASS }) })
  const { access_token } = await login.json()
  if (!login.ok || !access_token) throw new Error('La auditoría no pudo iniciar sesión')
  const out = {}
  for (const res of ['pedidos', 'vehiculos', 'conductores', 'clientes']) {
    const times = []; let wire = 0, raw = 0, encoding = 'none', count = 0
    for (let i = 0; i < 30; i++) {
      const t0 = performance.now()
      const query = process.env.AUDIT_PAGINATED === '1' ? '?page=1&limit=12' : ''
      const r = await fetch(`${BASE}/api/v1/${res}${query}`, { headers: { Authorization: `Bearer ${access_token}`, 'Accept-Encoding': 'br, gzip' } })
      if (!r.ok) throw new Error(`La API devolvió ${r.status} para ${res}`)
      const buf = Buffer.from(await r.arrayBuffer()) // fetch decodifica; medimos tamaño crudo
      times.push(performance.now() - t0)
      raw = buf.length
      encoding = r.headers.get('content-encoding') || 'none'
      const body = JSON.parse(buf.toString())
      count = Array.isArray(body) ? body.length : (body.items?.length ?? 0)
    }
    // bytes en el cable: petición sin decodificar automática
    const { execFileSync } = await import('node:child_process')
    const query = process.env.AUDIT_PAGINATED === '1' ? '?page=1&limit=12' : ''
    wire = Number(execFileSync('curl', ['--fail', '-s', '-o', '/dev/null', '-w', '%{size_download}', '-H', `Authorization: Bearer ${access_token}`, '-H', 'Accept-Encoding: br, gzip', `${BASE}/api/v1/${res}${query}`]).toString())
    out[res] = { samples_ms: times, media_ms: Number(mean(times).toFixed(1)), registros_devueltos: count, bytes_json: raw, bytes_transferidos: wire, content_encoding: encoding, mediana_ms: Number(median(times).toFixed(1)), p95_ms: Number([...times].sort((a, b) => a - b)[Math.floor(times.length * 0.95)].toFixed(1)) }
  }
  return out
}

const result = { etiqueta: label, fecha: new Date().toISOString(), base_url: BASE, revision: process.env.AUDIT_REVISION || 'worktree', entorno: 'Caddy producción + FastAPI + PostgreSQL 16 aislados; 50 vehículos, 60 conductores, 200 clientes, 1000 pedidos', corridas_por_modo: RUNS, lighthouse_version: '13.6.0', chrome_path: CHROME, regla: 'mediana de al menos tres corridas en frío por preset; flujos separados, sin sumar medianas independientes para estimar una sesión' }
result.lighthouse_desktop = await navRuns('desktop')
result.lighthouse_mobile = await navRuns('mobile')
const flows = []
for (let i = 1; i <= RUNS; i++) flows.push(await flowRun(i))
result.flujo_autenticado = { runs: flows, ...Object.fromEntries(Object.keys(flows[0]).map(k => [k, median(flows.map(run => run[k]))])) }
result.api = await apiBench()
writeReport(path.join(outDir, `metricas-${label}.json`), JSON.stringify(result, null, 2))
console.log(JSON.stringify({ desktop: result.lighthouse_desktop.median, mobile: result.lighthouse_mobile.median, flujo: result.flujo_autenticado, api: result.api }, null, 1))
