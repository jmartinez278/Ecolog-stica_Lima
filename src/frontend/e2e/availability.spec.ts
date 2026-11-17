import { expect, recordMetrics, test } from './support/fixtures'

const apiOrigin = () => process.env.E2E_API_URL || ''

test.describe('Disponibilidad: códigos HTTP del entorno desplegado', () => {
  test('la API y PostgreSQL responden en /health @public', async ({ request }) => {
    test.skip(!apiOrigin(), 'Defina E2E_API_URL para comprobar el backend directamente')
    const response = await request.get(`${apiOrigin()}/health`)
    expect(response.status()).toBe(200)
    expect(await response.json()).toEqual({ status: 'ok' })
  })

  test('la interfaz y los recursos estáticos responden 200 @public', async ({ page }) => {
    const failed: string[] = []
    page.on('response', response => { if (response.status() >= 400) failed.push(`${response.status()} ${response.url()}`) })
    const response = await page.goto('/')
    expect(response?.status()).toBe(200)
    expect(response?.headers()['content-type']).toContain('text/html')
    await page.waitForLoadState('networkidle')
    expect(failed).toEqual([])
  })

  test('el proxy /api protege los recursos: 401 sin token y 404 en rutas inexistentes @public', async ({ request }) => {
    const unauthorized = await request.get('/api/v1/vehiculos')
    expect(unauthorized.status()).toBe(401)
    expect(unauthorized.headers()['cache-control']).toContain('no-store')
    const missing = await request.get('/api/v1/ruta-inexistente')
    expect(missing.status()).toBe(404)
  })

  test('registra disponibilidad y latencia de 10 sondeos consecutivos @public', async ({ request }, testInfo) => {
    const targets = [{ name: 'interfaz', url: '/' }, { name: 'api-proxy', url: '/api/v1/vehiculos', expected: 401 }]
    if (apiOrigin()) targets.push({ name: 'api-health', url: `${apiOrigin()}/health` })
    const summary: Record<string, unknown> = {}
    for (const target of targets) {
      const samples: number[] = []
      let ok = 0
      for (let attempt = 0; attempt < 10; attempt++) {
        const started = performance.now()
        const response = await request.get(target.url, { timeout: 30_000 }).catch(() => null)
        samples.push(Math.round(performance.now() - started))
        if (response && response.status() === (target.expected ?? 200)) ok++
      }
      const sorted = [...samples].sort((a, b) => a - b)
      summary[target.name] = { probes: samples.length, ok, availabilityPct: (ok / samples.length) * 100, p50Ms: sorted[4], p95Ms: sorted[9], maxMs: sorted[9], samplesMs: samples }
      expect(ok).toBe(samples.length)
    }
    await recordMetrics(testInfo, 'disponibilidad', summary)
  })
})

test.describe('Resiliencia ante fallos de red y del servidor', () => {
  test('muestra un mensaje comprensible si se pierde la conexión @public', async ({ page }) => {
    await page.route('**/api/v1/auth/login', route => route.abort('internetdisconnected'))
    await page.goto('/')
    await page.getByLabel('Correo electrónico').fill('operador@example.test')
    await page.getByLabel('Contraseña').fill('clave-de-prueba')
    await page.getByRole('button', { name: 'Ingresar' }).click()
    await expect(page.getByRole('alert')).toHaveText('No se pudo conectar con el servidor. Revisa tu conexión e inténtalo nuevamente.')
    await expect(page.getByRole('button', { name: 'Ingresar' })).toBeEnabled()
  })

  test('explica una caída temporal del backend (503) sin bloquear la interfaz @public', async ({ page }) => {
    await page.route('**/api/v1/auth/login', route => route.fulfill({ status: 503, contentType: 'text/html', body: '<h1>Service Unavailable</h1>' }))
    await page.goto('/')
    await page.getByLabel('Correo electrónico').fill('operador@example.test')
    await page.getByLabel('Contraseña').fill('clave-de-prueba')
    await page.getByRole('button', { name: 'Ingresar' }).click()
    await expect(page.getByRole('alert')).toContainText('El servicio no está disponible en este momento')
    await expect(page.getByRole('alert')).toContainText('Error 503')
  })

  test('tolera una respuesta lenta de la API mostrando el estado de envío @public', async ({ page }) => {
    await page.route('**/api/v1/auth/login', async route => {
      await new Promise(resolve => setTimeout(resolve, 1500))
      await route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ detail: 'Credenciales inválidas' }) })
    })
    await page.goto('/')
    await page.getByLabel('Correo electrónico').fill('operador@example.test')
    await page.getByLabel('Contraseña').fill('clave-de-prueba')
    await page.getByRole('button', { name: 'Ingresar' }).click()
    await expect(page.getByRole('button', { name: /Ingresando/ })).toBeDisabled()
    await expect(page.getByRole('alert')).toHaveText('Credenciales inválidas')
  })
})
