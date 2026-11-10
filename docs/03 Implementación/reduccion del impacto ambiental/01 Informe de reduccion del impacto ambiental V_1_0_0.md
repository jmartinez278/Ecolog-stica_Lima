[← Volver al README](../../../README.md) · [Estándares y guía verde](<02 Estandares Ingeniería de software V_1_0_0.md>)

# Informe de reducción del impacto ambiental

**Proyecto:** EcoLogística Lima · **Líder:** Marco Jhair Martinez Llanos<br>
**Entrega:** Sprint 4 / Inspección 04 · **Versión semántica de entrega:** v1.0.0<br>
**Revisión documental:** V_1_0_2 (se conserva el nombre de archivo V_1_0_0 exigido)<br>
**Versión de aplicación:** 1.4.0 · **Corte de validación:** 10/11/2026

## 1. Introducción y propósito

Evaluar el coste de recursos del software y reducir los datos transferidos y el trabajo innecesario conservando US-001–US-015. Se implementan las ocho áreas de la consigna con React/TypeScript/Vite, FastAPI/SQLAlchemy, PostgreSQL y Caddy. El usuario confirmó el 10/11/2026 que el docente acepta este stack; los ejemplos MERN se adaptan sin migrar la arquitectura.

La huella digital aquí estimada corresponde al acceso y consulta del sistema. No representa emisiones de vehículos, ahorro de combustible ni rutas optimizadas: esas funciones pertenecen a otras historias.

## 2. Diagnóstico y protocolo ANTES/DESPUÉS

- ANTES: commit `cfcd53ffe62a94fcc4e227cf9ca1cd9086914b45`, extraído con `git archive` en una carpeta temporal, sin introducir ineficiencias artificiales.
- DESPUÉS: rama local `sprint-4`, basada en `e7ac3ff`, identificada como árbol de trabajo en el momento de medir. El [manifiesto SHA-256](evidencias/validacion-20261110/source-snapshot.json) identifica el código y la configuración auditados.
- Dos proyectos Compose independientes, `ecolog-green-before` y `ecolog-green-final`; build de producción servido por Caddy, FastAPI y PostgreSQL 16. No se usa el servidor Vite para puntuar rendimiento.
- Semilla 2026: exactamente 50 vehículos, 60 conductores, 200 clientes y 1.000 pedidos antes de medir. UUID y fechas de los registros generados son deterministas. Los [planes ANTES](evidencias/validacion-20261110/postgres-before.json) y [DESPUÉS](evidencias/validacion-20261110/postgres-after.json) conservan conteos, versión SQL y paquetes.
- Lighthouse 13.6.0; Chrome for Testing 156.0.8078.4; tres corridas independientes en frío por preset escritorio/móvil y tres recorridos autenticados. Cada JSON Lighthouse conserva su `configSettings`, versión y fecha UTC. La regla de aceptación usa medianas; se publican todas las corridas, no solo la mejor.
- El recorrido comprende login, Pedidos, Vehículos, Conductores y Clientes. Los bytes de cada sesión se suman dentro de ese mismo recorrido antes de tomar la mediana, evitando combinar medianas de sesiones distintas.
- Latencia API: 30 peticiones por recurso, mismas condiciones locales, con mediana y P95. ANTES se pide la lista que utilizaba la interfaz; DESPUÉS la primera página de 12. Es una comparación de la misma necesidad de consulta, no una prueba de igual cantidad de registros devueltos.
- GB y MB decimales: 1 GB = 10^9 bytes, 1 MB = 10^6 bytes; el presupuesto de 1,1 MB equivale a 1.100.000 bytes. Se distinguen JSON descomprimido, transferencia y almacenamiento instalado.

Las corridas iniciales de este trabajo que apuntaban a un host sin el virtual host de Caddy se descartaron; una página vacía no se consideró resultado válido. La comparación vigente usa exclusivamente `validacion-20261110/`; los archivos de evidencia anteriores que quedaron superados se retiraron en la limpieza documental y permanecen recuperables en el historial Git.

Para evitar presentaciones duplicadas, se conservan los JSON de todas las corridas y un HTML de consulta por escenario (primera corrida de cada preset o flujo). En LHCI se conserva el HTML marcado por la propia herramienta como representativo y los tres JSON con sus resultados. Las medianas se calculan con todas las muestras; el HTML de consulta no sustituye esos cálculos. Los logs que repetían los valores de `metricas-antes.json` y `metricas-despues.json` se retiraron.

## 3. Las ocho optimizaciones con código comparativo

### 3.1 Consultas ligeras e índices

La lectura anterior materializaba entidades ORM. La lectura actual proyecta columnas del DTO y usa `.mappings()`; la migración incremental `0003_green_list_indexes` añade índices para ordenar/filtrar sin borrar datos.

ANTES — repositorio de pedidos:

```python
def list_all(db: Session, state: str | None = None) -> list[Order]:
    query = select(Order).order_by(Order.creado_en, Order.pedido_id)
    if state:
        query = query.where(Order.estado == state)
    return list(db.scalars(query))
```

DESPUÉS — repositorio de pedidos:

```python
def list_query(state: str | None = None) -> Select:
    query = select(*projected_columns(Order, OrderOut)).order_by(Order.creado_en, Order.pedido_id)
    if state:
        query = query.where(Order.estado == state)
    return query
```

El SQL comparativo `SELECT * FROM pedidos ORDER BY creado_en, pedido_id LIMIT 12` registra 0,269 ms ANTES y 0,042 ms DESPUÉS, con sus planes completos enlazados. Se trata de una ejecución de diagnóstico por estado; no se interpreta como una garantía estadística de latencia. La estructura del plan y el volumen leído justifican el índice.

### 3.2 Paginación en API e interfaz

El router valida HTTP, el servicio coordina y el repositorio limita SQL. `?page=1&limit=12` devuelve `{items,total,page,limit,pages}`; admite de 1 a 50 elementos por página. Sin `page` se conserva deliberadamente la lista anterior para compatibilidad. Todos los listados de la interfaz, incluido el selector de clientes en pedidos, solicitan páginas.

ANTES — listado sin límite en el endpoint:

```python
def list_all(estado: OrderState | None = None, db: Session = Depends(get_db), user: User = Depends(require_read)):
    return repo.list_all(db, estado)
```

DESPUÉS — endpoint y servicio:

```python
def list_all(estado: OrderState | None = None, params: PageParams = Depends(page_params), db: Session = Depends(get_db), user: User = Depends(require_read)):
    return service.list_all(db, params, estado)

def list_all(db: Session, params: PageParams, value: str | None = None) -> list[dict] | dict:
    return fetch(db, repo.list_query(value), params)
```

El repositorio ejecuta la página mediante `query.offset(offset).limit(params.limit)`. El orden incluye UUID como desempate. Los filtros se aplican a filas y conteo. En React, el estado de página pertenece a filtro/sesión; `AbortController` y una marca de actividad impiden sobrescribir con respuestas antiguas. Se ajusta la página cuando queda vacía y se conserva el cliente seleccionado aunque esté fuera de la página actual.

ANTES — descarga completa de clientes del formulario:

```typescript
api<Client[]>('/clientes?activo=true', token)
```

DESPUÉS — consulta paginada y selección por identificador:

```typescript
usePagedList<Client>('/clientes?activo=true', token, onError)
api<Client>(`/clientes/${encodeURIComponent(value)}`, token, { signal: controller.signal })
```

Los pedidos pasan de 1000 registros / 557975 bytes a 12 registros / 1526 bytes transferidos. Las pruebas cubren parámetros inválidos, vacío, fuera de rango, filtros, cambios rápidos y actualización posterior a mutaciones.

### 3.3 Imágenes AVIF/WebP adaptativas

El estado histórico no tenía imágenes ráster; la marca era texto/CSS. Se incorporan variantes de la misma marca vectorial del proyecto a 52 y 104 px, usadas de forma real en el acceso. No se inventa un ahorro de imágenes en la línea base que no las tenía. El tamaño adicional queda incluido en la medición global.

ANTES — marca sin recurso adaptativo:

```tsx
<span className="login-emblem" aria-hidden="true">EL<span>↗</span></span>
```

DESPUÉS — uso de `<picture>` con `srcset`/`sizes`:

```tsx
<ResponsiveImage base="/brand/logo" widths={[52, 104]} sizes="52px"
  width={52} height={52} alt="" priority />
```

`ResponsiveImage` ofrece fuentes AVIF/WebP, fallback JPG y dimensiones estables; las imágenes no prioritarias usan `loading="lazy"`. La marca visible inicialmente usa carga inmediata. Los archivos de 52 px pesan 1.253 bytes JPG, 442 WebP y 654 AVIF; los de 104 px, 2.148, 658 y 602 bytes. La selección depende del soporte y densidad del dispositivo.

`check-images.mjs` se ejecuta en el build y rechaza recursos de más de 200 kB decimales (200.000 bytes) o JPG/PNG sin ambas alternativas. Su prueba crea casos válidos e inválidos en un directorio temporal y comprueba que la regla falla cuando corresponde. La variante pequeña no es necesariamente menor en AVIF que en WebP: los formatos también tienen sobrecostes de cabecera.

### 3.4 Carga diferida y acceso prerenderizado

ANTES — pantallas importadas al inicio:

```tsx
import { LoginPage } from './pages/LoginPage'
import { HomePage } from './pages/HomePage'
import { VehiclesPage } from './pages/VehiclesPage'
import { OrdersPage } from './pages/OrdersPage'
import { DriversPage } from './pages/DriversPage'
import { ClientsPage } from './pages/ClientsPage'
```

DESPUÉS — ejemplo de módulo bajo demanda:

```tsx
const VehiclesPage = lazy(() => import('./pages/VehiclesPage').then(m => ({ default: m.VehiclesPage })))
```

Las cinco páginas autenticadas están dentro de `Suspense` con estado de carga y `PageErrorBoundary`, que permite recargar si falla un módulo. Vite produce chunks separados. El build prerenderiza únicamente el acceso público con React y después lo hidrata; no incorpora tokens ni datos de usuarios. La comprobación de navegador verifica que el acceso es visible sin JavaScript y que la hidratación funciona sin errores. Esta mejora permite presentar contenido antes de descargar y ejecutar React, sin ocultar controles o aplazar la funcionalidad para alterar el score.

### 3.5 Dependencias necesarias y APIs nativas

ANTES — dependencias de ejecución y pruebas en el mismo archivo:

```text
fastapi>=0.115,<1
uvicorn[standard]>=0.30,<1
sqlalchemy>=2.0,<3
psycopg[binary]>=3.2,<4
pydantic-settings>=2.5,<3
PyJWT>=2.9,<3
alembic>=1.13,<2
pytest>=9.0.3,<10
pytest-cov>=5,<7
httpx>=0.27,<1
```

DESPUÉS — ejecución y desarrollo separados:

```text
fastapi>=0.115,<1
uvicorn[standard]>=0.30,<1
sqlalchemy>=2.0,<3
psycopg[binary]>=3.2,<4
pydantic-settings>=2.5,<3
PyJWT>=2.9,<3
alembic>=1.13,<2

# requirements-dev.txt
-r requirements.txt
pytest>=9.0.3,<10
pytest-cov>=5,<7
httpx>=0.27,<1
```

Los inventarios reales registran 39 distribuciones ANTES y 29 DESPUÉS (incluyen pip). El almacenamiento de `site-packages` pasa de 115,83 a 99,89 MB. Los locks con hashes preservan la instalación reproducible; CI usa el lock de desarrollo y la imagen de ejecución solo el de producción.

El frontend mantiene React y ReactDOM como dependencias de producción; se usa `fetch` nativo para revalidar, sin añadir una librería de caché. Las herramientas de auditoría tienen su propio lock. Se actualizaron Lighthouse/Puppeteer/LHCI y se fijó `basic-ftp` 6.2.6 mediante override por una vulnerabilidad transitiva; la auditoría npm final no registra vulnerabilidades. La compatibilidad del override se comprobó ejecutando LHCI y los recorridos, no mediante un downgrade automático.

### 3.6 Solicitudes HTTP e iconos inline

ANTES — sin favicon declarado:

```html
<title>EcoLogística Lima</title>
```

DESPUÉS — ícono SVG en la propia página:

```html
<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='6' fill='%23141a1a'/%3E%3Cpath d='M9 22 22 9m-8 0h8v8' stroke='%239df8bf' stroke-width='3' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E" />
```

El SVG inline evita la solicitud adicional a `/favicon.ico`. En la versión final, la marca adaptativa introduce una petición de imagen: el total de acceso queda en 4 peticiones en ambos estados. El recorrido pasa de 7 a 13 solicitudes por los chunks bajo demanda, pero transfiere muchos menos bytes. No se afirma una reducción neta de peticiones que la medición no respalda; se documenta la optimización específica y su compensación en el resultado global.

### 3.7 Caché y validación condicional

ANTES — cliente sin almacenamiento:

```typescript
cache: 'no-store'
```

DESPUÉS — GET revalidable; escrituras y autenticación sin almacenamiento:

```typescript
cache: !init.method || init.method === 'GET' ? 'no-cache' : 'no-store'
```

El middleware calcula ETag sobre contenido autorizado, devuelve 304 sin cuerpo si no cambió y añade `Cache-Control: private, no-cache` y `Vary: Authorization`. La autorización se evalúa antes de responder 304. Errores, escrituras y login usan `no-store`; el token queda en memoria y no se cachea en un almacén compartido. Mutaciones cambian el contenido/validador y la interfaz recarga el listado.

ANTES — estáticos sin política explícita:

```caddyfile
handle {
    root * /srv
    try_files {path} /index.html
    file_server
}
```

DESPUÉS — assets con hash:

```caddyfile
@assets path /assets/*
handle @assets {
    root * /srv
    header Cache-Control "public, max-age=31536000, immutable"
    file_server {
        precompressed br gzip
    }
}
```

El HTML permanece revalidable para recibir versiones nuevas. Las pruebas comprueban que retirar permisos invalida el acceso incluso con un ETag conocido y que actualizar/desactivar produce un 200 con contenido actualizado.

### 3.8 Compresión HTTP

ANTES — API sin middleware de compresión; Caddy sin codificación.

DESPUÉS:

```python
app.add_middleware(ETagMiddleware)
app.add_middleware(GZipMiddleware, minimum_size=1000, compresslevel=6)
```

```caddyfile
encode zstd gzip
# En los manejadores de estáticos:
file_server {
    precompressed br gzip
}
```

Node `zlib` genera `.br` y `.gz` durante el build; Brotli se aplica una vez a recursos estáticos, no en cada petición. FastAPI comprime JSON de al menos 1 KB. Caddy negocia formatos y evita recomprimir contenido que ya llega codificado. Se mantienen respuestas sin compresión para clientes que no la solicitan. Los JSON de API y las métricas permiten distinguir tamaño lógico de transferencia real; la compresión añade CPU y no debe confundirse con una medición eléctrica.

## 4. Comparación consolidada

Una variación positiva significa aumento; la columna de reducción puede ser negativa cuando una métrica empeora. No se atribuyen mejoras a variaciones pequeñas de tiempos.

| Indicador | ANTES | DESPUÉS | Variación absoluta | Reducción |
|---|---:|---:|---:|---:|
| Escritorio: Score | 100,00 /100 | 100,00 /100 | 0,00 | 0,00 % |
| Escritorio: FCP | 203,61 ms | 206,29 ms | 2,68 | -1,32 % |
| Escritorio: LCP | 203,61 ms | 206,29 ms | 2,68 | -1,32 % |
| Escritorio: TBT | 0,00 ms | 0,00 ms | 0,00 | — |
| Escritorio: CLS | 0,00  | 0,00  | 0,00 | — |
| Escritorio: Transferencia | 267 922,00 bytes | 69 893,00 bytes | -198 029,00 | 73,91 % |
| Escritorio: Peticiones | 4,00  | 4,00  | 0,00 | 0,00 % |
| Móvil: Score | 100,00 /100 | 100,00 /100 | 0,00 | 0,00 % |
| Móvil: FCP | 751,77 ms | 753,98 ms | 2,20 | -0,29 % |
| Móvil: LCP | 751,77 ms | 753,98 ms | 2,20 | -0,29 % |
| Móvil: TBT | 0,00 ms | 0,00 ms | 0,00 | — |
| Móvil: CLS | 0,00  | 0,00  | 0,00 | — |
| Móvil: Transferencia | 267 922,00 bytes | 69 841,00 bytes | -198 081,00 | 73,93 % |
| Móvil: Peticiones | 4,00  | 4,00  | 0,00 | 0,00 % |
| Sesión completa (bytes) | 1 011 683,00 | 87 589,00 | -924 094,00 | 91,34 % |
| Recorrido autenticado (bytes) | 743 761,00 | 17 696,00 | -726 065,00 | 97,62 % |
| Peticiones del recorrido | 7,00 | 13,00 | 6,00 | -85,71 % |
| TBT del recorrido (ms) | 64,47 | 0,00 | -64,47 | 100,00 % |

### 4.1 Respuesta API: media, mediana y P95

| Recurso | Transferencia ANTES → DESPUÉS (bytes) | Media ANTES → DESPUÉS (ms) | Mediana ANTES → DESPUÉS (ms) | P95 ANTES → DESPUÉS (ms) |
|---|---:|---:|---:|---:|
| pedidos | 557975 → 1526 | 40.1 → 12.0 | 35.3 → 11.6 | 78.7 → 16.7 |
| vehiculos | 15611 → 716 | 9.9 → 10.5 | 8.2 → 10.1 | 16.7 → 13.3 |
| conductores | 18278 → 841 | 8.0 → 10.0 | 7.9 → 9.9 | 9.1 → 11.7 |
| clientes | 75142 → 790 | 11.0 → 10.3 | 10.8 → 10.1 | 12.7 → 12 |

Las estadísticas provienen de las 30 muestras `samples_ms` de cada recurso, conservadas en los JSON; la media aritmética se deriva de esas mismas muestras. No es una nueva medición ni se combina con otra carga.

Las medianas de ambos presets y del recorrido cumplen score ≥90, FCP ≤1.000 ms, LCP ≤1.400 ms, TBT ≤85 ms, CLS ≤0,02 y transferencia ≤1.100.000 bytes. El script `check_budgets.py` falla si falta una métrica, no hay tres corridas o se rebasa algún umbral. LHCI ejecutó además tres auditorías y pasó todas las aserciones. Una [prueba negativa intencional](evidencias/validacion-20261110/lhci/presupuesto-negativo.json) con FCP máximo de 1 ms devolvió error sobre los mismos reportes; al restaurar el presupuesto real volvió a aprobar, sin repetir auditorías. Son resultados locales del código identificado, no métricas de producción ni una promesa de igualdad en cualquier equipo.

## 5. Impacto ambiental y energía atribuida

Se emplea [SWDM v4, fuente oficial](https://sustainablewebdesign.org/estimating-digital-emissions/): datos en GB decimales; intensidades operativas 0,055 + 0,059 + 0,080 = 0,194 kWh/GB y energía incorporada 0,012 + 0,013 + 0,081 = 0,106 kWh/GB. Se aplica intensidad mundial de 494 g CO2e/kWh, sin descuento por hosting verde ni por visitas recurrentes. El total es 0,300 kWh/GB. Es energía atribuida por un modelo, no consumo eléctrico medido del servidor.

La fórmula del HTML de referencia usa otros coeficientes y emisiones “ajustadas” sin detallar sus factores. Se reemplaza por el modelo v4 verificable; no se copian sus resultados de ejemplo.

```text
GB = bytes / 1.000.000.000
kWh_operativos = GB × 0,194
kWh_incorporados = GB × 0,106
kWh_atribuidos = GB × 0,300
g_CO2e = kWh_atribuidos × 494
reducción_% = (ANTES − DESPUÉS) / ANTES × 100
```

| Estado | Bytes/sesión | GB/sesión | kWh atribuidos/sesión | g CO2e/sesión | kWh/año | kg CO2e/año |
|---|---:|---:|---:|---:|---:|---:|
| ANTES | 1011683 | 0,001011683 | 0,000303505 | 0,149931 | 18,210294 | 8,995885 |
| DESPUÉS | 87589 | 0,000087589 | 0,000026277 | 0,012981 | 1,576602 | 0,778841 |

La proyección es un escenario hipotético de 60.000 sesiones/año (10 operadores × 20 sesiones/día × 300 días), no tráfico real confirmado. El ahorro estimado es 16,633692 kWh atribuidos y 8,217044 kg CO2e/año (91,34 %). Se conserva precisión completa hasta presentar el resultado. No se convierten estos valores en árboles o kilómetros sin una fuente específica.

El cálculo puede reproducirse con `python3 scripts/green_it/swdm.py <antes.json> <despues.json> 60000`. Sus pruebas verifican GB decimal, factores, negativos y el uso de bytes de sesiones emparejadas. El modelo no demuestra una reducción física de CPU, consumo eléctrico o emisiones medidas; usar otro factor local alteraría el valor absoluto.

## 6. Evidencias, pruebas y estado de la rúbrica

| Comprobación | Resultado local | Evidencia |
|---|---|---|
| Backend SQLite | 59 pruebas, 94,53 % de cobertura | `tests/test_green_it.py`, `tests/test_green_contracts.py` y regresión US-001–US-015 |
| Backend PostgreSQL 16 aislado | 59 pruebas, 94,53 %; upgrade Alembic y check sin diferencias | Base separada `sprint4_regression_test` |
| Frontend | 32 pruebas; 93,68 % de líneas y build correcto | Vitest/RTL; hook 100 % de líneas |
| Herramientas | 3 pruebas de cálculos/presupuestos y 1 de imágenes, 1 de estadística y 1 de redacción de secretos | Unit tests; verifican el fallo de presupuestos y guardián |
| Navegador | 33 comprobaciones, 360/1440 px, sin errores | [Registro del flujo](evidencias/validacion-20261110/verificacion-flujo.json) |
| Lighthouse | Tres corridas por preset/estado y tres flujos por estado | [ANTES](evidencias/validacion-20261110/metricas-antes.json), [DESPUÉS](evidencias/validacion-20261110/metricas-despues.json) y reportes individuales en esa carpeta |
| Lighthouse CI | Tres corridas, sin aserciones fallidas | [Aserciones](evidencias/validacion-20261110/lhci/assertion-results.json), [manifiesto](evidencias/validacion-20261110/lhci/manifest.json) |
| Fuente auditada | Captura del árbol de trabajo antes de publicar | [Manifiesto SHA-256](evidencias/validacion-20261110/source-snapshot.json) |

Axe revisó los cuatro módulos a 360 y 1440 px sin infracciones A/AA detectadas; el [registro](evidencias/validacion-20261110/accesibilidad-axe.json) conserva también comprobaciones incompletas que requieren revisión humana. No acredita conformidad universal. Python y npm no registran vulnerabilidades conocidas en el alcance auditado. Los [headers HTTP reales](evidencias/validacion-20261110/http-cache-compression.json) verifican 304 sin cuerpo, gzip, Brotli, caché privada y assets immutable a través de Caddy.

La prueba de navegador se ejecutó en `ecolog-green-after` después de la medición inicial y añadió vehículos `E04-*`. La medición final usa la carga nueva de `ecolog-green-final`, sin esas escrituras. La [comparación por hash](evidencias/validacion-20261110/build-equality.json) demuestra igualdad de los assets servidos y del código backend en ambos entornos. Las capturas de interfaz reflejan ese entorno de comprobación; los conteos usados para rendimiento son los guardados antes de las escrituras. La advertencia de deprecación de TestClient/httpx no impidió las pruebas y no se declara como fallo funcional.

| Criterio de evaluación | Peso | Estado verificable |
|---|---:|---|
| Ocho áreas, diagnóstico, métricas y cálculo | 11 | Implementación y validación local disponibles; imágenes usadas realmente y sus límites descritos |
| Estándares, arquitectura y matriz | 4 | [Segundo informe](<02 Estandares Ingeniería de software V_1_0_0.md>), ocho filas y reglas verificables |
| CI/CD, estructura y Git | 3 | YAML y LHCI comprobados localmente; ejecución de este cambio en GitHub y su publicación pendientes |
| Documento y comunicación | 2 | Dos informes, código delimitado, tablas y navegación relativa; revisión académica final pendiente |

No se adjudica una nota ni se declara completado el DoD por estas pruebas. La revisión independiente, la ejecución en GitHub del cambio final y su publicación requieren evidencia propia.

El [HTTPS local](evidencias/validacion-20261110/https-local.json) respondió 200 con certificado y hostname verificados mediante la CA local de Caddy, sin desactivar la verificación TLS ni instalar confianza global.

## 7. Ejecución reproducible y gestión de versiones

Desde la raíz, con Python 3.12, Node 22 y Docker:

```bash
python3 scripts/green_it/prepare_env.py --output /tmp/ecolog-green.env
# El archivo temporal conserva las credenciales; no se agrega a Git.
docker compose --env-file /tmp/ecolog-green.env -f docker-compose.staging.yml -p ecolog-green up -d --build --wait
docker cp scripts/green_it/seed_carga.py ecolog-green-backend-1:/tmp/seed_carga.py
docker exec -e GREEN_AUDIT_SEED=1 ecolog-green-backend-1 python /tmp/seed_carga.py
npm ci --ignore-scripts --prefix scripts/green_it
# CHROME_PATH debe señalar al Chrome instalado en el equipo.
python3 scripts/green_it/run_measure.py despues /tmp/ecolog-green-resultados --env-file /tmp/ecolog-green.env
python3 scripts/green_it/check_budgets.py /tmp/ecolog-green-resultados/metricas-despues.json
scripts/green_it/node_modules/.bin/lhci autorun --config=lighthouserc.json
# Ejecutar la comprobación con escrituras después de medir:
python3 scripts/green_it/run_measure.py despues /tmp/ecolog-green-resultados --env-file /tmp/ecolog-green.env --verify-flow
```

Para recuperar ANTES, ejecutar `git archive cfcd53f` en una carpeta separada, crear otro proyecto Compose y otro archivo de entorno con puertos distintos. Copiar allí la misma semilla y medir con la etiqueta `antes`. No sustituir el código ni la base operativa del desarrollador para generar el contraste. Para repetir un ensayo con la misma semilla después de escrituras, crear un entorno de auditoría nuevo: la semilla rechaza cargas parciales y bases ajenas; no borra registros.

El workflow [green-audit.yml](../../../.github/workflows/green-audit.yml) reproduce build, semilla, LHCI, presupuestos, recorrido y artefactos privados, con dependencias fijadas y permisos mínimos. No usa `|| true` para convertir fallos en éxito ni publica reportes en almacenamiento público temporal.

La rama local `sprint-4` se creó desde los avances existentes. Las mediciones se capturaron antes del commit. El usuario autorizó posteriormente registrar los cambios localmente; `git log -1` identifica ese registro. La publicación remota, tags y merge siguen pendientes de autorización. La secuencia siguiente documenta el procedimiento de registro y publicación; no acredita un push ya ejecutado:

```bash
git status
mkdir -p "docs/03 Implementación/reduccion del impacto ambiental"
git add src scripts .github .gitignore docker-compose.staging.yml lighthouserc.json README.md AGENTS.md "docs/03 Implementación/reduccion del impacto ambiental"
git diff --cached --check
git commit -m "feat(green-it): validar Sprint 4 y documentar entrega v1.0.0"
git push -u origin sprint-4
# Revisar el PR y sus controles antes de autorizar integración a main.
```

Se conserva el fin planificado de Jira del 23/11/2026; la fecha oficial académica todavía no fue confirmada. La revisión formal y aceptación se registrarán cuando ocurran.

Los fragmentos DOM que conservaban credenciales temporales se redactaron antes de entregar los artefactos; [el registro de redacción](evidencias/validacion-20261110/redaccion-secretos.json) identifica los archivos afectados. El exportador aplica ahora esa redacción automáticamente, con una prueba que comprueba que las métricas numéricas permanecen intactas.

## 8. Control documental

| Revisión | Fecha | Cambio |
|---|---|---|
| V_1_0_0 | 10/11/2026 | Documento heredado de la rama `respaldo-frontend`, commit `e7ac3ff`. |
| V_1_0_1 | 10/11/2026 | Validación sobre código corregido, nuevas mediciones, matemática reproducible y distinción de resultados locales/publicación. Nombre de archivo conservado por consigna. |
| V_1_0_2 | 10/11/2026 | Retirada de evidencias superadas y HTML/logs redundantes; todas las muestras y métricas vigentes se mantienen sin cambios. |

[← Volver al README](../../../README.md)
