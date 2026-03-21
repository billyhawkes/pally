import { Clock, Effect, Layer, Option, ServiceMap } from "effect"
import { eq } from "drizzle-orm"
import {
  CreateViewPayload,
  ProjectId,
  UpdateViewPayload,
  View,
  ViewId,
  ViewNotFoundError,
} from "@/lib/schemas"
import type { TaskPriority, TaskStatus } from "@/lib/schemas"
import { DB } from "@/db/layer"
import { dbQuery } from "@/db/query"
import { views } from "@/db/schema"

export class ViewService extends ServiceMap.Service<
  ViewService,
  {
    readonly list: () => Effect.Effect<readonly View[]>
    readonly findById: (id: ViewId) => Effect.Effect<View, ViewNotFoundError>
    readonly create: (payload: CreateViewPayload) => Effect.Effect<View>
    readonly update: (id: ViewId, payload: UpdateViewPayload) => Effect.Effect<View, ViewNotFoundError>
    readonly remove: (id: ViewId) => Effect.Effect<View, ViewNotFoundError>
  }
>()("@pally/ViewService") {
  static readonly layer = Layer.effect(
    ViewService,
    Effect.gen(function* () {
      const db = yield* DB

      const list = Effect.fn("ViewService.list")(function* () {
        const rows = yield* dbQuery(db.select().from(views))
        return rows.map(toView)
      })

      const findById = Effect.fn("ViewService.findById")(function* (id: ViewId) {
        const rows = yield* dbQuery(
          db.select().from(views).where(eq(views.id, id as string)).limit(1)
        )
        if (rows.length === 0) {
          return yield* Effect.fail(new ViewNotFoundError({ id }))
        }
        return toView(rows[0]!)
      })

      const create = Effect.fn("ViewService.create")(function* (payload: CreateViewPayload) {
        const now = yield* Clock.currentTimeMillis
        const id = `view-${now}-${Math.random().toString(36).slice(2, 7)}`
        const filtersJson = {
          status: Option.getOrNull(payload.filters.status) as string[] | null,
          priority: Option.getOrNull(payload.filters.priority) as string[] | null,
          projectId: Option.getOrNull(payload.filters.projectId) as string | null,
        }
        yield* dbQuery(
          db.insert(views).values({
            id,
            name: payload.name,
            filters: filtersJson,
          })
        )
        return new View({
          id: ViewId.makeUnsafe(id),
          name: payload.name,
          filters: payload.filters,
          createdAt: new Date(now),
          updatedAt: new Date(now),
        })
      })

      const update = Effect.fn("ViewService.update")(
        function* (id: ViewId, payload: UpdateViewPayload) {
          const existing = yield* findById(id)
          const now = yield* Clock.currentTimeMillis

          const setValues: Record<string, unknown> = { updatedAt: new Date(now) }
          if ("name" in payload) setValues.name = payload.name as string
          if ("filters" in payload) {
            const f = payload.filters as View["filters"]
            setValues.filters = {
              status: Option.getOrNull(f.status) as string[] | null,
              priority: Option.getOrNull(f.priority) as string[] | null,
              projectId: Option.getOrNull(f.projectId) as string | null,
            }
          }

          yield* dbQuery(
            db.update(views).set(setValues).where(eq(views.id, id as string))
          )

          type Filters = {
            status: Option.Option<readonly TaskStatus[]>
            priority: Option.Option<readonly TaskPriority[]>
            projectId: Option.Option<ProjectId>
          }
          return new View({
            id: existing.id,
            name: "name" in payload ? (payload.name as string) : existing.name,
            filters: "filters" in payload ? (payload.filters as Filters) : existing.filters,
            createdAt: existing.createdAt,
            updatedAt: new Date(now),
          })
        }
      )

      const remove = Effect.fn("ViewService.remove")(function* (id: ViewId) {
        const existing = yield* findById(id)
        yield* dbQuery(
          db.delete(views).where(eq(views.id, id as string))
        )
        return existing
      })

      return { list, findById, create, update, remove }
    })
  )
}

function toView(row: typeof views.$inferSelect): View {
  const filters = row.filters as {
    status: string[] | null
    priority: string[] | null
    projectId: string | null
  }
  return new View({
    id: ViewId.makeUnsafe(row.id),
    name: row.name,
    filters: {
      status: filters.status ? Option.some(filters.status as TaskStatus[]) : Option.none(),
      priority: filters.priority ? Option.some(filters.priority as TaskPriority[]) : Option.none(),
      projectId: filters.projectId ? Option.some(ProjectId.makeUnsafe(filters.projectId)) : Option.none(),
    },
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  })
}
