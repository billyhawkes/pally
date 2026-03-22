import { Clock, Effect, Layer, Schema, ServiceMap } from "effect"
import { eq, and } from "drizzle-orm"
import {
  CreateViewPayload,
  OrganizationId,
  UpdateViewPayload,
  View,
  ViewId,
  ViewNotFoundError,
} from "@/lib/schemas"
import { DB } from "@/db/layer"
import { dbQuery } from "@/db/query"
import { views } from "@/db/schema"

const decodeView = Schema.decodeUnknownSync(View)

export class ViewService extends ServiceMap.Service<
  ViewService,
  {
    readonly list: (filters?: { orgId?: OrganizationId | undefined }) => Effect.Effect<readonly View[]>
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

      const list = Effect.fn("ViewService.list")(function* (filters?: {
        orgId?: OrganizationId | undefined
      }) {
        const conditions = []
        if (filters?.orgId) {
          conditions.push(eq(views.orgId, filters.orgId as string))
        }

        const query =
          conditions.length > 0
            ? db.select().from(views).where(and(...conditions))
            : db.select().from(views)

        const rows = yield* dbQuery(query)
        return rows.map((row) => decodeView(row))
      })

      const findById = Effect.fn("ViewService.findById")(function* (id: ViewId) {
        const rows = yield* dbQuery(
          db.select().from(views).where(eq(views.id, id as string)).limit(1)
        )
        if (rows.length === 0) {
          return yield* new ViewNotFoundError({ id })
        }
        return decodeView(rows[0]!)
      })

      const create = Effect.fn("ViewService.create")(function* (payload: CreateViewPayload) {
        const now = yield* Clock.currentTimeMillis
        const id = `view-${now}-${Math.random().toString(36).slice(2, 7)}`
        yield* dbQuery(
          db.insert(views).values({
            id,
            name: payload.name,
            orgId: payload.orgId,
            filters: {
              status: payload.filters.status,
              priority: payload.filters.priority,
              projectId: payload.filters.projectId,
            },
          })
        )
        return decodeView({
          id,
          name: payload.name,
          orgId: payload.orgId,
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
          if ("name" in payload) setValues.name = payload.name
          if ("orgId" in payload) setValues.orgId = payload.orgId ?? null
          if ("filters" in payload) {
            const f = payload.filters!
            setValues.filters = {
              status: f.status ?? null,
              priority: f.priority ?? null,
              projectId: f.projectId ?? null,
            }
          }

          yield* dbQuery(
            db.update(views).set(setValues).where(eq(views.id, id as string))
          )

          return decodeView({
            id: existing.id,
            name: "name" in payload ? payload.name : existing.name,
            orgId: "orgId" in payload ? (payload.orgId ?? null) : existing.orgId,
            filters: "filters" in payload
              ? {
                  status: payload.filters!.status ?? null,
                  priority: payload.filters!.priority ?? null,
                  projectId: payload.filters!.projectId ?? null,
                }
              : existing.filters,
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
