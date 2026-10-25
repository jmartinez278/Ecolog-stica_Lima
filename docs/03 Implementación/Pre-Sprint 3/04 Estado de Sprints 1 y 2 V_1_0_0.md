[← Volver al README](../../../README.md)

# Estado de Sprints 1 y 2 — preparación de Pre-Sprint 3

**Versión documental:** 1.0.1 · **Versión del proyecto:** 1.2.4 · **Corte histórico de consulta:** 24/10/2026 (Lima). **Adenda:** 25/10/2026.

## Antecedentes documentados

- [Sprint 1](../Sprint%201/): los entregables históricos registran el corte del 29/09/2026.
- [Sprint 2](../Sprint%202/): los informes y el [anexo Jira](<../../02 Planificación/Anexos/Seguimiento Jira Sprint 2 V_1_0_3.md>) corresponden al corte del 06/10/2026.
- Esos documentos se conservan en sus carpetas; su organización no implica la realización retroactiva de reuniones.

## Consulta posterior de Jira ECO

Al 24/10/2026 la consulta verificó que ECO-17, ECO-19, ECO-20 y ECO-21 figuraban `Finalizada`, mientras ECO-18 seguía `In Review / QA`. El estado administrativo de Sprint 1 era `active` y el de Sprint 2 `future`, pese a la fecha histórica planificada. Estos estados deben distinguirse de la ejecución técnica y requieren conciliación por el equipo.

ECO-6 (US-001) y ECO-7 se identificaron como registros coincidentes; el duplicado se gestionó en Jira sin perder la historia implementada. Esta acción administrativa no aporta aceptación BDD.

## Evidencias técnicas de esta versión

La rama `Pre-Sprint-3` incorpora pruebas de API, migraciones, controles de seguridad, frontend modular y documentación de planificación. La [matriz BDD](<../../Calidad/01 Matriz de pruebas BDD.md>) relaciona las 15 historias de los dos primeros sprints con la suite. La CI de la rama registra el resultado real de las pruebas.

## Puntos que no deben inferirse

No consta autorización para atribuir fechas efectivas distintas a las registradas, asignar responsables, celebrar retrospectivas por escrito, declarar un staging real ni aprobar todo el Definition of Done. Estas actividades requieren documentación del equipo o del propietario según corresponda.

**Referencias:** [Versión 1.2.4](<../../Versiones/1.2.4.md>) · [Checklist de validación](<../../Calidad/02 Checklist de validación.md>).

## Adenda del 25/10/2026

La entrega posterior de Sprint 3 está concentrada en el [PR #4](https://github.com/jmartinez278/Ecolog-stica_Lima/pull/4). El entorno de pruebas localhost ya se ejecutó y verificó con TLS según la [evidencia local](<../Sprint 03/evidencias/staging-local.json>). Este hecho posterior actualiza la situación del staging sin alterar los cortes históricos de Sprint 1 y 2. La demostración y aceptación humana, fechas del equipo y aprobación independiente siguen requiriendo su propio registro; la [matriz vigente](<../Sprint 03/Matriz de entrega y rúbrica V_1_0_0.md>) identifica esos límites.

| Versión documental | Fecha | Cambio |
|---|---|---|
| 1.0.0 | 24/10/2026 | Corte de consulta y límites de las verificaciones históricas. |
| 1.0.1 | 25/10/2026 | Adenda del despliegue local y entrega posterior en PR único. |
