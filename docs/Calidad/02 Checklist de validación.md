[← Volver al README](../../README.md)

# Checklist de validación — Pre-Sprint 3

**Versión documental:** 1.0.3 · **Actualizado:** 25/10/2026. Se identifican los resultados históricos y las adendas posteriores.

**Versión del proyecto:** 1.2.4 · **Rama:** `Pre-Sprint-3` · **Fecha:** 24/10/2026.

Este registro distingue **implementación técnica en la rama** de **aceptación formal**. Cada control de CI debe comprobarse nuevamente en el commit definitivo.

## Entregables y código

- [x] Conservar los 13 documentos de Inicio sin modificar los hechos históricos.
- [x] Incorporar el presupuesto como cuarto entregable de Planificación; seguimiento Jira en Anexos.
- [x] Agrupar informes en carpetas Sprint 1, Sprint 2 y Pre-Sprint 3; documentar las modificaciones globales en [Versión 1.2.4](../Versiones/1.2.4.md).
- [x] Centralizar diagramas de API y C4 en `docs/Arquitectura/`.
- [x] Incorporar migraciones explícitas Alembic e índice de unicidad de correo del cliente.
- [x] Añadir pruebas de rollback, auditoría y salvaguarda de bases de prueba.
- [x] Separar frontend en `pages/`, `forms/`, `components/` y `styles/` sin añadir historias futuras.
- [x] Preparar workflows de CI, CodeQL y auditoría de dependencias.
- [x] Preparar configuración de staging aislado sin presentar un despliegue externo como hecho.
- [x] Crear [matriz BDD](<01 Matriz de pruebas BDD.md>) de US-001 a US-015.

## Verificaciones automáticas

- [x] [CI de Pre-Sprint 3](https://github.com/RodrigoAC12/Ecolog-stica_Lima/actions/runs/40141894546): 27 pruebas backend tanto en SQLite como en PostgreSQL 16, cobertura del 92,85 %, 6 pruebas frontend, build, migraciones Alembic, Docker y enlaces.
- [x] [Auditoría de dependencias](https://github.com/RodrigoAC12/Ecolog-stica_Lima/actions/runs/40141894558) aprobada.
- [x] [CodeQL Python/TypeScript](https://github.com/RodrigoAC12/Ecolog-stica_Lima/actions/runs/40141894532) aprobado con los análisis SARIF exportados.
- [ ] Realizar triage humano de las alertas visibles en el panel Code Scanning, si las hubiera; un workflow verde no certifica que no exista ningún riesgo.
- [x] Validación automática de enlaces locales Markdown aprobada durante el CI de Pre-Sprint 3.

## Validaciones formales pendientes

- [ ] Aprobación presupuestal y del contenido documental por el equipo.
- [x] Staging en localhost verificado el 25/10/2026, con HTTPS local y secretos fuera del repositorio.
- [ ] Pruebas manuales de accesibilidad WCAG, 360 px, teclado y navegadores soportados.
- [ ] Demostración y aceptación de los escenarios oficiales Gherkin por interesados.
- [ ] Revisión independiente del código y aprobación del Pull Request por el propietario.
- [x] Integración técnica de la base 1.2.4 mediante [PR #3](https://github.com/jmartinez278/Ecolog-stica_Lima/pull/3), 24/10/2026; no sustituye la revisión independiente requerida.
- [ ] Confirmación de responsables, estado de sprints y ceremonias reales en Jira; no inventar reuniones ni fechas.

**Referencias:** [Informe de seguridad](<../03 Implementación/Pre-Sprint 3/02 Informe de seguridad V_1_0_0.md>), [Integridad y auditoría](<../03 Implementación/Pre-Sprint 3/03 Informe de integridad y auditoría V_1_0_0.md>) y [Versión 1.2.4](../Versiones/1.2.4.md).

## Adenda de Sprint 3 — estado vigente al 25/10/2026

- [x] Cinco informes oficiales preparados en `docs/03 Implementación/Sprint 03/` con retorno al README.
- [x] Cuatro hallazgos S9011 corregidos y reanalizados.
- [x] JWT sin expiración rechazado y probado.
- [x] Gestión de foco corregida y comprobada en la aplicación real.
- [x] 36 pruebas backend en SQLite y PostgreSQL; migraciones verificadas.
- [x] 11 pruebas frontend y compilación; 92,19 % de líneas, cuatro formularios 100 % y App 90 %.
- [x] Auditorías de dependencias sin avisos conocidos en el corte conservado.
- [x] Sonar del commit `3c1b45d` aprobado: tres condiciones, 92,4 % global, 100 % nuevo y cero problemas abiertos.
- [x] 13 estados de accesibilidad automática y 16 comprobaciones dirigidas aprobadas.
- [x] Contraste funcional medido: 437 comprobaciones, mínimo 6,66:1; restantes incompletos decorativos identificados.
- [ ] Acreditar uso humano de lector de pantalla y navegadores del alcance completo.
- [ ] Acreditar aceptación de interesados y revisión independiente.
- [x] Validar el entorno local según la [adenda vigente](<../03 Implementación/Sprint 03/Alcance de validación local V_1_0_0.md>).
- [ ] Confirmar acuerdos personales, calendario y cierre administrativo en Jira.

- [x] Entrega concentrada en el [PR #4](https://github.com/jmartinez278/Ecolog-stica_Lima/pull/4) y [matriz de los ocho criterios](<../03 Implementación/Sprint 03/Matriz de entrega y rúbrica V_1_0_0.md>).
- [ ] Demostración a interesados y observaciones acreditadas para completar el criterio 1.
- [ ] Aprobación e integración por el propietario; no se marca como realizada por publicar el PR.

Consultar el [registro de entrega del Sprint 3](<../Versiones/Sprint 3 V_1_0_0.md>) para resultados, límites y trazabilidad. La preparación de documentos no convierte en realizadas las validaciones pendientes.

## Control documental

| Versión | Fecha | Cambio |
|---|---|---|
| 1.0.0 | 24/10/2026 | Checklist de la base Pre-Sprint 3. |
| 1.0.1 | 24/10/2026 | Adenda del incremento de Sprint 3. |
| 1.0.2 | 25/10/2026 | Alcance y comprobación localhost. |
| 1.0.3 | 25/10/2026 | Evidencias de contraste, cobertura, Sonar y matriz de entrega única. |
