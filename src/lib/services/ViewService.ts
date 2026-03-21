import { Clock, Effect, Layer, Option, ServiceMap } from "effect"
import {
  CreateViewPayload,
  ProjectId,
  UpdateViewPayload,
  View,
  ViewId,
  ViewNotFoundError,
} from "../schemas"
import type { TaskPriority, TaskStatus } from "../schemas"

// Seed data
const seedViews: View[] = [
  new View({
    id: ViewId.makeUnsafe("view-1"),
    name: "All Tasks",
    filters: {
      status: Option.none(),
      priority: Option.none(),
      projectId: Option.none(),
    },
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  }),
  new View({
    id: ViewId.makeUnsafe("view-2"),
    name: "High Priority",
    filters: {
      status: Option.none(),
      priority: Option.some(["urgent", "high"] as const),
      projectId: Option.none(),
    },
    createdAt: new Date("2024-01-02"),
    updatedAt: new Date("2024-01-02"),
  }),
  new View({
    id: ViewId.makeUnsafe("view-3"),
    name: "In Progress",
    filters: {
      status: Option.some(["in_progress"] as const),
      priority: Option.none(),
      projectId: Option.none(),
    },
    createdAt: new Date("2024-01-03"),
    updatedAt: new Date("2024-01-03"),
  }),
]

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
      let views = [...seedViews]

      const list = Effect.fn("ViewService.list")(function* () {
        return views
      })

      const findById = Effect.fn("ViewService.findById")(function* (id: ViewId) {
        const view = views.find((v) => v.id === id)
        if (!view) {
          return yield* Effect.fail(new ViewNotFoundError({ id }))
        }
        return view
      })

      const create = Effect.fn("ViewService.create")(function* (payload: CreateViewPayload) {
        const now = yield* Clock.currentTimeMillis
        const view = new View({
          id: ViewId.makeUnsafe(`view-${now}-${Math.random().toString(36).slice(2, 7)}`),
          name: payload.name,
          filters: payload.filters,
          createdAt: new Date(now),
          updatedAt: new Date(now),
        })
        views = [...views, view]
        return view
      })

      const update = Effect.fn("ViewService.update")(
        function* (id: ViewId, payload: UpdateViewPayload) {
          const index = views.findIndex((v) => v.id === id)
          if (index === -1) {
            return yield* Effect.fail(new ViewNotFoundError({ id }))
          }
          const now = yield* Clock.currentTimeMillis
          const existing = views[index]!
          type Filters = {
            status: Option.Option<readonly TaskStatus[]>
            priority: Option.Option<readonly TaskPriority[]>
            projectId: Option.Option<ProjectId>
          }
          const updated = new View({
            id: existing.id,
            name: "name" in payload ? (payload.name as string) : existing.name,
            filters: "filters" in payload ? (payload.filters as Filters) : existing.filters,
            createdAt: existing.createdAt,
            updatedAt: new Date(now),
          })
          views = views.map((v, i) => (i === index ? updated : v))
          return updated
        }
      )

      const remove = Effect.fn("ViewService.remove")(function* (id: ViewId) {
        const index = views.findIndex((v) => v.id === id)
        if (index === -1) {
          return yield* Effect.fail(new ViewNotFoundError({ id }))
        }
        const view = views[index]!
        views = views.filter((v) => v.id !== id)
        return view
      })

      return { list, findById, create, update, remove }
    })
  )
}
