# AGENTS.md

## Purpose

Pally is a web-first project and task application with strong Github two-way sync.

## Rules
- Never change the version of dependencies without asking

## Tech Stack

- Tanstack (Start, DB, Table, Form)
- Effect.ts v4 (CLI, Services)
- React
- Shadcn and Tailwind 
- Postgres
- Docker
- Better auth
- Drizzle-orm and @effect/sql-pg  
- Bun
- Typescript

## Features
- Authentication
  - How: Better auth
  - Features: Organizations, Teams, Login, Logout
- Navigation
  - What: Sidebar
  - How: Shadcn sidebar component
  - Features: Better auth organizations/teams, Projects/tasks/views within teams, Global tasks/projects
- Tasks
  - Features: List/Board views, sync with Github Issues (two-way), filters
- Projects
  - Features: List/Board views, sync with Github Repositories, filters
- Views
  - What: Custom views with names based on a set of filters
  - Features: Can save current view/filters as a new view
- CLI/API
  - What: CLI and API for interacting with Pally
  - How: Effect v4 CLI and OpenAPI
  - Examples: Create task = pally task create and POST /api/task

## Architecture
- Services
  - What: Break core functionality into services
  - How: Docker
  - Examples: Tasks, Projects, Views

<!-- effect-solutions:start -->
## Effect Best Practices

**IMPORTANT:** Always consult effect-solutions before writing Effect code.

1. Run `effect-solutions list` to see available guides
2. Run `effect-solutions show <topic>...` for relevant patterns (supports multiple topics)
3. Search `~/.local/share/effect-solutions/effect` for real implementations

Topics: quick-start, project-setup, tsconfig, basics, services-and-layers, data-modeling, error-handling, config, testing, cli.

Never guess at Effect patterns - check the guide first.
<!-- effect-solutions:end -->

## Local Effect Source

The Effect v4 repository is cloned to `~/.local/share/effect-solutions/effect` for reference.
Use this to explore APIs, find usage examples, and understand implementation
details when the documentation isn't enough.

<!-- intent-skills:start -->
# Skill mappings - when working in these areas, load the linked skill file into context.
skills:
  - task: "Creating routes, route loaders, navigation, and search params"
    load: "node_modules/@tanstack/router-core/skills/router-core/SKILL.md"
  - task: "Route protection, auth guards, and RBAC with Better Auth"
    load: "node_modules/@tanstack/router-core/skills/router-core/auth-and-guards/SKILL.md"
  - task: "TanStack Start project setup, SSR, and execution model"
    load: "node_modules/@tanstack/start-client-core/skills/start-core/SKILL.md"
  - task: "Server functions, API endpoints, and server middleware"
    load: "node_modules/@tanstack/start-client-core/skills/start-core/server-functions/SKILL.md"
  - task: "Setting up TanStack DB collections, live queries, and optimistic mutations"
    load: "node_modules/@tanstack/db/skills/db-core/SKILL.md"
<!-- intent-skills:end -->

