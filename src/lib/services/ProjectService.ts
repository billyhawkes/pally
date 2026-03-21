import { Clock, Effect, Layer, Option, ServiceMap } from "effect"
import { eq } from "drizzle-orm"
import {
  CreateProjectPayload,
  Project,
  ProjectId,
  ProjectNotFoundError,
  UpdateProjectPayload,
} from "@/lib/schemas"
import { DB } from "@/db/layer"
import { dbQuery } from "@/db/query"
import { projects } from "@/db/schema"

export class ProjectService extends ServiceMap.Service<
  ProjectService,
  {
    readonly list: () => Effect.Effect<readonly Project[]>
    readonly findById: (id: ProjectId) => Effect.Effect<Project, ProjectNotFoundError>
    readonly create: (payload: CreateProjectPayload) => Effect.Effect<Project>
    readonly update: (id: ProjectId, payload: UpdateProjectPayload) => Effect.Effect<Project, ProjectNotFoundError>
    readonly remove: (id: ProjectId) => Effect.Effect<Project, ProjectNotFoundError>
  }
>()("@pally/ProjectService") {
  static readonly layer = Layer.effect(
    ProjectService,
    Effect.gen(function* () {
      const db = yield* DB

      const list = Effect.fn("ProjectService.list")(function* () {
        const rows = yield* dbQuery(db.select().from(projects))
        return rows.map(toProject)
      })

      const findById = Effect.fn("ProjectService.findById")(function* (id: ProjectId) {
        const rows = yield* dbQuery(
          db.select().from(projects).where(eq(projects.id, id as string)).limit(1)
        )
        if (rows.length === 0) {
          return yield* Effect.fail(new ProjectNotFoundError({ id }))
        }
        return toProject(rows[0]!)
      })

      const create = Effect.fn("ProjectService.create")(function* (payload: CreateProjectPayload) {
        const now = yield* Clock.currentTimeMillis
        const id = `project-${now}-${Math.random().toString(36).slice(2, 7)}`
        yield* dbQuery(
          db.insert(projects).values({
            id,
            name: payload.name,
            description: Option.getOrNull(payload.description) as string | null,
          })
        )
        return new Project({
          id: ProjectId.makeUnsafe(id),
          name: payload.name,
          description: payload.description,
          createdAt: new Date(now),
          updatedAt: new Date(now),
        })
      })

      const update = Effect.fn("ProjectService.update")(
        function* (id: ProjectId, payload: UpdateProjectPayload) {
          const existing = yield* findById(id)
          const now = yield* Clock.currentTimeMillis

          const setValues: Record<string, unknown> = { updatedAt: new Date(now) }
          if ("name" in payload) setValues.name = payload.name
          if ("description" in payload) setValues.description = Option.getOrNull(payload.description as Option.Option<string>)

          yield* dbQuery(
            db.update(projects).set(setValues).where(eq(projects.id, id as string))
          )

          return new Project({
            id: existing.id,
            name: "name" in payload ? (payload.name as string) : existing.name,
            description: "description" in payload ? payload.description as Option.Option<string> : existing.description,
            createdAt: existing.createdAt,
            updatedAt: new Date(now),
          })
        }
      )

      const remove = Effect.fn("ProjectService.remove")(function* (id: ProjectId) {
        const existing = yield* findById(id)
        yield* dbQuery(
          db.delete(projects).where(eq(projects.id, id as string))
        )
        return existing
      })

      return { list, findById, create, update, remove }
    })
  )
}

function toProject(row: typeof projects.$inferSelect): Project {
  return new Project({
    id: ProjectId.makeUnsafe(row.id),
    name: row.name,
    description: row.description ? Option.some(row.description) : Option.none(),
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  })
}
