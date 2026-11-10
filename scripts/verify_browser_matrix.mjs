import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'
import { spawn, spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const requireTools = createRequire(path.join(root, 'tmp/browser-tools/package.json'))
const { Builder, By, Key, until } = requireTools('selenium-webdriver')
const chrome = requireTools('selenium-webdriver/chrome')
const edge = requireTools('selenium-webdriver/edge')
const firefox = requireTools('selenium-webdriver/firefox')
const browsingContext = requireTools('selenium-webdriver/bidi/browsingContext')
let configurationPath
switch (process.argv[2]) {
  case undefined:
  case 'tmp/browser-matrix.json': configurationPath = path.join(root, 'tmp/browser-matrix.json'); break
  case 'tmp/compatibilidad-conjunto-final.json': configurationPath = path.join(root, 'tmp/compatibilidad-conjunto-final.json'); break
  default: throw new Error('Seleccione una de las dos matrices locales documentadas.')
}
const config = JSON.parse(await readFile(configurationPath, 'utf8'))
const evidence = path.join(root, 'docs/03 Implementación/Sprint 03/evidencias')
const temporary = path.join(root, 'tmp', `compat-${Date.now()}`)
await mkdir(temporary, { recursive: true })
const password = randomBytes(24).toString('base64url')
const environment = { ...process.env, DATABASE_URL: `sqlite:///${path.join(temporary, 'test_compat.db').replaceAll('\\', '/')}`, JWT_SECRET: randomBytes(48).toString('base64url'), BOOTSTRAP_OPERATOR_EMAIL: 'compat@example.test', BOOTSTRAP_OPERATOR_PASSWORD: password, VITE_API_PROXY_TARGET: 'http://127.0.0.1:8003' }
const python = path.join(root, '.venv/Scripts/python.exe')
const children = []
let driver
const report = { executedAt: new Date().toISOString(), projectVersion: '1.3.0', scope: 'Aplicación y API reales en localhost; perfiles y SQLite exclusivos de evaluación.', tools: { selenium: requireTools('selenium-webdriver/package.json').version }, browsers: [], limits: ['La ejecución técnica no registra revisión ni aceptación del cliente o del usuario.', 'La semántica accesible y los eventos live se comprueban técnicamente; la comprensión de la salida de un lector de pantalla corresponde a la revisión del usuario.'] }
function start(executable, args, cwd) {
  const child = spawn(executable, args, { cwd, env: environment, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] })
  children.push(child); child.stdout.resume(); child.stderr.resume()
}
async function ready(url) {
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch(url)).ok) return } catch {}
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  throw new Error(`Servicio no disponible: ${url}`)
}
const axe = await readFile(path.join(root, 'src/frontend/node_modules/axe-core/axe.min.js'), 'utf8')
let current
let recordNeedle = ''
function check(name, passed, detail) { current.checks.push({ name, passed, ...(detail === undefined ? {} : { detail }) }); assert.ok(passed, name) }
async function find(selector) {
  if (selector === 'main li:last-child') {
    return driver.wait(async () => {
      for (const item of await driver.findElements(By.css('main li'))) if ((await item.getText()).includes(recordNeedle)) return item
      return false
    }, 10000)
  }
  return driver.wait(until.elementLocated(By.css(selector)), 10000)
}
async function text(selector) { return (await find(selector)).getText() }
async function button(name, within = '') {
  const buttons = within === 'main li:last-child' ? await (await find(within)).findElements(By.css('button')) : await driver.findElements(By.css(`${within} button`.trim()))
  for (const item of buttons) {
    const label = (await item.getText()).trim()
    const withoutArrow = label.endsWith('→') ? label.slice(0, -1).trimEnd() : label
    if (withoutArrow === name) { await item.click(); return }
  }
  throw new Error(`Botón no localizado: ${name}`)
}
async function field(name, value) {
  const element = await driver.executeScript(function (label) {
    const match = [...document.querySelectorAll('label')].find(item => item.firstChild?.textContent.trim() === label || item.textContent.trim() === label)
    return match?.querySelector('input,textarea,select') || (match?.htmlFor ? document.getElementById(match.htmlFor) : null)
  }, name)
  assert.ok(element, `Campo ${name}`)
  const tag = await element.getTagName()
  const type = await element.getAttribute('type')
  if (tag !== 'select' && type !== 'datetime-local') {
    await element.click()
    await element.sendKeys(Key.chord(Key.CONTROL, 'a'), Key.BACK_SPACE)
    await element.sendKeys(value)
    return
  }
  await driver.executeScript(function (input, value) {
    const prototype = input.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : input.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype
    Object.getOwnPropertyDescriptor(prototype, 'value').set.call(input, value)
    input.dispatchEvent(new Event(input.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }))
  }, element, value)
}
async function fill(values) { for (const [name, value] of Object.entries(values)) await field(name, value) }
async function notice(message) {
  await driver.wait(async () => (await driver.findElements(By.css('[role=status]'))).length > 0 && (await text('[role=status]')) === message, 10000)
  await driver.wait(async () => (await find('main form button[type=submit]')).isEnabled(), 10000)
  check(message, true)
}
async function contains(selector, value, name) { await driver.wait(async () => (await text(selector)).includes(value), 10000); check(name, true) }
async function navigate(name) { await button(name, 'nav'); await driver.wait(async () => (await text('h1')).replace(/\.$/, '') === name, 10000) }
async function accept() { await driver.wait(until.alertIsPresent(), 5000); await (await driver.switchTo().alert()).accept() }
async function audit(name, width) {
  // Outer-window minimums differ. Set the content viewport using the measured chrome delta.
  if (current.family === 'firefox') {
    const context = await browsingContext(driver, { browsingContextId: await driver.getWindowHandle() })
    await context.setViewport(width, 900, 1)
  } else {
    await driver.sendDevToolsCommand('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: false })
  }
  await driver.executeAsyncScript('const done=arguments[arguments.length-1];document.fonts.ready.then(()=>setTimeout(done,300))')
  await driver.executeScript(axe)
  const result = await driver.executeAsyncScript(function () {
    const done = arguments[arguments.length - 1]
    axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] } }).then(results => done({
      axeVersion: results.testEngine.version,
      violations: results.violations.map(item => ({ id: item.id, impact: item.impact, targets: item.nodes.map(node => node.target) })),
      incomplete: results.incomplete.map(item => ({ id: item.id, nodes: item.nodes.map(node => ({ target: node.target, decorative: Boolean(document.querySelector(node.target[0])?.closest('[aria-hidden=true]')) })) })),
      contrastOccurrences: results.passes.filter(item => item.id === 'color-contrast').reduce((sum, item) => sum + item.nodes.length, 0),
      viewport: innerWidth, documentWidth: document.documentElement.scrollWidth,
      semantics: { language: document.documentElement.lang, main: document.querySelectorAll('main').length, controls: [...document.querySelectorAll('main input,main select,main textarea')].map(input => ({ tag: input.tagName, type: input.type, label: [...(input.labels || [])].map(label => label.textContent.trim()).join(' '), required: input.required })) }
    })).catch(error => done({ error: error.message }))
  })
  current.states.push({ name, ...result })
  check(`${name}: sin infracciones automáticas`, !result.error && result.violations.length === 0)
  check(`${name}: reflow`, result.viewport === width && result.documentWidth <= width + 1)
  check(`${name}: nombres y regiones accesibles`, result.semantics.language === 'es' && result.semantics.main === 1 && result.semantics.controls.every(input => input.label))
  check(`${name}: contraste funcional evaluado`, result.incomplete.every(rule => rule.nodes.every(node => node.decorative)))
  if (['Login', 'Clientes', 'Conductores'].includes(name)) {
    const filename = `compat-${current.id}-${name.toLowerCase()}-${width}.png`
    await writeFile(path.join(evidence, filename), await driver.takeScreenshot(), 'base64')
    current.screenshots.push(filename)
  }
}
async function workflows() {
  const id = current.id.replaceAll('-', '').slice(-12).toUpperCase()
  if (current.family === 'firefox') {
    const context = await browsingContext(driver, { browsingContextId: await driver.getWindowHandle() }); await context.setViewport(1440, 1000, 1)
  } else await driver.sendDevToolsCommand('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false })
  await navigate('Clientes')
  recordNeedle = `Cliente ${id}`
  await fill({ Nombre: `Cliente ${id}`, Teléfono: '999111222', 'Correo electrónico': `${id.toLowerCase()}@example.test`, 'Preferencia de entrega': 'Llamar antes', 'Restricción de acceso': 'Puerta lateral' })
  await button('Registrar'); await notice('Cliente registrado.')
  await contains('main', `Cliente ${id}`, 'US-013/014: cliente visible')
  await button('Editar', 'main li:last-child'); await field('Preferencia de entrega', 'Entregar por la mañana'); await button('Guardar cambios'); await notice('Cliente actualizado.')
  await contains('main', 'Entregar por la mañana', 'US-015: condiciones conservadas')
  await navigate('Vehículos')
  recordNeedle = id
  await fill({ Placa: id, Marca: 'Toyota', Modelo: 'Hiace', 'Capacidad (kg)': '1200', 'Capacidad (m³)': '8', 'Consumo (km/l)': '12', 'Emisión (kg CO₂/km)': '0.25' })
  await button('Registrar'); await notice('Vehículo registrado.'); await contains('main', id, 'US-001/002: vehículo visible')
  await button('Editar', 'main li:last-child'); await field('Capacidad (kg)', '1500'); await button('Guardar cambios'); await notice('Vehículo actualizado.'); await contains('main', '1500', 'US-003: capacidad actualizada')
  await button('Desactivar', 'main li:last-child'); await accept(); await notice('Vehículo desactivado.'); await contains('main li:last-child', 'INACTIVO', 'US-004: desactivación lógica')
  await navigate('Conductores')
  recordNeedle = `Ana${id}`
  await fill({ Nombres: `Ana${id}`, Apellidos: 'Pérez', 'Número de licencia': `L${id}`, 'Categoría de licencia': 'A-IIb', Teléfono: '999111223', 'Experiencia (años)': '5' })
  await button('Registrar'); await notice('Conductor registrado.'); await contains('main', `Ana${id}`, 'US-009/010: conductor visible')
  await button('Editar', 'main li:last-child'); await field('Teléfono', '999111224'); await button('Guardar cambios'); await notice('Conductor actualizado.'); await contains('main li:last-child', '999111224', 'US-011: contacto actualizado')
  await button('Desactivar', 'main li:last-child'); await accept(); await notice('Conductor desactivado.'); await contains('main li:last-child', 'INACTIVO', 'US-012: desactivación lógica')
  await navigate('Pedidos')
  recordNeedle = id
  const date = new Date(Date.now() + 86400000).toISOString().slice(0, 10)
  const client = await driver.findElement(By.css('main select'))
  await driver.wait(async () => driver.executeScript(function (input, name) { return [...input.options].some(option => option.text === name) }, client, `Cliente ${id}`), 10000)
  await driver.executeScript(function (input, name) { input.value = [...input.options].find(option => option.text === name).value; input.dispatchEvent(new Event('change', { bubbles: true })) }, client, `Cliente ${id}`)
  await fill({ 'Código de pedido': id, 'Dirección de entrega': 'Av. Lima 100', Referencia: 'Puerta verde', Latitud: '-12.043180', Longitud: '-77.028240', 'Peso (kg)': '25', 'Volumen (m³)': '0.125', 'Inicio de ventana': `${date}T09:00`, 'Fin de ventana': `${date}T12:00`, 'Tipo de producto': 'Alimentos' })
  await button('Registrar'); await notice('Pedido registrado.'); await contains('main li:last-child', 'PENDIENTE', 'US-005/006: pedido pendiente')
  await button('Editar', 'main li:last-child'); await field('Dirección de entrega', 'Av. Lima 150'); await button('Guardar cambios'); await notice('Pedido actualizado.'); await contains('main li:last-child', 'Av. Lima 150', 'US-007: dirección actualizada')
  await button('Cancelar pedido', 'main li:last-child'); await accept(); await notice('Pedido cancelado.'); await contains('main li:last-child', 'CANCELADO', 'US-008: cancelación')
}
try {
  const init = spawnSync(python, ['-c', 'from app.db.base import Base; from app.db.session import engine; import app.models; from app.db.seed_demo import seed; Base.metadata.create_all(engine); seed()'], { cwd: path.join(root, 'src/backend'), env: environment, windowsHide: true, encoding: 'utf8' })
  assert.equal(init.status, 0, init.stderr)
  start(python, ['-m', 'uvicorn', 'app.main:app', '--host', '127.0.0.1', '--port', '8003'], path.join(root, 'src/backend'))
  start(process.execPath, [path.join(root, 'src/frontend/node_modules/vite/bin/vite.js'), '--host', '127.0.0.1', '--port', '5175', '--strictPort'], path.join(root, 'src/frontend'))
  await ready('http://127.0.0.1:8003/health'); await ready('http://127.0.0.1:5175')
  for (const item of config.browsers) {
    current = { id: item.id, family: item.family, expectedVersion: item.version, source: item.source, checks: [], states: [], screenshots: [], status: 'RUNNING' }; report.browsers.push(current)
    try {
      const builder = new Builder().forBrowser(item.family).withCapabilities({ unhandledPromptBehavior: 'ignore' })
      if (item.family === 'firefox') builder.setFirefoxOptions(new firefox.Options().setBinary(item.binary).addArguments('-headless').enableBidi()).setFirefoxService(new firefox.ServiceBuilder(item.driver))
      else if (item.family === 'MicrosoftEdge') builder.setEdgeOptions(new edge.Options().setEdgeChromiumBinaryPath(item.binary).addArguments('--headless=new', '--window-size=1440,1000')).setEdgeService(new edge.ServiceBuilder(item.driver))
      else builder.setChromeOptions(new chrome.Options().setChromeBinaryPath(item.binary).addArguments('--headless=new', '--window-size=1440,1000')).setChromeService(new chrome.ServiceBuilder(item.driver))
      driver = await builder.build()
      await driver.manage().setTimeouts({ script: 30000, pageLoad: 30000 })
      current.actualVersion = (await driver.getCapabilities()).get('browserVersion')
      check('Versión ejecutada corresponde a la matriz', current.actualVersion === item.version)
      await driver.get('http://127.0.0.1:5175'); await find('form')
      await driver.actions().sendKeys(Key.TAB).perform()
      check('Primer Tab alcanza salto al contenido', await driver.executeScript('return document.activeElement.textContent.trim()==="Saltar al contenido"'))
      await driver.actions().sendKeys(Key.ENTER).perform()
      check('Salto al contenido mueve el foco', await driver.executeScript('return document.activeElement.id==="main-content"'))
      for (const width of [1440, 360]) await audit('Login', width)
      await fill({ 'Correo electrónico': environment.BOOTSTRAP_OPERATOR_EMAIL, Contraseña: password }); await button('Ingresar'); await driver.wait(async () => (await driver.findElements(By.css('nav'))).length > 0, 10000)
      check('Login dirige foco al contenido', await driver.executeScript('return document.activeElement.id==="main-content"'))
      for (const name of ['Inicio', 'Vehículos', 'Pedidos', 'Conductores', 'Clientes']) {
        await navigate(name)
        check(`${name}: foco al contenido`, await driver.executeScript('return document.activeElement.id==="main-content"'))
        for (const width of [1440, 360]) await audit(name, width)
      }
      await workflows()
      await button('Salir'); await fill({ 'Correo electrónico': environment.BOOTSTRAP_OPERATOR_EMAIL, Contraseña: 'incorrecta' }); await button('Ingresar'); await find('[role=alert]')
      check('Error accesible de autenticación', Boolean(await text('[role=alert]')))
      await audit('LoginError', 360)
      current.status = 'PASSED'
    } catch (error) { current.status = 'FAILED'; current.error = error.message.slice(0, 1500); if (driver) await writeFile(path.join(temporary, `${item.id}-error.png`), await driver.takeScreenshot().catch(() => ''), 'base64') }
    finally { await driver?.quit().catch(() => {}); driver = undefined }
    process.stdout.write(`${current.id}: ${current.status}, ${current.checks.length} comprobaciones\n`)
    await writeFile(path.join(evidence, 'compatibilidad-1.3.0.json'), JSON.stringify(report, null, 2) + '\n')
  }
  report.summary = { browsers: report.browsers.length, passed: report.browsers.filter(item => item.status === 'PASSED').length, failed: report.browsers.filter(item => item.status === 'FAILED').length, checks: report.browsers.reduce((sum, item) => sum + item.checks.length, 0), states: report.browsers.reduce((sum, item) => sum + item.states.length, 0) }
  await writeFile(path.join(evidence, 'compatibilidad-1.3.0.json'), JSON.stringify(report, null, 2) + '\n')
  assert.equal(report.summary.failed, 0, 'Quedan navegadores con comprobaciones fallidas')
} finally { await driver?.quit().catch(() => {}); for (const child of children.reverse()) child.kill() }
