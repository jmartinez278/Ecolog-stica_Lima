import { apiToken, expect, goToLastPage, login, openModule, test, uniqueCode } from './support/fixtures'

test.describe('Clientes y pedidos: flujo principal de negocio (US-005 a US-008, US-013 a US-015)', () => {
  test('registra un cliente y le asigna un pedido con ventana de entrega, luego lo cancela', async ({ page }, testInfo) => {
    const code = uniqueCode('PED', testInfo)
    const clientName = `Cliente ${code}`
    await login(page)

    await openModule(page, 'Clientes')
    await page.getByLabel('Nombre').fill(clientName)
    await page.getByLabel('Teléfono').fill('987654321')
    await page.getByLabel('Correo electrónico').fill(`${code.toLowerCase()}@example.test`)
    await page.getByLabel('Preferencia de entrega').fill('Entregar por la mañana')
    await page.getByRole('button', { name: 'Registrar' }).click()
    await expect(page.getByRole('status').filter({ hasText: 'Cliente registrado.' })).toBeVisible()

    // Capturar la primera respuesta real del selector para diagnosticar datos desactualizados.
    const pickerAnswer = page.waitForResponse(answer => answer.url().includes('/api/v1/clientes?activo=true') && answer.request().method() === 'GET')
    await openModule(page, 'Pedidos')
    const answer = await pickerAnswer
    const pickerBody = await answer.text().catch(() => '')
    const diagnosis = {
      status: answer.status(),
      ifNoneMatch: answer.request().headers()['if-none-match'] ?? null,
      etag: answer.headers()['etag'] ?? null,
      clientInBody: pickerBody.includes(clientName),
      bodyBytes: pickerBody.length,
    }
    const clientSelect = page.getByLabel('Cliente')
    const pages = page.getByRole('navigation', { name: 'Paginación de clientes disponibles' })
    // El selector pagina clientes de 12 en 12: avanzar hasta encontrar el cliente nuevo,
    // esperando en cada página a que termine la carga (aria-busy) antes de buscar.
    for (let current = 1; ; current++) {
      await expect(clientSelect).toHaveAttribute('aria-busy', 'false')
      const options = await clientSelect.locator('option').allTextContents()
      if (options.some(text => text.includes(clientName))) break
      const next = pages.getByRole('button', { name: 'Siguiente' })
      const canAdvance = await pages.isVisible() && await next.isEnabled()
      expect(canAdvance, `Cliente "${clientName}" ausente del selector en la página ${current}. ` +
        `Opciones: ${JSON.stringify(options)}. Primera respuesta: ${JSON.stringify(diagnosis)}`).toBe(true)
      await next.click()
      await expect(pages).toContainText(`Página ${current + 1} de`)
    }
    await clientSelect.selectOption({ label: clientName })
    await page.getByLabel('Código de pedido').fill(code)
    await page.getByLabel('Dirección de entrega').fill('Av. Javier Prado Este 1234, San Isidro')
    await page.getByLabel('Latitud').fill('-12.091500')
    await page.getByLabel('Longitud').fill('-77.023400')
    await page.getByLabel('Peso (kg)').fill('25.5')
    await page.getByLabel('Volumen (m³)').fill('0.350')
    await page.getByLabel('Inicio de ventana').fill('2026-12-01T09:00')
    await page.getByLabel('Fin de ventana').fill('2026-12-01T12:00')
    await page.getByLabel('Prioridad').selectOption('ALTA')
    await page.getByRole('button', { name: 'Registrar' }).click()
    await expect(page.getByRole('status').filter({ hasText: 'Pedido registrado.' })).toBeVisible()

    const token = await apiToken(page)
    const headers = { Authorization: `Bearer ${token}` }
    const orders = await (await page.request.get('/api/v1/pedidos', { headers })).json() as { pedido_id: string; codigo_pedido: string; estado: string; prioridad: string }[]
    const saved = orders.find(order => order.codigo_pedido === code)
    expect(saved).toMatchObject({ estado: 'PENDIENTE', prioridad: 'ALTA' })

    await goToLastPage(page, 'pedidos')
    page.once('dialog', dialog => void dialog.accept())
    await page.getByRole('listitem').filter({ hasText: code }).getByRole('button', { name: 'Cancelar pedido' }).click()
    await expect(page.getByRole('status').filter({ hasText: 'Pedido cancelado.' })).toBeVisible()
    const cancelled = await (await page.request.get(`/api/v1/pedidos/${saved?.pedido_id}`, { headers })).json()
    expect(cancelled.estado).toBe('CANCELADO')
  })

  test('rechaza una ventana de entrega que termina antes de empezar', async ({ page }, testInfo) => {
    await login(page)
    await openModule(page, 'Pedidos')
    await page.getByLabel('Cliente').selectOption({ label: 'Cliente de ejemplo' })
    await page.getByLabel('Código de pedido').fill(uniqueCode('VEN', testInfo))
    await page.getByLabel('Dirección de entrega').fill('Jr. de la Unión 500, Lima')
    await page.getByLabel('Latitud').fill('-12.046')
    await page.getByLabel('Longitud').fill('-77.030')
    await page.getByLabel('Peso (kg)').fill('5')
    await page.getByLabel('Volumen (m³)').fill('0.1')
    await page.getByLabel('Inicio de ventana').fill('2026-12-01T15:00')
    await page.getByLabel('Fin de ventana').fill('2026-12-01T10:00')
    const answer = page.waitForResponse(response => response.url().endsWith('/api/v1/pedidos') && response.request().method() === 'POST')
    await page.getByRole('button', { name: 'Registrar' }).click()
    expect((await answer).status()).toBe(422)
    await expect(page.getByRole('alert')).toBeVisible()
  })
})
