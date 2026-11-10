import assert from 'node:assert/strict'
import path from 'node:path'

export async function demonstrateWorkflows(page, evidenceDirectory) {
  const steps = []
  async function navigate(name) {
    await page.getByRole('navigation').getByRole('button', { name, exact: true }).click()
    await page.getByRole('heading', { name, exact: true }).waitFor()
  }
  async function fill(values) {
    for (const [label, value] of Object.entries(values)) await page.getByLabel(label).fill(value)
  }
  async function notice(text) {
    await page.getByRole('status').filter({ hasText: text }).waitFor()
    assert.equal(await page.getByRole('status').textContent(), text)
  }
  async function record(name, histories) {
    const screenshot = `demostracion-${String(steps.length + 1).padStart(2, '0')}.png`
    await page.waitForTimeout(900)
    await page.screenshot({ path: path.join(evidenceDirectory, screenshot), fullPage: true })
    steps.push({ name, histories, executedAt: new Date().toISOString(), result: 'PASSED', visibleMessage: await page.getByRole('status').textContent(), screenshot })
  }

  await page.setViewportSize({ width: 1440, height: 1000 })
  await navigate('Clientes')
  await fill({ Nombre: 'Comercial Centro', Teléfono: '999111222', 'Correo electrónico': 'centro@example.test', 'Preferencia de entrega': 'Llamar antes de entregar', 'Restricción de acceso': 'Usar puerta lateral' })
  await page.getByRole('button', { name: 'Registrar', exact: true }).click()
  await notice('Cliente registrado.')
  const client = page.getByRole('listitem').filter({ hasText: 'Comercial Centro' })
  await client.getByText('Comercial Centro', { exact: true }).waitFor()
  await record('Registro y consulta del cliente', ['US-013', 'US-014'])
  await client.getByRole('button', { name: 'Editar', exact: true }).click()
  await fill({ 'Preferencia de entrega': 'Entregar durante la mañana' })
  await page.getByRole('button', { name: 'Guardar cambios', exact: true }).click()
  await notice('Cliente actualizado.')
  await client.getByText('Preferencia: Entregar durante la mañana', { exact: true }).waitFor()
  await page.getByLabel('Solo activos').check()
  await client.waitFor()
  await record('Actualización de condiciones y consulta de clientes activos', ['US-014', 'US-015'])

  await navigate('Vehículos')
  await fill({ Placa: 'SPR-130', Marca: 'Toyota', Modelo: 'Hiace', 'Capacidad (kg)': '1200', 'Capacidad (m³)': '8', 'Consumo (km/l)': '12', 'Emisión (kg CO₂/km)': '0.25' })
  await page.getByRole('button', { name: 'Registrar', exact: true }).click()
  await notice('Vehículo registrado.')
  const vehicle = page.getByRole('listitem').filter({ hasText: 'SPR-130' })
  await vehicle.waitFor()
  await record('Registro y consulta del vehículo', ['US-001', 'US-002'])
  await vehicle.getByRole('button', { name: 'Editar', exact: true }).click()
  await fill({ 'Capacidad (kg)': '1500' })
  await page.getByRole('button', { name: 'Guardar cambios', exact: true }).click()
  await notice('Vehículo actualizado.')
  assert.match(await vehicle.textContent(), /1500(?:\.00)? kg/)
  await record('Actualización de capacidad del vehículo', ['US-003'])
  page.once('dialog', dialog => dialog.accept())
  await vehicle.getByRole('button', { name: 'Desactivar', exact: true }).click()
  await notice('Vehículo desactivado.')
  await vehicle.getByText('INACTIVO', { exact: true }).waitFor()
  await record('Desactivación lógica conservando el vehículo', ['US-004'])

  await navigate('Conductores')
  await fill({ Nombres: 'Ana', Apellidos: 'Pérez', 'Número de licencia': 'LIC-130', 'Categoría de licencia': 'A-IIb', Teléfono: '999111223', 'Experiencia (años)': '5' })
  await page.getByRole('button', { name: 'Registrar', exact: true }).click()
  await notice('Conductor registrado.')
  const driver = page.getByRole('listitem').filter({ hasText: 'Ana Pérez' })
  await driver.waitFor()
  await record('Registro y consulta del conductor', ['US-009', 'US-010'])
  await driver.getByRole('button', { name: 'Editar', exact: true }).click()
  await fill({ Teléfono: '999111224' })
  await page.getByRole('button', { name: 'Guardar cambios', exact: true }).click()
  await notice('Conductor actualizado.')
  await driver.getByText('999111224', { exact: true }).waitFor()
  await record('Actualización del contacto del conductor', ['US-011'])
  page.once('dialog', dialog => dialog.accept())
  await driver.getByRole('button', { name: 'Desactivar', exact: true }).click()
  await notice('Conductor desactivado.')
  await driver.getByText('INACTIVO', { exact: true }).waitFor()
  await page.getByLabel('Solo disponibles').check()
  await driver.waitFor({ state: 'detached' })
  await record('Desactivación y exclusión del filtro de conductores disponibles', ['US-010', 'US-012'])

  await navigate('Pedidos')
  const date = new Date(Date.now() + 86400000).toISOString().slice(0, 10)
  await page.getByLabel('Cliente').selectOption({ label: 'Comercial Centro' })
  await fill({ 'Código de pedido': 'SPR3-130', 'Dirección de entrega': 'Av. Lima 100', Referencia: 'Portón verde', Latitud: '-12.043180', Longitud: '-77.028240', 'Peso (kg)': '25', 'Volumen (m³)': '0.125', 'Inicio de ventana': `${date}T09:00`, 'Fin de ventana': `${date}T12:00`, 'Tipo de producto': 'Alimentos' })
  await page.getByLabel('Prioridad').selectOption('ALTA')
  await page.getByRole('button', { name: 'Registrar', exact: true }).click()
  await notice('Pedido registrado.')
  const order = page.getByRole('listitem').filter({ hasText: 'SPR3-130' })
  await order.getByText('PENDIENTE', { exact: true }).waitFor()
  await record('Registro y consulta del pedido pendiente', ['US-005', 'US-006'])
  await order.getByRole('button', { name: 'Editar', exact: true }).click()
  await fill({ 'Dirección de entrega': 'Av. Lima 150' })
  await page.getByRole('button', { name: 'Guardar cambios', exact: true }).click()
  await notice('Pedido actualizado.')
  await order.getByText('Av. Lima 150', { exact: true }).waitFor()
  await record('Edición del pedido pendiente', ['US-007'])
  page.once('dialog', dialog => dialog.accept())
  await order.getByRole('button', { name: 'Cancelar pedido', exact: true }).click()
  await notice('Pedido cancelado.')
  await page.getByLabel('Filtrar por estado').selectOption('CANCELADO')
  await order.getByText('CANCELADO', { exact: true }).waitFor()
  await record('Cancelación y consulta del pedido cancelado', ['US-006', 'US-008'])

  return { scope: 'Recorrido técnico de la aplicación real con API y base exclusiva de evaluación; no registra aceptación de interesados.', steps, historiesExercised: [...new Set(steps.flatMap(step => step.histories))].sort((left, right) => left.localeCompare(right)), failedSteps: 0 }
}
