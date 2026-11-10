// Green IT (Inspección 04): guardián de imágenes. Falla el build si una imagen ráster
// supera 200 KB o si un JPG/PNG no tiene sus variantes AVIF y WebP.
import { existsSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const ROOTS = ['src', 'public'].map(dir => new URL(`../${dir}/`, import.meta.url).pathname).filter(existsSync)
const RASTER = /\.(png|jpe?g|gif|webp|avif)$/i
const LIMIT = 200 * 1024
const walk = dir => readdirSync(dir).flatMap(name => {
  const path = join(dir, name)
  return statSync(path).isDirectory() ? walk(path) : [path]
})

const problems = []
const images = ROOTS.flatMap(walk).filter(path => RASTER.test(path))
for (const file of images) {
  if (statSync(file).size > LIMIT) problems.push(`${file}: supera 200 KB`)
  if (/\.(png|jpe?g)$/i.test(file)) {
    const base = file.replace(/\.(png|jpe?g)$/i, '')
    for (const ext of ['avif', 'webp']) if (!existsSync(`${base}.${ext}`)) problems.push(`${file}: falta ${ext.toUpperCase()}`)
  }
}
if (problems.length) {
  console.error('Imágenes que incumplen la guía de desarrollo verde:\n' + problems.join('\n'))
  process.exit(1)
}
console.log(`Imágenes verificadas: ${images.length} archivo(s) ráster, todos dentro de la guía.`)
