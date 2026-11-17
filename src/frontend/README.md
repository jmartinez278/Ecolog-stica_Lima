# Frontend — Sprint 4, versión 1.5.0

Interfaz React, TypeScript y Vite para login, vehículos, pedidos, conductores y clientes. El Sprint 2 añade actualización y desactivación de conductores, además de registro, consulta y actualización de clientes y condiciones de entrega. El token se mantiene solo en memoria; al recargar la página se solicita ingresar nuevamente.

Desde `src/frontend`, ejecutar `npm ci`, `npm run dev`, `npm test` y `npm run build`. El servidor Vite envía `/api` al backend configurado mediante `VITE_API_PROXY_TARGET` (por defecto `http://localhost:8000`; Compose usa `http://backend:8000`). La interfaz local está en `http://localhost:5173`.

## Estructura de módulos

- `src/App.tsx`: punto de composición, estado de sesión y selección de vista.
- `src/pages/`: acceso, inicio, vehículos, pedidos, conductores y clientes.
- `src/forms/`: formularios tipados reutilizables de cada recurso.
- `src/components/layout/`: cabecera y navegación principal.
- `src/components/common/`: campos, notificaciones y encabezados de módulos.
- `src/styles/`: estructura, controles, formularios y media queries; `src/style.css` contiene las reglas globales.

Las pruebas se ejecutan con `npm test` y la compilación con `npm run build`. La navegación incluye un salto al contenido mediante teclado y respeta la preferencia de movimiento reducido. Las funciones de rutas, mapas e indicadores aún pertenecen a las historias futuras.

El Sprint 4 incorpora páginas de 12 registros con cancelación de peticiones obsoletas, selección de clientes paginada, importaciones dinámicas con recuperación de errores y marca adaptativa AVIF/WebP/JPG. El token sigue en memoria y los datos se revalidan por HTTP; las escrituras usan `no-store`.

El build valida imágenes, compila TypeScript/Vite, prerenderiza únicamente el acceso público y genera `.br`/`.gz`. No incluye tokens ni datos operativos en HTML. React hidrata los mismos controles al cargar. `node --test scripts/check-images.test.mjs` comprueba el rechazo de imágenes inválidas; `npm run test:coverage` verifica los componentes. El [informe Green IT](<../../docs/03 Implementación/reduccion del impacto ambiental/01 Informe de reduccion del impacto ambiental V_1_0_0.md>) describe la auditoría de producción; Vite en 5173 es para desarrollo.

## Pruebas E2E con Playwright

La suite está en `e2e/` y la configuración en `playwright.config.ts` (Chromium, Firefox y WebKit). Por defecto levanta la API real (`../../scripts/e2e_backend.py`) sobre una base de prueba `test_*` y sirve el build de producción con `vite preview` en el puerto 4173.

```bash
npm run lint                       # ESLint + tipos de la suite E2E
npx playwright install             # navegadores (una vez)
E2E_PYTHON=../../.venv/Scripts/python.exe npm run e2e   # suite completa local
npm run e2e:report                 # abrir el reporte HTML
E2E_BASE_URL=https://ecologistica-lima.vercel.app E2E_API_URL=https://ecologistica-lima-api-ktea.onrender.com npm run e2e:prod
```

`E2E_SKIP_BUILD=1` reutiliza un `dist/` existente. `npm run e2e:metrics` resume TTFB, FCP, LCP, tiempos de API y disponibilidad desde `test-results/metrics/`. Las pruebas etiquetadas `@public` son de solo lectura y son las únicas que se ejecutan contra producción. El análisis completo está en [03 Análisis Playwright](<../../docs/03 Inplementación/Sprint 4/03 Analisis PlayWrigth V_1_0_0.md>).
