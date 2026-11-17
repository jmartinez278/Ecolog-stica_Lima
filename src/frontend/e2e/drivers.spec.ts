import { expect, login, openModule, test, uniqueCode } from './support/fixtures'

test.describe('Conductores (US-009 a US-012)', () => {
  test('registra un conductor y rechaza una licencia duplicada', async ({ page }, testInfo) => {
    const licencia = uniqueCode('Q', testInfo)
    await login(page)
    await openModule(page, 'Conductores')

    const fill = async () => {
      await page.getByLabel('Nombres').fill('Rosa')
      await page.getByLabel('Apellidos').fill('Quispe Huamán')
      await page.getByLabel('Número de licencia').fill(licencia)
      await page.getByLabel('Categoría de licencia').fill('A-IIb')
      await page.getByLabel('Experiencia (años)').fill('6')
      await page.getByRole('button', { name: 'Registrar' }).click()
    }
    await fill()
    await expect(page.getByRole('status').filter({ hasText: 'Conductor registrado.' })).toBeVisible()
    await fill()
    await expect(page.getByRole('alert')).toHaveText('El número de licencia ya está registrado')
  })
})
