import { Clock, Effect, Layer, Option, ServiceMap } from "effect"
import {
  CreateTaskPayload,
  ProjectId,
  Task,
  TaskId,
  TaskNotFoundError,
  UpdateTaskPayload,
} from "../schemas"
import type { TaskPriority, TaskStatus } from "../schemas"

// Seed data
const seedTasks: Task[] = [
  new Task({
    id: TaskId.makeUnsafe("task-1"),
    title: "Set up project structure",
    description: Option.some("Initialize the project with Effect and TanStack Start"),
    status: "done",
    priority: "high",
    projectId: Option.none(),
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-02"),
  }),
  new Task({
    id: TaskId.makeUnsafe("task-2"),
    title: "Implement authentication",
    description: Option.some("Set up Better Auth with organizations and teams"),
    status: "in_progress",
    priority: "urgent",
    projectId: Option.some(ProjectId.makeUnsafe("project-1")),
    createdAt: new Date("2024-01-03"),
    updatedAt: new Date("2024-01-03"),
  }),
  new Task({
    id: TaskId.makeUnsafe("task-3"),
    title: "Create task board view",
    description: Option.none(),
    status: "todo",
    priority: "medium",
    projectId: Option.some(ProjectId.makeUnsafe("project-1")),
    createdAt: new Date("2024-01-04"),
    updatedAt: new Date("2024-01-04"),
  }),
]

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
      let tasks = [...seedTasks]

      const list = Effect.fn("TaskService.list")(function* (filters?: {
        status?: TaskStatus | undefined
        priority?: TaskPriority | undefined
        projectId?: ProjectId | undefined
      }) {
        let result = tasks
        if (filters?.status) {
          result = result.filter((t) => t.status === filters.status)
        }
        if (filters?.priority) {
          result = result.filter((t) => t.priority === filters.priority)
        }
        if (filters?.projectId) {
          result = result.filter(
            (t) => Option.isSome(t.projectId) && t.projectId.value === filters.projectId
          )
        }
        return result
      })

      const findById = Effect.fn("TaskService.findById")(function* (id: TaskId) {
        const task = tasks.find((t) => t.id === id)
        if (!task) {
          return yield* Effect.fail(new TaskNotFoundError({ id }))
        }
        return task
      })

      const create = Effect.fn("TaskService.create")(function* (payload: CreateTaskPayload) {
        const now = yield* Clock.currentTimeMillis
        const task = new Task({
          id: TaskId.makeUnsafe(`task-${now}-${Math.random().toString(36).slice(2, 7)}`),
          title: payload.title,
          description: payload.description,
          status: payload.status,
          priority: payload.priority,
          projectId: payload.projectId,
          createdAt: new Date(now),
          updatedAt: new Date(now),
        })
        tasks = [...tasks, task]
        return task
      })

      const update = Effect.fn("TaskService.update")(
        function* (id: TaskId, payload: UpdateTaskPayload) {
          const index = tasks.findIndex((t) => t.id === id)
          if (index === -1) {
            return yield* Effect.fail(new TaskNotFoundError({ id }))
          }
          const now = yield* Clock.currentTimeMillis
          const existing = tasks[index]!
          const updated = new Task({
            id: existing.id,
            title: "title" in payload ? (payload.title as string) : existing.title,
            description: "description" in payload ? payload.description as Option.Option<string> : existing.description,
            status: "status" in payload ? (payload.status as TaskStatus) : existing.status,
            priority: "priority" in payload ? (payload.priority as TaskPriority) : existing.priority,
            projectId: "projectId" in payload ? payload.projectId as Option.Option<ProjectId> : existing.projectId,
            createdAt: existing.createdAt,
            updatedAt: new Date(now),
          })
          tasks = tasks.map((t, i) => (i === index ? updated : t))
          return updated
        }
      )

      const remove = Effect.fn("TaskService.remove")(function* (id: TaskId) {
        const index = tasks.findIndex((t) => t.id === id)
        if (index === -1) {
          return yield* Effect.fail(new TaskNotFoundError({ id }))
        }
        const task = tasks[index]!
        tasks = tasks.filter((t) => t.id !== id)
        return task
      })

      return { list, findById, create, update, remove }
    })
  )
}
