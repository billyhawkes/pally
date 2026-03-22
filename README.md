# Pally

![Pally banner](./public/banner.png)

Pally is a web-first project and task application inspired by Linear and GitHub Projects. It combines organization and team-based planning with a synced workflow for projects, tasks, views, and GitHub issues.

Built with TanStack Start, Effect, Better Auth, Drizzle, Postgres, Bun, and shadcn/ui, Pally is designed to support both a browser-first experience and a CLI/API workflow.

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
docker compose up -d
```

5. Run database migrations:

```bash
bunx drizzle-kit migrate --config drizzle.config.ts
```

6. Start the development server:

```bash
bun run dev
```

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

Pally supports two GitHub integration modes:

- GitHub OAuth for sign-in
- GitHub App installation for repository selection and two-way issue sync

You can run the app locally without either of these configured. Add the GitHub environment variables only when you are ready to enable those flows.
