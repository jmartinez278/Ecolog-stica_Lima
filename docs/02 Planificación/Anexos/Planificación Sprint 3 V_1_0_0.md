[← Volver al README](../../../README.md)

# Adenda de planificación — Sprint 3

**Versión documental:** V_1_0_2 · **Actualizado:** 25/10/2026 (Lima).<br>
**Base:** [Transformando a ágil V_1_0_1](<../01 Transformando a ágil V_1_0_1.md>) y [seguimiento de Sprint 2](<Seguimiento Jira Sprint 2 V_1_0_3.md>).<br>
**Rama de entrega:** `Sprint-3` del fork `RodrigoAC12/Ecolog-stica_Lima`.

## Alcance y trazabilidad

La línea base conserva 23 historias funcionales y 10 enablers. Esta adenda incorpora EP-06/ECO-59 para calidad, seguridad y mantenibilidad, con las ocho unidades de trabajo ECO-51 a ECO-58. Amplía las cinco épicas originales; no atribuye historias funcionales adicionales ni implementación de optimización, mapas o analítica.

| Jira | Criterio de consigna | Requisitos y DoD relacionados | Entregable |
|---|---|---|---|
| ECO-51 | Revisión del sprint | DoD-10, evidencia de aceptación y pendientes | Informe 01 |
| ECO-52 | Retrospectiva | Mejora continua; responsables y acciones verificables | Informe 02 |
| ECO-53 | Calidad de código | RNF-015; EN-009/ECO-38; DoD-01/02/03 | Informe 03 y evidencia Sonar |
| ECO-54 | Seguridad OWASP 2025 | RNF-005/006/007/010/011; ECO-34/36; DoD-02/05/09 | Informe 04, auditorías y pruebas negativas |
| ECO-55 | WCAG AA | RNF-008/009/014; ECO-35; DoD-08 | Informe 05 y evaluación de interfaz |
| ECO-56 | Organización y exclusiones | RNF-015/016; DoD-06 | Código modular y `.gitignore` revisado |
| ECO-57 | Coherencia y versiones | RNF-016; ECO-39; DoD-06 | Adendas y documentos actualizados |
| ECO-58 | Publicación y enlaces | RNF-016; DoD-04/06/12 | Cinco Markdown, enlaces y PR de revisión |

## Criterios de cierre

El despliegue se comprueba exclusivamente en localhost conforme a la [adenda de alcance del 25/10/2026](<../../03 Implementación/Sprint 03/Alcance de validación local V_1_0_0.md>). La [evidencia local](<../../03 Implementación/Sprint 03/evidencias/staging-local.json>) acredita HTTP/HTTPS, login y recursos protegidos; no se requiere infraestructura remota.

Las evidencias técnicas permiten revisar el trabajo; el cierre exige los puntos aplicables del DoD. Mantener en revisión los controles humanos o de entorno no acreditados. La rama de entrega y el PR no equivalen a aprobación ni a fusión en `main`.

En Jira, Sprint 1 figuraba activo y Sprint 2/Sprint 3 futuros con fechas vencidas. No se crean fechas efectivas por inferencia: su regularización corresponde al equipo con fechas reales. ECO-18 permanece en QA y los pendientes ECO-47 a ECO-50 conservan su seguimiento independiente.

## Impacto documental

| Documento o grupo | Tratamiento |
|---|---|
| README | Versión documental 1.2.7, informes oficiales, alcance localhost y matriz de entrega |
| Notas 1.2.4 y guía Sonar | Aclaración de integración y evidencia del incremento posterior |
| Planificación inicial de cinco épicas | Se conserva como línea base histórica; EP-06 se añade mediante esta adenda versionada |
| Informes de Sprints 1 y 2 | Se conservan cortes del 29/09 y 06/10; el estado posterior se registra por separado |
| Documentos de Inicio | No cambian los RF/RNF ni el modelo de negocio en esta entrega; no requieren redefinición por las correcciones realizadas |
| Equipo histórico y actual | Conservar los integrantes del corte original; no atribuir fechas de incorporación sin respaldo |
| Versiones de software | 1.2.4 es la base integrada; los identificadores `1.2.4-sprint3-*` distinguen análisis. OpenAPI 0.2.0 y frontend 0.1.0 son versiones de componente, no una nueva liberación aprobada del MVP |

## Control documental

| Versión | Fecha | Cambio |
|---|---|---|
| V_1_0_0 | 24/10/2026 | Adenda EP-06, trazabilidad de los ocho criterios y tratamiento de documentos afectados. |
| V_1_0_1 | 25/10/2026 | Alcance localhost y evidencia de validación del entorno local. |
| V_1_0_2 | 25/10/2026 | Entrega única mediante PR #4, evidencias vigentes y matriz explícita de la rúbrica. |

La [matriz de entrega](<../../03 Implementación/Sprint 03/Matriz de entrega y rúbrica V_1_0_0.md>) conserva los ocho criterios de la consigna sin convertir toda mejora del backlog en obligación de esta entrega. Las limitaciones de evaluación y la demostración pendiente se declaran expresamente para revisión del propietario.
