// Captura el reporte HTML de Playwright como evidencia PNG.
// Uso: node e2e/support/capture-report.mjs <destino.png> [filtro, ej. "s:failed"]
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { chromium } from '@playwright/test'

const [destination, filter = ''] = process.argv.slice(2)
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1360, height: 1000 }, deviceScaleFactor: 1 })
const url = pathToFileURL(path.resolve('playwright-report/index.html')).href + (filter ? `#?q=${encodeURIComponent(filter)}` : '')
await page.goto(url)
await page.waitForSelector('.test-file-test, .chip', { timeout: 15000 })
await page.screenshot({ path: destination, fullPage: true })
await browser.close()
console.log('Captura:', destination)
