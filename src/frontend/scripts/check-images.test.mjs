import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { checkImages } from './check-images.mjs'

test('impide imágenes grandes o sin alternativas y acepta el conjunto completo', () => {
  const root = mkdtempSync(join(tmpdir(), 'ecolog-images-'))
  try {
    writeFileSync(join(root, 'photo.jpg'), Buffer.alloc(200_001))
    assert.equal(checkImages([root]).problems.length, 3)
    writeFileSync(join(root, 'photo.jpg'), Buffer.alloc(100))
    for (const ext of ['avif', 'webp']) writeFileSync(join(root, `photo.${ext}`), Buffer.alloc(50))
    assert.deepEqual(checkImages([root]), { problems: [], count: 3 })
  } finally { rmSync(root, { recursive: true, force: true }) }
})
