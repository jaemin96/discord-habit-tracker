# Discord Habit Tracker Server

## Docker local run

Infrastructure files live at the repository root so they can later be shared by additional apps such as an admin dashboard.

By default, the root `docker-compose.yml` starts only the NestJS server and reads environment variables from `apps/habit-tracker-server/.env`. Use this when `DATABASE_URL` points to Supabase or another hosted Postgres.

```powershell
docker compose up --build
```

If you want to use a different server env file:

```powershell
$env:HABIT_TRACKER_SERVER_ENV_FILE = "apps/habit-tracker-server/.env.local"
docker compose up --build
```

If you want a fully local stack with PostgreSQL in Docker too:

```powershell
$env:HABIT_TRACKER_SERVER_ENV_FILE = "apps/habit-tracker-server/.env.local-db"
docker compose -f docker-compose.yml -f docker-compose.local-db.yml up --build
```

The `server` container runs Prisma migrations on startup and then starts the NestJS app.

## GHCR publish

The workflow at `.github/workflows/publish-habit-tracker-server.yml` publishes:

- `ghcr.io/<github-owner>/habit-tracker-server:latest`
- `ghcr.io/<github-owner>/habit-tracker-server:sha-<commit>`
- `ghcr.io/<github-owner>/habit-tracker-server:<branch>`

It runs automatically on pushes to `main` that touch the server or workspace dependencies, and it can also be triggered manually from GitHub Actions.
