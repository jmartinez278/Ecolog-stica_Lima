import { rm } from 'node:fs/promises'
import path from 'node:path'
import type { FullConfig } from '@playwright/test'

/** Cada ejecución parte de una carpeta de métricas vacía para no mezclar corridas. */
export default async function globalSetup(config: FullConfig) {
  await rm(path.join(config.rootDir, '..', 'test-results', 'metrics'), { recursive: true, force: true })
}
