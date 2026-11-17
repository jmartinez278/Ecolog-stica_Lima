[← Volver al README principal](../../../README.md)

# Retrospectiva del sprint

**Nombre del Proyecto:** EcoLogística Lima — Optimizador de rutas sostenibles para DistriRápido S.A.C.

**Líder del Proyecto:** Marco Jhair Martinez Llanos

| Campo | Detalle |
|---|---|
| Sprint | Sprint 4 (Jira Sprint ID 71), 09/11/2026 – 23/11/2026 |
| Tipo de documento | Análisis preparado para la sesión de retrospectiva (ECO-78), basado en la evidencia del repositorio, GitHub Actions y Jira al 17/11/2026 |
| Versión del documento | V_1_0_0 · 17/11/2026 |

Este documento reúne lo que muestran los commits, los pipelines y el tablero. Los responsables de la tabla de acciones son una **propuesta** que el equipo confirmará o cambiará durante la retrospectiva; el acuerdo final se registrará en la versión V_1_1_0.

## ¿Qué aprendimos?

**Técnicas**

- **Las pruebas E2E contra producción encuentran defectos que las pruebas unitarias no ven.** La versión 1.4.0 pasaba todas las pruebas unitarias, pero en producción mostraba `Failed to fetch` (Chromium) o `Load failed` (WebKit) cuando se perdía la conexión. El mensaje dependía del navegador, algo que solo una prueba multinavegador revela.
- **Un pipeline verde hoy puede fallar mañana sin cambiar el código.** Entre el 10/11 y el 17/11 aparecieron dos advisories nuevos: GHSA-fc5q-39xc-vjpf en `picomatch` (sin parche) y GHSA-mf5v-w3w3-f6cg en `opentelemetry-api` (corregido con 1.45.2). Las auditorías de dependencias necesitan un proceso para decidir entre actualizar o aceptar el riesgo con una fecha de revisión.
- **YAML tiene reglas que no se ven a simple vista.** `--only-binary=:all: --require-hashes` en un escalar plano invalidó `ci.yml` y `tests.yml` porque `: ` se interpreta como clave. GitHub mostró el run fallido sin jobs. Ahora esos comandos van en bloques `>-`.
- **El código debe funcionar en el sistema de cada integrante.** `precompress.mjs` usaba `URL.pathname`, que falla en Windows con espacios y letra de unidad; CI en Linux nunca lo detectó.

**Arquitectónicas**

- **El plan gratuito de Render condiciona la disponibilidad.** El primer acceso tras inactividad tardó 37,6 s. Con la API despierta, la mediana de respuesta fue de 216–412 ms, pero el p95 a través del proxy de Vercel llegó a 831 ms.
- **El esquema Alembic depende de PostgreSQL.** Las identidades no funcionan en SQLite, así que las pruebas E2E en CI usan PostgreSQL con migraciones reales, igual que producción.

**De gestión**

- **Jira no refleja el avance real.** ECO-79, 80, 82 y 83 tienen evidencia técnica en el repositorio, pero siguen en *Tareas por hacer*. ECO-63 a ECO-71 siguen en *In Review / QA* desde el 10/11.
- **Las ceremonias con stakeholders siguen sin acta.** Las revisiones de los Sprints 1 a 3 también dejaron la aceptación como pendiente. Es un patrón repetido, no un problema puntual de este Sprint.

## ¿Qué estamos haciendo bien?

- **Dependencias con hashes y despliegue por SHA.** Los locks con `--require-hashes` y el gate de `deploy-production.yml` impiden publicar un commit distinto del que pasó CI, Tests, CodeQL y Green IT.
- **Trabajo por ramas y PR.** Todo el Sprint se integra desde `sprint-4` mediante PR (#7 a #12); nadie edita `main` directamente.
- **Evidencia antes que afirmaciones.** Los informes separan lo medido de lo estimado: SWDM v4 como estimación, Lighthouse y Playwright como mediciones, y los fallos de producción se documentan en lugar de ocultarse.
- **Selectores accesibles en las pruebas.** Playwright usa `getByRole` y `getByLabel`, de modo que la suite también protege la accesibilidad lograda en el Sprint 3.
- **Green IT medible.** Bajar la sesión de 1.011.683 a 87.589 bytes con Lighthouse 100 demuestra que las optimizaciones tuvieron efecto.

## ¿Qué podemos hacer mejor?

### Personas

- El CI/CD y la Green IT se concentraron en pocos integrantes (según el historial de commits). Si una de esas personas falta, nadie más sabe operar el despliegue.
- La identidad de git en un equipo compartido estaba sin configurar (“Tu Nombre”), lo que habría dejado commits sin autor identificable.

### Relaciones

- La comunicación con DistriRápido S.A.C. y el docente no deja registro: no hay actas de demostración en ningún Sprint.
- Frontend y backend se coordinan bien en el código, pero las decisiones de despliegue (Vercel/Render, plan gratuito) no se comunicaron al Product Owner como riesgo de disponibilidad.

### Procesos

- El tablero se actualiza al final y no al terminar cada tarea.
- No hay revisión cruzada obligatoria: los PR #9 a #12 se integraron el mismo día en que se abrieron.
- Las estimaciones no consideraron el tiempo de configuración de infraestructura (secretos, entornos, promoción en Vercel), que generó cuatro commits de corrección del CD el 10/11.

### Herramientas

- No hay validación local de YAML antes del push; el error de `:all:` se detectó en GitHub.
- Firefox no corre en la máquina Windows del equipo por una dependencia del sistema; la cobertura de ese navegador depende solo de CI.
- El monitoreo de producción es nuevo y aún no tiene historial suficiente para calcular un *uptime* mensual.

### Acciones a realizar

| # | Acción (SMART) | Responsable propuesto | Métrica de seguimiento | Fecha límite |
|---|---|---|---|---|
| A1 | Realizar la Sprint Review con DistriRápido y el docente, y registrar asistentes, retroalimentación y decisión por elemento de Jira | Marco Jhair Martinez Llanos (líder) | Acta incorporada a la Revisión V_1_1_0 con 100 % de los elementos EP-07/EP-08 con decisión | 23/11/2026 |
| A2 | Aplicar la encuesta SUS a al menos 5 participantes y publicar el resultado | Luis Antony Gonzalo Guerrero y Piero Pool Chauris Leguia | n ≥ 5 respuestas válidas en el formulario; informe 04 con puntaje global | 21/11/2026 |
| A3 | Mover cada tarea de Jira al terminarla, enlazando su commit o PR | Todo el equipo; control del líder en cada daily | 0 tareas con evidencia en el repositorio y estado *Tareas por hacer* al revisar el tablero | Desde 18/11/2026 |
| A4 | Exigir una revisión de otro integrante antes de fusionar un PR a `main` | Rodrigo Vladimir Arce Curi (calidad) | 100 % de los PR con al menos una aprobación registrada en GitHub | Desde el PR del Sprint 4 |
| A5 | Sesión de 1 hora para que dos integrantes más ejecuten y diagnostiquen `deploy-production.yml` | Jhon Robert Paitan Montes | Dos integrantes adicionales ejecutan un `workflow_dispatch` con éxito | 22/11/2026 |
| A6 | Revisar semanalmente los advisories aceptados y el resultado de `production-monitor` | Jhon Robert Paitan Montes | Excepción GHSA-fc5q-39xc-vjpf revisada antes del 15/12/2026; ejecuciones de monitoreo fallidas atendidas en 24 h | Semanal, desde 24/11/2026 |
| A7 | Presentar al Product Owner el costo de un plan sin suspensión en Render y la migración de la base gratuita | Jhon Robert Paitan Montes y Marco Jhair Martinez Llanos | Decisión registrada antes de que caduque la base (10/12/2026) | 01/12/2026 |
| A8 | Configurar la identidad de git en cada equipo y validar YAML antes del push | Cada integrante | 0 commits con autor genérico; 0 runs con “Invalid workflow file” | 20/11/2026 |

[← Volver al README principal](../../../README.md)
