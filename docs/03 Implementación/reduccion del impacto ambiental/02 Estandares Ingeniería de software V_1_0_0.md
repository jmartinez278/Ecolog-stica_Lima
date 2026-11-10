[← Volver al README](../../../README.md) · [Informe de reducción del impacto ambiental](<01 Informe de reduccion del impacto ambiental V_1_0_0.md>)

# Estándares de Ingeniería de Software y Guía de Desarrollo Verde

**Nombre del Proyecto:** EcoLogística Lima<br>
**Líder del Proyecto:** Marco Jhair Martinez Llanos<br>
**Entrega:** Inspección 04 — Reducción del impacto ambiental y estándares de ingeniería de software<br>
**Versión del documento:** V_1_0_0 · **Versión semántica de la entrega:** v1.0.0<br>
**Stack:** React 19 + TypeScript + Vite · FastAPI + SQLAlchemy 2 · PostgreSQL 16 · Caddy 2<br>
**Fecha de actualización:** 10/11/2026

## 1. Propósito y alcance

Este documento fundamenta las ocho optimizaciones descritas en el [informe de reducción del impacto ambiental](<01 Informe de reduccion del impacto ambiental V_1_0_0.md>) en tres marcos de referencia. El primero es la norma de calidad de producto ISO/IEC 25010. El segundo son los principios de la Green Software Foundation (GSF). El tercero son las W3C Web Sustainability Guidelines (WSG 1.0). Además, define las reglas de desarrollo verde que el equipo aplicará en adelante en backend y frontend.

La consigna se redactó para el stack MERN. EcoLogística Lima no usa MongoDB, Express ni Node.js en el servidor, por lo que cada optimización se implementa con su **equivalente técnico real** en el stack del proyecto. La correspondencia se detalla en la sección 1.4 del informe.

## 2. Relación de estándares internacionales aplicados

### 2.1 ISO/IEC 25010 — Modelo de calidad del producto de software

| Característica | Subcaracterística | Cómo se evidencia en EcoLogística Lima |
|---|---|---|
| Eficiencia de desempeño | Comportamiento temporal | La primera página de pedidos pasa de *Seq Scan + Sort* (0,265 ms, 30 bloques) a *Index Scan* (0,043 ms, 3 bloques) en PostgreSQL. El FCP móvil se reduce según la tabla comparativa del informe. |
| Eficiencia de desempeño | Utilización de recursos | Hay menos bytes por sesión gracias a la paginación, la compresión y el 304. No se crean objetos ORM en los listados. La imagen de ejecución lleva 10 paquetes Python menos. |
| Eficiencia de desempeño | Capacidad | El tamaño de respuesta queda acotado (máximo 50 registros por página), con independencia del volumen de pedidos almacenado. |
| Mantenibilidad | Modularidad | `app/api/pagination.py` y `app/core/http_cache.py` son módulos únicos reutilizados por los cuatro listados. El frontend se divide en fragmentos cargados bajo demanda. |
| Mantenibilidad | Reusabilidad | `projected_columns()` y `fetch()` se aplican a cualquier entidad con su esquema de salida. |
| Mantenibilidad | Analizabilidad | Las dependencias de ejecución (`requirements.lock`) están separadas de las de prueba (`requirements-dev.lock`). Hay presupuestos explícitos en `lighthouserc.json`. |
| Mantenibilidad | Capacidad de ser probado | 13 pruebas nuevas en `tests/test_green_it.py` (paginación, ETag/304, compresión y validación de parámetros). Los módulos nuevos tienen 100 % de cobertura. |
| Compatibilidad | Coexistencia | Sin `?page=` la API conserva el contrato anterior (lista completa), por lo que los clientes previos no se rompen. |

### 2.2 Principios de la Green Software Foundation

| Principio | Definición operativa | Aplicación en el proyecto |
|---|---|---|
| Eficiencia de carbono | Emitir la menor cantidad de carbono por unidad de trabajo útil. | Se miden los gramos de CO2e por sesión de operador con SWDM v4 y se reducen en el porcentaje indicado en el informe. |
| Eficiencia energética | Consumir la menor energía posible por unidad de trabajo. | Hay menos datos transferidos (energía de red y de dispositivo) y menos trabajo de CPU (sin ordenar 1 000 filas ni hidratar objetos). |
| Eficiencia de hardware | Usar la menor cantidad de hardware incorporado posible. | La imagen del backend es más pequeña, los assets son inmutables y quedan en caché, y el JavaScript inicial es menor, lo que importa en equipos modestos de operadores y conductores. |
| Conciencia de carbono | Hacer más cuando la energía es más limpia y menos cuando es más sucia. | El trabajo pesado se reduce de forma permanente en lugar de desplazarse. La auditoría LHCI se ejecuta solo en *push* o *pull request*, no de forma programada. Se declara como mejora futura en la sección 5. |

La medición se apoya en la idea de la especificación SCI (*Software Carbon Intensity*) de la GSF: expresar las emisiones por unidad funcional. Aquí esa unidad es la **sesión de operador**, que comprende el acceso y la consulta de los cuatro listados.

### 2.3 W3C Web Sustainability Guidelines (WSG 1.0)

La consigna numera las pautas como 1.2, 2.4 y 3.1. El borrador vigente de la W3C las organiza por categorías: *User Experience Design*, *Web Development*, *Hosting, Infrastructure, and Systems* y *Business Strategy and Product Management*. La tabla relaciona cada referencia de la consigna con el título oficial de la pauta.

| Referencia de la consigna | Pauta oficial WSG 1.0 (título) | Aplicación |
|---|---|---|
| 1.2 — UI y recursos | *Optimize media to reduce resource use* (UX Design) | Imágenes en WebP/AVIF con `<picture>`, ícono SVG inline y ninguna imagen ráster sin optimizar. |
| 2.4 — Arquitectura y caché | *Modularize bandwidth-heavy components* (Web Development) y *Optimize caching and support offline access* (Hosting) | `React.lazy`/`Suspense`, ETag con 304 en la API y `Cache-Control: immutable` en los assets con hash. |
| 3.1 — Red | *Reduce data transfer with compression* (Hosting) y *Use sustainable JavaScript and APIs* (Web Development, criterio *API requests*) | GZip/zstd dinámico, Brotli precomprimido y respuestas que solo incluyen los datos que la vista necesita (paginación y proyección). |
| Complementarias | *Minify and remove unused code*, *Use dependencies sparingly and maintain them*, *Reduce the number and complexity of database queries*, *Set goals based on performance and energy impact* | Build minificado, dependencias de prueba fuera de la imagen, índices compuestos y presupuestos de Lighthouse en CI. |

## 3. Matriz de mapeo directo: optimizaciones frente a estándares

| # | Optimización aplicada en EcoLogística Lima | ISO/IEC 25010 | Principio GSF | Pauta W3C WSG 1.0 |
|---|---|---|---|---|
| 1 | Consultas con proyección de columnas, filas sin hidratación ORM e índices compuestos | Eficiencia de desempeño: utilización de recursos | Eficiencia de hardware | *Reduce the number and complexity of database queries* (3.1 en la consigna) |
| 2 | Paginación de 12 registros en API y listados React | Eficiencia de desempeño: capacidad | Eficiencia energética | *Use sustainable JavaScript and APIs*, criterio *API requests* (3.1) |
| 3 | Imágenes WebP/AVIF con `<picture>` y carga diferida | Eficiencia de desempeño: comportamiento temporal | Eficiencia de carbono | *Optimize media to reduce resource use* (1.2) |
| 4 | Code splitting con `React.lazy` y `Suspense` | Mantenibilidad: modularidad | Eficiencia de hardware | *Modularize bandwidth-heavy components* (2.4) |
| 5 | Depuración de dependencias (imagen de ejecución sin herramientas de prueba; bundle sin librerías innecesarias) | Mantenibilidad: analizabilidad | Eficiencia energética | *Use dependencies sparingly and maintain them* / *Minify and remove unused code* |
| 6 | Reducción de peticiones HTTP (SVG inline) | Eficiencia de desempeño: comportamiento temporal | Eficiencia de carbono | *Use sustainable JavaScript and APIs* (3.1) |
| 7 | Caché: ETag/304 en la API, `immutable` en assets y caché en cliente | Eficiencia de desempeño: comportamiento temporal | Eficiencia energética | *Optimize caching and support offline access* (2.4) |
| 8 | Compresión: GZip en FastAPI, zstd/gzip en Caddy y Brotli precomprimido | Eficiencia de desempeño: capacidad | Eficiencia de carbono | *Reduce data transfer with compression* (3.1) |

## 4. Guía de desarrollo verde para EcoLogística Lima

Las reglas se redactan como criterios verificables. Las que tienen control automático lo indican.

### 4.1 Reglas de backend (FastAPI, SQLAlchemy y PostgreSQL)

1. **Ningún listado sin límite.** Todo endpoint de colección acepta `page` y `limit`, con 12 por defecto y 50 como máximo. *Control:* pruebas `test_every_list_supports_pagination` y `test_pagination_rejects_invalid_parameters`.
2. **Proyección explícita.** Los listados se construyen con `select(*projected_columns(Modelo, EsquemaOut))`, no con `select(Modelo)`, y se leen con `.mappings()`. Se prohíbe devolver columnas que el esquema de salida no expone.
3. **Índice para cada orden de listado.** Si un listado ordena o filtra por columnas nuevas, la migración Alembic que lo introduce crea el índice compuesto correspondiente y se verifica con `EXPLAIN ANALYZE`.
4. **Compresión y validación condicional activas.** `GZipMiddleware` (≥1 KB) y `ETagMiddleware` no se retiran de `app/main.py`. *Control:* `test_large_json_responses_are_compressed` y `test_etag_returns_304_when_content_is_unchanged`.
5. **La imagen de ejecución solo contiene lo que se ejecuta.** Las herramientas de prueba van en `requirements-dev.txt`/`requirements-dev.lock`. Las librerías nuevas de producción se justifican en el PR.

### 4.2 Reglas de frontend (React, TypeScript y Vite)

1. **Las pantallas secundarias se cargan bajo demanda** con `React.lazy` y un `Suspense` con mensaje accesible. Solo el acceso y el armazón entran en el bundle inicial.
2. **Las imágenes ráster de más de 200 KB no se suben.** Toda imagen nueva se entrega en AVIF/WebP mediante `<picture>`, con `width`/`height` declarados (para no generar CLS) y `loading="lazy"` si está debajo del pliegue.
3. **Los íconos van como SVG inline** en componentes, sin fuentes de íconos ni peticiones por ícono.
4. **Las peticiones GET permiten revalidación** (`cache: 'no-cache'`), nunca `no-store`, salvo datos sensibles justificados.
5. **El peso de cada librería nueva se revisa** antes de añadirla (por ejemplo en Bundlephobia). Se prefieren las APIs nativas (`Intl`, `fetch`, `URLSearchParams`).
6. **Presupuesto de rendimiento.** El build no se integra si Lighthouse CI incumple `lighthouserc.json`: rendimiento ≥0,90, FCP ≤1,0 s, LCP ≤1,4 s, TBT ≤85 ms, CLS ≤0,02 y peso ≤1,1 MB.

### 4.3 Principios de código limpio aplicados

| Principio | Aplicación concreta |
|---|---|
| Clean Code | Funciones cortas con nombre de intención (`projected_columns`, `fetch`, `etag_for`). Docstrings en español que explican el porqué de cada optimización. |
| SOLID (responsabilidad única) | El router recibe los parámetros, el repositorio construye la consulta, `pagination.fetch` ejecuta y pagina, y el middleware gestiona la caché HTTP. Ninguna capa conoce los detalles de otra. |
| SOLID (abierto/cerrado) | Un listado nuevo se pagina sin modificar `pagination.py`: basta con pasar su consulta y su esquema. |
| DRY | Una sola implementación de paginación, ETag y compresión para los cuatro recursos, en lugar de repetir lógica en cada endpoint. |
| YAGNI | No se añadió Redis ni una CDN ni otra infraestructura que el volumen actual no requiere. El ETag usa el cuerpo ya serializado, sin almacenamiento adicional. |

### 4.4 Integración en CI/CD verde

El workflow [`green-audit.yml`](../../../.github/workflows/green-audit.yml) se ejecuta en cada *push* a `main` o a `inspeccion-04-green-it` y en cada *pull request*. Instala dependencias, construye el frontend con precompresión y ejecuta **Lighthouse CI 0.15.1** tres veces con el preset de escritorio. Las aserciones de [`lighthouserc.json`](../../../lighthouserc.json) hacen fallar el job si se rompe un presupuesto. Los reportes se conservan como artefacto `lighthouse-reports`.

## 5. Limitaciones y mejoras futuras

- LHCI audita la pantalla de acceso servida como estático. El recorrido autenticado se mide con `scripts/green_it/measure.mjs`, que todavía no corre en CI porque requiere PostgreSQL y datos de carga.
- La intensidad de carbono usa el promedio mundial de SWDM v4 (494 gCO2e/kWh). Un cálculo con la intensidad de la red peruana o de un proveedor verde verificado cambiaría el valor absoluto, pero no el porcentaje de reducción.
- La conciencia de carbono (ejecutar procesos diferibles en horas de energía más limpia) aplicará cuando existan procesos por lotes, como la optimización de rutas de US-016.

## Referencias

- ISO/IEC 25010:2023, *Systems and software engineering — Product quality model*. https://www.iso.org/standard/78176.html
- Green Software Foundation, *Green Software Principles* y *Software Carbon Intensity (SCI)*. https://learn.greensoftware.foundation/ · https://sci.greensoftware.foundation/
- W3C, *Web Sustainability Guidelines (WSG)*, borrador vigente. https://w3c.github.io/sustainableweb-wsg/
- R. C. Martin, *Clean Code* (2008) y principios SOLID; A. Hunt y D. Thomas, *The Pragmatic Programmer* (DRY).

## Control documental

| Versión | Fecha | Cambio |
|---|---|---|
| V_1_0_0 | 10/11/2026 | Versión inicial para la Inspección 04: estándares, matriz de mapeo y guía de desarrollo verde. |
| V_1_0_0 (rev. 2) | 10/11/2026 | Cifras de PostgreSQL actualizadas con `EXPLAIN (ANALYZE, BUFFERS)` y sección de referencias. |

[← Volver al README](../../../README.md)
