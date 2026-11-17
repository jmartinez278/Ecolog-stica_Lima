/**
 * Sprint 4 — Suite E2E y monitoreo con Playwright (EcoLogística Lima).
 *
 * Modo local/CI (por defecto): levanta la API FastAPI real sobre una base de prueba aislada
 * y sirve el build de producción con `vite preview`, que reenvía /api a la API.
 * Modo producción: E2E_BASE_URL=https://ecologistica-lima.vercel.app ejecuta solo las
 * pruebas de solo lectura etiquetadas @public (sin credenciales ni escrituras).
 */
import { randomBytes } from 'node:crypto'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, devices } from '@playwright/test'

const here = path.dirname(fileURLToPath(import.meta.url))
const repository = path.resolve(here, '../..')
const external = process.env.E2E_BASE_URL?.replace(/\/$/, '')
const backendPort = Number(process.env.E2E_BACKEND_PORT || 8010)
const frontendPort = Number(process.env.E2E_FRONTEND_PORT || 4173)

// Credenciales efímeras de la base de prueba. Se fijan en process.env antes de crear los
// workers para que todos compartan el mismo valor; nunca se usan fuera de la base test_*.
process.env.E2E_USER_EMAIL ??= 'e2e.operador@example.test'
process.env.E2E_USER_PASSWORD ??= `e2e-${randomBytes(18).toString('base64url')}`
process.env.E2E_API_URL ??= external ? '' : `http://127.0.0.1:${backendPort}`

const backendEnvironment = {
  DATABASE_URL: process.env.E2E_DATABASE_URL || `sqlite:///${path.join(repository, 'tmp', 'test_e2e.db').replaceAll('\\', '/')}`,
  JWT_SECRET: process.env.E2E_JWT_SECRET || randomBytes(48).toString('base64url'),
  BOOTSTRAP_OPERATOR_EMAIL: process.env.E2E_USER_EMAIL,
  BOOTSTRAP_OPERATOR_PASSWORD: process.env.E2E_USER_PASSWORD,
}

const preview = `npx vite preview --host 127.0.0.1 --port ${frontendPort} --strictPort`

export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/support/global-setup.ts',
  outputDir: './test-results/artifacts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: process.env.CI ? 2 : 3,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  grep: external ? /@public/ : undefined,
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
  ],
  use: {
    baseURL: external || `http://127.0.0.1:${frontendPort}`,
    locale: 'es-PE',
    timezoneId: 'America/Lima',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: external ? undefined : [
    {
      name: 'API FastAPI',
      command: `"${process.env.E2E_PYTHON || 'python'}" ../../scripts/e2e_backend.py --port ${backendPort}`,
      url: `http://127.0.0.1:${backendPort}/health`,
      env: backendEnvironment,
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      name: 'Frontend (build de producción)',
      command: process.env.E2E_SKIP_BUILD ? preview : `npm run build && ${preview}`,
      url: `http://127.0.0.1:${frontendPort}`,
      env: { VITE_API_PROXY_TARGET: `http://127.0.0.1:${backendPort}` },
      reuseExistingServer: false,
      timeout: 180_000,
    },
  ],
})
