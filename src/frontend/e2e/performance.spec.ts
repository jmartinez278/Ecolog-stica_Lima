import type { Page } from '@playwright/test'
import { expect, login, openModule, recordMetrics, test } from './support/fixtures'

/**
 * Monitoreo de rendimiento: Navigation Timing (TTFB), Paint Timing (FCP) y
 * Largest Contentful Paint (LCP) leídos del propio navegador, más la duración de la API
 * medida con Resource Timing. WebKit no expone LCP: se registra como no soportado.
 */
const BUDGET = { ttfb: 800, fcp: 1800, lcp: 2500, api: 500 }

async function webVitals(page: Page) {
  return page.evaluate(async () => {
    const lcp = await new Promise<number | null>(resolve => {
      if (!PerformanceObserver.supportedEntryTypes?.includes('largest-contentful-paint')) return resolve(null)
      let value: number | null = null
      new PerformanceObserver(list => {
        for (const entry of list.getEntries()) value = entry.startTime
      }).observe({ type: 'largest-contentful-paint', buffered: true })
      setTimeout(() => resolve(value), 1500)
    })
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    const fcp = performance.getEntriesByName('first-contentful-paint')[0]?.startTime ?? null
    return {
      ttfb: Math.round(navigation.responseStart - navigation.startTime),
      domContentLoaded: Math.round(navigation.domContentLoadedEventEnd - navigation.startTime),
      load: Math.round(navigation.loadEventEnd - navigation.startTime),
      fcp: fcp === null ? null : Math.round(fcp),
      lcp: lcp === null ? null : Math.round(lcp),
      transferBytes: navigation.transferSize,
    }
  })
}

test.describe('Rendimiento y Web Vitals', () => {
  test('la página de acceso cumple los presupuestos de TTFB, FCP y LCP @public', async ({ page }, testInfo) => {
    await page.goto('/', { waitUntil: 'load' })
    await expect(page.getByRole('button', { name: 'Ingresar' })).toBeVisible()
    const vitals = await webVitals(page)
    await recordMetrics(testInfo, 'web-vitals-acceso', { budget: BUDGET, ...vitals })
    expect(vitals.ttfb).toBeLessThan(BUDGET.ttfb)
    if (vitals.fcp !== null) expect(vitals.fcp).toBeLessThan(BUDGET.fcp)
    if (vitals.lcp !== null) expect(vitals.lcp).toBeLessThan(BUDGET.lcp)
  })

  test('las APIs autenticadas responden en menos de 500 ms', async ({ page }, testInfo) => {
    await login(page)
    const timings: Record<string, number> = {}
    for (const [module, path] of [['Vehículos', '/api/v1/vehiculos'], ['Pedidos', '/api/v1/pedidos'], ['Conductores', '/api/v1/conductores'], ['Clientes', '/api/v1/clientes']] as const) {
      const response = page.waitForResponse(answer => answer.url().includes(`${path}?`) && answer.request().method() === 'GET')
      await openModule(page, module)
      const answer = await response
      expect(answer.status()).toBe(200)
      timings[path] = await page.evaluate(url => {
        const entries = performance.getEntriesByType('resource').filter(entry => entry.name === url) as PerformanceResourceTiming[]
        const last = entries.at(-1)
        return last ? Math.round(last.responseEnd - last.startTime) : -1
      }, answer.url())
    }
    const loginMs = await page.evaluate(() => {
      const entry = (performance.getEntriesByType('resource') as PerformanceResourceTiming[]).find(item => item.name.endsWith('/api/v1/auth/login'))
      return entry ? Math.round(entry.responseEnd - entry.startTime) : -1
    })
    await recordMetrics(testInfo, 'api-tiempos', { budgetMs: BUDGET.api, '/api/v1/auth/login': loginMs, ...timings })
    for (const value of Object.values(timings)) {
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThan(BUDGET.api)
    }
  })
})
