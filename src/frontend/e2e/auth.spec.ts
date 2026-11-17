import { credentials, expect, login, test } from './support/fixtures'

test.describe('Autenticación (US de acceso del operador)', () => {
  test('muestra la pantalla pública de acceso @public', async ({ page }) => {
    const response = await page.goto('/')
    expect(response?.status()).toBe(200)
    await expect(page).toHaveTitle(/EcoLogística/i)
    await expect(page.getByRole('heading', { name: /Bienvenido de nuevo/ })).toBeVisible()
    await expect(page.getByLabel('Correo electrónico')).toBeVisible()
    await expect(page.getByLabel('Contraseña')).toHaveAttribute('type', 'password')
  })

  test('rechaza credenciales inválidas sin abrir la sesión @public', async ({ page }) => {
    await page.goto('/')
    await page.getByLabel('Correo electrónico').fill('no-existe@example.test')
    await page.getByLabel('Contraseña').fill('clave-incorrecta-e2e')
    const answer = page.waitForResponse(response => response.url().endsWith('/api/v1/auth/login'))
    await page.getByRole('button', { name: 'Ingresar' }).click()
    expect((await answer).status()).toBe(401)
    await expect(page.getByRole('alert')).toHaveText('Credenciales inválidas')
    await expect(page.getByRole('navigation', { name: 'Navegación principal' })).toHaveCount(0)
  })

  test('valida los campos obligatorios antes de enviar @public', async ({ page }) => {
    let requests = 0
    page.on('request', request => { if (request.url().includes('/api/v1/auth/login')) requests++ })
    await page.goto('/')
    await page.getByRole('button', { name: 'Ingresar' }).click()
    const email = page.getByLabel('Correo electrónico')
    expect(await email.evaluate((input: HTMLInputElement) => input.validity.valueMissing)).toBe(true)
    await email.fill('correo-sin-arroba')
    await page.getByLabel('Contraseña').fill('cualquier-clave')
    await page.getByRole('button', { name: 'Ingresar' }).click()
    expect(await email.evaluate((input: HTMLInputElement) => input.validity.typeMismatch)).toBe(true)
    expect(requests).toBe(0)
  })

  test('inicia sesión, navega por los módulos y cierra sesión', async ({ page }) => {
    test.skip(!credentials.password, 'Requiere credenciales de la base de prueba')
    await login(page)
    await expect(page.getByRole('heading', { name: 'Módulos operativos' })).toBeVisible()
    for (const module of ['Vehículos', 'Pedidos', 'Conductores', 'Clientes'] as const) {
      await page.getByRole('navigation', { name: 'Navegación principal' }).getByRole('button', { name: module }).click()
      await expect(page.getByRole('main', { name: module })).toBeVisible()
      await expect(page.getByRole('button', { name: module })).toHaveAttribute('aria-current', 'page')
    }
    await page.getByRole('button', { name: 'Salir' }).click()
    await expect(page.getByRole('heading', { name: /Bienvenido de nuevo/ })).toBeVisible()
  })

  test('mantiene el token solo en memoria: recargar exige un nuevo acceso', async ({ page }) => {
    await login(page)
    const stored = await page.evaluate(() => JSON.stringify({ ...localStorage }) + JSON.stringify({ ...sessionStorage }))
    expect(stored).not.toMatch(/eyJ/)
    await page.reload()
    await expect(page.getByRole('button', { name: 'Ingresar' })).toBeVisible()
  })
})
