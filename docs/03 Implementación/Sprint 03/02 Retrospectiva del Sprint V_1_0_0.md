[← Volver al README](../../../README.md)

# Retrospectiva del sprint

**Nombre del Proyecto:** EcoLogística Lima<br>
**Líder del Proyecto:** Marco Jhair Martinez Llanos<br>
**Versión del documento:** V_1_0_0<br>
**Fecha de actualización:** 09/11/2026

## ¿Qué aprendimos?

- Una cifra de SonarCloud debe vincularse con la revisión exacta que fue analizada.
- Un Quality Gate aprobado demuestra condiciones de calidad de código, no disponibilidad, recuperación ni rendimiento de producción.
- La ausencia de vulnerabilidades estáticas no equivale a certificar las diez categorías OWASP.
- Las pruebas automáticas de accesibilidad necesitan interpretación y revisión manual para sostener una evaluación WCAG.

## ¿Qué estamos haciendo bien?

- Frontend y backend se mantienen separados y organizados.
- Las pruebas y la compilación se ejecutan antes de preparar la entrega.
- El repositorio integra SonarCloud y conserva trazabilidad con la revisión analizada.
- Los cinco informes solicitados enlazan de ida y vuelta con el README.
- Los resultados no comprobados se registran como pendientes en lugar de presentarlos como aprobados.

## ¿Qué podemos hacer mejor?

### Personas

Asignar responsables claros para la revisión de calidad, seguridad, accesibilidad y aceptación funcional, evitando que la evidencia dependa de una sola persona.

### Relaciones

Registrar la demostración, los participantes y las observaciones reales de los stakeholders. La revisión técnica y la aceptación funcional deben mantenerse separadas.

### Procesos

Ejecutar SonarCloud sobre la revisión candidata definitiva y completar las pruebas operativas de los requisitos no funcionales antes de cambiar su estado en Jira.

### Herramientas

Mantener la integración de pruebas, cobertura y SonarCloud. Añadir una herramienta de monitoreo para disponibilidad y pruebas de carga para latencia, recuperación, capacidad y CPU, porque SonarCloud no genera esas mediciones.

### Acciones a realizar

| Acción | Responsable propuesto | Criterio de cierre |
|---|---|---|
| Repetir SonarCloud sobre la versión candidata final | Responsable de calidad | Quality Gate y métricas asociados al commit entregado |
| Registrar la revisión con stakeholders | Líder del proyecto | Participantes, observaciones y aceptación documentados |
| Medir disponibilidad y recuperación | Responsable de infraestructura | Periodo medido, fórmula, incidentes y recuperación registrados |
| Ejecutar pruebas de carga | Responsable técnico | Evidencia de umbrales de tiempo, capacidad, CPU y P95 |
| Completar revisión manual WCAG | Responsable de frontend | Hallazgos, correcciones y resultado por los cuatro principios |

[← Volver al README](../../../README.md)
