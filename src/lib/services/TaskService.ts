import { Clock, Effect, Layer, Option, ServiceMap } from "effect"
import { eq, and } from "drizzle-orm"
import {
  CreateTaskPayload,
  ProjectId,
  Task,
  TaskId,
  TaskNotFoundError,
  UpdateTaskPayload,
} from "@/lib/schemas"
import type { TaskPriority, TaskStatus } from "@/lib/schemas"
import { DB } from "@/db/layer"
import { dbQuery } from "@/db/query"
import { tasks } from "@/db/schema"

export class TaskService extends ServiceMap.Service<
  TaskService,
  {
    readonly list: (filters?: {
      status?: TaskStatus | undefined
      priority?: TaskPriority | undefined
      projectId?: ProjectId | undefined
    }) => Effect.Effect<readonly Task[]>
    readonly findById: (id: TaskId) => Effect.Effect<Task, TaskNotFoundError>
    readonly create: (payload: CreateTaskPayload) => Effect.Effect<Task>
    readonly update: (id: TaskId, payload: UpdateTaskPayload) => Effect.Effect<Task, TaskNotFoundError>
    readonly remove: (id: TaskId) => Effect.Effect<Task, TaskNotFoundError>
  }
>()("@pally/TaskService") {
  static readonly layer = Layer.effect(
    TaskService,
    Effect.gen(function* () {
      const db = yield* DB

      const list = Effect.fn("TaskService.list")(function* (filters?: {
        status?: TaskStatus | undefined
        priority?: TaskPriority | undefined
        projectId?: ProjectId | undefined
      }) {
        const conditions = []
        if (filters?.status) {
          conditions.push(eq(tasks.status, filters.status))
        }
        if (filters?.priority) {
          conditions.push(eq(tasks.priority, filters.priority))
        }
        if (filters?.projectId) {
          conditions.push(eq(tasks.projectId, filters.projectId as string))
        }

        const query = conditions.length > 0
          ? db.select().from(tasks).where(and(...conditions))
          : db.select().from(tasks)

        const rows = yield* dbQuery(query)
        return rows.map(toTask)
      })

      const findById = Effect.fn("TaskService.findById")(function* (id: TaskId) {
        const rows = yield* dbQuery(
          db.select().from(tasks).where(eq(tasks.id, id as string)).limit(1)
        )
        if (rows.length === 0) {
          return yield* Effect.fail(new TaskNotFoundError({ id }))
        }
        return toTask(rows[0]!)
      })

      const create = Effect.fn("TaskService.create")(function* (payload: CreateTaskPayload) {
        const now = yield* Clock.currentTimeMillis
        const id = `task-${now}-${Math.random().toString(36).slice(2, 7)}`
        yield* dbQuery(
          db.insert(tasks).values({
            id,
            title: payload.title,
            description: Option.getOrNull(payload.description) as string | null,
            status: payload.status,
            priority: payload.priority,
            projectId: Option.getOrNull(payload.projectId) as string | null,
          })
        )
        return new Task({
          id: TaskId.makeUnsafe(id),
          title: payload.title,
          description: payload.description,
          status: payload.status,
          priority: payload.priority,
          projectId: payload.projectId,
          createdAt: new Date(now),
          updatedAt: new Date(now),
        })
      })

      const update = Effect.fn("TaskService.update")(
        function* (id: TaskId, payload: UpdateTaskPayload) {
          const existing = yield* findById(id)
          const now = yield* Clock.currentTimeMillis

          const setValues: Record<string, unknown> = { updatedAt: new Date(now) }
          if ("title" in payload) setValues.title = payload.title
          if ("description" in payload) setValues.description = Option.getOrNull(payload.description as Option.Option<string>)
          if ("status" in payload) setValues.status = payload.status as TaskStatus
          if ("priority" in payload) setValues.priority = payload.priority as TaskPriority
          if ("projectId" in payload) setValues.projectId = Option.getOrNull(payload.projectId as Option.Option<ProjectId>)

          yield* dbQuery(
            db.update(tasks).set(setValues).where(eq(tasks.id, id as string))
          )

          return new Task({
            id: existing.id,
            title: "title" in payload ? (payload.title as string) : existing.title,
            description: "description" in payload ? payload.description as Option.Option<string> : existing.description,
            status: "status" in payload ? (payload.status as TaskStatus) : existing.status,
            priority: "priority" in payload ? (payload.priority as TaskPriority) : existing.priority,
            projectId: "projectId" in payload ? payload.projectId as Option.Option<ProjectId> : existing.projectId,
            createdAt: existing.createdAt,
            updatedAt: new Date(now),
          })
        }
      )

      const remove = Effect.fn("TaskService.remove")(function* (id: TaskId) {
        const existing = yield* findById(id)
        yield* dbQuery(
          db.delete(tasks).where(eq(tasks.id, id as string))
        )
        return existing
      })

      return { list, findById, create, update, remove }
    })
  )
}

function toTask(row: typeof tasks.$inferSelect): Task {
  return new Task({
    id: TaskId.makeUnsafe(row.id),
    title: row.title,
    description: row.description ? Option.some(row.description) : Option.none(),
    status: row.status as TaskStatus,
    priority: row.priority as TaskPriority,
    projectId: row.projectId ? Option.some(ProjectId.makeUnsafe(row.projectId)) : Option.none(),
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  })
}
