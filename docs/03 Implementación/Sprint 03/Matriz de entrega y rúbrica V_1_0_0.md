[← Volver al README](../../../README.md)

# Matriz de entrega y rúbrica — Sprint 3

**Versión documental:** V_1_0_0 · **Fecha:** 25/10/2026 (Lima).<br>
**Fuente:** consigna oficial «Implementación, Calidad de Código y Evaluación», adjunta por el solicitante.<br>
**Entrega única:** [PR #4](https://github.com/jmartinez278/Ecolog-stica_Lima/pull/4), `RodrigoAC12/Ecolog-stica_Lima:Sprint-3` → `jmartinez278/Ecolog-stica_Lima:main`.<br>
**Alcance de ejecución:** exclusivamente localhost. El propietario evalúa y decide la integración; esta matriz no asigna una nota ni sustituye aceptación humana.

## Los ocho criterios

| Ítem y exigencia de la rúbrica | Evidencia entregada | Estado y límite |
|---|---|---|
| 1. Review: secciones completas, HU y Done, demostración a interesados y pendientes reales | [Informe 01](<01 Revisión del Sprint V_1_0_0.md>), tabla de US-001 a US-015, DoD, recorrido y capturas | **Parcial:** revisión técnica preparada; falta acreditar la demostración a interesados y sus observaciones. No se atribuyen reuniones ni aprobaciones inexistentes. |
| 2. Retrospectiva: aprendizajes, aciertos y acciones concretas en Personas, Relaciones, Procesos y Herramientas | [Informe 02](<02 Retrospectiva del Sprint V_1_0_0.md>), acciones con rol propuesto, plazo relativo y evidencia | **Documento preparado:** cuatro dimensiones cubiertas; los compromisos personales requieren confirmación del equipo. |
| 3. Calidad: Quality Gate, bugs, smells, cobertura, duplicación y plan de deuda | [Informe 03](<03 Calidad de código V_1_0_0.md>), [Sonar vigente](evidencias/sonar-entrega.json) y [cobertura por archivo](evidencias/frontend-cobertura-entrega.json) | **Evaluado:** gate aprobado; 92,4 % global, 100 % nuevo, duplicación 0 %, cero problemas abiertos. Plan y antecedentes incluidos. |
| 4. OWASP 2025: diez categorías, hallazgos/hotspots y correcciones | [Informe 04](<04 OWASP V_1_0_0.md>), Sonar, auditorías, pruebas negativas y evidencia TLS local | **Evaluación documentada:** cero hotspots detectados y defecto JWT corregido. Se explicitan categorías bajo revisión y límites del perfil estático. No se afirma seguridad completa ni se inventan hotspots. |
| 5. WCAG AA: cuatro principios, interpretación y tabla de problemas/componentes/correcciones | [Informe 05](<05 WCAG V_1_0_0.md>), [13 estados](evidencias/accesibilidad-entrega-edge.json) y capturas antes/después | **Evaluación con correcciones:** 437 comprobaciones de contraste, 16 de interacción, sin infracciones/reflow en el alcance probado. No se acredita conformidad AA universal, uso humano de lector de pantalla ni la matriz completa de navegadores del DoD. |
| 6. Frontend/backend modular y `.gitignore` sin temporales | [Frontend](../../../src/frontend/), [backend](../../../src/backend/) y [.gitignore](../../../.gitignore) | **Preparado:** componentes separados; se excluyen secretos, dependencias instaladas, coberturas de trabajo, cachés y copias temporales. Se conserva evidencia seleccionada. |
| 7. Coherencia y actualización/versionamiento de documentos afectados | Cinco informes revisados V_1_0_1; [adenda de planificación](<../../02 Planificación/Anexos/Planificación Sprint 3 V_1_0_0.md>), [notas de base](<../../Versiones/1.2.4.md>), [notas de entrega](<../../Versiones/Sprint 3 V_1_0_0.md>), guías y checklists con historial | **Actualizado:** cortes históricos identificados, alcance local y resultados vigentes diferenciados. Se conservan nombres canónicos de los cinco archivos exigidos y se incrementa la versión documental interna. |
| 8. Cinco Markdown en `docs/03 Implementación/Sprint 03` y enlaces de ida/vuelta con README | [README](../../../README.md), cinco informes enlazados y comprobador de enlaces | **Publicado para revisión:** todos los archivos se concentran en el PR #4; integración al repositorio oficial pendiente del propietario. |

## Cómo revisar la entrega

1. Leer los cinco informes oficiales y abrir sus JSON/capturas desde GitHub; no se necesita acceso al Sonar de esta PC para revisar las métricas conservadas.
2. Consultar los controles del último commit del PR. La CI ejecuta backend SQLite/PostgreSQL, migraciones, frontend en Node 22, compilación, enlaces y configuración/build Compose. CodeQL y auditorías se ejecutan por separado.
3. Para reproducir en la PC local, seguir la [guía de staging](<../../Despliegue/Guía de staging.md>) y la [guía Sonar](<../../Calidad/03 SonarQube local.md>). Las credenciales operativas permanecen fuera de Git.
4. La auditoría de interfaz se reproduce desde `src/frontend` mediante `npm run audit:accessibility -- entrega-edge edge`, con Edge instalado y la `.venv` del backend preparada. Utiliza procesos y SQLite propios en localhost.
5. Registrar revisión y observaciones en el PR único. Antes de afirmar aceptación total o Done, completar los puntos humanos y de compatibilidad indicados; no cerrar la épica únicamente por un pipeline aprobado.

## Obligaciones y plan de mejora

La consigna pide evaluar, interpretar y documentar correcciones y remediación; no exige declarar todas las categorías OWASP limpias ni implementar de inmediato toda mejora encontrada. Limitación de intentos, alertas/retención y pruebas adicionales de recuperación se conservan en el plan de mejora. No se añaden US-016 a US-023 ni infraestructura externa a esta entrega.

El adjunto remite además a «TP2-ISI Consigna del repositorio PFA», cuyo texto no acompaña el archivo recibido. Se verifican aquí las reglas explícitas de ubicación, Markdown y enlaces del adjunto; no se atribuye verificación de reglas adicionales no disponibles.

## Control documental

| Versión | Fecha | Cambio |
|---|---|---|
| V_1_0_0 | 25/10/2026 | Trazabilidad de ocho criterios, evidencia, límites y procedimiento de revisión del PR único. |

[← Volver al README](../../../README.md)
