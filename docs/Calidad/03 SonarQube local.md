[← Volver al README](../../README.md)

# Preparación del análisis local con SonarQube

**Versión documental:** 1.0.3 · **Actualizado:** 25/10/2026 (Lima).

## Alcance

Análisis local de ECO-53 sobre la base integrada 1.2.4 y el incremento de `Sprint-3`, consolidado en el [PR #4](https://github.com/jmartinez278/Ecolog-stica_Lima/pull/4). Comprende Python, TypeScript/React y CSS del alcance configurado. El análisis vigente identifica el código del commit `3c1b45d` y un árbol limpio al comenzar; las secciones iniciales conservan sus cortes históricos. Sonar no acredita aceptación humana ni todas las categorías OWASP. El despliegue localhost se verifica [por separado](<../03 Implementación/Sprint 03/evidencias/staging-local.json>).

## Herramientas y configuración

- SonarQube Community Build 26.10.0.133078 y JDK 21, con servidor local en `http://localhost:9000`.
- Proyecto SonarQube `ecologistica-lima`, independiente de los repositorios GitHub.
- SonarScanner para NPM `@sonar/scan@5.0.2`, ejecutado con `npx`.
- Entorno Python 3.12 en `.venv/`, con dependencias de `src/backend/requirements.txt`.
- Vitest 5.0.5 y `@vitest/coverage-v8` 5.0.5 para el reporte LCOV.
- Alcance y rutas definidos en [sonar-project.properties](../../sonar-project.properties).

En esta PC se utilizan Python 3.12.13 y Node.js 24.14.1. El CI existente utiliza Node.js 22; una validación local no reemplaza la del entorno de CI.

## Generar pruebas y cobertura

Desde la raíz del repositorio, con el entorno Python y las dependencias frontend preparados:

```powershell
Push-Location src/backend
try {
    & ../../.venv/Scripts/python.exe -m pytest -q --cov=app --cov-report=term-missing --cov-report=xml:coverage.xml --cov-fail-under=80
} finally {
    Pop-Location
}
npm.cmd --prefix src/frontend run test:coverage -- --maxWorkers=1
npm.cmd --prefix src/frontend run build
```

Comprobar que cada comando finaliza correctamente antes de continuar. Para la ejecución inicial se utilizó SQLite temporal de las pruebas, sin configurar `TEST_DATABASE_URL`; no se reutilizó ninguna base existente. PostgreSQL debe verificarse posteriormente con un entorno desechable independiente.

Los reportes son `src/backend/coverage.xml` y `src/frontend/coverage/lcov.info`. Se ignoran en Git junto con `.scannerwork/`; conservar como evidencia los resultados asociados a la ejecución. La cobertura incluye el código fuente de aplicación; los archivos de pruebas y su preparación se clasifican por separado.

## Ejecutar el análisis

Crear un token de análisis del proyecto desde la cuenta SonarQube autorizada. Introducirlo en una terminal propia; no incluirlo en archivos versionados, comandos literales ni mensajes del chat:

```powershell
$sonarSecureToken = Read-Host 'Token de análisis del proyecto' -AsSecureString
$env:SONAR_TOKEN = [System.Net.NetworkCredential]::new('', $sonarSecureToken).Password
$env:SONAR_HOST_URL = 'http://localhost:9000'
try {
    npx.cmd --yes @sonar/scan@5.0.2 '-Dsonar.qualitygate.wait=true'
} finally {
    Remove-Item Env:SONAR_TOKEN -ErrorAction SilentlyContinue
    Remove-Variable sonarSecureToken -ErrorAction SilentlyContinue
}
```

El scanner puede obtener su runtime Java automáticamente. Si se utiliza el JDK instalado, configurar `JAVA_HOME` y su carpeta `bin` en el `PATH` de esa terminal, y pasar `-Dsonar.scanner.skipJreProvisioning=true`. En equipos con memoria ajustada pueden limitarse el heap del scanner mediante `SONAR_SCANNER_JAVA_OPTS` y el de JavaScript mediante `sonar.javascript.node.maxspace`.

Un código de salida por Quality Gate fallido debe investigarse en el panel: distinguir un análisis procesado con hallazgos de un fallo de ejecución. No cambiar umbrales ni excluir código para ocultar resultados.

## Validación inicial de las pruebas

| Comprobación local | Resultado |
|---|---|
| Backend sobre SQLite temporal | 27 pruebas aprobadas; cobertura de líneas 92,85 % |
| Frontend | 6 pruebas aprobadas |
| Cobertura frontend de líneas | 83,16 % |
| Cobertura frontend de sentencias | 82,74 % |
| Cobertura frontend de funciones | 79,13 % |
| Compilación TypeScript/Vite | Aprobada |

Las métricas anteriores proceden de Pytest/Coverage.py y Vitest. La cobertura calculada por SonarQube puede diferir por su definición de líneas y condiciones; registrar ambas con su origen.

## Evidencias y pendientes

### Primer análisis procesado

El análisis `1b97743a-d6f8-4bae-bcd3-49a1fd34a68b` se procesó el **24/10/2026 a las 23:13:57 de Lima**. La [instantánea de la API](evidencias-sonar/2026-10-24-inicial.json) conserva los identificadores, métricas y hallazgos sin credenciales. El [panel local](http://localhost:9000/dashboard?id=ecologistica-lima) requiere acceso al servidor de esta PC.

| Métrica de SonarQube | Resultado inicial |
|---|---|
| Procesamiento | SUCCESS |
| Quality Gate devuelto | OK / PASSED |
| Cobertura combinada de líneas y condiciones | 89,5 % |
| Cobertura de líneas | 90,8 % |
| Cobertura de condiciones | 82,7 % |
| Duplicación | 0,0 % |
| Bugs | 4, severidad MAJOR |
| Vulnerabilidades detectadas | 0 |
| Code smells | 0 |
| Security hotspots detectados | 0 |
| Deuda técnica de mantenibilidad (`sqale_index`) | 0 minutos |

**Límite del Quality Gate:** es la primera línea base y la API devolvió `conditions: []`. Por ello, el estado aprobado no demuestra evaluación efectiva del código nuevo ni ausencia de defectos. Se conservaron las reglas y umbrales del servidor sin alterarlos. El scanner omitió el análisis de dependencias SCA; mantener las auditorías de dependencias por separado.

Los cuatro bugs corresponden a `typescript:S9011`: declarar explícitamente el atributo `type` de los botones de envío en `ClientForm.tsx:23`, `DriverForm.tsx:25`, `OrderForm.tsx:33` y `VehicleForm.tsx:27`. El servidor estima dos minutos por hallazgo; esa estimación no incluye pruebas ni revisión. En este corte inicial estaban pendientes de corrección y verificación; la remediación posterior se documenta a continuación.

Durante esta ejecución se utilizó un token temporal restringido al análisis del proyecto y se revocó al terminar. No se guardaron tokens en el repositorio.

### Corrección y segundo análisis

Se añadió `type="submit"` a los cuatro botones de envío, manteniendo `type="button"` en las acciones de cancelar. Se repitieron las seis pruebas frontend con cobertura y la compilación TypeScript/Vite: ambas comprobaciones aprobaron y la cobertura de líneas permaneció en 83,16 %. No hubo cambios backend; para el análisis se reutilizó su reporte de cobertura del corte inicial.

El análisis `7365e9ba-3c8a-4e8e-9513-e7d34b7a7cda`, versión de análisis `1.2.4-sprint3-remediacion`, se procesó el **24/10/2026 a las 23:19:45 de Lima**. La [evidencia de remediación](evidencias-sonar/2026-10-24-remediacion.json) registra los cuatro hallazgos cerrados automáticamente como `FIXED`, cero problemas abiertos, cero bugs y un Quality Gate aprobado.

| Condición de código nuevo | Umbral del servidor | Resultado |
|---|---|---|
| Cobertura | Al menos 80 % | 93,8 %, aprobado |
| Duplicación | Como máximo 3 % | 0,0 %, aprobado |
| Nuevos problemas | 0 | 0, aprobado |

Esta vez el servidor devolvió las tres condiciones evaluadas y ninguna ignorada. El período de referencia es la versión anterior `1.2.4-sprint3-baseline`; no se cambiaron umbrales, perfiles ni exclusiones para obtener ese resultado. La cobertura global de Sonar permanece en 89,5 %, la cobertura de líneas en 90,8 % y la duplicación global en 0,0 %. Las métricas de vulnerabilidades, code smells y hotspots detectados son cero dentro del alcance y los perfiles activos.

Los cambios siguen sin commit y el scanner advierte falta de información `blame` en los cuatro formularios modificados; se debe repetir la validación sobre la revisión definitiva antes de publicar. El token temporal de esta segunda ejecución también se revocó. El resultado no sustituye las evaluaciones OWASP/WCAG, la revisión independiente ni la aceptación del Sprint 3.

### Consolidación de resultados

### Corte del incremento completo del Sprint 3

La [evidencia final](<../03 Implementación/Sprint 03/evidencias/sonar-final.json>) y el [informe oficial](<../03 Implementación/Sprint 03/03 Calidad de código V_1_0_0.md>) incorporan seguridad y accesibilidad: 36 pruebas backend en SQLite y PostgreSQL, 7 frontend, cobertura backend 93,43 % y de líneas frontend 83,41 %. El análisis `27f7541e-5ee3-474a-9461-d27b17198d8f`, del 24/10/2026 a las 23:39:58 de Lima, registra cobertura global 89,9 %, 100 % de cobertura de código nuevo, duplicación 0 % y cero problemas abiertos. Aprueba las tres condiciones del Quality Gate sin modificar sus umbrales.

La [evaluación de accesibilidad](<../03 Implementación/Sprint 03/05 WCAG V_1_0_0.md>) conserva resultados automáticos y pendientes humanos. La rama de entrega es `Sprint-3`; los resultados de los dos cortes anteriores se mantienen como antecedentes.

### Corte consolidado para revisión — 25/10/2026

La [evidencia vigente](<../03 Implementación/Sprint 03/evidencias/sonar-entrega.json>) corresponde al análisis `7e922f0a-7e3c-467e-ab4a-1052f14d1855`, procesado a las 01:15:24 de Lima sobre `3c1b45d2f98011a0c355f9343b10928aed5c7269`. Quality Gate `OK`, tres condiciones evaluadas, cobertura global 92,4 %, código nuevo 100 %, duplicación 0 %, cero problemas abiertos y deuda Sonar 0 minutos. No se cambiaron umbrales, perfiles ni exclusiones. Se revocó el token temporal al terminar.

La ejecución previa del commit publicado `cde28d7`, análisis `dfc82560-3601-494b-9ee7-6182c662f80b`, aprobó con cobertura global 89,9 % y nueva 95,8 %. La nueva suite de 11 pruebas frontend alcanza 92,19 % de líneas y 100 % en los cuatro formularios; el backend conserva 36 pruebas y 93,43 % de líneas. Consultar el [informe oficial actualizado](<../03 Implementación/Sprint 03/03 Calidad de código V_1_0_0.md>).

### Operación y límites

- Las evidencias y el plan de remediación ya están preparados en el informe oficial; no son entregables pendientes de creación.
- Revisión independiente, demostración/aceptación y límites de WCAG se comprueban por separado.
- Sonar se ejecuta en esta PC. Un runner alojado en GitHub no puede acceder a este localhost; el análisis remoto no es requisito de esta entrega.
- La cuenta de administración local debe gestionar su contraseña desde la interfaz del servidor. No se incorpora ninguna credencial al repositorio.

## Historial documental

| Versión | Fecha | Cambio |
|---|---|---|
| 1.0.0 | 24/10/2026 | Preparación del entorno y primer análisis local con cuatro hallazgos. |
| 1.0.1 | 24/10/2026 | Corrección de los cuatro botones, pruebas frontend y segundo análisis con condiciones de Quality Gate aprobadas. |
| 1.0.2 | 24/10/2026 | Corte completo del Sprint 3, seguridad, accesibilidad y enlace a los cinco informes oficiales. |
| 1.0.3 | 25/10/2026 | Análisis sobre commit limpio, resultados actuales y antecedentes de la revisión publicada. |
