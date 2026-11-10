import { readFile, writeFile } from 'node:fs/promises'
import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { createServer } from 'vite'

// Solo el acceso público, sin usuarios, tokens, datos operativos ni servidor SSR.
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', optimizeDeps: { noDiscovery: true, include: [] } })
try {
  const { App } = await server.ssrLoadModule('/src/App.tsx')
  const markup = renderToString(createElement(App))
  const file = new URL('../dist/index.html', import.meta.url)
  const html = await readFile(file, 'utf8')
  if (!html.includes('<div id="root"></div>')) throw new Error('Falta el punto de prerenderizado')
  await writeFile(file, html.replace('<div id="root"></div>', `<div id="root">${markup}</div>`))
} finally {
  await server.close()
}
