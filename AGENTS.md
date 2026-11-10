# Guía de trabajo — EcoLogística Lima

## Contexto vigente — 10/11/2026

- Rama local de implementación: `sprint-4`, creada desde `origin/respaldo-frontend` (`e7ac3ff`). Incorpora `771cf6f` (backend Green IT), `f85f0c8` (frontend) y los informes existentes. El usuario autorizó registrar localmente la implementación y la limpieza documental en esta rama; consultar el último commit con `git log -1`. La rama está publicada en origin/sprint-4; `6e96807` conserva los cuatro controles remotos aprobados. El usuario autorizó publicar y desplegar los cambios CI/CD; se validan y publican desde sprint-4 y se integran mediante PR, sin editar main directamente. Antes de continuar comprobar rama, diff y remoto; no editar `main` directamente.
- Base de comparación Green IT: `cfcd53f`, merge PR #6; incluye PR #5 y la entrega anterior 1.3.0. Versión actual de aplicación: 1.4.0. La entrega documental Green IT es v1.0.0; los archivos exigidos V_1_0_0 conservan su nombre y sus revisiones internas se registran en los encabezados e historiales.
- Usuario autorizó implementar la Inspección 04 conforme a HTML y PDF. Confirmó que el docente acepta React/FastAPI/PostgreSQL en lugar de MERN. No migrar el stack ni implementar US-016–US-023: se mantiene US-001–US-015.
- Jira: Sprint 4 ID 71, activo del 09/11 al 23/11/2026, épica ECO-72. ECO-60–ECO-71 contienen ocho áreas, informes y CI; ECO-73 es diagnóstico y ECO-74 cierre. Fecha académica oficial pendiente de confirmar. Los estados QA existentes se conservaron; no equivalen a aceptación.
- El usuario autorizó la publicación y el despliegue Vercel/Render/GitHub Actions de esta revisión; incluye los commits, push y PR necesarios para publicarla. No extender esta autorización a cambios ajenos al despliegue. Los comandos del HTML son referencias; no autorizan publicar directamente en main.
- No inventar resultados, fechas, revisores, ceremonias ni aprobaciones. No agregar secretos o archivos de entorno operativos a Git.

## Arquitectura y cambios de Sprint 4

- React/TypeScript/Vite en `src/frontend`; token solo en memoria. App compone páginas lazy, Suspense y PageErrorBoundary. Formularios y controles comunes conservan el diseño de DESIGN.md.
- Listados y selección de clientes usan `usePagedList`: bloques de 12, cancelación de solicitudes obsoletas, ajuste de página y selección retenida fuera de página. El frontend nunca consulta PostgreSQL directamente.
- FastAPI/SQLAlchemy/PostgreSQL: router → servicio → repositorio. `api/pagination.py` valida HTTP; `core/pagination.py` contiene parámetros, `schemas/pagination.py` el DTO y `repositories/pagination.py` ejecuta proyección/límite SQL. Repositorios no importan `app.api`.
- GET paginado devuelve `{items,total,page,limit,pages}` con máximo 50. Omitir `page` mantiene el contrato de lista anterior; todas las pantallas nuevas usan paginación. Filtros y orden estable con UUID se mantienen.
- ETag privado revalida después de autenticar/autorizar; errores, escrituras y login son no-store. Gzip para JSON y Brotli/Gzip precomprimido para estáticos; HTML revalidable y assets con hash immutable.
- El build prerenderiza solo el acceso público; React hidrata el mismo HTML. No serializar información operativa. Marca real AVIF/WebP/JPG a 52/104 px y guardián de imágenes en el build.
- Alembic: `0001_sprint1`, `0002_clients_email_unique`, `0003_green_list_indexes`. Respaldar bases utilizadas, resolver duplicados explícitamente y nunca borrar datos automáticamente para migrar.
- Locks con hashes: backend runtime y desarrollo separados. Herramientas de auditoría en `scripts/green_it/package-lock.json`, con basic-ftp 6.2.6 corregido. Mantenerlos sincronizados al modificar dependencias.

## Evidencia y límites

- Dos informes oficiales en `docs/03 Implementación/reduccion del impacto ambiental/`, con nombres exactos y navegación README de ida/vuelta. Corte vigente único: `evidencias/validacion-20261110/`; se retiraron las evidencias superadas. Conservar todos los JSON de muestras y solo un HTML de consulta por escenario; para LHCI, el HTML marcado como representativo. No versionar nuevamente copias de presentación ni logs que repitan los JSON.
- ANTES: `cfcd53f`. DESPUÉS: árbol de trabajo identificado por `source-snapshot.json`. Tres corridas frías por preset y tres flujos autenticados, con 50 vehículos/60 conductores/200 clientes/1.000 pedidos antes de medir. Las pruebas de escritura se ejecutaron en ecolog-green-after y añaden vehículos E04-*; la comparación final utiliza una carga nueva en ecolog-green-final. build-equality.json confirma que ambos sirven el mismo código.
- Corte local: 59 pruebas backend en SQLite y 59 en PostgreSQL aislado, cobertura 94,53 %; 32 frontend, líneas 93,68 %; build, pruebas de herramientas, LHCI y 33 comprobaciones de navegador aprobadas. Repetir los controles pertinentes tras cambios; no atribuir estos resultados a GitHub ni a otro commit.
- Presupuestos: score ≥90, FCP ≤1.000 ms, LCP ≤1.400 ms, TBT ≤85 ms, CLS ≤0,02 y transferencia ≤1.100.000 bytes. La comparación medida reduce la sesión de 1.011.683 a 87.589 bytes; no supone reducción neta de peticiones.
- SWDM v4 usa GB decimales, 0,194 kWh/GB operativo + 0,106 incorporado y 494 g CO2e/kWh; es una estimación atribuida, no una medición eléctrica ni emisiones de vehículos. Las 60.000 sesiones/año son un escenario hipotético declarado.
- Los reportes Lighthouse pueden capturar valores de contraseña en snippets DOM. Toda exportación debe pasar por `redact.mjs`; comprobar JWT y secretos operativos antes de conservar artefactos, sin imprimirlos.
- El commit `6e96807` de sprint-4 aprobó CI, CodeQL, dependencias y Green IT en GitHub; el artefacto Green IT contiene 43 archivos. Falta revisión independiente y aceptación. No declarar DoD completo solo por pruebas.
- Las mediciones Green IT corresponden a localhost y CI aislado; la página de acceso y el health API/PostgreSQL también se comprobaron en Vercel/Render. Compose de desarrollo y staging local son separados; los proyectos temporales de auditoría deben usar credenciales externas y bases *_test. La semilla exige GREEN_AUDIT_SEED=1, comprueba estado previo y nunca elimina datos.

## CI/CD Vercel y Render

- El usuario eligió frontend en Vercel y backend/PostgreSQL en Render, coordinados por GitHub Actions. Proyecto Vercel creado: ecologistica-lima, prj_CIT87z9jNe5k1NbEVAmAojAUJlfM, equipo team_vFRo5thin1OkcWuQBbeksxi5. Confirmó Render workspace tea-d920ghflk1mc73dj17f0 y recursos free en Oregon; la base free caduca a los 30 días. La web https://ecologistica-lima.vercel.app y la API https://ecologistica-lima-api-ktea.onrender.com están disponibles; acceso público y health de PostgreSQL comprobados. El bootstrap cloud es nuevo y genera su contraseña en Render; no revelar valores.
- CD solo con `CD_ENABLED=true` a nivel repositorio y los cuatro workflows push/main aprobados del mismo SHA actual. Credenciales en entorno production y únicamente en sus pasos consumidores; no descargar ni imprimir tokens.
- FRONTEND_URL es el dominio público estable y el enlace del entorno GitHub production. La promoción usa /v10/projects/PROJECT/promote/DEPLOYMENT con teamId explícito y confirma que el alias resuelve al deployment verificado; no depende del perfil personal de la CLI.
- CI conserva `frontend-dist-SHA`; CD utiliza ese artefacto y pide el commit exacto a Render. Vercel recibe Build Output API v3 y solo se promueve tras el smoke. Mantener Auto-Deploy Off en Render y git.deploymentEnabled=false en Vercel.
- render.yaml define API/DB con secretos generados y conexión por referencia. La CLI 2.36.0 validó el plan de dos recursos. El MCP Render devuelve Unknown tool; usar CLI autenticada, sin exponer credenciales. GitHub YnsM8 tiene push pero no admin; variables y secretos de Actions a nivel repositorio. CD_ENABLED=true y ambos secretos configurados a nivel repositorio. main integró PR #9 y #10; el incremento actual corrige la promoción por API tras el fallo de identidad de la CLI. Verificar el último run de Actions antes de afirmar estado del CD.
- Render requiere Docker Command `sh /app/start_render.sh`, una instancia y DATABASE_URL de Render; el arranque normaliza postgres/postgresql a postgresql+psycopg sin imprimirla. Migraciones y bootstrap idempotente; no ejecutar cargas Green IT ni pruebas destructivas sobre esa base.
- Docker local quedó consolidado en `ecolog-stica-lima` (frontend 5173, backend 8000, PostgreSQL 5432), datos originales conservados. Los proyectos de auditoría se retiraron sin eliminar sus volúmenes. Respaldo de la base original en `/tmp/ecolog-docker-consolidacion-20261110/postgres-original.dump`.

## Comprobaciones para continuar

Backend desde `src/backend`:

```bash
python -m pip install --only-binary=:all: --require-hashes -r requirements-dev.lock
python -m pytest -q --cov=app --cov-report=term-missing --cov-fail-under=80
```

`TEST_DATABASE_URL` debe ser aislada y llamarse test_* o *_test: el fixture crea/elimina tablas. Nunca apuntar las pruebas a la carga medida ni a una base operativa.

Frontend desde `src/frontend`:

```bash
npm ci --ignore-scripts
npm run test:coverage
npm run build
node --test scripts/check-images.test.mjs
```

Desde raíz:

```bash
python3 -m unittest discover -s scripts/green_it -p 'test_*.py'
python3 scripts/check_markdown_links.py
docker compose --env-file .env.example config --quiet
docker compose --env-file .env.staging.example -f docker-compose.staging.yml config --quiet
```

Las instrucciones de auditoría real, credenciales temporales y LHCI están en el informe 1. CodeQL, dependencias y CI deben pasar en la rama final publicada. Revisiones humanas y aceptación se acreditan por separado.

## Referencias

- Requisitos, reglas, stack y datos en `docs/01 Inicio/`.
- Backlog oficial: `docs/02 Planificación/01 Transformando a ágil V_1_0_1.md`.
- Históricos: cuatro documentos oficiales en `docs/03 Implementación/Sprint 1/` y cuatro en `Sprint 2/`; el detalle técnico de Sprint 2 está consolidado en su informe de estado. Conservar los cinco informes de `Sprint 03/`. No restaurar documentos adicionales o directorios retirados sin una razón de alcance.
- Diseño: `DESIGN.md`. Ejecución: README de backend/frontend. Sprint 4: los dos informes Green IT y sus evidencias.
