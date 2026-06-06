# H CMS

AI-first content management dashboard built with Next.js, Prisma, and PostgreSQL.

## Prerequisites

- Node.js 20+
- Docker Desktop (for local PostgreSQL)

## Quick start

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Environment**

   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` if needed. Defaults work with the bundled Docker database.

3. **Database**

   ```bash
   npm run setup
   ```

   This starts PostgreSQL (`docker compose up -d`) and applies Prisma migrations.

4. **Run the app**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

5. **Sign in**

   On first run, the bootstrap admin from `.env.local` is created automatically:

   - Username: `admin`
   - Password: `admin`

   Change `AUTH_BOOTSTRAP_*` in `.env.local` before first login in production.

## Project structure

```
src/
  app/              # Next.js App Router (pages, API routes, server actions)
    (dashboard)/    # Authenticated CMS routes
    login/          # Public login
    api/            # REST endpoints
  components/       # UI components
  lib/              # Auth, Prisma, AI, SEO, commands
  generated/prisma/ # Prisma client (generated on install)
```

## Useful commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (Turbopack) |
| `npm run setup` | Start DB + run migrations |
| `npm run db:up` | Start PostgreSQL container |
| `npm run db:migrate` | Apply pending migrations |
| `npm run build` | Production build |

## Troubleshooting

**`Can't reach database server at localhost:5432`**

PostgreSQL is not running. Start it with:

```bash
npm run db:up
```

**Login says no accounts yet**

Add `AUTH_BOOTSTRAP_ADMIN_USERNAME` and `AUTH_BOOTSTRAP_ADMIN_PASSWORD` to `.env.local`, restart `npm run dev`, then sign in.
