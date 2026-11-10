[← Volver al README](../../../README.md) · [Estándares de ingeniería de software](<02 Estandares Ingeniería de software V_1_0_0.md>)

# Informe de Reducción del Impacto Ambiental y Optimización del Stack

**Nombre del Proyecto:** EcoLogística Lima<br>
**Líder del Proyecto:** Marco Jhair Martinez Llanos<br>
**Entrega:** Inspección 04 — Reducción del impacto ambiental y estándares de ingeniería de software<br>
**Versión del documento:** V_1_0_0 · **Versión semántica de la entrega:** v1.0.0<br>
**Rama:** `inspeccion-04-green-it` · **Línea base medida:** `main` en `cfcd53f`<br>
**Fecha de actualización:** 10/11/2026

## 1.1 Introducción y propósito

Este informe documenta la auditoría, la refactorización y la medición del impacto ambiental de EcoLogística Lima. En una aplicación web, cada byte que viaja por la red y cada ciclo de CPU en el servidor o en el equipo del operador consume energía, y esa energía tiene una intensidad de carbono. El objetivo es reducir esa huella **sin cambiar el comportamiento funcional** de las historias US-001 a US-015.

Propósitos:

1. Identificar dónde se desperdician datos y cómputo en el estado integrado de `main`.
2. Aplicar ocho optimizaciones en backend, frontend e infraestructura local.
3. Medir el resultado con Google Lighthouse, con un recorrido autenticado y con un *benchmark* de la API, usando la misma carga de datos antes y después.
4. Calcular energía y emisiones con el **Sustainable Web Design Model v4 (SWDM v4)** y proyectar el ahorro anual.

> **Criterio de honestidad.** Todas las cifras de este informe provienen de mediciones reproducibles con los scripts de `scripts/green_it/`. No se copiaron valores del ejemplo de la consigna. Los JSON y reportes HTML originales están en [`evidencias/`](evidencias/).

## 1.2 Entorno y metodología de medición

| Elemento | Valor |
|---|---|
| Servidor web | Caddy 2.10.2 sirviendo el build de producción de Vite (configuración `Caddyfile.staging`, sin TLS, puerto 8080) |
| API y base de datos | FastAPI con uvicorn (1 worker) y PostgreSQL 16, en localhost |
| Datos de carga | `seed_carga.py` con semilla 2026: 50 vehículos, 60 conductores, 200 clientes y 1 000 pedidos (volumen de RNF-004) |
| Lighthouse | 12.8.2, Chromium *headless*, 5 corridas por modo (mediana), preset de escritorio y móvil por defecto (4G simulado con CPU ×4) |
| Recorrido autenticado | *User flow* de Lighthouse: inicio de sesión y apertura de Pedidos, Vehículos, Conductores y Clientes |
| API | 30 peticiones por recurso; mediana y p95 del tiempo de respuesta y bytes transferidos con `Accept-Encoding: br, gzip` |

**Unidad funcional (sesión de operador):** cargar la pantalla de acceso, iniciar sesión y consultar los cuatro listados. Los bytes de la sesión son la suma del peso de la página y de los bytes transferidos durante el recorrido.

Reproducción:

```bash
# Desde src/backend, con la base local migrada y el operador de prueba creado
python ../../scripts/green_it/seed_carga.py
# Con el backend en :8000 y Caddy en :8080
cd scripts/green_it && npm install && node measure.mjs despues "../../docs/03 Implementación/reduccion del impacto ambiental/evidencias"
python swdm.py ../../docs/.../evidencias/metricas-antes.json ../../docs/.../evidencias/metricas-despues.json
```

## 1.3 Diagnóstico inicial (estado ANTES, `cfcd53f`)

| Indicador | Escritorio | Móvil |
|---|---:|---:|
| Score de rendimiento Lighthouse | 100 / 100 | 96 / 100 |
| First Contentful Paint (FCP) | 0,50 s | 2,17 s |
| Largest Contentful Paint (LCP) | 0,50 s | 2,32 s |
| Total Blocking Time (TBT) | 0 ms | 0 ms |
| Cumulative Layout Shift (CLS) | 0 | 0 |
| Peso de la página de acceso | 267,9 KB (4 peticiones) | 267,9 KB |

| Recorrido autenticado y API | ANTES |
|---|---:|
| Bytes transferidos en el recorrido | 785,9 KB (7 peticiones) |
| `GET /pedidos` | 1 000 registros, 592,0 KB, sin compresión, mediana 30,7 ms |
| `GET /clientes` | 201 registros, 77,9 KB, sin compresión |
| `GET /vehiculos` / `GET /conductores` | 16,8 KB / 19,7 KB, sin compresión |
| TBT del recorrido | 88 ms |

**Hallazgos.**

1. La pantalla de acceso ya era liviana en escritorio. El problema no estaba en el *render* inicial.
2. El desperdicio estaba en los **datos**. Cada visita a Pedidos descargaba los 1 000 registros (592 KB) aunque la vista muestra unos pocos, sin compresión y sin posibilidad de reutilizar la respuesta (`cache: 'no-store'`).
3. PostgreSQL resolvía el listado con *Seq Scan + Sort* de toda la tabla.
4. El JavaScript (252 KB) y el CSS se servían sin comprimir y sin política de caché, lo que explica el FCP de 2,17 s en móvil.
5. La imagen Docker del backend instalaba pytest, coverage, httpx y sus dependencias, que no se usan en ejecución.

## 1.4 Correspondencia MERN → EcoLogística Lima

| # | Área de la consigna (MERN) | Equivalente implementado en el stack real | Capa |
|---|---|---|---|
| 1 | `.select()`, `.lean()` e índices en MongoDB | `select(*columnas)` según el esquema de salida, filas `.mappings()` sin hidratación ORM e índices compuestos (Alembic `0003`) | Backend |
| 2 | Paginación `page`/`limit` de 12 registros | `?page=&limit=` en FastAPI (12 por defecto, máximo 50) y paginador en las listas React | Backend y frontend |
| 3 | Imágenes WebP/AVIF con `<picture>` | Componente `ResponsiveImage` (AVIF → WebP → JPG) y un guardián de build que rechaza imágenes ráster de más de 200 KB o sin variantes | Frontend |
| 4 | `React.lazy` y `Suspense` | Carga diferida de las pantallas autenticadas | Frontend |
| 5 | Sustituir librerías por APIs nativas | Imagen de ejecución sin dependencias de prueba; revisión del bundle | Backend y frontend |
| 6 | Inlining de SVG | Ícono de la aplicación como SVG inline (`data:` URI) que elimina la petición a `/favicon.ico` | Frontend |
| 7 | Cache-Control, ETag y React Query | ETag + 304 en la API, `immutable` en assets, `no-cache` en `index.html` y revalidación en el cliente | Backend, Caddy y frontend |
| 8 | Middleware `compression` (Brotli/Gzip) | `GZipMiddleware` en FastAPI, `encode zstd gzip` en Caddy y Brotli precomprimido en el build | Backend y Caddy |

## 1.5 Detalle técnico de las ocho optimizaciones

### 1. Consultas magras e índices compuestos

**Diagnóstico.** `select(Order)` cargaba entidades ORM completas en el *identity map* de la sesión y PostgreSQL ordenaba la tabla entera para cada listado.

**Implementación.** La consulta proyecta solo las columnas del esquema `OrderOut` y devuelve diccionarios. La migración `0003_green_list_indexes` crea cinco índices que coinciden con el `ORDER BY` de cada listado.

ANTES (`app/repositories/orders.py`):

```python
def list_all(db: Session, state: str | None = None) -> list[Order]:
    query = select(Order).order_by(Order.creado_en, Order.pedido_id)
    if state:
        query = query.where(Order.estado == state)
    return list(db.scalars(query))
```

DESPUÉS:

```python
# app/repositories/orders.py
def list_query(state: str | None = None) -> Select:
    query = select(*projected_columns(Order, OrderOut)).order_by(Order.creado_en, Order.pedido_id)
    if state:
        query = query.where(Order.estado == state)
    return query

# app/models/entities.py — índices alineados con el orden del listado
Index("idx_pedidos_listado", "creado_en", "pedido_id"),
Index("idx_pedidos_estado_listado", "estado", "creado_en", "pedido_id"),
```

**Evidencia (`EXPLAIN ANALYZE`, primera página de 12 pedidos):**

| Estado | Plan | Tiempo de ejecución |
|---|---|---:|
| ANTES | `Seq Scan` + `Sort` (top-N heapsort sobre 1 000 filas) | 0,609 ms |
| DESPUÉS | `Index Scan using idx_pedidos_listado` (lee 12 filas) | 0,028 ms |

### 2. Paginación en backend y frontend

**Diagnóstico.** `GET /api/v1/pedidos` devolvía los 1 000 pedidos (592 KB) en cada visita.

**Implementación (backend).** El módulo `app/api/pagination.py` aplica la paginación a los cuatro listados. Con `?page=` responde `{ items, total, page, limit, pages }`. Sin `page`, conserva la lista anterior por compatibilidad. Los parámetros se validan (`page ≥ 1`, `1 ≤ limit ≤ 50`).

ANTES:

```python
@router.get("", response_model=list[OrderOut])
def list_all(estado: OrderState | None = None, db: Session = Depends(get_db), user: User = Depends(require_read)):
    return repo.list_all(db, estado)
```

DESPUÉS:

```python
@router.get("", response_model=list[OrderOut] | Page[OrderOut])
def list_all(estado: OrderState | None = None, params: PageParams = Depends(page_params),
             db: Session = Depends(get_db), user: User = Depends(require_read)):
    return fetch(db, repo.list_query(estado), params)

# app/api/pagination.py
total = db.scalar(select(func.count()).select_from(query.order_by(None).subquery())) or 0
rows = db.execute(query.offset((params.page - 1) * params.limit).limit(params.limit)).mappings()
```

**Implementación (frontend).** El hook `usePagedList` (en `src/hooks/usePagedList.ts`) solicita bloques de 12 registros. El componente accesible `Pagination` (`<nav>` con *Anterior/Siguiente* y anuncio `aria-live`) se usa en los cuatro listados. El contador muestra el total real del servidor.

ANTES (`src/pages/VehiclesPage.tsx`):

```tsx
const [items, setItems] = useState<Vehicle[]>([])
async function load() {
  try { setItems(await api<Vehicle[]>('/vehiculos', token)) }
  catch (error) { setNotice({ text: (error as Error).message, error: true }) }
}
useEffect(() => { void load() }, [token])
// ...
<span className="count-pill">{items.length}</span>
```

DESPUÉS:

```tsx
const list = usePagedList<Vehicle>('/vehiculos', token, text => setNotice({ text, error: true }))
const { items, reload: load } = list
// ...
<span className="count-pill">{list.total}</span>
<Pagination page={list.page} pages={list.pages} total={list.total} label="vehículos" onChange={list.setPage} />

// src/hooks/usePagedList.ts
export const PAGE_SIZE = 12
export function pagedPath(path: string, page: number, limit = PAGE_SIZE): string {
  return `${path}${path.includes('?') ? '&' : '?'}page=${page}&limit=${limit}`
}
```

**Resultado.** Una página de 12 pedidos pesa **1 557 bytes** comprimida (7,1 KB de JSON), frente a los 592,0 KB de la lista completa (−99,7 %). Responde con una mediana de 7,2 ms, medida con `curl` en 30 peticiones.

### 3. Imágenes en formatos de nueva generación

**Diagnóstico.** La auditoría no encontró imágenes ráster en el proyecto: la marca y la ilustración de acceso se construyen con texto y CSS. Por eso no hay bytes que recortar hoy. El riesgo está en el futuro, cuando se incorporen mapas, fotos de vehículos o logotipos de clientes (US-018).

**Implementación.** Se aplica la optimización como **mecanismo obligatorio y verificable**, no como una imagen añadida solo para optimizarla:

- `src/components/common/ResponsiveImage.tsx` es la única vía permitida para mostrar imágenes. Entrega AVIF → WebP → JPG mediante `<picture>`, declara `width`/`height` (sin CLS) y aplica `loading="lazy"` y `decoding="async"` fuera de la vista inicial.
- `scripts/check-images.mjs` se ejecuta al inicio de `npm run build` y **hace fallar el build** si una imagen supera 200 KB o si un JPG/PNG no tiene sus variantes AVIF y WebP.

ANTES: no existía regla. Cualquier imagen podía integrarse sin comprimir con `<img src="foto.png">`.

DESPUÉS:

```tsx
<picture>
  <source srcSet={`${base}.avif`} type="image/avif" />
  <source srcSet={`${base}.webp`} type="image/webp" />
  <img src={`${base}.jpg`} alt={alt} width={width} height={height}
    loading={priority ? 'eager' : 'lazy'} decoding="async" fetchPriority={priority ? 'high' : 'auto'} />
</picture>
```

```json
"build": "node scripts/check-images.mjs && tsc -b && vite build && node scripts/precompress.mjs"
```

**Resultado.** 0 bytes de imágenes ráster en el estado actual, y una garantía automática de que no se integrarán imágenes que incumplan la guía.

### 4. Carga diferida y *code splitting*

**Diagnóstico.** `App.tsx` importaba de forma estática las cinco pantallas autenticadas, así que la pantalla de acceso descargaba código que el usuario aún no podía usar.

**Implementación.** Las pantallas autenticadas se cargan con `React.lazy` dentro de un `Suspense`, con un mensaje accesible (`role="status"`). Vite genera un fragmento por pantalla.

ANTES (`src/App.tsx`):

```tsx
import { HomePage } from './pages/HomePage'
import { VehiclesPage } from './pages/VehiclesPage'
import { OrdersPage } from './pages/OrdersPage'
// ...
{page === 'Vehículos' && <VehiclesPage token={token} />}
```

DESPUÉS:

```tsx
const VehiclesPage = lazy(() => import('./pages/VehiclesPage').then(m => ({ default: m.VehiclesPage })))
const OrdersPage = lazy(() => import('./pages/OrdersPage').then(m => ({ default: m.OrdersPage })))
// ...
<Suspense fallback={<p className="loading" role="status">Cargando…</p>}>
  {page === 'Vehículos' && <VehiclesPage token={token} />}
</Suspense>
```

**Resultado.** El JavaScript inicial pasa de 252,2 KB a 232,7 KB sin comprimir (−7,7 %). Las pantallas se separan en seis fragmentos de 0,7 a 1,9 KB con Brotli que solo se descargan al abrirlas. La mayor parte del bundle inicial es React 19, que es imprescindible.

### 5. Depuración de dependencias

**Diagnóstico.** `requirements.lock` mezclaba dependencias de ejecución y de prueba, y la imagen del backend instalaba 38 paquetes.

**Implementación.** `requirements.txt` y `requirements.lock` contienen solo lo que se ejecuta. `requirements-dev.txt` y `requirements-dev.lock` añaden pytest, pytest-cov y httpx para CI. Los workflows `ci.yml` y `dependency-audit.yml` usan el lock de desarrollo, así que la auditoría de vulnerabilidades sigue cubriendo todas las dependencias.

ANTES (`requirements.txt`):

```text
fastapi>=0.115,<1
...
alembic>=1.13,<2
pytest>=9.0.3,<10
pytest-cov>=5,<7
httpx>=0.27,<1
```

DESPUÉS:

```text
# requirements.txt (imagen Docker)        # requirements-dev.txt (CI)
fastapi>=0.115,<1                          -r requirements.txt
...                                        pytest>=9.0.3,<10
alembic>=1.13,<2                           pytest-cov>=5,<7
                                           httpx>=0.27,<1
```

**Resultado (instalación limpia en Python 3.12):** de 38 a 28 paquetes y de **83,1 MB a 74,8 MB** en `site-packages` (−8,3 MB, −10,0 %). Se retiraron certifi, coverage, httpcore, httpx, iniconfig, packaging, pluggy, pygments, pytest y pytest-cov.

**Frontend.** El bundle de producción solo contiene `react` y `react-dom`; el resto son dependencias de desarrollo que no llegan al navegador. Para la caché del cliente **se decidió no añadir TanStack Query**: la revalidación HTTP nativa (`fetch` con `cache: 'no-cache'` + ETag) cubre la necesidad sin sumar una librería al bundle. Es la sustitución por APIs nativas que plantea la consigna.

### 6. Reducción de solicitudes HTTP

**Diagnóstico.** `index.html` no declaraba ícono, así que el navegador pedía `/favicon.ico`. Caddy resolvía esa ruta con `try_files` y devolvía de nuevo `index.html`: una petición y unos bytes inútiles en cada carga.

**Implementación.** El ícono de la marca se incrusta como SVG inline (`data:` URI, 0,3 KB) en `index.html`. La aplicación no usa fuentes ni sprites de íconos externos.

ANTES:

```html
<title>EcoLogística Lima</title>
```

DESPUÉS:

```html
<title>EcoLogística Lima</title>
<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E...%3C/svg%3E" />
```

**Resultado.** La pantalla de acceso pasa de **4 a 3 peticiones**. El recorrido autenticado suma peticiones pequeñas por los fragmentos de `React.lazy` (de 7 a 13), pero transfiere **96,7 % menos bytes**.

### 7. Estrategia de caché

**Diagnóstico.** Las respuestas de la API no tenían validadores y el cliente usaba `cache: 'no-store'`, así que cada visita repetía la descarga completa. Los assets con hash no declaraban vigencia.

**Implementación.**

- `app/core/http_cache.py`: `ETagMiddleware` calcula un ETag débil (SHA-256) del cuerpo de cada GET 200 de la API y responde **304 sin cuerpo** si coincide con `If-None-Match`. Añade `Cache-Control: private, no-cache` (siempre revalida, nunca muestra datos operativos vencidos) y `Vary: Authorization`. Los errores no se cachean.
- `Caddyfile.staging`: `/assets/*` con `Cache-Control: public, max-age=31536000, immutable`; `index.html` y las rutas de la SPA con `no-cache`.
- Frontend (`src/api.ts`): `cache: 'no-store'` pasa a `cache: 'no-cache'`. El navegador conserva la respuesta y la revalida con `If-None-Match`; si no cambió, recibe 304 y reutiliza su copia. Es el equivalente nativo de la caché de React Query, sin dependencias.

ANTES (`Caddyfile.staging`):

```caddyfile
handle {
    root * /srv
    try_files {path} /index.html
    file_server
}
```

DESPUÉS:

```caddyfile
@assets path /assets/*
handle @assets {
    root * /srv
    header Cache-Control "public, max-age=31536000, immutable"
    file_server {
        precompressed br gzip
    }
}
handle {
    root * /srv
    header Cache-Control "no-cache"
    try_files {path} /index.html
    file_server {
        precompressed br gzip
    }
}
```

**Resultado.** Una consulta repetida sin cambios devuelve `304 Not Modified` con **0 bytes** de cuerpo (prueba `test_etag_returns_304_when_content_is_unchanged` y verificación con `curl` sobre Caddy).

### 8. Compresión de respuestas

**Diagnóstico.** Ni FastAPI ni Caddy comprimían. El JSON de pedidos (592 KB) y el JavaScript (252 KB) viajaban en texto plano.

**Implementación.** Caddy estándar no incluye Brotli dinámico, así que se combinan tres mecanismos:

- **Recursos estáticos:** `src/frontend/scripts/precompress.mjs` (solo `zlib` nativo, sin dependencias) genera `.br` (calidad 11) y `.gz` en el build, y Caddy los sirve con `precompressed br gzip`.
- **API:** `GZipMiddleware` de FastAPI comprime las respuestas de 1 KB o más.
- **Pasarela:** Caddy aplica `encode zstd gzip` a lo que llegue sin comprimir.

ANTES (`app/main.py`): sin middleware de compresión.

DESPUÉS:

```python
app.add_middleware(ETagMiddleware)
app.add_middleware(GZipMiddleware, minimum_size=1000, compresslevel=6)
```

**Resultado.**

- JavaScript inicial: 252,2 KB → **62,5 KB** con Brotli.
- `GET /pedidos` completo: 592,0 KB → **87,5 KB** con gzip.
- Página de acceso: 267,9 KB → **68,1 KB** (incluye el efecto de `React.lazy` y del ícono inline).

## 1.6 Tabla comparativa ANTES vs DESPUÉS

Fuente: [`metricas-antes.json`](evidencias/metricas-antes.json) y [`metricas-despues.json`](evidencias/metricas-despues.json), con la mediana de 5 corridas por modo.

| Métrica / indicador | ANTES (`cfcd53f`) | DESPUÉS | Variación absoluta | Mejora |
|---|---:|---:|---:|---:|
| Score de rendimiento, escritorio | 100 / 100 | 100 / 100 | 0 | — |
| Score de rendimiento, móvil | 96 / 100 | 100 / 100 | +4 pts | +4,2 % |
| FCP escritorio | 0,50 s | 0,34 s | −0,17 s | −33,1 % |
| LCP escritorio | 0,50 s | 0,34 s | −0,17 s | −33,1 % |
| FCP móvil (4G simulado) | 2,17 s | 1,27 s | −0,90 s | −41,3 % |
| LCP móvil (4G simulado) | 2,32 s | 1,27 s | −1,05 s | −45,1 % |
| TBT de la pantalla de acceso | 0 ms | 0 ms | 0 | — |
| TBT del recorrido autenticado | 88 ms | 0 ms | −88 ms | −100 % |
| CLS | 0 | 0 | 0 | — |
| Peso de la pantalla de acceso | 267,9 KB (4 peticiones) | 68,1 KB (3 peticiones) | −199,8 KB | −74,6 % |
| Bytes del recorrido autenticado | 785,9 KB | 25,7 KB | −760,2 KB | −96,7 % |
| **Bytes por sesión (acceso + recorrido)** | **1 053,9 KB** | **93,8 KB** | **−960,0 KB** | **−91,1 %** |
| Respuesta de pedidos que pide la interfaz | 592,0 KB (1 000 registros) | 1,6 KB (12 registros) | −590,4 KB | −99,7 % |
| Primera página de pedidos en PostgreSQL | 0,609 ms | 0,028 ms | −0,581 ms | −95,4 % |
| JavaScript inicial (transferido) | 252,2 KB | 62,5 KB (Brotli) | −189,7 KB | −75,2 % |
| Paquetes Python en la imagen | 38 (83,1 MB) | 28 (74,8 MB) | −10 (−8,3 MB) | −10,0 % |

**Cumplimiento de los umbrales de la rúbrica** (escritorio, preset de Lighthouse CI):

| Umbral | Valor DESPUÉS | Estado |
|---|---:|---|
| Score ≥ 90 | 100 | Cumple |
| FCP ≤ 1,0 s | 0,34 s | Cumple |
| LCP ≤ 1,4 s | 0,34 s | Cumple |
| TBT ≤ 85 ms | 0 ms | Cumple |
| CLS ≤ 0,02 | 0 | Cumple |
| Peso ≤ 1,1 MB | 68,1 KB (página) / 93,8 KB (sesión completa) | Cumple |

En móvil con 4G simulado, el LCP (1,27 s) cumple el umbral de 1,4 s y el FCP (1,27 s) queda por encima de 1,0 s, condicionado por la latencia de red simulada. Se reporta tal cual.

## 1.7 Análisis de impacto ambiental (SWDM v4)

**Modelo.** Se usa el [Sustainable Web Design Model v4](https://sustainablewebdesign.org/estimating-digital-emissions/). Este modelo reemplaza al v3 del ejemplo de la consigna, que usaba 0,81 kWh/GB y 442 g/kWh. Sus constantes son:

| Segmento | Operativa (kWh/GB) | Incorporada (kWh/GB) |
|---|---:|---:|
| Centros de datos | 0,055 | 0,012 |
| Redes | 0,059 | 0,013 |
| Dispositivos de usuario | 0,080 | 0,081 |
| **Total** | **0,194** | **0,106** |

**Fórmula aplicada.**

E (g CO2e) = datos (GB) × 0,300 kWh/GB × 494 g CO2e/kWh

Se asumen las siguientes condiciones:

- Factor de hosting verde igual a 0, porque no hay proveedor verificado.
- Se considera visitante nuevo, sin descontar caché. Es el escenario conservador.
- La intensidad de la red eléctrica es el promedio mundial del modelo.
- 1 GB equivale a 10⁹ bytes.

**Cálculo por sesión de operador:**

| Escenario | Bytes/sesión | GB/sesión | kWh/sesión | g CO2e/sesión |
|---|---:|---:|---:|---:|
| ANTES | 1 053 854 | 0,001054 | 0,0003162 | 0,1562 |
| DESPUÉS | 93 830 | 0,000094 | 0,0000281 | 0,0139 |

Verificación:

- ANTES: 0,001054 GB × 0,300 = 0,0003162 kWh; 0,0003162 kWh × 494 = 0,1562 g CO2e.
- DESPUÉS: 0,0000938 GB × 0,300 = 0,0000281 kWh; 0,0000281 kWh × 494 = 0,0139 g CO2e.
- Reducción: 0,1423 g CO2e por sesión (−91,1 %).

**Proyección anual.** Supuesto declarado: 10 operadores × 20 sesiones/día × 300 días = **60 000 sesiones/año**.

| Escenario | kWh/año | kg CO2e/año |
|---|---:|---:|
| ANTES | 18,969 | 9,371 |
| DESPUÉS | 1,689 | 0,834 |
| **Ahorro** | **17,280 kWh** | **8,537 kg CO2e (−91,1 %)** |

El valor absoluto es pequeño porque EcoLogística es una aplicación interna con pocos usuarios. Lo relevante es que la reducción es proporcional: el ahorro por sesión se mantiene si crecen los operadores o el volumen de pedidos. Además, con paginación el tamaño de cada respuesta ya no depende del número de pedidos almacenados.

## 1.8 Evidencias de validación

| Evidencia | Archivo |
|---|---|
| Métricas ANTES (JSON) | [`evidencias/metricas-antes.json`](evidencias/metricas-antes.json) |
| Métricas DESPUÉS (JSON) | [`evidencias/metricas-despues.json`](evidencias/metricas-despues.json) |
| Reportes Lighthouse ANTES (escritorio, móvil y recorrido) | [`lighthouse-antes-desktop.html`](evidencias/lighthouse-antes-desktop.html), [`lighthouse-antes-mobile.html`](evidencias/lighthouse-antes-mobile.html), [`flow-antes.html`](evidencias/flow-antes.html) |
| Reportes Lighthouse DESPUÉS | [`lighthouse-despues-desktop.html`](evidencias/lighthouse-despues-desktop.html), [`lighthouse-despues-mobile.html`](evidencias/lighthouse-despues-mobile.html), [`flow-despues.html`](evidencias/flow-despues.html) |
| Pruebas automatizadas | `src/backend/tests/test_green_it.py` (13 pruebas), `src/frontend/src/hooks/usePagedList.test.ts` y la prueba de paginación en `App.test.tsx` |
| Auditoría continua | [`.github/workflows/green-audit.yml`](../../../.github/workflows/green-audit.yml) y [`lighthouserc.json`](../../../lighthouserc.json) |

## 1.9 Limitaciones

- Las mediciones son locales (localhost, sin latencia real de red). Lighthouse móvil simula 4G, pero no reemplaza una medición de campo.
- La pantalla de acceso ya cumplía los umbrales de escritorio en el estado ANTES. Por eso la mejora principal está en los datos del recorrido autenticado, no en el score.
- El recorrido mide la primera visita a cada listado. Las visitas repetidas se benefician además del 304 y de la caché inmutable de assets, que este cálculo conservador no descuenta.
- La compresión gzip añade CPU en el servidor cuando alguien pide la lista completa sin `page`: la mediana de `GET /pedidos` completo sube de 30,7 a 46,1 ms. La interfaz ya no hace esa petición; pide páginas de 12 registros, que responden en 7,2 ms (`curl`, mediana de 30).
- Las emisiones usan la intensidad mundial de SWDM v4. Con datos de la red peruana el valor absoluto cambiaría, pero no el porcentaje.

## 3. Gestión de versiones con Git

Secuencia aplicada para publicar la entrega (v1.0.0):

```bash
git status
git checkout -b inspeccion-04-green-it
mkdir -p "docs/03 Implementación/reduccion del impacto ambiental/evidencias"
git add "docs/03 Implementación/reduccion del impacto ambiental/" .github/workflows/green-audit.yml lighthouserc.json scripts/green_it/
git commit -m "docs(green-it): add environmental impact report and software engineering standards v1.0.0"
git tag -a v1.0.0-green-it -m "Inspección 04: reducción del impacto ambiental"
git push -u origin inspeccion-04-green-it --follow-tags
```

## Control documental

| Versión | Fecha | Cambio |
|---|---|---|
| V_1_0_0 | 10/11/2026 | Versión inicial: diagnóstico, ocho optimizaciones, comparativa medida y cálculo SWDM v4. |

[← Volver al README](../../../README.md)
