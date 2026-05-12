# Singularity

## Branching strategy

We use a **linear promotion** flow. Feature and task branches are created from `develop`, then merged back into `develop`. `develop` is merged into `main` when we cut a release.

```text
main  ←  develop  ←  task-type_task-name_assignee
```

| Branch | Purpose |
|--------|---------|
| `main` | Production-ready code. |
| `develop` | Integration branch for ongoing work. |
| `task-type_task-name_assignee` | Short-lived branches for a single task or feature. |

**Naming convention:** `{task-type}_{task-name}_{assignee}`

Use lowercase, hyphens in the task name if you prefer readability; underscores separate the three parts.

**Example:** `feature_create-read-me_dumi`

Suggested task types: `feature`, `fix`, `chore`, `docs`, `refactor`, `test`.

---

## About this project

The One Event Marketplace: a React + TypeScript + Vite web app (Tailwind CSS, shadcn/ui, Supabase).

---

## Prerequisites

Install the following before working on the repo.

- **Git**: clone, branch, and merge.
- **Node.js**: LTS recommended (includes **npm**). Matches the versions your team standardizes on.
- **A modern browser**: for local development and testing.

Optional but useful:

- **VS Code or Cursor**: editor; ESLint integration helps.

For **full local backend / database development** (Docker-based workflows, local Postgres, or future `docker-compose` setups):

- **Docker Desktop** (or Docker Engine + Docker Compose on Linux): run containers consistently on every machine.
- **PostgreSQL**: either run via Docker (recommended for parity) or a local install if you prefer a native Postgres service.

> **Note:** Running the web UI alone does **not** require Docker or Postgres today. The app talks to hosted Supabase from the client; Docker and Postgres are listed so the README stays accurate when you add local API services or a local database.

---

## Run the project (no Docker)

From the repository root.

### 1. Install dependencies

```bash
npm install
```

### 2. Start the development server

```bash
npm run dev
```

Vite serves the app at **http://localhost:8080/** (see `vite.config.ts` for host and port).

### 3. Other useful commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server with HMR. |
| `npm run build` | Production build to `dist/`. |
| `npm run build:dev` | Build in development mode. |
| `npm run preview` | Serve the production build locally. |
| `npm run lint` | Run ESLint on the project. |

---

## Docker and Postgres (local development) - not final

Use this when you need a **local Postgres** instance (custom APIs, migrations, or replacing remote services in development). Exact wiring depends on your future `.env` and services; the steps below are a common baseline.

### 1. Start Postgres in Docker

Example: Postgres 16, database `singularity`, exposed on port `5432`.

One line (PowerShell, **cmd.exe**, bash, zsh):

```bash
docker run --name singularity-postgres -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=singularity -p 5432:5432 -d postgres:16
```

Multi-line (bash / zsh / Git Bash on Windows):

```bash
docker run --name singularity-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=singularity \
  -p 5432:5432 \
  -d postgres:16
```

Stop and remove when finished (this deletes the container; use a volume if you need persistent data across removals):

```bash
docker stop singularity-postgres
docker rm singularity-postgres
```

### 2. Optional: persistent data

Mount a named volume so data survives container recreation:

```bash
docker volume create singularity-pgdata

docker run --name singularity-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=singularity \
  -p 5432:5432 \
  -v singularity-pgdata:/var/lib/postgresql/data \
  -d postgres:16
```

When the team adds a **`docker-compose.yml`**, prefer `docker compose up` from the repo root and document any extra services (APIs, Supabase local stack, etc.) in this section.

---

## Project structure (high level)

| Path | Role |
|------|------|
| `src/` | Application source (components, pages, hooks, contexts). |
| `src/pages/` | Route-level views wired in `App.tsx`. |
| `public/` | Static assets served as-is. |
| `vite.config.ts` | Vite config (aliases, dev server). |

---

## Next.js migration (future)

A move to Next.js is **moderate effort**, not a rewrite. The app is standard React + TypeScript + Tailwind with only a few routes today, so they map cleanly to the App Router (`/`, `/rfq/[token]`, and a not-found page). Most work is replacing React Router, adding a root `layout` with client `Providers` (theme, React Query, toasts, auth context), and marking interactive and Supabase-heavy trees with `'use client'`. Optional later step: `@supabase/ssr` if we want server-aware sessions instead of a purely client-side Supabase client.

---

## Contributing

1. Branch from `develop` using the naming convention above.
2. Keep commits focused; open a PR into `develop` (not `main`, unless releasing).
3. Run `npm run lint` before requesting review when you touch TypeScript or React code.
