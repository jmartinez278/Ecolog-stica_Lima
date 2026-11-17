import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { expect, test as base, type Page, type TestInfo } from '@playwright/test'

export const credentials = {
  email: process.env.E2E_USER_EMAIL ?? '',
  password: process.env.E2E_USER_PASSWORD ?? '',
}

/** Identificador corto y único por navegador y ejecución para no colisionar en paralelo. */
export function uniqueCode(prefix: string, testInfo: TestInfo): string {
  const browser = testInfo.project.name.slice(0, 2).toUpperCase()
  return `${prefix}${browser}${Date.now().toString(36).slice(-5)}${testInfo.workerIndex}`.toUpperCase()
}

export async function login(page: Page) {
  await page.goto('/')
  await page.getByLabel('Correo electrónico').fill(credentials.email)
  await page.getByLabel('Contraseña').fill(credentials.password)
  await page.getByRole('button', { name: 'Ingresar' }).click()
  await expect(page.getByRole('navigation', { name: 'Navegación principal' })).toBeVisible()
}

export async function openModule(page: Page, name: 'Vehículos' | 'Pedidos' | 'Conductores' | 'Clientes') {
  await page.getByRole('navigation', { name: 'Navegación principal' }).getByRole('button', { name }).click()
  await expect(page.getByRole('main', { name })).toBeVisible()
}

/** Token de la sesión de prueba para verificar el estado persistido directamente en la API. */
export async function apiToken(page: Page): Promise<string> {
  const response = await page.request.post('/api/v1/auth/login', { data: credentials })
  expect(response.status()).toBe(200)
  return (await response.json()).access_token
}

/** Registrar métricas en el reporte HTML y en test-results/metrics para el resumen del pipeline. */
export async function recordMetrics(testInfo: TestInfo, name: string, values: Record<string, unknown>) {
  const payload = { test: testInfo.title, project: testInfo.project.name, target: testInfo.project.use.baseURL, measuredAt: new Date().toISOString(), ...values }
  await testInfo.attach(`${name}.json`, { body: JSON.stringify(payload, null, 2), contentType: 'application/json' })
  const folder = path.join(testInfo.config.rootDir, '..', 'test-results', 'metrics')
  await mkdir(folder, { recursive: true })
  await writeFile(path.join(folder, `${testInfo.project.name}-${name}.json`), JSON.stringify(payload, null, 2))
}

export const test = base
export { expect }

/** Ir a la última página de un listado paginado esperando cada carga (orden por creación). */
export async function goToLastPage(page: Page, label: string) {
  await expect(page.getByText('Cargando registros…')).toHaveCount(0)
  const nav = page.getByRole('navigation', { name: `Paginación de ${label}` })
  if (!(await nav.isVisible())) return
  const text = (await nav.textContent()) ?? ''
  const [, current, total] = /Página (\d+) de (\d+)/.exec(text) ?? ['', '1', '1']
  for (let next = Number(current) + 1; next <= Number(total); next++) {
    await nav.getByRole('button', { name: 'Siguiente' }).click()
    await expect(nav).toContainText(`Página ${next} de`)
    await expect(page.getByText('Cargando registros…')).toHaveCount(0)
  }
}
