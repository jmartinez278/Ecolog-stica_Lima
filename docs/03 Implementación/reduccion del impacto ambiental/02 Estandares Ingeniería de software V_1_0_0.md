[← Volver al README](../../../README.md) · [Informe ambiental y comparativos](<01 Informe de reduccion del impacto ambiental V_1_0_0.md>)

# Estándares de ingeniería de software y guía de desarrollo verde

**Proyecto:** EcoLogística Lima · **Líder:** Marco Jhair Martinez Llanos<br>
**Entrega:** Sprint 4 / Inspección 04 · **Versión de entrega:** v1.0.0<br>
**Revisión documental:** V_1_0_1; se conserva el nombre V_1_0_0 exigido<br>
**Aplicación:** 1.4.0 · **Actualizado:** 10/11/2026

## 1. Alcance y fundamento

Esta guía relaciona las ocho áreas implementadas con calidad, sostenibilidad y reglas de desarrollo verificables. El [informe ambiental](<01 Informe de reduccion del impacto ambiental V_1_0_0.md>) conserva el diagnóstico, el código ANTES/DESPUÉS y la medición. Los criterios de la rúbrica son presupuestos de aceptación técnica, no resultados tomados del ejemplo HTML.

El docente acepta React/TypeScript/Vite, FastAPI/SQLAlchemy, PostgreSQL y Docker según confirmación del usuario el 10/11/2026. Las equivalencias son: proyección y lecturas de filas por `.select()`/`.lean()`; índices PostgreSQL por índices MongoDB; middleware FastAPI/Caddy por Express; revalidación HTTP nativa por caché React Query. El navegador accede a la API y conserva Router → Service → Repository → PostgreSQL.

## 2. Estándares y aplicación razonada

### 2.1 ISO/IEC 25010:2023

Se adopta la edición 2023 del [modelo de calidad de producto ISO/IEC 25010](https://www.iso.org/standard/78176.html). El siguiente es un mapeo de ingeniería de las decisiones, no una declaración de certificación.

| Característica y subcaracterística | Decisión y justificación | Comprobación |
|---|---|---|
| Eficiencia de desempeño: comportamiento temporal | Índices alineados con orden/filtro y acceso público prerenderizado reducen trabajo o espera evitable. | Planes SQL y FCP/LCP/TBT; informar también cambios sin mejora. |
| Eficiencia de desempeño: utilización de recursos | Filas ligeras, páginas acotadas, compresión y validadores reducen materialización y transferencia. | Bytes lógicos/transferidos, inventario de paquetes y 304; CPU/energía física no se infieren del score. |
| Eficiencia de desempeño: capacidad | La interfaz solicita 12 registros con máximo de 50 por página; permite operar con 1.000 pedidos sin entregar toda la colección en cada vista. | Volumen idéntico antes/después y pruebas de límites/filtros. No equivale a una prueba de concurrencia. |
| Mantenibilidad: modularidad y reutilización | Parámetros HTTP, DTO, servicio y ejecución SQL están separados; hook y controles comunes evitan repetir paginación. | Imports de repositorios sin dependencia de `app.api`; revisión de capas y pruebas compartidas. |
| Mantenibilidad: analizabilidad | Locks separados, manifiesto de fuentes, presupuestos y artefactos permiten identificar qué se evaluó. | Fuente SHA-256, configuración de herramientas y comandos reproducibles. |
| Mantenibilidad: capacidad de prueba y modificación | Casos de regresión, errores, carreras de red y autorización condicional permiten cambiar módulos conservando reglas. | 59 pruebas backend por motor, 32 frontend y pruebas de herramientas. |

### 2.2 Principios de Green Software Foundation

La [formación oficial de GSF](https://greensoftware.foundation/education/) incluye eficiencia de carbono, energía, hardware, conciencia de carbono, medición y compromisos climáticos. Se desarrollan los cuatro primeros ejes que solicita esta entrega; no se afirma que sean los únicos principios de la fundación.

| Eje | Aplicación concreta | Límite y criterio de revisión |
|---|---|---|
| Eficiencia de carbono | Comparar emisiones estimadas para una misma sesión funcional, con menos transferencia. | SWDM v4 es estimación; evitar confundirlo con combustible o emisiones físicas medidas. |
| Eficiencia energética | Reducir filas serializadas, dependencias de ejecución y compresión repetida de estáticos. | Medir coste de CPU/latencia cuando se cambie compresión; menos bytes no prueba por sí solo menor potencia instantánea. |
| Eficiencia de hardware | Mantener cargas pequeñas y una interfaz utilizable en dispositivos de 360 px, sin ampliar infraestructura para esta escala. | No atribuir prolongación real de vida útil sin estudio; controlar tamaño de imagen, JS y memoria cuando se amplíe el sistema. |
| Conciencia de carbono | Conservar las operaciones interactivas disponibles y permitir programar auditorías adicionales manuales cuando exista señal verificable de intensidad menor. | No se dispone de señal temporal/regional ni se implementa desplazamiento automático. Se documenta como política condicionada; cancelar ejecuciones obsoletas ahorra trabajo, pero no acredita conciencia de carbono medida. |

La [introducción oficial de GSF](https://learn.greensoftware.foundation/practitioner/introduction/) distingue las acciones de eficiencia energética, hardware y conciencia de carbono. La medición por sesión se inspira en una unidad funcional, pero el cálculo SWDM no se presenta como una certificación ni implementación completa de la [especificación SCI](https://sci.greensoftware.foundation/).

### 2.3 W3C Web Sustainability Guidelines

Se fija como referencia verificable la [nota de grupo en borrador del 26/06/2026](https://www.w3.org/TR/2026/DNOTE-web-sustainability-guidelines-20260626/). La consigna usa los identificadores 1.2, 2.4 y 3.1 como etiquetas temáticas. Su numeración no coincide con esta edición; se conserva su intención y se declara el cruce, sin atribuir títulos inventados a W3C.

| Etiqueta de la consigna | Tema requerido | Correspondencia en la edición fijada |
|---|---|---|
| 1.2 | UI y recursos | 2.11, optimización de medios; variantes, dimensiones y carga apropiada. |
| 2.4 | Arquitectura y caché | 3.3, modularización; 3.8, recursos no críticos; 4.2, caché. |
| 3.1 | Transferencia y consultas | 3.20, consultas; 4.3, compresión. El 3.1 oficial se refiere a objetivos de rendimiento e impacto energético. |
| Complementarias | Dependencias, presupuesto y automatización | 3.4, código innecesario; 3.16, dependencias; 4.6, uso de automatización. |

Estas referencias fundamentan decisiones concretas de los apartados siguientes. No se declara conformidad integral con todas las pautas del borrador.

## 3. Matriz de mapeo directo de las ocho áreas

Las rutas de código se refieren al árbol identificado en el [manifiesto de fuentes](evidencias/validacion-20261110/source-snapshot.json). La evidencia y los ocho comparativos están en el primer informe.

| # | Optimización y código | ISO/IEC 25010 | Eje GSF | WSG de referencia | Regla verificable/evidencia |
|---|---|---|---|---|---|
| 1 | Consultas ligeras: [repositorios](../../../src/backend/app/repositories/) e [índices Alembic](../../../src/backend/alembic/versions/0003_green_list_indexes.py) | Utilización de recursos; analizabilidad | Energía y hardware | 3.20 | Proyección DTO, mappings e índice justificado por plan SQL; [planes](evidencias/validacion-20261110/postgres-after.json). |
| 2 | [Paginación SQL](../../../src/backend/app/repositories/pagination.py), [hook](../../../src/frontend/src/hooks/usePagedList.ts) y [selector](../../../src/frontend/src/components/common/ClientPicker.tsx) | Capacidad; reutilización | Energía | 3.20 y 3.3 | 12 registros en interfaz, máximo 50; filtros/conteo y cliente fuera de página probados. |
| 3 | [ResponsiveImage](../../../src/frontend/src/components/common/ResponsiveImage.tsx), [marca](../../../src/frontend/public/brand/) y [guardián](../../../src/frontend/scripts/check-images.mjs) | Comportamiento temporal | Carbono y hardware | 2.11 | Picture/AVIF/WebP/srcset/sizes; dimensiones; fallback; archivo ≤200 kB decimales (200.000 bytes). No atribuir ahorro a imágenes inexistentes en ANTES. |
| 4 | [App](../../../src/frontend/src/App.tsx), [recuperación](../../../src/frontend/src/components/common/PageErrorBoundary.tsx) y [prerender](../../../src/frontend/scripts/prerender.mjs) | Modularidad y comportamiento temporal | Energía y hardware | 3.3 y 3.8 | Chunks reales, carga/errores accesibles; acceso visible sin JS e hidratación comprobada. |
| 5 | [Lock runtime](../../../src/backend/requirements.lock), [lock dev](../../../src/backend/requirements-dev.lock) y [lock de auditoría](../../../scripts/green_it/package-lock.json) | Analizabilidad; utilización de recursos | Energía y hardware | 3.4 y 3.16 | Instalación con hashes, auditorías y comparación de distribuciones/almacenamiento reales. |
| 6 | [Favicon SVG inline](../../../src/frontend/index.html) | Comportamiento temporal | Carbono | 3.4 y 4.3 | Evitar petición favicon; contar también la nueva marca y chunks. El total global puede aumentar aunque se elimine una solicitud concreta. |
| 7 | [ETag](../../../src/backend/app/core/http_cache.py), [cliente HTTP](../../../src/frontend/src/api.ts) y [Caddy](../../../src/frontend/Caddyfile.staging) | Comportamiento temporal; modularidad | Energía | 4.2 | 304 autorizado, private/no-cache, Vary, invalidación; no-store para errores/login/escrituras y assets con hash immutable. |
| 8 | [Middleware](../../../src/backend/app/main.py) y [precompresión](../../../src/frontend/scripts/precompress.mjs) | Utilización de recursos y capacidad | Carbono y energía | 4.3 | Negociación Gzip/Brotli, contenido equivalente y bytes reales; zstd es complementario. |

## 4. Guía de desarrollo verde y arquitectura

### 4.1 Backend

1. El router recibe y valida HTTP; el servicio coordina la operación; el repositorio construye/ejecuta SQL. No importar `app.api` desde repositorios. `PageParams` está en `core`, el DTO `Page` en `schemas` y las utilidades SQL en `repositories`.
2. Todo listado nuevo debe estar paginado en servidor y toda consulta de la interfaz usar `page/limit`. La ruta de compatibilidad sin `page` de los cuatro recursos existentes conserva contratos anteriores y puede entregar la colección completa; es una excepción explícita, no la política para nuevas pantallas.
3. Seleccionar columnas de salida y leer mappings en listados. No cargar entidades completas para descartarlas después. Elegir índices por consultas y planes medidos; no crear un índice por cada campo sin justificación de coste/escrituras.
4. Mantener validación Pydantic, UUID, unicidad, transacciones, auditoría y RBAC. Un ETag conocido nunca elude autorización. Probar 401/403 incluso con `If-None-Match` y después de retirar roles.
5. Los datos operativos solo se almacenan en caché privada revalidable cuando procede; autenticación, escrituras y errores son `no-store`. No introducir caché compartida de usuarios, tokens o roles. Las mutaciones recargan la lectura y modifican el validador.
6. Mantener migraciones incrementales. Respaldar bases utilizadas y resolver conflictos explícitamente; los índices Green IT no deben borrar información. Las pruebas destructivas solo usan una base `*_test` independiente.
7. Separar dependencias runtime/dev y mantener hashes de locks. Ejecutar la auditoría completa al cambiarlos. No retirar validación/seguridad para mejorar tamaño o score.
8. La semilla de carga exige `GREEN_AUDIT_SEED=1`, nombre `*_test` y estado vacío esperado. Rechaza bases no preparadas o parciales y no elimina datos para regenerar un ensayo.

### 4.2 Frontend

1. Solicitar bloques de 12, reflejar total/página, reiniciar al filtrar y descartar peticiones obsoletas. La selección de clientes debe funcionar fuera de la página visible sin descargar la colección completa.
2. Usar `React.lazy` y `Suspense` para módulos secundarios, con estado accesible y recuperación ante fallo. No diferir funcionalidad o esconder contenido solo durante auditorías.
3. Prerenderizar únicamente contenido público estable y sin credenciales; hidratar los mismos controles. No serializar tokens ni datos operativos en HTML. Probar con JS desactivado y revisar errores de hidratación con JS activado.
4. Usar `ResponsiveImage` con variantes AVIF/WebP, fallback JPG, tamaños por viewport/densidad y dimensiones. Lazy fuera de pantalla; carga inmediata para un recurso inicialmente visible. El build rechaza archivos fuera de la política; comprobar coste real en vez de asumir que AVIF siempre es menor.
5. Mantener iconos pequeños inline cuando ahorren solicitudes. No usar fuentes de iconos externas para unos pocos símbolos. Contar el coste de HTML y la pérdida de caché al decidir inline.
6. Preferir APIs nativas cuando satisfagan los requisitos (`fetch`, `Intl`, `Set`, `AbortController`). Antes de una dependencia nueva, registrar necesidad y tamaño de bundle, actualizar lock y comprobar auditoría/build.
7. Conservar token en memoria, foco, teclado, estados/errores visibles y navegación desde 360 px. Un build de producción debe conservar la misma funcionalidad que desarrollo.
8. Evaluar carga fría y revalidación por separado. Las medianas deben incluir todos los ensayos y dispositivos del protocolo, sin escoger solo el más favorable.

### 4.3 Clean Code, SOLID, DRY y YAGNI

| Principio | Aplicación | Revisión concreta |
|---|---|---|
| Clean Code | Nombres orientados a propósito, estados tipados y errores claros; funciones con responsabilidad acotada. | No duplicar reglas de dominio en UI; conservar manejo explícito de vacío/error/carga. |
| SOLID: responsabilidad única | Dependencia HTTP, coordinación, SQL, serialización y caché en módulos distintos. | Revisar imports y que el router no ejecute consultas ni el repositorio dependa de HTTP. |
| SOLID: extensión | Otro listado reutiliza DTO/parámetros/ejecutor pasando una consulta; componentes reciben props explícitas. | Añadir prueba de un recurso nuevo sin modificar lógica común de los existentes. |
| SOLID: sustitución, interfaces y dependencias | Conservar contrato legacy deliberado, interfaz paginada tipada y separación de detalles de transporte/persistencia. | Probar ambos contratos y evitar interfaces globales que obliguen a un componente a conocer toda la aplicación. No introducir abstracciones solo para citar SOLID. |
| DRY | Ejecutor SQL, hook, Pagination, ClientPicker y ResponsiveImage compartidos. | Una corrección de paginación/ETag debe beneficiar a los cuatro recursos; comparar antes de copiar código. |
| YAGNI | Evitar Redis, CDN, TanStack Query o motor de rutas cuando no son necesarios para esta entrega. | Justificar cualquier nueva infraestructura con necesidad y medición; las herramientas de auditoría son de desarrollo y no viajan al cliente. |

## 5. CI/CD verde, calidad y gestión de versiones

[green-audit.yml](../../../.github/workflows/green-audit.yml) usa acciones fijadas, permisos mínimos y concurrencia por rama para cancelar auditorías obsoletas. Instala desde locks, comprueba matemáticas/imágenes, prepara un proyecto Compose aislado, carga datos sintéticos, ejecuta LHCI y tres auditorías por dispositivo con recorrido autenticado, aplica presupuestos y conserva artefactos. Las credenciales temporales no se suben como artefacto; los reportes no se envían a almacenamiento público temporal. La limpieza afecta solo al proyecto CI creado para esa ejecución.

[Los presupuestos](../../../lighthouserc.json) exigen score ≥90, FCP ≤1.000 ms, LCP ≤1.400 ms, TBT ≤85 ms, CLS ≤0,02 y 1.100.000 bytes. [check_budgets.py](../../../scripts/green_it/check_budgets.py) añade móvil y sesión autenticada; sus pruebas demuestran que una métrica fuera de límite falla. El comando local LHCI pasó tres corridas con sus aserciones, conservadas en la evidencia. La ejecución en GitHub de esta revisión permanece pendiente de publicar el código y ejecutar el workflow final.

Los controles generales CI, CodeQL y dependencias incluyen las ramas del Sprint 4. Se conservan Pytest con cobertura ≥80 %, PostgreSQL aislado, Vitest/RTL, compilación y enlaces Markdown. La auditoría de npm del frontend y herramientas no informa vulnerabilidades; ello no equivale a ausencia universal de riesgos.

La [secuencia Git y su estado real](<01 Informe de reduccion del impacto ambiental V_1_0_0.md>) incluye mkdir, git add, git commit y git push en rama de trabajo. El usuario autorizó el commit local; push y merge requieren autorización adicional. La ejecución remota no se presenta como realizada. La revisión por pares y aprobación formal del entregable también conservan su estado pendiente.

## 6. Matriz de verificación documental y de rúbrica

| Criterio | Evidencia prevista o disponible | Cierre pendiente |
|---|---|---|
| Refactorización/impacto, 11 puntos | Ocho áreas comparadas, métricas locales, JSON/HTML y fórmulas reproducibles en informe 1. | Revisión académica de las equivalencias y de la evidencia técnica; stack aceptado según confirmación del usuario. |
| Estándares/guía, 4 puntos | ISO/IEC 25010, cuatro ejes GSF, cruce WSG y matriz 8/8 con reglas verificables. | Revisión independiente del contenido. |
| CI/CD/Git, 3 puntos | Workflow y LHCI local funcional, rutas/nombres exactos y versión de entrega v1.0.0. | Publicación y ejecución de este cambio en GitHub, con su evidencia. |
| Comunicación, 2 puntos | Dos archivos con nombres solicitados, tablas y bloques delimitados, enlaces relativos bidireccionales. | Aprobación docente final. |

Los archivos oficiales se conservan en `docs/03 Implementación/reduccion del impacto ambiental/` con los nombres exactos de la consigna. Los datos temporales de auditoría y las credenciales no se versionan. Las evidencias publicables corresponden únicamente a datos sintéticos y al código identificado.

## 7. Fuentes

- [ISO/IEC 25010:2023, modelo de calidad de producto](https://www.iso.org/standard/78176.html).
- [GSF, formación y principios](https://greensoftware.foundation/education/), [introducción del curso](https://learn.greensoftware.foundation/practitioner/introduction/) y [especificación SCI](https://sci.greensoftware.foundation/).
- [W3C WSG, nota de grupo en borrador del 26/06/2026](https://www.w3.org/TR/2026/DNOTE-web-sustainability-guidelines-20260626/).
- [Sustainable Web Design Model v4](https://sustainablewebdesign.org/estimating-digital-emissions/).
- Consigna HTML y rúbrica PDF aportadas por el usuario: nombres y huellas SHA-256 registrados en la [épica ECO-72](https://jhonpaitanrcm.atlassian.net/browse/ECO-72).

## 8. Control documental

| Revisión | Fecha | Cambio |
|---|---|---|
| V_1_0_0 | 10/11/2026 | Documento heredado de `respaldo-frontend`, commit `e7ac3ff`. |
| V_1_0_1 | 10/11/2026 | Reglas contrastadas con código corregido, fuentes con edición explícita, matriz completa y límites de validación/publicación. Nombre de archivo exigido conservado. |

[← Volver al README](../../../README.md)
