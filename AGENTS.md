# AGENTS.md

## Purpose

Pally is a web-first project and task application with strong Github two-way sync.

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


