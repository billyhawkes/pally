# TODOs

## Phase 1: Foundation
Goal: Install all dependencies, scaffold TanStack Start, and verify the dev server runs.

- [x] Install missing dependencies (React, TanStack Start/DB/Table/Form, Shadcn, Tailwind, Better Auth, Drizzle, @effect/sql-pg)
- [x] Upgrade Effect to v4 (currently v3)
- [x] Scaffold TanStack Start app structure (routes, root layout)
- [x] Verify dev server runs and renders a page

## Phase 2: Effect Services + API
Goal: Build the backend service layer with Effect, expose as HTTP API and CLI.

- [x] TaskService — CRUD for tasks with seed data
- [x] ProjectService — CRUD for projects with seed data
- [x] ViewService — CRUD for saved views/filters
- [x] Expose services as HTTP API with Effect platform
- [x] Add OpenAPI spec generation and Swagger docs
- [x] Create Effect CLI commands (e.g. `pally task create`)

## Phase 2.5: Connect Effect To Tanstck
Goal: Connect the effect server to the tanstack start server

- [x] Expose the effect server through a tanstack start api route
- [x] Implement Scalar API docs at /api/docs

## Phase 3: Database
Goal: Connect real persistence via Postgres, Drizzle, and Effect SQL.

- [x] Add docker-compose.yml with Postgres
- [x] Configure environment variables (.env, .env.example)
- [x] Define Drizzle schema (tasks, projects, views)
- [x] Run initial migration
- [x] Wire Drizzle into Effect services via @effect/sql-pg

## Phase 3.5: Fixes
- [x] Fix schema class types (convert to `Schema.Struct` instead of `Schema.Class`)

## Phase 4: Auth
Goal: Set up authentication with Better Auth integrated via Effect and drizzle.

- [x] AuthService — Better Auth integration via Effect
- [x] Enable login/logout flows
- [x] Enable teams/organizations plugins

## Phase 5: Frontend
Goal: Connect TanStack DB to the Effect API and display data in the UI.

- [ ] Create TanStack DB collections calling Effect API via RPC
- [ ] Build list/board view components for tasks
- [ ] Build sidebar navigation with Better Auth teams/organizations
- [ ] Build login/logout UI
- [ ] Display live data from the API in the web app
