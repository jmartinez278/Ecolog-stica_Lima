# Backend — Sprint 4, versión 1.4.0

API FastAPI con capas `api → services → repositories → PostgreSQL`. Implementa US-001 a US-015. La documentación interactiva está en `/docs`, el contrato JSON en `/openapi.json` y la comprobación de base de datos en `/health`.

## Configuración y ejecución

Desde la raíz, copiar `.env.example` a `.env` y sustituir **todos** los valores que empiezan por `replace`. `JWT_SECRET` debe ser aleatorio y tener al menos 32 caracteres. El usuario operador se crea solo si aún no existe; cambiar `BOOTSTRAP_OPERATOR_PASSWORD` después no cambia su contraseña almacenada.

### Entorno de desarrollo en VS Code con WSL

Si Pylance muestra `reportMissingImports` para `fastapi` o `sqlalchemy.orm`, el intérprete seleccionado no tiene instaladas las dependencias del backend. Desde la raíz del repositorio, crear el entorno e instalar el mismo `requirements.txt` usado por Docker:

```bash
python3 -m venv src/backend/.venv
src/backend/.venv/bin/python -m pip install --only-binary=:all: --require-hashes -r src/backend/requirements-dev.lock
```

En VS Code conectado a WSL, ejecutar **Python: Select Interpreter** y elegir `src/backend/.venv/bin/python`; después ejecutar **Developer: Reload Window**. La versión `3.12.3` de la barra de estado no distingue el Python global del virtual: comprobar la **ruta completa** del intérprete. `pyrightconfig.json` indica a Pylance dónde están el entorno `.venv` y el paquete `app`. El entorno y los ajustes personales de `.vscode` están excluidos de Git. Si se abre el repositorio desde Windows en vez de WSL, crear un entorno virtual con Python de Windows y seleccionar su `python.exe`.

Iniciar el conjunto con `docker compose up --build`. La migración se aplica al iniciar el backend y el proceso de carga inicial crea los roles, un operador y un cliente de ejemplo de forma idempotente. La API estará en `http://localhost:8000`, la interfaz en `http://localhost:5173` y PostgreSQL en el puerto `5432`. Los puertos publicados por Compose (`5432`, `8000`, `5173`) están limitados a `127.0.0.1` del equipo anfitrión. Son únicamente para desarrollo local: el proxy interno de Vite sigue accediendo al backend a través de `backend:8000`, y el backend a PostgreSQL a través de la red interna de Docker. No abrir ni publicar estos puertos directamente en una red externa. Un despliegue externo requiere HTTPS/TLS, secretos administrados, aislamiento de PostgreSQL y un procedimiento de staging independiente; este Compose NO los acredita.

Para arrancar el backend sin Compose, instalar `requirements.txt`, configurar `DATABASE_URL` apuntando a PostgreSQL, ejecutar `python -m alembic upgrade head`, `python -m app.db.seed_demo` y `python -m uvicorn app.main:app --reload` desde `src/backend`.

Docker instala únicamente `requirements.lock`; las pruebas y el desarrollo usan `requirements-dev.lock`. Las migraciones vigentes son `0001_sprint1`, `0002_clients_email_unique` y `0003_green_list_indexes`. Respaldar bases utilizadas antes de migrar; no se borran datos para resolver conflictos.

Los cuatro listados aceptan `?page=1&limit=12` y devuelven `{items,total,page,limit,pages}`. El límite máximo es 50 y el orden incluye UUID para desempatar. Omitir `page` conserva la lista anterior por compatibilidad; la interfaz nueva siempre solicita páginas. Los filtros de estado/disponibilidad/actividad se aplican también al total. El router valida parámetros, el servicio coordina y el repositorio ejecuta proyección y límite SQL.

Las lecturas autenticadas revalidan con ETag y `Cache-Control: private, no-cache`; un 304 sigue exigiendo permisos vigentes. Errores, autenticación y escrituras usan `no-store`. Gzip comprime JSON elegible y Caddy sirve assets precomprimidos Brotli/Gzip. El procedimiento y sus mediciones están en el [informe Green IT](<../../docs/03 Implementación/reduccion del impacto ambiental/01 Informe de reduccion del impacto ambiental V_1_0_0.md>).

## Contrato y reglas

`POST /api/v1/auth/login` recibe JSON con `email` y `password`, y devuelve un token Bearer. Las operaciones de lectura aceptan los roles documentados de lectura; las escrituras requieren `ADMINISTRADOR` u `OPERADOR_LOGISTICO`. La consulta global de estos módulos no se permite a `CONDUCTOR` porque aún no existen asignaciones para aplicar la restricción por atributos.

Los registros usan UUID. Los pedidos requieren un `cliente_id` activo. `/api/v1/clientes` permite registrar, consultar, filtrar y actualizar clientes y sus condiciones de entrega. Los conductores pueden actualizarse y desactivarse, salvo que estén asignados. Solo los pedidos `PENDIENTE` pueden editarse o cancelarse. Los registros de vehículo y conductor se desactivan lógicamente. Una mutación exitosa y su auditoría se confirman en la misma transacción; los fallos HTTP de mutaciones se auditan aparte.

## Pruebas

`python -m pytest -q --cov=app --cov-report=term-missing --cov-fail-under=80` ejecuta pruebas aisladas con SQLite por defecto. Para verificar persistencia PostgreSQL, crear una base de prueba **separada**, exportar `TEST_DATABASE_URL=postgresql+psycopg://.../ecologistica_test` y ejecutar el mismo comando. Las pruebas crean y destruyen las tablas en esa base: nunca apuntar `TEST_DATABASE_URL` a datos de trabajo. Si se proporciona una URL explícita, `conftest.py` exige que la base se llame `test_*` o `*_test` (o SQLite en memoria); esta restricción adicional **no sustituye** una base exclusiva sin datos valiosos.

### Pruebas PostgreSQL y auditoría en CI

La tarea `postgres-integration` de `.github/workflows/ci.yml` ejecuta la suite completa en PostgreSQL 16 con contenedor efímero y base `ecologistica_test`, independiente del job SQLite. El 24/10/2026 ambas completaron **25 pruebas**, con **92,85 %** de cobertura total del backend. Los casos `tests/test_transaction_audit.py` verifican la reversión de alta/actualización cuando falla la auditoría de éxito, y el registro separado de intentos rechazados sin mutar la entidad. Las nuevas versiones deben volver a ejecutar el pipeline y comprobarse en el run correspondiente.
