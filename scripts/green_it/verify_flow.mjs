import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { chromium } from '../../src/frontend/node_modules/playwright/index.mjs'
const requireFrontend = createRequire(new URL('../../src/frontend/package.json', import.meta.url))
const AxeBuilder = requireFrontend('@axe-core/playwright').default

const base = process.env.AUDIT_BASE_URL || 'http://localhost:8180'
const output = process.argv[2]
if (!process.env.AUDIT_EMAIL || !process.env.AUDIT_PASSWORD || !output) throw new Error('Faltan credenciales externas o directorio de evidencia')
fs.mkdirSync(output, { recursive: true })
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH, headless: true, args: ['--no-sandbox'] })
const checks = [], errors = [], requests = [], accessibility = []
const verify = (condition, description) => { if (!condition) throw new Error(description); checks.push(description) }
try {
  const staticContext = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 360, height: 800 } })
  const staticPage = await staticContext.newPage()
  await staticPage.goto(base)
  verify(await staticPage.getByRole('heading', { name: /Bienvenido/ }).isVisible(), 'El acceso es visible antes de ejecutar JavaScript')
  await staticContext.close()
  for (const width of [360, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 900 } })
    const page = await context.newPage()
    page.on('pageerror', error => errors.push(error.message))
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
    page.on('request', request => {
      const url = new URL(request.url())
      if (request.method() === 'GET' && /^\/api\/v1\/(vehiculos|pedidos|conductores|clientes)$/.test(url.pathname)) requests.push(url.pathname + url.search)
    })
    await page.goto(base)
    await page.getByLabel('Correo electrónico').fill(process.env.AUDIT_EMAIL)
    await page.getByLabel('Contraseña').fill(process.env.AUDIT_PASSWORD)
    await page.getByRole('button', { name: 'Ingresar' }).click()
    await page.getByRole('heading', { name: 'Inicio', exact: true }).waitFor()
    for (const name of ['Vehículos', 'Pedidos', 'Conductores', 'Clientes']) {
      await page.getByRole('button', { name, exact: true }).click()
      await page.locator('.cards > li').first().waitFor()
      verify(await page.locator('.cards > li').count() <= 12, `${name}: máximo 12 registros a ${width}px`)
      verify(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `${name}: sin desbordamiento a ${width}px`)
      const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
      accessibility.push({ page: name, width, violations: axe.violations, passed_rules: axe.passes.length, incomplete: axe.incomplete.map(item => item.id) })
      fs.writeFileSync(path.join(output, 'accesibilidad-axe.json'), JSON.stringify(accessibility, null, 2))
      verify(axe.violations.length === 0, `${name}: sin infracciones axe A/AA detectadas a ${width}px`)
      await page.screenshot({ path: path.join(output, `${name.toLowerCase()}-${width}.png`), fullPage: true })
      if (name === 'Pedidos') {
        verify(await page.getByLabel('Cliente').locator('option').count() <= 13, `Selector de clientes acotado a ${width}px`)
      }
    }
    if (width === 1440) {
      await page.getByRole('button', { name: 'Vehículos', exact: true }).click()
      await page.locator('.cards > li').first().waitFor()
      const plate = `E04-${Date.now().toString(36).slice(-3).toUpperCase()}`
      for (const [label, value] of Object.entries({ Placa: plate, Marca: 'Auditoría', Modelo: 'Green IT', 'Capacidad (kg)': '1200', 'Capacidad (m³)': '8' })) await page.getByLabel(label, { exact: true }).fill(value)
      const created = page.waitForResponse(response => response.url().endsWith('/api/v1/vehiculos') && response.request().method() === 'POST')
      await page.getByRole('button', { name: 'Registrar', exact: true }).click()
      verify((await created).status() === 201, 'Registro real desde el navegador responde 201')
      const navigation = page.getByRole('navigation', { name: 'Paginación de vehículos' })
      while (await navigation.getByRole('button', { name: 'Siguiente' }).isEnabled()) {
        const previous = await navigation.locator('span').textContent()
        await navigation.getByRole('button', { name: 'Siguiente' }).click()
        await page.waitForFunction(text => document.querySelector('nav[aria-label="Paginación de vehículos"] span')?.textContent !== text, previous)
        await page.locator('.cards > li').first().waitFor()
      }
      const card = page.locator('.cards > li').filter({ hasText: plate })
      await card.getByRole('button', { name: 'Editar', exact: true }).click()
      await page.getByLabel('Capacidad (kg)', { exact: true }).fill('1500')
      await page.getByRole('button', { name: 'Guardar cambios' }).click()
      await card.getByText(/^1500(?:\.00)? kg$/).waitFor()
      page.once('dialog', dialog => dialog.accept())
      await card.getByRole('button', { name: 'Desactivar', exact: true }).click()
      await card.getByText('INACTIVO', { exact: true }).waitFor()
      checks.push('Registro, actualización y desactivación persisten y vuelven a mostrarse en la interfaz')
    }
    await page.getByRole('button', { name: 'Salir' }).click()
    await page.getByLabel('Correo electrónico').waitFor()
    verify(await page.getByRole('main', { name: 'Acceso' }).isVisible(), `Cierre de sesión a ${width}px`)
    await context.close()
  }
  verify(requests.length > 0 && requests.every(url => new URL(url, base).searchParams.has('page')), 'Todos los listados de la interfaz solicitan paginación en servidor')
  verify(errors.length === 0, 'Sin errores de consola, hidratación ni módulos')
  fs.writeFileSync(path.join(output, 'verificacion-flujo.json'), JSON.stringify({ checked_at: new Date().toISOString(), checks, requests, errors, note: 'La prueba de escritura se ejecuta después de medir y añade vehículos E04-* de auditoría.' }, null, 2))
  console.log(`${checks.length} comprobaciones del flujo aprobadas.`)
} finally { await browser.close() }
