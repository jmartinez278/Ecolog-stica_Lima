[← Volver al README](../../../README.md)

# Revisión del sprint

**Nombre del Proyecto:** EcoLogística Lima<br>
**Líder del Proyecto:** Marco Jhair Martinez Llanos<br>
**Sprint:** Sprint 3 — Implementación, calidad de código y evaluación<br>
**Versión del documento:** V_1_0_0<br>
**Fecha de actualización:** 09/11/2026

## Historias de Usuario completadas en este Sprint

El Sprint 3 evaluó el incremento existente de las historias US-001 a US-015 mediante pruebas, análisis estático, seguridad y accesibilidad. No se presentan US-016 a US-023 como parte de esta entrega documental porque pertenecen al backlog funcional posterior.

| Alcance revisado | Resultado técnico | Estado de aceptación |
|---|---|---|
| US-001 a US-004 — vehículos | Registro, consulta, actualización y desactivación disponibles | Pruebas técnicas aprobadas; aceptación del usuario pendiente |
| US-005 a US-008 — pedidos | Registro, consulta, edición y cancelación disponibles | Pruebas técnicas aprobadas; aceptación del usuario pendiente |
| US-009 a US-012 — conductores | Registro, consulta, actualización y desactivación disponibles | US-012 permanece en revisión/QA en Jira |
| US-013 a US-015 — clientes | Registro, consulta y actualización disponibles | Pruebas técnicas aprobadas; aceptación del usuario pendiente |

La revisión técnica no reemplaza la definición de Done ni una aprobación de los stakeholders. SonarCloud analizó la versión 1.3.0, revisión `fd9ede188207982af68af7b9ef014005f6135bec`, con Quality Gate aprobado.

## Demostración del trabajo completado

El recorrido técnico comprende:

1. Inicio de sesión y control de acceso.
2. Registro, consulta, edición y cambio de estado de vehículos.
3. Registro, consulta, edición y cancelación de pedidos.
4. Registro, consulta, edición y desactivación de conductores.
5. Registro, consulta y actualización de clientes.
6. Ejecución de pruebas automatizadas, compilación del frontend y revisión del resultado real de SonarCloud.

La demostración técnica está disponible para la revisión del equipo. No existe evidencia suficiente para afirmar que los stakeholders aprobaron formalmente el incremento; por ello la aceptación permanece pendiente.

## Pendientes

- Registrar participantes, observaciones y decisión de aceptación de la revisión con stakeholders.
- Completar la aceptación de US-012 y de los criterios de Done que requieren validación humana.
- No atribuir a SonarCloud comprobaciones operativas que no realiza. La disponibilidad mensual de 99.5%, la recuperación en 10 minutos, el consumo de CPU y la latencia P95 requieren monitoreo o pruebas de carga independientes.
- Analizar nuevamente en SonarCloud cualquier cambio posterior a la revisión `fd9ede18` antes de presentarlo como parte de esta entrega.

[← Volver al README](../../../README.md)
