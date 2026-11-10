import assert from 'node:assert/strict'
import { spawn, spawnSync } from 'node:child_process'
import { randomBytes, createHash } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const frontend = path.join(root, 'src/frontend')
const require = createRequire(path.join(frontend, 'package.json'))
const { chromium } = require('playwright')
const version = require('./package.json').version
assert.match(version, /^\d+\.\d+\.\d+$/)
const nvda = path.join(root, 'tmp/browser-tools/nvda/nvda.exe')
const git = 'C:\\Program Files\\Git\\cmd\\git.exe'
assert.ok(existsSync(nvda), 'Se requiere NVDA portable instalado; no se descarga ni instala software.')
const running = spawnSync('C:\\Windows\\System32\\tasklist.exe', ['/FI', 'IMAGENAME eq nvda.exe', '/FO', 'CSV', '/NH'], { encoding: 'utf8', windowsHide: true })
assert.equal(running.status, 0)
assert.ok(!/"nvda\.exe"/i.test(running.stdout), 'Cierre su sesión personal de NVDA antes de ejecutar este perfil aislado.')
const temporary = path.join(root, 'tmp', `screen-reader-${Date.now()}-${process.pid}`)
const profile = path.join(temporary, 'profile')
mkdirSync(path.join(profile, 'scratchpad/globalPlugins'), { recursive: true })
copyFileSync(path.join(root, 'scripts/nvda_speech_capture.py'), path.join(profile, 'scratchpad/globalPlugins/sprintCapture.py'))
writeFileSync(path.join(profile, 'nvda.ini'), '[general]\nlanguage = es\nshowWelcomeDialogAtStartup = False\n[speech]\nsynth = silence\n[development]\nenableScratchpadDir = True\n')
const evidence = path.join(root, 'docs/03 Implementación/Sprint 03/evidencias')
const python = path.join(root, '.venv/Scripts/python.exe')
const password = randomBytes(24).toString('base64url')
const environment = { ...process.env, DATABASE_URL: `sqlite:///${path.join(temporary, 'test_reader.db').replaceAll('\\', '/')}`, JWT_SECRET: randomBytes(48).toString('hex'), BOOTSTRAP_OPERATOR_EMAIL: 'lector@sprint3.example.test', BOOTSTRAP_OPERATOR_PASSWORD: password, VITE_API_PROXY_TARGET: 'http://127.0.0.1:8004' }
const report = { executedAt: new Date().toISOString(), applicationVersion: version, sourceCommit: spawnSync(git, ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).stdout.trim(), sourceFiles: {}, method: 'NVDA real, extensión pre_speech de solo lectura, Edge visible, foco y eventos de la aplicación real; síntesis silenciosa y transcripción textual anterior al sintetizador.', scope: 'Acceso, Inicio, navegación, formularios de cuatro módulos, mensajes y cierre de sesión en localhost 5176/8004; SQLite y operador sintéticos exclusivos; perfil NVDA y navegador desechables.', checks: [], limits: ['No evalúa la calidad acústica, pronunciación ni comprensión de una persona: se recoge la salida textual real de NVDA con sintetizador silencioso.', 'Acredita únicamente la combinación y los controles identificados, no conformidad WCAG AA universal.', 'La revisión del cliente o del usuario y su aceptación permanecen pendientes.'] }
for (const relative of ['src/frontend/src/App.tsx', 'src/frontend/src/pages/LoginPage.tsx', 'src/frontend/src/forms/ClientForm.tsx', 'src/frontend/src/forms/VehicleForm.tsx', 'src/frontend/src/forms/OrderForm.tsx', 'src/frontend/src/forms/DriverForm.tsx', 'src/frontend/src/components/common/StatusMessage.tsx']) report.sourceFiles[relative] = createHash('sha256').update(readFileSync(path.join(root, relative))).digest('hex')
const children = []
let server, browser, nvdaStarted = false, browserPid
const pause = ms => new Promise(resolve => setTimeout(resolve, ms))
function start(executable, args, cwd) {
  const child = spawn(executable, args, { cwd, env: environment, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] })
  children.push(child)
  child.stdout.resume()
  child.stderr.resume()
  return child
}
async function until(test, label, attempts = 100) {
  for (let i = 0; i < attempts; i++) { if (await test()) return; await pause(300) }
  throw new Error(`No disponible: ${label}`)
}
function transcript() {
  const file = path.join(profile, 'speech.jsonl')
  return existsSync(file) ? readFileSync(file, 'utf8').trim().split(/\r?\n/).filter(Boolean).map(line => JSON.parse(line)) : []
}
const normalized = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9 ]/g, '')
async function check(name, action, expected) {
  writeFileSync(path.join(profile, 'target.json'), JSON.stringify({ pid: browserPid, step: name }))
  await action()
  await pause(1800)
  let events = transcript().filter(event => event.step === name)
  for (let i = 0; i < 8 && !expected(events.map(event => event.text).join(' ')); i++) {
    await pause(300)
    events = transcript().filter(event => event.step === name)
  }
  report.checks.push({ name, passed: expected(events.map(event => event.text).join(' ')), utterances: events })
  process.stdout.write(`${report.checks.at(-1).passed ? 'OK' : 'FALLO'} ${name}\n`)
}

try {
  const init = spawnSync(python, ['-c', 'from app.db.base import Base; from app.db.session import engine; import app.models; from app.db.seed_demo import seed; Base.metadata.create_all(engine); seed()'], { cwd: path.join(root, 'src/backend'), env: environment, encoding: 'utf8', windowsHide: true })
  assert.equal(init.status, 0, init.stderr)
  start(python, ['-m', 'uvicorn', 'app.main:app', '--host', '127.0.0.1', '--port', '8004'], path.join(root, 'src/backend'))
  start(process.execPath, [path.join(frontend, 'node_modules/vite/bin/vite.js'), '--host', '127.0.0.1', '--port', '5176', '--strictPort'], frontend)
  await until(async () => { try { return (await fetch('http://127.0.0.1:8004/health')).ok && (await fetch('http://127.0.0.1:5176')).ok } catch { return false } }, 'aplicación')
  start(nvda, ['--minimal', '--no-sr-flag', '--config-path=' + profile, '--log-file=' + path.join(profile, 'nvda.log')], path.dirname(nvda))
  nvdaStarted = true
  await until(() => existsSync(path.join(profile, 'ready.json')) && existsSync(path.join(profile, 'nvda.log')) && readFileSync(path.join(profile, 'nvda.log'), 'utf8').includes('NVDA initialized'), 'NVDA inicializado')
  report.workingTreeDirtyAtStart = Boolean(spawnSync(git, ['status', '--porcelain'], { cwd: root, encoding: 'utf8' }).stdout.trim())
  report.nvdaVersion = readFileSync(path.join(profile, 'nvda.log'), 'utf8').match(/Starting NVDA version (.+)/)?.[1].trim()
  server = await chromium.launchServer({ channel: 'msedge', headless: false, args: ['--force-renderer-accessibility'] })
  browserPid = server.process().pid
  browser = await chromium.connect(server.wsEndpoint())
  report.browser = { name: 'Microsoft Edge', version: browser.version(), platform: process.platform }
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
  const page = await context.newPage()
  await check('Carga y enlace de salto', async () => { await page.goto('http://127.0.0.1:5176'); await page.bringToFront(); await page.getByRole('heading', { name: /Bienvenido de nuevo/ }).waitFor(); await pause(1000); await page.getByRole('link', { name: 'Saltar al contenido' }).focus() }, text => /Saltar al contenido/i.test(text))
  await check('Login: correo requerido', () => page.getByLabel('Correo electrónico').focus(), text => /Correo electrónico.*requerido/i.test(text))
  await check('Login: contraseña protegida requerida por Tab', () => page.keyboard.press('Tab'), text => /Contraseña.*contraseña.*requerido/i.test(text))
  await check('Login: botón por Tab', () => page.keyboard.press('Tab'), text => /Ingresar botón/i.test(text))
  await page.getByLabel('Correo electrónico').fill(environment.BOOTSTRAP_OPERATOR_EMAIL)
  await page.getByLabel('Contraseña').fill('incorrecta')
  await check('Error de autenticación anunciado sin mover el foco', async () => { await page.getByRole('button', { name: 'Ingresar', exact: true }).click(); await page.getByRole('alert').waitFor() }, text => /alerta Credenciales inválidas/i.test(text))
  await page.getByLabel('Contraseña').fill(password)
  await check('Autenticación: región principal', async () => { await page.getByRole('button', { name: 'Ingresar', exact: true }).click(); await page.getByRole('heading', { name: 'Inicio', exact: true }).waitFor() }, text => /principal región/i.test(text))
  for (const name of ['Vehículos', 'Pedidos', 'Conductores', 'Clientes']) {
    const destination = page.getByRole('navigation').getByRole('button', { name, exact: true })
    await check(`Navegación: ${name}`, () => destination.focus(), text => normalized(text).includes(normalized(name)) && /botón/i.test(text))
    await check(`Contenido: ${name}`, async () => { await page.keyboard.press('Enter'); await page.getByRole('heading', { name, exact: true }).waitFor() }, text => normalized(text).includes(normalized(name + ' principal región')))
    const controls = page.locator('main form input:not([type="hidden"]), main form select, main form textarea, main form button:not(:disabled)')
    for (const control of await controls.all()) {
      const details = await control.evaluate(element => ({ label: element.labels?.[0]?.querySelector('span')?.textContent.trim() || element.textContent.trim(), tag: element.tagName, type: element.type }))
      const expectedLabel = normalized(details.label.split('(')[0].trim())
      await check(`${name}: ${details.label}`, () => control.focus(), text => normalized(text).includes(expectedLabel))
      report.checks.at(-1).control = details
    }
  }
  await page.getByLabel('Nombre', { exact: true }).fill('Cliente lector de pantalla')
  await check('Éxito: registro de cliente anunciado sin mover el foco', async () => { await page.getByRole('button', { name: 'Registrar', exact: true }).click(); await page.getByRole('status').waitFor() }, text => /Cliente registrado/i.test(text))
  await check('Cierre de sesión', async () => { await page.getByRole('button', { name: 'Salir', exact: true }).click(); await page.getByRole('heading', { name: /Bienvenido de nuevo/ }).waitFor() }, text => /Acceso principal región/i.test(text))
  report.transcript = transcript()
  report.summary = { completeScreenReaderEvaluation: report.checks.every(item => item.passed), total: report.checks.length, passed: report.checks.filter(item => item.passed).length, failed: report.checks.filter(item => !item.passed).length, utterances: report.transcript.length }
  report.finishedAt = new Date().toISOString()
  report.status = report.summary.failed === 0 ? 'passed-scoped-evaluation' : 'failed-checks'
  const serialized = JSON.stringify(report, null, 2).replaceAll(password, '[PROTEGIDO]') + '\n'
  writeFileSync(path.join(evidence, `lector-pantalla-reintento-${version}.json`), serialized)
  process.stdout.write(JSON.stringify(report.summary) + '\n')
  assert.equal(report.summary.failed, 0, 'Consulte las comprobaciones fallidas en la evidencia; no se declara aprobado.')
} finally {
  await browser?.close().catch(() => {})
  await server?.close().catch(() => {})
  if (nvdaStarted) spawnSync(nvda, ['--quit'], { windowsHide: true, stdio: 'ignore' })
  for (const child of children.reverse()) child.kill()
}
