import { Effect } from "effect"
import { DB } from "./layer"
import * as schema from "./schema"
import { dbQuery } from "./query"

export const seed = Effect.gen(function* () {
  const db = yield* DB

  // Check if data already exists
  const existingProjects = yield* dbQuery(
    db.select({ id: schema.projects.id }).from(schema.projects).limit(1)
  )

  if (existingProjects.length > 0) {
    return
  }

  yield* Effect.log("Seeding database...")

  yield* dbQuery(
    db.insert(schema.projects).values([
      {
        id: "project-1",
        name: "Pally",
        description: "A web-first project and task application with Github sync",
      },
      {
        id: "project-2",
        name: "Website",
        description: "Company website redesign",
      },
    ])
  )

  yield* dbQuery(
    db.insert(schema.tasks).values([
      {
        id: "task-1",
        title: "Set up project structure",
        description: "Initialize the project with Effect and TanStack Start",
        status: "done",
        priority: "high",
        projectId: null,
      },
      {
        id: "task-2",
        title: "Implement authentication",
        description: "Set up Better Auth with organizations and teams",
        status: "in_progress",
        priority: "urgent",
        projectId: "project-1",
      },
      {
        id: "task-3",
        title: "Create task board view",
        description: null,
        status: "todo",
        priority: "medium",
        projectId: "project-1",
      },
    ])
  )

  yield* dbQuery(
    db.insert(schema.views).values([
      {
        id: "view-1",
        name: "All Tasks",
        filters: { status: null, priority: null, projectId: null },
      },
      {
        id: "view-2",
        name: "High Priority",
        filters: { status: null, priority: ["urgent", "high"], projectId: null },
      },
      {
        id: "view-3",
        name: "In Progress",
        filters: { status: ["in_progress"], priority: null, projectId: null },
      },
    ])
  )

  yield* Effect.log("Database seeded.")
})
