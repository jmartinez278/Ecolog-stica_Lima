[← Volver al README](../../../README.md)

# Reporte de Seguridad OWASP Top 10 (2025)

**Nombre del Proyecto:** EcoLogística Lima<br>
**Herramienta de Escaneo:** SonarQube Community Build 26.10.0.133078; complementos Pytest, pip-audit y npm audit.<br>
**Versión documental:** V_1_0_1 · **Actualizado:** 25/10/2026 (Lima).<br>
**Alcance:** API FastAPI, persistencia y frontend de las funcionalidades US-001 a US-015, en la rama `Sprint-3`.

## 1. Matriz de Cumplimiento OWASP Top 10 2025

**Actualización de alcance, 25/10/2026:** únicamente localhost, según la [adenda versionada](<Alcance de validación local V_1_0_0.md>). El [entorno verificado](evidencias/staging-local.json) utiliza HTTP de loopback y HTTPS con CA interna; no se exige servidor ni DNS público.

Se utiliza la [lista oficial OWASP 2025](https://top10.owasp.org/2025/). La tabla de la consigna conserva nombres y orden de 2021 bajo el rótulo 2025; se mantiene la estructura solicitada y se corrige la clasificación. SSRF se revisa dentro del control de acceso y de los servicios aplicables, no como una categoría A10 independiente de 2025.

| Categoría OWASP 2025 | Estado en proyecto | Hallazgos de SonarQube y comprobaciones complementarias |
|---|---|---|
| A01 — Broken Access Control | Bajo revisión; controles probados | Sin vulnerabilidades notificadas en el corte Sonar disponible. Las pruebas verifican 401 sin autenticación y 403 ante escrituras de AUDITOR en vehículos, pedidos, conductores y clientes. Falta completar la matriz de todos los roles y alcance por objeto. |
| A02 — Security Misconfiguration | Bajo revisión; entorno local verificado | Gateway limitado a 127.0.0.1, API y PostgreSQL sin puertos publicados. Se verifican cabeceras nosniff, DENY y no-referrer y rechazo sin autenticación. SonarQube mantiene controles de acceso independientes. |
| A03 — Software Supply Chain Failures | Limpio en las auditorías ejecutadas; alcance limitado | [pip-audit](evidencias/python-audit.json) y [npm audit](evidencias/npm-audit.json) no detectaron avisos conocidos en esta ejecución. npm incluye dependencias de desarrollo. El scanner Sonar omitió SCA y la auditoría no certifica la cadena completa de suministro. |
| A04 — Cryptographic Failures | Bajo revisión; controles probados | Contraseñas con scrypt, sal aleatoria y comparación constante; JWT con clave configurada. TLS 1.3 local verifica cadena y hostname con la CA seleccionada. Secretos generados fuera del repositorio. HTTP se limita a loopback y no se presenta como tráfico cifrado. |
| A05 — Injection | Bajo revisión; caso negativo probado | SQLAlchemy construye las consultas mediante parámetros. El intento de entrada SQL en el login devuelve 401 sin token. React presenta los valores como texto; no se considera probada toda variante de inyección mediante un único caso. |
| A06 — Insecure Design | Bajo revisión | Las pruebas existentes verifican restricciones de estados y transacciones. Faltan análisis de abuso, límites de recursos y reglas de futuras rutas. No se atribuye implementación de US-016 a US-023. |
| A07 — Authentication Failures | Bajo revisión; defecto corregido | Se reprodujo la aceptación de un JWT firmado sin `exp` y se corrigió exigiendo `exp` y `sub`. Se verifican token vencido, sin firma y sin expiración. Quedan limitación de intentos, política de sesión y demás controles de autenticación por definir. |
| A08 — Software or Data Integrity Failures | Bajo revisión; controles probados | Hay migraciones explícitas, índice único de correo y pruebas de rollback junto con auditoría. Las 36 pruebas y migraciones se verificaron en PostgreSQL 16 aislado. El [despliegue local](evidencias/staging-local.json) acredita frontend, salud, login, lectura protegida y TLS; el procedimiento Compose es reproducible. La auditoría de interfaz utiliza SQLite propio. |
| A09 — Security Logging and Alerting Failures | Bajo revisión | Se registran escrituras críticas y sus rechazos. No se acreditan alertas operativas, retención centralizada ni registro completo de los intentos de login. |
| A10 — Mishandling of Exceptional Conditions | Bajo revisión; pruebas parciales | Se ejecutan casos 401/403/404/409/422 y rollback. Las pruebas negativas de JWT evitan aceptar credenciales incompletas. Quedan fallos de infraestructura, agotamiento de recursos y recuperación del servicio. |

“Limpio” describe únicamente las comprobaciones indicadas. No se declara una categoría segura por la ausencia de alertas estáticas. El estado “Bajo revisión” conserva las limitaciones técnicas y de entorno pendientes.

## 2. Detalles de Security Hotspots y Vulnerabilidades Críticas

SonarQube no generó security hotspots ni vulnerabilidades en el [análisis de entrega](evidencias/sonar-entrega.json), revisión `3c1b45d`, con Quality Gate aprobado. **Hotspot #1 y Hotspot #2: no aplican; se detectaron cero.** El análisis usa los perfiles activos `Sonar way core`; no sustituye una prueba de penetración ni todos los controles de OWASP. Los cuatro problemas corregidos S9011 son de fiabilidad, no se presentan como vulnerabilidades.

### SEC-01 — Token firmado sin fecha de expiración

- **Categoría:** A07; relacionado con validación estricta de entradas de autenticación.
- **Origen:** prueba dinámica local, no una alerta de SonarQube.
- **Ubicación:** `src/backend/app/core/security.py`, función `user_from_token`.
- **Reproducción:** un JWT firmado con la clave de las pruebas y `sub` válido, pero sin `exp`, obtuvo HTTP 200 donde se esperaba 401. La ejecución inicial de las nuevas pruebas arrojó 1 fallo y 8 aprobaciones.
- **Impacto y límite:** la API no imponía caducidad a un token emitido sin esa propiedad. El caso requiere un token firmado válido; no demuestra obtención de la clave ni evasión de la firma.
- **Corrección aplicada:** `jwt.decode` requiere las propiedades `exp` y `sub`, conservando el algoritmo permitido HS256.
- **Verificación:** las nueve pruebas nuevas y la suite backend completa pasan: 36 pruebas en SQLite temporal y 36 en PostgreSQL 16 aislado, cobertura 93,43 %. Se incluye rechazo de token vencido y de algoritmo `none`; las migraciones llegan a head y `alembic check` no detecta deriva.
- **Estado:** corregido y probado localmente; revisión independiente pendiente.

## 3. Evidencias, límites y seguimiento

La matriz distingue el resultado estático común (cero vulnerabilidades y hotspots dentro de los perfiles activos) de las comprobaciones complementarias por categoría. Sonar no acredita por sí solo las diez categorías completas. Los estados bajo revisión explicitan cobertura pendiente; no equivalen a vulnerabilidades confirmadas. Limitación de intentos, alertas, retención y recuperación son acciones de mejora que se priorizan en el backlog, no requisitos adicionales atribuidos a esta consigna.

| Control | Evidencia | Resultado |
|---|---|---|
| Análisis estático Sonar | [informe de calidad](<03 Calidad de código V_1_0_0.md>) y JSON referenciados | Consultar el corte identificado; repetir si cambia el código |
| Dependencias Python | [python-audit.json](evidencias/python-audit.json) | Sin vulnerabilidades conocidas detectadas en esta ejecución |
| Dependencias frontend | [npm-audit.json](evidencias/npm-audit.json) | 0 avisos en todas las severidades |
| Pruebas negativas y control de acceso | [test_security_assessment.py](../../../src/backend/tests/test_security_assessment.py), [JUnit PostgreSQL](evidencias/backend-postgres.xml) | 9 casos nuevos; suite completa 36/36 en cada base |
| Integridad y auditoría | Tests existentes de rollback, duplicados y restricciones | Verificación automatizada; no aceptación humana |
| Comunicación y configuración local | [staging-local.json](evidencias/staging-local.json) y [guía de despliegue](<../../Despliegue/Guía de staging.md>) | TLS 1.3, certificado verificado, cabeceras y puertos limitados a loopback |

El informe registra resultados técnicos sobre datos de pruebas. Antes del cierre se requiere revisar los pendientes con responsable, conservar la validación de la revisión final y acreditar la aceptación aplicable del DoD dentro del alcance localhost. Las auditorías reflejan avisos conocidos al ejecutarse; no garantizan ausencia de vulnerabilidades futuras.

## Control documental

| Versión | Fecha | Cambio |
|---|---|---|
| V_1_0_0 | 24/10/2026 | Matriz OWASP 2025, auditorías reales y remediación de JWT sin expiración. |
| V_1_0_1 | 25/10/2026 | Evidencia del commit de entrega, cero hotspots y despliegue localhost ya acreditado; límites y backlog explícitos. |

[← Volver al README](../../../README.md)
