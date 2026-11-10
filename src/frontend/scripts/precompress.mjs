// Green IT (Inspección 04): genera copias .br (Brotli) y .gz de los recursos estáticos del build.
// Caddy las sirve con `file_server { precompressed br gzip }` sin comprimir en cada petición.
// Sin dependencias externas: usa zlib nativo de Node.js.
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { brotliCompressSync, constants, gzipSync } from 'node:zlib'

const DIST = new URL('../dist/', import.meta.url).pathname
const COMPRESSIBLE = /\.(js|css|html|svg|json|txt|webmanifest)$/
const MIN_BYTES = 1024

function walk(dir) {
  return readdirSync(dir).flatMap(name => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? walk(path) : [path]
  })
}

let original = 0, brotli = 0
for (const file of walk(DIST).filter(path => COMPRESSIBLE.test(path))) {
  const source = readFileSync(file)
  if (source.length < MIN_BYTES) continue
  const br = brotliCompressSync(source, { params: { [constants.BROTLI_PARAM_QUALITY]: 11 } })
  writeFileSync(`${file}.br`, br)
  writeFileSync(`${file}.gz`, gzipSync(source, { level: 9 }))
  original += source.length
  brotli += br.length
}
console.log(`Precompresión: ${(original / 1024).toFixed(1)} KB → ${(brotli / 1024).toFixed(1)} KB con Brotli`)
