# Sistema General de Control de Personal en Tiempo Real

Paquete autosuficiente que orquesta backend Node.js, frontend React y PostgreSQL para monitorear personal en vivo. Se ejecuta íntegramente en contenedores y se administra mediante una SPA.

## Requisitos
- Docker y Docker Compose v2
- Make (opcional, facilita comandos)

## Puesta en marcha
```bash
cp .env.example .env
cp app/.env.example app/.env
docker compose up -d --build
```

La base se inicializa automáticamente con esquemas y semillas. Accesos principales:
- SPA: http://localhost:5173
- API/diagnóstico: http://localhost:8080/health

Para detener los servicios: `docker compose down`

### Makefile útil
- `make build`
- `make up`
- `make down`
- `make seed` (reinyecta semillas desde el backend)

## API
La documentación OpenAPI se encuentra en [`openapi.yaml`](./openapi.yaml). Endpoints clave: autenticación, personas, eventos de presencia, estados en vivo, reportes KPI y alertas de prueba. Incluye ejemplos y definición de errores esperados.

## Arquitectura
- **Backend** (`backend-node/`): Express, WebSocket y motor de estados puro que resuelve conflictos por prioridad (EMERGENCY > BIOMETRIC > GEOFENCE > TASK > CALENDAR). Publica eventos en `/ws/status` para actualizaciones en tiempo real. Tests con Jest (motor + contrato básico).
- **Frontend** (`app/`): React + TypeScript + Vite + Tailwind + React Query + React Hook Form + Zod + TanStack Table + Recharts. Incluye onboarding institucional, configuración, CRUD e importación CSV de personas, sandbox de eventos, dashboard en vivo, auditoría y diagnóstico.
- **DB** (`db/`): PostgreSQL con tablas `person`, `shift`, `presence_event`, `status_snapshot`, `site`, `audit_log`. Seeds con usuarios de ejemplo.
- **Infra**: Docker Compose (sin campo `version`) y Makefile. CI publica imágenes en GHCR.

### Escalabilidad futura
Para analítica avanzada, puede agregarse ClickHouse replicando los eventos desde PostgreSQL. Documentar en infra un conector (p.ej. Debezium + Kafka) que replique `presence_event` para consultas OLAP.

### Monitoreo en tiempo real
El frontend consume el WebSocket `/ws/status` y cae a polling de 3 segundos si no hay conectividad. Los cambios también se reflejan en la tabla y gráficos del dashboard.

## Tests
Desde el backend:
```bash
cd backend-node
npm install
npm test
```

## CI/CD
El workflow [`ci.yml`](.github/workflows/ci.yml) construye las imágenes y las publica en GHCR (`ghcr.io/<OWNER>/<REPO>-backend:latest` y `ghcr.io/<OWNER>/<REPO>-frontend:latest`). El token estándar `GITHUB_TOKEN` es suficiente para el push.

## Tips operativos
- Los seeds ejecutados por Docker cargan personas y estados iniciales.
- La plantilla CSV está en `app/src/assets/plantilla_personas.csv`.
- TTL recomendado para `presence_event`: ejecutar periódicamente `DELETE FROM presence_event WHERE ts < NOW() - INTERVAL '90 days';` o configurar `pg_cron`.

## Licencia
MIT (puede ajustarse según necesidades de la institución).
