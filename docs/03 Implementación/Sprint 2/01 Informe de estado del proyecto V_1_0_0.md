[← Volver al README principal](<../../../README.md>)

# Informe de estado del proyecto — Sprint 2

**Nombre del Proyecto:** EcoLogística Lima – Optimizador de Rutas Sostenibles para DistriRápido S.A.C.

**Líder del Proyecto:** Marco Jhair Martinez Llanos (según el acta de constitución)

**Sprint:** ECO Sprint 2 · **Fecha de corte:** 06/10/2026 (Lima) · **Versión interna del documento:** 1.0.3

El nombre del archivo conserva `V_1_0_0` porque la consigna exige ese nombre exacto; las revisiones se identifican en este encabezado y en el historial.

## Estado general

El incremento técnico de US-011 a US-015 está publicado en la rama `sprint-2` (commit `53642da`) y fue integrado a `main` mediante el PR #1 (`51b8c59`). Amplía la gestión de conductores y clientes sin retirar las operaciones del Sprint 1. La entrega formal continúa **en proceso**: las cinco historias pasaron de `To Do` a `In Review / QA` en Jira el 06/10/2026; el Sprint 2 aún figura como `future`. **El único criterio para declarar una historia terminada es cumplir todos los puntos aplicables del [Definition of Done](<../../02 Planificación/01 Transformando a ágil V_1_0_1.md>).** Los escenarios BDD se comprueban dentro de DoD-10; un commit, un merge o una demostración por sí solos no cierran una historia.

## Historias de Usuario completadas en este Sprint

**Acreditadas como `Done` según el DoD: ninguna al corte.** Hay implementación funcional para las cinco historias; la evidencia incompleta se detalla sin usar otra definición de terminado.

| Historia / Jira | Alcance verificable en el código | Estado de aceptación |
|---|---|---|
| US-011 / [ECO-17](https://jhonpaitanrcm.atlassian.net/browse/ECO-17) | Actualizar conductor y disponibilidad; rechazar datos inválidos, licencia duplicada e inactivos. | Implementada; `In Review / QA` y DoD pendiente. |
| US-012 / [ECO-18](https://jhonpaitanrcm.atlassian.net/browse/ECO-18) | Desactivación lógica; respuesta 404 para ID inexistente y rechazo de conductor asignado. | Implementada; `In Review / QA` y DoD pendiente. |
| US-013 / [ECO-19](https://jhonpaitanrcm.atlassian.net/browse/ECO-19) | Alta de cliente con preferencias y restricciones; validación de nombre y correo. | Implementada; `In Review / QA` y DoD pendiente. |
| US-014 / [ECO-20](https://jhonpaitanrcm.atlassian.net/browse/ECO-20) | Lista, filtro de activos y ficha de cliente; 404 si no existe. | Implementada; `In Review / QA` y DoD pendiente. |
| US-015 / [ECO-21](https://jhonpaitanrcm.atlassian.net/browse/ECO-21) | Actualización de datos y condiciones de entrega; rechazo de correo inválido o duplicado. | Implementada; `In Review / QA` y DoD pendiente. |

La [planificación](<../../02 Planificación/01 Transformando a ágil V_1_0_1.md>) define los escenarios oficiales de estas historias. El código incorpora rutas, servicios, repositorios, esquemas y formularios; los pedidos mantienen la regla del Sprint 1 de exigir un cliente activo. El Sprint 2 no incorpora optimización, mapas, emisiones ni reportes.

## Evidencia técnica y límites

| Comprobación al corte | Resultado | Alcance |
|---|---|---|
| `git diff 02e8f05...origin/sprint-2` | Cambios de US-011 a US-015 en backend, frontend y pruebas; sin cambios en `docs/03 Implementación/` antes de esta actualización documental. | Comparación de commits. |
| `python -m pytest -q --cov=app --cov-report=term --cov-fail-under=80` | 14 pruebas aprobadas y **92,41 %** de cobertura total tanto sobre SQLite como sobre PostgreSQL aislado. | Base PostgreSQL temporal creada solo para la suite y eliminada al terminar. Los módulos nuevos de conductores y clientes alcanzaron 96–100 %. |
| Vitest, build y Compose | 5 pruebas frontend aprobadas; `npm run build` completado; servicios PostgreSQL, backend y frontend activos. | Ejecutados dentro de contenedores el 06/10/2026. `docker compose config --quiet` pasó. |
| `localhost` | `/health`, `/openapi.json` y frontend respondieron 200; login bootstrap 200; las cuatro listas autenticadas y el proxy Vite respondieron 200; petición sin token 401. | Comprobación HTTP de lectura; las mutaciones se verificaron en la base de prueba aislada. |
| Jira `ECO board`, sprint ID 37 | 5 historias, 0 `Done`, 5 `In Review / QA`, 5 sin responsable; sprint `future`. Sprint Goal registrado. | Estado comprobado tras las transiciones del 06/10/2026. [Detalle y fuentes](<../../02 Planificación/Anexos/Seguimiento Jira Sprint 2 V_1_0_3.md>). |

El PR #1 acredita la integración en `main`; no se verificó una aprobación de revisión por pares ni un pipeline satisfactorio. Tampoco constan en esta revisión análisis estático, staging, aceptación BDD por interesados, compatibilidad entre navegadores o evaluación WCAG.

## Detalle técnico para reproducir y revisar el incremento

| Historia | Contrato HTTP | Implementación | Prueba concreta |
|---|---|---|---|
| US-011 | `PUT /api/v1/conductores/{id}` | `api/drivers.py` → `services/drivers.py` → `repositories/drivers.py`; `DriverInput` valida datos y el servicio rechaza licencia duplicada e inactivos. | `test_driver_update_and_deactivation`, `test_driver_update_rejections_preserve_state` |
| US-012 | `PATCH /api/v1/conductores/{id}/desactivar` | Desactivación lógica a `INACTIVO`; rechazo de ID ausente, estado inactivo o `ASIGNADO`. | Las mismas pruebas de actualización y desactivación de `test_drivers.py`. |
| US-013 | `POST /api/v1/clientes` | `api/clients.py` → `services/clients.py` → `repositories/clients.py`; `ClientInput` valida nombre y formato de correo; el servicio comprueba duplicado. | `test_client_registration_query_and_update`, `test_client_rejections_and_filters` |
| US-014 | `GET /api/v1/clientes`, `GET /api/v1/clientes/{id}` | Consulta ordenada y filtro `activo`; ficha inexistente devuelve 404. | `test_client_registration_query_and_update`, `test_client_rejections_and_filters` |
| US-015 | `PUT /api/v1/clientes/{id}` | Actualiza contacto, preferencias, restricciones y estado; rechaza correo inválido o duplicado. | `test_client_registration_query_and_update`, `test_client_rejections_and_filters` |

Las rutas usan permisos de lectura o escritura mediante dependencias de FastAPI; las mutaciones pasan por `commit_change`, que persiste entidad y auditoría en una transacción. Los modelos SQLAlchemy `conductores` y `clientes` ya existían en la base del Sprint 1: este incremento no añadió una migración. Los pedidos conservan la comprobación de `cliente_id` activo. Los archivos citados se encuentran bajo `src/backend/app/` y `src/backend/tests/`; las acciones de la interfaz están en `src/frontend/src/App.tsx` y el cliente HTTP en `src/frontend/src/api.ts`. La API documenta sus rutas en `/docs` y `/openapi.json`. Para repetir la suite: desde `src/backend`, ejecutar `python -m pytest -q --cov=app --cov-report=term --cov-fail-under=80`; usar una base de prueba aislada si se configura `TEST_DATABASE_URL` para PostgreSQL.

### Alcance funcional y trazabilidad técnica consolidados

El Sprint 2 comprometió **15 Story Points**: US-011 (3), US-012 (2), US-013 (5), US-014 (2) y US-015 (3). El objetivo fue completar la gestión de conductores y clientes para futuras planificaciones; estos valores corresponden al registro histórico del 06/10/2026 y no a una reestimación actual.

- **Conductores:** actualizar nombres, apellidos, licencia, categoría, teléfono, experiencia y disponibilidad; conservar la licencia del propio registro sin detectarla como duplicada. La desactivación se realiza por la acción específica, con rechazo de conductores asignados, inactivos y de la inactivación por actualización general.
- **Clientes:** registrar y actualizar contacto, correo, preferencias, restricciones y estado; normalizar campos opcionales y correo. Los pedidos mantienen selección exclusiva de clientes activos. Se admiten lista, ficha y filtro por activos/inactivos.
- **Interfaz:** incorporar Clientes al inicio y navegación, formularios y tarjetas de condiciones de entrega; filtrar activos, editar y desactivar conductores. El token permanece en memoria.
- **Integridad:** reutilizar `commit_change` para entidad y auditoría; auditar operaciones fallidas. No se requirió una migración de esquema en este incremento porque las tablas y campos ya existían.

Los puntos de entrada históricos son `src/backend/app/api/drivers.py`, `services/drivers.py`, `api/clients.py`, `services/clients.py`, `repositories/clients.py`, `schemas/operations.py` y `main.py`; la interfaz de ese corte se encontraba en `src/frontend/src/App.tsx` y `api.ts`. Los módulos posteriores pueden reorganizar estos archivos; los datos de esta sección describen el corte del Sprint 2.

Los casos críticos comprenden actualización válida, datos inválidos, licencia duplicada, ID inexistente, conservación del estado, conductor asignado/inactivo, nombre requerido, correo inválido/duplicado, ficha inexistente y filtros. Se conservan en `src/backend/tests/test_drivers.py` y `test_clients.py`, con recorridos de interfaz en `src/frontend/src/App.test.tsx`.

### Reproducción y publicación del corte histórico

```bash
# Desde src/backend, con una base de prueba aislada:
python -m pytest -q --cov=app --cov-report=term-missing --cov-fail-under=80
# Desde src/frontend:
npm test
npm run build
# Desde la raíz, con variables locales configuradas:
docker compose up --build -d
```

El contrato OpenAPI del corte de implementación se identificó como `0.2.0`. En la repetición del 06/10/2026 se verificaron lectura HTTP, login, proxy y suites aisladas; el recorrido de mutaciones HTTP de la entrega inicial no se repitió fuera de esas suites. No se atribuye aquí una nueva ejecución de pruebas históricas.

La publicación técnica se realizó en `sprint-2`, commit `53642da` del 06/10/2026 a las 13:53:08, y se integró mediante [PR #1](https://github.com/jmartinez278/EcoLog-stica-Lima/pull/1) a las 16:23:33 de ese día, hora de Lima. El merge no acredita revisión por pares ni aceptación, según los resultados y pendientes ya registrados en este informe.

La revisión documental del 10/11/2026 consolida aquí el contenido único del anterior informe adicional de implementación; sus comprobaciones y fechas originales se mantienen como antecedentes. La matriz siguiente es la referencia única del DoD del corte.

## Seguimiento del Definition of Done

**Criterio único:** una US pasa a `Done` solo cuando **todos** sus criterios aplicables están verificados. `Parcial` y `sin evidencia` significan que la historia sigue abierta. La matriz aplica a US-011 a US-015 y sigue la numeración de la planificación.

| DoD | Evidencia al 06/10/2026 | Estado |
|---|---|---|
| 01 · Cobertura ≥80 % del código afectado | 14 pruebas backend aprobadas en SQLite y PostgreSQL; cobertura total 92,41 %. API y repositorios de conductores/clientes: 100 %; servicios: 100 % y 96 %; esquemas de operaciones: 100 %. | Verificado para los módulos backend afectados. |
| 02 · Análisis estático y seguridad | No consta resultado de SonarQube, CodeQL o equivalente para el incremento. | Sin evidencia. |
| 03 · Pruebas críticas | Pasaron 14 pruebas backend sobre SQLite y PostgreSQL, 5 pruebas frontend y build. Falta una matriz formal de todas las pruebas críticas aplicables por historia. | Parcial. |
| 04 · Revisión por pares | El PR #1 solicitó revisor, pero la consulta de reviews de GitHub devolvió `[]`. | No acreditado. |
| 05 · Acceso y TLS | La API conserva `require_read` y `require_write`; `test_client_write_permissions` cubre un rechazo 403. No consta verificación TLS externa. | Parcial. |
| 06 · Documentación / OpenAPI | README técnicos y esquemas actualizados; `/openapi.json` respondió 200 en el backend arrancado. | Verificado en el entorno local. |
| 07 · Staging | No consta despliegue ni prueba en staging. | Sin evidencia. |
| 08 · UI, 360 px y navegadores | Vitest pasó 5 flujos; no consta revisión visual a 360 px, accesibilidad ni compatibilidad entre navegadores. | Parcial. |
| 09 · Auditoría e integridad | `test_drivers.py` y `test_clients.py` comprueban eventos de auditoría exitosos; falta comprobación integrada de fallos y reversión en PostgreSQL. | Parcial. |
| 10 · Escenarios BDD | Hay pruebas automatizadas de los escenarios principales; no consta aprobación de todos los escenarios oficiales por historia. | Parcial. |
| 11 · Sin defectos bloqueantes | No hay una comprobación cerrada de defectos críticos asociados a las cinco tarjetas. | Sin evidencia. |
| 12 · Integración y pipeline | PR #1 fusionado; la consulta de ejecuciones de workflow para `53642da` devolvió `[]`. | Parcial. |

Las consultas de PR, reviews y workflows se hicieron en GitHub el 06/10/2026. No se interpreta `[]` como aprobación tácita. La [revisión del Sprint](<03 Revisión del Sprint V_1_0_0.md>) vincula estas brechas con las cinco historias.

## Calendario y desviación de seguimiento

Jira programó ECO Sprint 2 del **22/09/2026 a las 19:59:45** al **06/10/2026 a las 19:59:35**, hora de Lima. El commit de implementación está fechado el **06/10 a las 13:53**, el PR se abrió a las **14:08** y se fusionó a las **16:23**. Esas son fechas comprobadas; no se dispone de evidencia para repartir el desarrollo entre los días anteriores. Jira conserva el sprint en `future` pese a que el intervalo programado ya comenzó; las cinco tarjetas ahora están en revisión. Las acciones todavía abiertas carecen de fecha propia en Jira y requieren replanificación si no se completan antes del fin programado; no se les asigna una fecha efectiva ficticia. Véase la [línea de tiempo](<../../02 Planificación/Anexos/Seguimiento Jira Sprint 2 V_1_0_3.md>).

La observación del profesor sobre información técnica insuficiente señala un riesgo de retraso por tiempo de reconstrucción y aclaración. No se recibió una medición de días perdidos; el [registro de impedimentos](<02 Registro de Impedimentos V_1_0_0.md>) lo documenta como observación y acción de mejora, sin cuantificarlo como retraso ocurrido.

## Demostración del trabajo completado

La [revisión del Sprint 2](<03 Revisión del Sprint V_1_0_0.md>) contiene un recorrido propuesto de conductores y clientes. **No hay evidencia de una demostración ya realizada ante stakeholders** al corte de este informe, por lo que no se atribuyen asistentes, comentarios ni decisiones.

## Impedimentos

El [registro de impedimentos](<02 Registro de Impedimentos V_1_0_0.md>) documenta la desalineación de Jira frente al código integrado, la ausencia inicial de entregables del Sprint 2, la verificación del entorno ya completada y la falta de evidencia para cerrar el DoD. Incluye impacto, prioridad, estado y acciones propuestas.

## Pendientes

1. Resolver la discordancia entre fechas y estado `future` del sprint en Jira; asignar responsables confirmados y revisar las evidencias de las cinco tarjetas en `In Review / QA`.
2. Conservar las salidas de Vitest, build, Compose y pruebas PostgreSQL del 06/10/2026; completar la revisión visual de 360 px y navegadores.
3. Ejecutar la demostración con interesados y registrar asistentes, casos mostrados, observaciones, decisiones y compromisos reales.
4. Celebrar la retrospectiva del equipo y confirmar o corregir el [análisis y plan de acción](<04 Retrospectiva del Sprint V_1_0_0.md>).
5. Completar las evidencias aplicables del DoD antes de declarar US-011 a US-015 como `Done`.

## Historial de control de cambios

| Versión | Fecha | Cambio |
|---|---|---|
| 1.0.0 | 06/10/2026 | Informe inicial del Sprint 2 con avance técnico, estado real de Jira, comprobaciones y pendientes de aceptación. |
| 1.0.1 | 06/10/2026 | DoD como criterio único de cierre, detalle técnico por historia, matriz de evidencia y calendario exacto de Jira frente a fechas comprobadas. |
| 1.0.2 | 06/10/2026 | Verificación local con Docker, PostgreSQL aislado, frontend y API; actualización de las cinco tarjetas a revisión en Jira. |
| 1.0.3 | 10/11/2026 | Consolidación del informe adicional de implementación en este documento; conservación de alcance, pruebas y publicación históricos, sin repetir datos en otro archivo. |
