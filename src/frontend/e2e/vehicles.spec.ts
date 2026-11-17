import { apiToken, expect, goToLastPage, login, openModule, test, uniqueCode } from './support/fixtures'

test.describe('Flota: registro, edición y desactivación de vehículos (US-001 a US-004)', () => {
  test('registra, edita y desactiva un vehículo de punta a punta', async ({ page }, testInfo) => {
    const placa = uniqueCode('E2E', testInfo).slice(0, 15)
    await login(page)
    await openModule(page, 'Vehículos')

    await page.getByLabel('Placa').fill(placa)
    await page.getByLabel('Marca').fill('Volvo')
    await page.getByLabel('Modelo').fill('FH 460')
    await page.getByLabel('Capacidad (kg)').fill('12000')
    await page.getByLabel('Capacidad (m³)').fill('45.5')
    await page.getByLabel('Consumo (km/l)').fill('3.2')
    await page.getByRole('button', { name: 'Registrar' }).click()
    await expect(page.getByRole('status').filter({ hasText: 'Vehículo registrado.' })).toBeVisible()

    // El listado ordena por fecha de creación: el registro nuevo está en la última página.
    await goToLastPage(page, 'vehículos')
    const card = page.getByRole('listitem').filter({ hasText: placa })
    await expect(card).toContainText('DISPONIBLE')
    await expect(card).toContainText('Volvo · FH 460')

    await card.getByRole('button', { name: 'Editar' }).click()
    await expect(page.getByRole('heading', { name: 'Editar vehículo' })).toBeVisible()
    await page.getByLabel('Estado').selectOption('MANTENIMIENTO')
    await page.getByRole('button', { name: 'Guardar cambios' }).click()
    await expect(page.getByRole('status').filter({ hasText: 'Vehículo actualizado.' })).toBeVisible()

    page.once('dialog', dialog => {
      expect(dialog.message()).toContain(placa)
      void dialog.accept()
    })
    await page.getByRole('listitem').filter({ hasText: placa }).getByRole('button', { name: 'Desactivar' }).click()
    await expect(page.getByRole('status').filter({ hasText: 'Vehículo desactivado.' })).toBeVisible()

    // Verificación independiente del estado persistido en la API.
    const token = await apiToken(page)
    const response = await page.request.get('/api/v1/vehiculos', { headers: { Authorization: `Bearer ${token}` } })
    const saved = (await response.json() as { placa: string; estado: string }[]).find(item => item.placa === placa)
    expect(saved?.estado).toBe('INACTIVO')
  })

  test('impide registrar un vehículo con capacidad inválida', async ({ page }, testInfo) => {
    await login(page)
    await openModule(page, 'Vehículos')
    let writes = 0
    page.on('request', request => { if (request.method() === 'POST' && request.url().includes('/api/v1/vehiculos')) writes++ })
    await page.getByLabel('Placa').fill(uniqueCode('BAD', testInfo).slice(0, 15))
    await page.getByLabel('Marca').fill('Marca')
    await page.getByLabel('Modelo').fill('Modelo')
    await page.getByLabel('Capacidad (kg)').fill('0')
    await page.getByLabel('Capacidad (m³)').fill('10')
    await page.getByRole('button', { name: 'Registrar' }).click()
    expect(await page.getByLabel('Capacidad (kg)').evaluate((input: HTMLInputElement) => input.validity.rangeUnderflow)).toBe(true)
    expect(writes).toBe(0)
  })

  test('informa la placa duplicada devuelta por la API', async ({ page }, testInfo) => {
    const placa = uniqueCode('DUP', testInfo).slice(0, 15)
    await login(page)
    const token = await apiToken(page)
    const body = { placa, marca: 'Hino', modelo: '300', capacidad_kg: '3000', capacidad_m3: '15', estado: 'DISPONIBLE' }
    expect((await page.request.post('/api/v1/vehiculos', { data: body, headers: { Authorization: `Bearer ${token}` } })).status()).toBe(201)
    await openModule(page, 'Vehículos')
    await page.getByLabel('Placa').fill(placa)
    await page.getByLabel('Marca').fill('Hino')
    await page.getByLabel('Modelo').fill('300')
    await page.getByLabel('Capacidad (kg)').fill('3000')
    await page.getByLabel('Capacidad (m³)').fill('15')
    await page.getByRole('button', { name: 'Registrar' }).click()
    await expect(page.getByRole('alert')).toHaveText('La placa ya está registrada')
  })
})
