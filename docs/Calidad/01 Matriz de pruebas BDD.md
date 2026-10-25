[← Volver al README](../../README.md)

# Matriz de pruebas BDD — Sprints 1 y 2

**Versión documental:** 1.0.1 · **Actualizado:** 25/10/2026 (Lima).

**Versión del proyecto:** 1.2.4 · **Etapa:** Pre-Sprint 3. Los escenarios completos Gherkin se conservan en [Transformando a ágil](<../02 Planificación/01 Transformando a ágil V_1_0_1.md>). La siguiente matriz relaciona cada historia con los tests implementados; no afirma aceptación formal.

| Historia | Alcance | Prueba automatizada relacionada |
|---|---|---|
| US-001 | Registro de vehículos | `test_vehicles.py` |
| US-002 | Consulta de flota | `test_vehicles.py` |
| US-003 | Actualización de vehículos | `test_vehicles.py` |
| US-004 | Desactivación lógica de vehículos | `test_vehicles.py` |
| US-005 | Registro de pedidos | `test_orders.py` |
| US-006 | Consulta y filtros de pedidos | `test_orders.py` |
| US-007 | Edición de pedidos pendientes | `test_orders.py` |
| US-008 | Cancelación de pedidos | `test_orders.py` |
| US-009 | Registro de conductores | `test_drivers.py` |
| US-010 | Consulta de conductores | `test_drivers.py` |
| US-011 | Actualización de conductores | `test_drivers.py` |
| US-012 | Desactivación de conductores | `test_drivers.py` |
| US-013 | Registro de clientes | `test_clients.py`, `test_client_email_uniqueness.py` |
| US-014 | Consulta de clientes | `test_clients.py` |
| US-015 | Actualización de clientes y condiciones de entrega | `test_clients.py`, `test_client_email_uniqueness.py` |

## Controles transversales

- **Integridad y auditoría:** `test_transaction_audit.py`, `test_database_safety.py`, `test_client_email_uniqueness.py`.
- **Autenticación y permisos:** `test_auth.py` y las respuestas HTTP probadas por cada módulo.
- **Frontend:** `src/frontend/src/App.test.tsx` con React Testing Library y mocks de red; incluye enlace de salto por teclado.
- **Entorno:** tests backend con SQLite y PostgreSQL 16 aislado; migraciones, documentación y compilación en [Actions](https://github.com/RodrigoAC12/Ecolog-stica_Lima/actions?query=branch%3APre-Sprint-3).

## Adenda del Sprint 3

El incremento se consolida en el [PR #4](https://github.com/jmartinez278/Ecolog-stica_Lima/pull/4). La regresión backend conserva 36 pruebas en cada base y el frontend incorpora 11 pruebas; cuatro casos verifican cancelación de edición sin escritura. La [evaluación de interfaz](<../03 Implementación/Sprint 03/05 WCAG V_1_0_0.md>) documenta 13 estados, 16 comprobaciones dirigidas y contraste medido. Estas evidencias amplían la cobertura técnica sin atribuir aceptación de todos los escenarios oficiales Gherkin.

## Aceptación adicional requerida

- [ ] Ejecutar y aprobar cada escenario oficial Gherkin con el interesado responsable.
- [ ] Documentar sesión o acta de revisión funcional, fecha real y defectos detectados.
- [ ] Verificar accesibilidad WCAG, navegación completa, 360 px y navegadores reales.
- [ ] Confirmar revisión independiente y evidencias de Definition of Done antes de fusionar el cambio.

El resultado de un test unitario o de integración no equivale a la aceptación del escenario completo por los interesados.

## Control documental

| Versión | Fecha | Cambio |
|---|---|---|
| 1.0.0 | 24/10/2026 | Trazabilidad de las 15 historias y separación de pruebas frente a aceptación. |
| 1.0.1 | 25/10/2026 | Evidencias actuales y PR único del Sprint 3; se conservan pendientes de aceptación. |
