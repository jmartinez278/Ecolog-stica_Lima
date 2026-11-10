# Guía de trabajo — EcoLogística Lima

## Contexto y alcance

- **Rama de desarrollo vigente:** `Sprint-3`, autorizada por el usuario en el fork `RodrigoAC12/Ecolog-stica_Lima`. El Sprint 3 fue aprobado e integrado mediante PR #5, commit `3f1b4fe`. El 27/10/2026 el usuario autorizó sincronizar el fork, corregir los hallazgos Cloud, incorporar cobertura desde CI y actualizar las evidencias.
- **Versión del proyecto:** 1.3.0 para Sprint 3; 1.2.4 es la base histórica integrada. Los documentos numerados `V_1_0_0` conservan su versión documental individual.
- El PR #5 ya está integrado. Las correcciones posteriores se validan en el fork y se proponen para revisión del propietario; no fusionar cambios en el repositorio oficial sin su aprobación. La revisión del cliente o del usuario sigue siendo un pendiente diferente.
- Sprint 1 abarca US-001 a US-010; Sprint 2, US-011 a US-015. La entrega documental de Sprint 3 conserva únicamente los cinco informes exigidos en `docs/03 Implementación/Sprint 03/` y sus capturas SonarCloud.
- Los entregables históricos están en `docs/03 Implementación/Sprint 1/` y `docs/03 Implementación/Sprint 2/`; mover un archivo no significa que su sesión o aceptación histórica haya ocurrido.
- Los cinco informes oficiales del Sprint 3 están en `docs/03 Implementación/Sprint 03/`; conservar sus enlaces bidireccionales y evidencias, sin presentar resultados automáticos como aprobación humana.
- Los cuatro entregables obligatorios de planificación están en `docs/02 Planificación/`; el seguimiento adicional está en `Anexos/`.
- Registrar la documentación oficial del Sprint 3 en `docs/03 Implementación/Sprint 03/`.
- El estado de Jira y las ceremonias se basan en datos reales. No inventar revisores, fechas, sesiones, aprobaciones ni despliegues de staging.
- No agregar secretos. Archivos `.env` operativos no deben almacenarse en Git.

## Arquitectura

- Frontend React + TypeScript + Vite en `src/frontend/src`, con `App.tsx` como composición de páginas, `pages/`, `forms/`, `components/` y `styles/`. El token permanece en memoria.
- Backend FastAPI + SQLAlchemy + PostgreSQL en `src/backend`: router HTTP → servicio → repositorio → persistencia y auditoría.
- Alembic mantiene las revisiones `0001_sprint1` y `0002_clients_email_unique`. Al migrar una base ya utilizada, hacer copia de seguridad y resolver duplicados de correo antes de aplicar la revisión incremental; no borrar registros automáticamente.
- El despliegue y las comprobaciones se limitan a localhost. `docker-compose.yml` es para desarrollo y `docker-compose.staging.yml` para validación local separada. No exigir servidor ni dominio público; conservar evidencia del entorno realmente ejecutado.

## Verificación técnica

Backend, desde `src/backend`:

```bash
python -m pytest -q --cov=app --cov-report=term-missing --cov-fail-under=80
```

El CI utiliza además PostgreSQL 16 **aislado**. El fixture puede crear y eliminar tablas: nunca usar una base productiva como `TEST_DATABASE_URL`.

Frontend, desde `src/frontend`:

```bash
npm ci
npm test
npm run build
```

Desde la raíz:

```bash
python3 scripts/check_markdown_links.py
docker compose --env-file .env.example config --quiet
docker compose --env-file .env.staging.example -f docker-compose.staging.yml config --quiet
```

Los workflows CodeQL y auditoría de dependencias deben pasar en la **rama final**. La revisión humana del PR, WCAG AA/360 px en navegadores reales, BDD con interesados y staging TLS en localhost se comprueban por separado: una prueba automatizada no cierra el Definition of Done por sí misma.

## Documentos de referencia

- Requisitos: `docs/01 Inicio/06. Requisitos funcionales V_1_0_0.md` y `07. Requisitos no funcionales V_1_0_0.md`.
- Reglas de negocio: `docs/01 Inicio/09. Reglas de negocio V_1_0_0.md`.
- Planificación: `docs/02 Planificación/01 Transformando a ágil V_1_0_1.md`.
- Diseño visual: `DESIGN.md`.
- Entrega en revisión previa: `docs/03 Implementación/Sprint 03/`.
