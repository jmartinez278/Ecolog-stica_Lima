[← Volver al README principal](../../../README.md)

# Revisión del sprint

**Nombre del Proyecto:** EcoLogística Lima — Optimizador de rutas sostenibles para DistriRápido S.A.C.

**Líder del Proyecto:** Martinez Llanos, Marco Jhair

| Campo | Detalle |
|---|---|
| Sprint | Sprint 4 — Implementación, calidad, despliegue y cierre (Jira: Sprint ID 71, épicas EP-07 y EP-08) |
| Periodo programado en Jira | 09/11/2026 – 23/11/2026 |
| Incremento revisado | Aplicación 1.5.0, rama `sprint-4` (commits `d67ba70` y posteriores) sobre `main` `c5c1b6a` |
| Entornos | Producción: [ecologistica-lima.vercel.app](https://ecologistica-lima.vercel.app) (frontend, Vercel) y [API en Render](https://ecologistica-lima-api-ktea.onrender.com/docs) con PostgreSQL 16 |
| Versión del documento | V_1_0_0 · 17/11/2026 |

## Historias de Usuario completadas en este Sprint

El Sprint 4 no añade historias funcionales nuevas: el alcance del MVP se mantiene en US-001 a US-015 (vehículos, pedidos, conductores y clientes) y US-016 a US-023 continúan en el backlog. El trabajo del Sprint se registró en Jira como elementos técnicos de las épicas **EP-07 (Inspección 04 — Green IT)** y **EP-08 (cierre del Sprint 4)**. Un elemento figura aquí como completado cuando sus criterios técnicos se verificaron con evidencia reproducible; el estado de Jira se informa tal como está, porque la aceptación formal es una decisión del Product Owner en la revisión.

### EP-07 — Inspección 04: reducción del impacto ambiental

| Código | Título | Criterios de aceptación verificados | Cierre (PR / commit) | Estado en Jira (17/11) |
|---|---|---|---|---|
| ECO-60 | Green IT 1 – Consultas con proyección de columnas e índices compuestos | Los listados proyectan solo las columnas del DTO; migración `0003_green_list_indexes` crea índices compuestos; 59 pruebas backend aprobadas en SQLite y PostgreSQL | [PR #7](https://github.com/jmartinez278/Ecolog-stica_Lima/pull/7) · [`771cf6f`](https://github.com/jmartinez278/Ecolog-stica_Lima/commit/771cf6f) | Finalizada |
| ECO-61 | Green IT 2 – Paginación de 12 registros en la API | `GET` paginado devuelve `{items,total,page,limit,pages}`, máximo 50, y conserva el contrato sin `page` | [PR #7](https://github.com/jmartinez278/Ecolog-stica_Lima/pull/7) · [`771cf6f`](https://github.com/jmartinez278/Ecolog-stica_Lima/commit/771cf6f) | Finalizada |
| ECO-62 | Green IT 2 – Paginación de 12 registros en los listados React | `usePagedList` pide bloques de 12, cancela solicitudes obsoletas y mantiene la selección fuera de página; cubierto por E2E (`goToLastPage`) | [PR #7](https://github.com/jmartinez278/Ecolog-stica_Lima/pull/7) · [`f85f0c8`](https://github.com/jmartinez278/Ecolog-stica_Lima/commit/f85f0c8) | Finalizada |
| ECO-63 | Green IT 3 – Imágenes AVIF/WebP con `<picture>` y guardián de build | Logotipo en AVIF/WebP/JPG a 52/104 px; `check-images.mjs` rompe el build si aparece una imagen sin variantes | [PR #7](https://github.com/jmartinez278/Ecolog-stica_Lima/pull/7) · [`f85f0c8`](https://github.com/jmartinez278/Ecolog-stica_Lima/commit/f85f0c8) | In Review / QA |
| ECO-64 | Green IT 4 – Code splitting con `React.lazy` y `Suspense` | Solo el acceso viaja en el bundle inicial; cada módulo se descarga al abrirse | [PR #7](https://github.com/jmartinez278/Ecolog-stica_Lima/pull/7) · [`f85f0c8`](https://github.com/jmartinez278/Ecolog-stica_Lima/commit/f85f0c8) | In Review / QA |
| ECO-65 | Green IT 5 – Depuración de dependencias | Locks con hashes separados para runtime y desarrollo; auditorías `pip-audit` y `npm audit` en CI | [PR #7](https://github.com/jmartinez278/Ecolog-stica_Lima/pull/7) · [`2ca8a69`](https://github.com/jmartinez278/Ecolog-stica_Lima/commit/2ca8a69) | Finalizada |
| ECO-66 | Green IT 6 – Reducción de peticiones HTTP (SVG inline) | El ícono SVG inline evita la petición a `/favicon.ico`; el informe no afirma una reducción neta de peticiones del recorrido (pasa de 7 a 13 por los chunks bajo demanda, con muchos menos bytes) | [PR #7](https://github.com/jmartinez278/Ecolog-stica_Lima/pull/7) · [`f85f0c8`](https://github.com/jmartinez278/Ecolog-stica_Lima/commit/f85f0c8) | In Review / QA |
| ECO-67 | Green IT 7 – Caché ETag/304, `Cache-Control` immutable y revalidación | ETag privado después de autorizar; errores y escrituras `no-store` (verificado también por E2E: 401 con `no-store`) | [PR #7](https://github.com/jmartinez278/Ecolog-stica_Lima/pull/7) · [`771cf6f`](https://github.com/jmartinez278/Ecolog-stica_Lima/commit/771cf6f) | In Review / QA |
| ECO-68 | Green IT 8 – Compresión GZip y Brotli precomprimido | JSON con GZip; estáticos `.br`/`.gz` precomprimidos (270,2 KB → 74,2 KB) | [PR #7](https://github.com/jmartinez278/Ecolog-stica_Lima/pull/7) · [`771cf6f`](https://github.com/jmartinez278/Ecolog-stica_Lima/commit/771cf6f) | In Review / QA |
| ECO-69 | Informe de reducción del impacto ambiental (SWDM v4) | Sesión medida de 1.011.683 a 87.589 bytes (−91,34 %); Lighthouse 100 móvil y escritorio | [PR #7](https://github.com/jmartinez278/Ecolog-stica_Lima/pull/7) · [`e7ac3ff`](https://github.com/jmartinez278/Ecolog-stica_Lima/commit/e7ac3ff) · [PR #12](https://github.com/jmartinez278/Ecolog-stica_Lima/pull/12) | In Review / QA |
| ECO-70 | Estándares de ingeniería de software y guía de desarrollo verde | Documento V_1_0_0 publicado y enlazado desde el README | [PR #7](https://github.com/jmartinez278/Ecolog-stica_Lima/pull/7) · [`e7ac3ff`](https://github.com/jmartinez278/Ecolog-stica_Lima/commit/e7ac3ff) | In Review / QA |
| ECO-71 | Pipeline `green-audit.yml` con Lighthouse CI | Aserciones de presupuesto (score ≥ 90, FCP ≤ 1.000 ms, LCP ≤ 1.400 ms, TBT ≤ 85 ms, CLS ≤ 0,02) en verde en `main` `c5c1b6a` | [PR #7](https://github.com/jmartinez278/Ecolog-stica_Lima/pull/7) · [PR #9](https://github.com/jmartinez278/Ecolog-stica_Lima/pull/9) | In Review / QA |
| ECO-73 | Inspección 04 – Diagnóstico ANTES y protocolo de medición | Línea base `cfcd53f` con tres corridas frías por preset | [`2ca8a69`](https://github.com/jmartinez278/Ecolog-stica_Lima/commit/2ca8a69) | Finalizada |
| ECO-74 | Inspección 04 – Rúbrica y entrega de los dos informes | Dos informes con navegación de ida y vuelta desde el README | [PR #12](https://github.com/jmartinez278/Ecolog-stica_Lima/pull/12) | Finalizada |

### EP-08 — Cierre del Sprint 4

| Código | Título | Criterios de aceptación verificados | Cierre (PR / commit) | Estado en Jira (17/11) |
|---|---|---|---|---|
| ECO-79 | Implementar pruebas E2E con Playwright | Suite de 20 casos × 3 navegadores; 40/40 aprobadas en Chromium y WebKit locales; ejecución en Chromium, Firefox y WebKit en `tests.yml` (ver [03 Análisis Playwright](<03 Analisis PlayWrigth V_1_0_0.md>)) | [`d67ba70`](https://github.com/jmartinez278/Ecolog-stica_Lima/commit/d67ba70) | Tareas por hacer |
| ECO-80 | Monitorear rendimiento y disponibilidad | TTFB/FCP/LCP y tiempos de API medidos con Playwright; 10 sondeos por destino en producción con 100 % de respuestas esperadas; monitoreo programado cada 6 horas | [`d67ba70`](https://github.com/jmartinez278/Ecolog-stica_Lima/commit/d67ba70) | Tareas por hacer |
| ECO-81 | Evaluar usabilidad mediante escala SUS | Instrumento, tareas y cálculo preparados; formulario de recolección publicado (ver [04 Usabilidad](<04 Usabilidad V_1_0_0.md>)) | Este Sprint | Tareas por hacer |
| ECO-82 | Configurar y validar CI/CD con GitHub Actions | `ci.yml`, `tests.yml` y `deploy-production.yml` en `.github/workflows/`; credenciales solo en GitHub Secrets | [`d67ba70`](https://github.com/jmartinez278/Ecolog-stica_Lima/commit/d67ba70) · [`3beb525`](https://github.com/jmartinez278/Ecolog-stica_Lima/commit/3beb525) | Tareas por hacer |
| ECO-83 | Verificar arquitectura y control de versiones | Separación `src/frontend` / `src/backend`; `.gitignore` amplía Playwright y auditorías; CI rechaza archivos residuales (`*~`, `node_modules`, `.env`); stack actualizado a V_1_1_0 | [`d67ba70`](https://github.com/jmartinez278/Ecolog-stica_Lima/commit/d67ba70) | Tareas por hacer |
| ECO-84 | Verificar trazabilidad y preparar entrega final | README con índice del Sprint 4, badges de workflows y enlaces de vuelta en los cuatro documentos; `check_markdown_links.py` sin enlaces rotos | Este Sprint | Tareas por hacer |
| ECO-77 / ECO-78 | Revisión y retrospectiva del Sprint 4 | Este documento y la [retrospectiva](<02 Retrospectiva del Sprint V_1_0_0.md>) | Este Sprint | Tareas por hacer |

**Corrección detectada durante el Sprint.** La suite E2E encontró que la versión 1.4.0 en producción mostraba mensajes técnicos del navegador ante una caída de red (`Failed to fetch`, `Load failed`) y solo `Error 503` cuando el backend no está disponible. El cliente HTTP (`src/frontend/src/api.ts`) ahora entrega mensajes comprensibles e iguales en los tres navegadores, con ocho casos de prueba unitarios nuevos.

## Demostración del trabajo completado

La demostración a los stakeholders está **programada para la Sprint Review del cierre del Sprint (fecha límite en Jira: 23/11/2026)**. Este apartado es la agenda y el guion preparados; las observaciones y la decisión de aceptación se registrarán después de la sesión, sin anticiparlas.

**Participantes convocados:** Product Owner y representante de DistriRápido S.A.C. (operación logística), docente de Taller de Proyectos 2 y el equipo de desarrollo (Luis Antony Gonzalo Guerrero, Jhon Robert Paitan Montes, Marco Jhair Martinez Llanos, Piero Pool Chauris Leguia y Rodrigo Vladimir Arce Curi).

**Entorno:** producción real — frontend en Vercel y API/PostgreSQL en Render. Antes de la sesión se despierta la API, porque el plan gratuito de Render la suspende por inactividad (arranque en frío medido: 37,6 s).

| Bloque | Qué se muestra | Evidencia que respalda el bloque |
|---|---|---|
| 1. Recorrido operativo | Acceso, registro y edición de un vehículo, registro de cliente, pedido con ventana de entrega y cancelación | Mismos pasos que automatizan `vehicles.spec.ts` y `orders.spec.ts` |
| 2. Resiliencia | Mensaje claro ante pérdida de conexión y ante backend no disponible (503) | `availability.spec.ts`; [reporte de producción antes de la corrección](evidencias/produccion-antes-20261117/reporte-html-produccion.png) |
| 3. Calidad automatizada | Reporte HTML de Playwright en tres navegadores y métricas TTFB/FCP/LCP | [Reporte local](evidencias/local-20261117/reporte-html-local.png) y artifacts `playwright-report-*` de `tests.yml` |
| 4. CI/CD | Un push a `main` ejecuta `ci.yml` y `tests.yml`; `deploy-production.yml` despliega Render, verifica y promueve Vercel, y repite las pruebas `@public` sobre producción | Pestaña Actions del repositorio |
| 5. Green IT | Sesión de 1.011.683 → 87.589 bytes y Lighthouse 100 | [Informe de impacto ambiental](<../../03 Implementación/reduccion del impacto ambiental/01 Informe de reduccion del impacto ambiental V_1_0_0.md>) |
| 6. Usabilidad | Resultado SUS de los participantes | [04 Usabilidad](<04 Usabilidad V_1_0_0.md>) |

**Preguntas que se llevarán a los stakeholders:** ¿el flujo de pedidos con ventana horaria refleja el trabajo diario?, ¿qué mensaje esperan ver cuando el sistema no responde?, y ¿qué historia del backlog (US-016 a US-023, rutas y mapa) priorizan para la siguiente versión?

## Pendientes

| Pendiente | Justificación | Tratamiento |
|---|---|---|
| Realizar la demostración y registrar asistentes, retroalimentación y decisión de aceptación | La sesión está agendada para el cierre del Sprint | Actualizar este documento como V_1_1_0 con el acta de la sesión |
| Mover en Jira ECO-63, 64, 66–71 de *In Review / QA* y ECO-77–84 de *Tareas por hacer* | Requiere la revisión del Product Owner; un estado QA no equivale a aceptación | Conciliar el tablero durante la Review |
| Completar la muestra SUS (n ≥ 5) | Las respuestas deben provenir de usuarios reales | Formulario publicado; cálculo automatizado en el informe 04 |
| Integrar `sprint-4` en `main` | El equipo revisará el PR antes de fusionar | Al fusionar, `deploy-production.yml` publica la versión 1.5.0 |
| Arranque en frío de Render (37,6 s) y p95 de API vía proxy de 821–831 ms en producción | Plan gratuito con suspensión por inactividad; latencia Vercel → Render (Oregon) | Deuda técnica: plan con instancia siempre activa o región más cercana antes de operar con usuarios reales |
| Base PostgreSQL gratuita de Render caduca el 10/12/2026 | Limitación del plan | Respaldar y migrar a un plan persistente antes de esa fecha |
| Vulnerabilidad GHSA-fc5q-39xc-vjpf (`picomatch`) sin parche | Afecta solo herramientas de build y lint | Excepción con fecha de revisión 15/12/2026 en `.github/npm-audit-exceptions.json` |
| US-016 a US-023 (optimización de rutas, mapa, indicadores) | Fuera del alcance acordado del MVP actual | Permanecen en el backlog priorizado |

[← Volver al README principal](../../../README.md)
