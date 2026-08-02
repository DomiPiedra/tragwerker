# Tragwerker — independent local instance

Fully isolated copy of HCMS for **Tragwerker**. Does not share Docker containers, volumes, ports, or databases with `HCMS`, `HCMS-copy`, `runn-app`, or any other project.

## Resource isolation

| Resource | HCMS (original) | HCMS-copy | runn.app | Tragwerker |
| --- | --- | --- | --- | --- |
| Next.js | http://localhost:3000 | http://localhost:3001* | http://localhost:3002 | **http://localhost:3003** |
| PostgreSQL port | 5432 | 5433* | 5434 | **5435** |
| Docker container | `hcms` | `hcms-copy-db`* | `runn-app-db` | **`tragwerker-db`** |
| Docker volume | `hcms2_postgres_data` | `hcms_copy_postgres_data`* | `runn_app_postgres_data` | **`tragwerker_postgres_data`** |
| Database | `hcms` | `hcms_copy`* | `runn_app` | **`tragwerker`** |
| Compose project | `hcms` | `hcms-copy`* | `runn-app` | **`tragwerker`** |
| npm package name | `h-cms` | `h-cms` | `runn-app` | **`tragwerker`** |

\*HCMS-copy values if configured per `HCMS-copy/COPY-SETUP.md`.

## First-time setup

```bash
cd /Users/dominikholzheu/Codes/Tragwerker

docker compose up -d
npm install
npx prisma migrate deploy
```

## Daily development

```bash
cd /Users/dominikholzheu/Codes/Tragwerker
docker compose up -d
npm run dev
```

Open **http://localhost:3003**

## Run all instances

| Terminal | Folder | URL |
| --- | --- | --- |
| 1 | `HCMS` | http://localhost:3000 |
| 2 | `HCMS-copy` | http://localhost:3001 |
| 3 | `runn-app` | http://localhost:3002 |
| 4 | `Tragwerker` | http://localhost:3003 |

The original `HCMS` project was not modified.
