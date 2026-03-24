# Pally

![Pally banner](./public/banner.png)

Pally is an open-source project and task application for teams that want to self-host their planning stack. It is free forever, built around organizations and teams, and can optionally sync with GitHub issues and repositories when that workflow matters.

Built with TanStack Start, Effect, Better Auth, Drizzle, Postgres, Bun, and shadcn/ui, Pally is designed for a browser-first experience with a CLI and API alongside it.

## Why Pally

- 100% open source
- Free forever
- Self-hosting focused
- Organizations, teams, projects, and tasks in one app
- Optional GitHub sign-in and sync
- API and CLI included

## Features

- Authentication with Better Auth
- Organizations and teams
- Task management with table and board views
- Project management with team-aware scoping
- Saved task views and filters
- Command palette for navigation and quick actions
- Effect-powered API with Scalar docs at `/api/docs`
- CLI for working with tasks, projects, and views
- GitHub OAuth sign-in support
- GitHub App-powered repository and issue sync
- Seeded starter workspace data for new organizations

## Tech Stack

- TanStack Start
- React
- Effect v4
- Better Auth
- Drizzle ORM
- Postgres
- shadcn/ui and Tailwind CSS
- Bun
- TypeScript

## Prerequisites

Before you start, make sure you have:

- [Bun](https://bun.sh)
- [Docker](https://www.docker.com/)

## Setup

1. Install dependencies:

```bash
bun install
```

2. Copy the example environment file:

```bash
cp .env.example .env
```

3. Fill in the required values in `.env`.

At minimum for local development you should set:

```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=pally
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/pally
BETTER_AUTH_SECRET=replace-with-a-long-random-string
BETTER_AUTH_URL=http://localhost:3000
```

GitHub variables are optional unless you want GitHub sign-in or repository syncing.

4. Start Postgres:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d postgres
```

5. Run database migrations:

```bash
bun run migrate
```

6. Start the development server:

```bash
bun run dev
```

## Self-Hosting

Pally is built to run as a self-hosted app with Postgres and a single app container.

- The published container image is `ghcr.io/billyhawkes/pally:latest`
- Postgres is required
- Database migrations run automatically when the app starts
- GitHub OAuth and GitHub App sync are optional
- `docker run`, `docker compose`, and Coolify all work well

### Environment Variables

These are the variables you should understand before deploying.

#### Required

```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=change-me
POSTGRES_DB=pally
DATABASE_URL=postgresql://postgres:change-me@postgres:5432/pally
BETTER_AUTH_SECRET=replace-with-a-long-random-string
BETTER_AUTH_URL=https://pally.your-domain.com
```

- `POSTGRES_USER`: Postgres username
- `POSTGRES_PASSWORD`: Postgres password
- `POSTGRES_DB`: Postgres database name
- `DATABASE_URL`: connection string Pally uses to reach Postgres
- `BETTER_AUTH_SECRET`: long random secret used to sign auth data and sessions
- Generate `BETTER_AUTH_SECRET` with `openssl rand -base64 32`
- `BETTER_AUTH_URL`: public base URL users visit in the browser

#### Optional GitHub OAuth

Only needed if you want GitHub sign-in or account linking.

```env
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
```

#### Optional GitHub App Sync

Only needed if you want repository installs and two-way GitHub issue sync.

```env
GITHUB_APP_ID=
GITHUB_APP_SLUG=
GITHUB_APP_PRIVATE_KEY=
GITHUB_APP_WEBHOOK_SECRET=
```

### Option 1: Docker Image + Existing Postgres

Use this when you already have a Postgres server or managed database.

```bash
docker run -d \
  --name pally \
  -p 3000:3000 \
  -e DATABASE_URL="postgresql://postgres:change-me@your-postgres-host:5432/pally" \
  -e BETTER_AUTH_SECRET="replace-with-a-long-random-string" \
  -e BETTER_AUTH_URL="https://pally.your-domain.com" \
  -e GITHUB_CLIENT_ID="" \
  -e GITHUB_CLIENT_SECRET="" \
  -e GITHUB_APP_ID="" \
  -e GITHUB_APP_SLUG="" \
  -e GITHUB_APP_PRIVATE_KEY="" \
  -e GITHUB_APP_WEBHOOK_SECRET="" \
  ghcr.io/billyhawkes/pally:latest
```

Notes:

- Replace `your-postgres-host` with the hostname of your Postgres server
- Set `BETTER_AUTH_URL` to your real public HTTPS URL in production
- `POSTGRES_USER`, `POSTGRES_PASSWORD`, and `POSTGRES_DB` are not required by the app container when `DATABASE_URL` is already set explicitly

### Option 2: Docker Compose with Postgres

Use this when you want a full self-hosted stack on one server or VM.

Create a `docker-compose.yaml` file:

```yaml
services:
  postgres:
    image: postgres:18-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-postgres}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-postgres}
      POSTGRES_DB: ${POSTGRES_DB:-pally}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-postgres} -d ${POSTGRES_DB:-pally}"]
      interval: 5s
      timeout: 5s
      retries: 10

  app:
    image: ghcr.io/billyhawkes/pally:latest
    restart: unless-stopped
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      PORT: 3000
      DATABASE_URL: postgresql://${POSTGRES_USER:-postgres}:${POSTGRES_PASSWORD:-postgres}@postgres:5432/${POSTGRES_DB:-pally}
      BETTER_AUTH_SECRET: ${BETTER_AUTH_SECRET}
      BETTER_AUTH_URL: ${BETTER_AUTH_URL:-http://localhost:3000}
      GITHUB_CLIENT_ID: ${GITHUB_CLIENT_ID:-}
      GITHUB_CLIENT_SECRET: ${GITHUB_CLIENT_SECRET:-}
      GITHUB_APP_ID: ${GITHUB_APP_ID:-}
      GITHUB_APP_SLUG: ${GITHUB_APP_SLUG:-}
      GITHUB_APP_PRIVATE_KEY: ${GITHUB_APP_PRIVATE_KEY:-}
      GITHUB_APP_WEBHOOK_SECRET: ${GITHUB_APP_WEBHOOK_SECRET:-}
    ports:
      - "3000:3000"

volumes:
  postgres_data:
```

Then start it:

```bash
docker compose up -d
```

Useful commands:

```bash
docker compose logs -f app
docker compose down
docker compose pull
docker compose up -d
```

### Coolify

Pally is compatible with Coolify in both common deployment modes.

#### Coolify Docker Image

Use `ghcr.io/billyhawkes/pally:latest` as the image and attach a Postgres service.

- Expose port `3000`
- Set `BETTER_AUTH_URL` to your final Coolify domain
- Set `DATABASE_URL` using the Postgres service credentials Coolify provides
- Add `BETTER_AUTH_SECRET` as a generated secret
- Leave GitHub variables empty unless you are enabling those integrations

#### Coolify Docker Compose

You can also paste the compose example above into a Coolify Docker Compose service.

- Keep the app service on port `3000`
- Keep `DATABASE_URL` pointed at the `postgres` service hostname inside the compose network
- Mount a persistent volume for Postgres data
- Route your public domain to the app service
- Set `BETTER_AUTH_URL` to the same public domain

### Deployment Notes

- Use HTTPS in production so auth callbacks and cookies behave correctly
- Keep `BETTER_AUTH_SECRET` stable after first deployment
- Back up the Postgres volume or managed database regularly
- GitHub integrations can be added later without changing the core deployment shape

## Local URLs

- App: `http://localhost:3000`
- API docs: `http://localhost:3000/api/docs`

## Environment Variables

### Required for local development

```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=pally
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/pally
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=http://localhost:3000
```

### Optional GitHub OAuth

Used for GitHub sign-in and account linking.

```env
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
```

### Optional GitHub App sync

Used for repository installation flow and GitHub issue syncing.

```env
GITHUB_APP_ID=
GITHUB_APP_SLUG=
GITHUB_APP_PRIVATE_KEY=
GITHUB_APP_WEBHOOK_SECRET=
```

## Running the App

Once the app is running:

- Visit `http://localhost:3000`
- Create an account or sign in
- Create an organization if you do not already have one
- New organizations are automatically seeded with example teams, projects, and tasks

## API and CLI

Pally exposes an Effect-powered API through the TanStack Start server.

- API docs: `http://localhost:3000/api/docs`

CLI examples:

```bash
bun run cli --help
bun run cli task list
bun run cli task create "Write onboarding docs"
bun run cli project list
```

## GitHub Integration

GitHub support is a primary feature, but it is still optional.

Pally supports two GitHub integration modes:

- GitHub OAuth for sign-in
- GitHub App installation for repository selection and two-way issue sync

You can run the app locally or self-host it without either of these configured. Add the GitHub environment variables only when you are ready to enable those flows.
