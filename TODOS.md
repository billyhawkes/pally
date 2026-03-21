# TODOs

## Phase 1: Foundation
Goal: Install all dependencies, scaffold TanStack Start, and verify the dev server runs.

- [ ] Install missing dependencies (React, TanStack Start/DB/Table/Form, Shadcn, Tailwind, Better Auth, Drizzle, @effect/sql-pg)
- [ ] Upgrade Effect to v4 (currently v3)
- [ ] Scaffold TanStack Start app structure (routes, root layout)
- [ ] Verify dev server runs and renders a page

## Phase 2: Effect Services + API
Goal: Build the backend service layer with Effect, expose as HTTP API and CLI.

- [ ] TaskService — CRUD for tasks with seed data
- [ ] ProjectService — CRUD for projects with seed data
- [ ] ViewService — CRUD for saved views/filters
- [ ] Expose services as HTTP API with Effect platform
- [ ] Add OpenAPI spec generation and Swagger docs
- [ ] Create Effect CLI commands (e.g. `pally task create`)

## Phase 3: Database
Goal: Connect real persistence via Postgres, Drizzle, and Effect SQL.

- [ ] Add docker-compose.yml with Postgres
- [ ] Configure environment variables (.env, .env.example)
- [ ] Define Drizzle schema (tasks, projects, views, users)
- [ ] Run initial migration
- [ ] Wire Drizzle into Effect services via @effect/sql-pg

## Phase 4: Auth
Goal: Set up authentication with Better Auth integrated via Effect.

- [ ] AuthService — Better Auth integration via Effect
- [ ] Enable login/logout flows
- [ ] Enable teams/organizations plugins

## Phase 5: Frontend
Goal: Connect TanStack DB to the Effect API and display data in the UI.

- [ ] Create TanStack DB collections calling Effect API via RPC
- [ ] Build list/board view components for tasks
- [ ] Build sidebar navigation with Better Auth teams/organizations
- [ ] Build login/logout UI
- [ ] Display live data from the API in the web app
