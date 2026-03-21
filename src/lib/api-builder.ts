import { Effect, Layer } from "effect"
import { HttpApiBuilder } from "effect/unstable/httpapi"
import { PallyApi } from "./api"
import { TaskService, ProjectService, ViewService } from "./services/index"
import type { CreateTaskPayload, UpdateTaskPayload, CreateProjectPayload, UpdateProjectPayload, CreateViewPayload, UpdateViewPayload } from "./schemas"
import { DBLive } from "@/db/layer"

// Tasks group implementation
const tasksGroupLive = HttpApiBuilder.group(
  PallyApi,
  "tasks",
  (handlers) =>
    handlers
      .handle("listTasks", ({ query }) =>
        Effect.gen(function* () {
          const taskService = yield* TaskService
          return yield* taskService.list({
            status: query.status,
            priority: query.priority,
            projectId: query.projectId,
          })
        })
      )
      .handle("getTask", ({ params }) =>
        Effect.gen(function* () {
          const taskService = yield* TaskService
          return yield* taskService.findById(params.id)
        })
      )
      .handle("createTask", ({ payload }) =>
        Effect.gen(function* () {
          const taskService = yield* TaskService
          return yield* taskService.create(payload as CreateTaskPayload)
        })
      )
      .handle("updateTask", ({ params, payload }) =>
        Effect.gen(function* () {
          const taskService = yield* TaskService
          return yield* taskService.update(params.id, payload as UpdateTaskPayload)
        })
      )
      .handle("deleteTask", ({ params }) =>
        Effect.gen(function* () {
          const taskService = yield* TaskService
          return yield* taskService.remove(params.id)
        })
      )
)

// Projects group implementation
const projectsGroupLive = HttpApiBuilder.group(
  PallyApi,
  "projects",
  (handlers) =>
    handlers
      .handle("listProjects", () =>
        Effect.gen(function* () {
          const projectService = yield* ProjectService
          return yield* projectService.list()
        })
      )
      .handle("getProject", ({ params }) =>
        Effect.gen(function* () {
          const projectService = yield* ProjectService
          return yield* projectService.findById(params.id)
        })
      )
      .handle("createProject", ({ payload }) =>
        Effect.gen(function* () {
          const projectService = yield* ProjectService
          return yield* projectService.create(payload as CreateProjectPayload)
        })
      )
      .handle("updateProject", ({ params, payload }) =>
        Effect.gen(function* () {
          const projectService = yield* ProjectService
          return yield* projectService.update(params.id, payload as UpdateProjectPayload)
        })
      )
      .handle("deleteProject", ({ params }) =>
        Effect.gen(function* () {
          const projectService = yield* ProjectService
          return yield* projectService.remove(params.id)
        })
      )
)

// Views group implementation
const viewsGroupLive = HttpApiBuilder.group(
  PallyApi,
  "views",
  (handlers) =>
    handlers
      .handle("listViews", () =>
        Effect.gen(function* () {
          const viewService = yield* ViewService
          return yield* viewService.list()
        })
      )
      .handle("getView", ({ params }) =>
        Effect.gen(function* () {
          const viewService = yield* ViewService
          return yield* viewService.findById(params.id)
        })
      )
      .handle("createView", ({ payload }) =>
        Effect.gen(function* () {
          const viewService = yield* ViewService
          return yield* viewService.create(payload as CreateViewPayload)
        })
      )
      .handle("updateView", ({ params, payload }) =>
        Effect.gen(function* () {
          const viewService = yield* ViewService
          return yield* viewService.update(params.id, payload as UpdateViewPayload)
        })
      )
      .handle("deleteView", ({ params }) =>
        Effect.gen(function* () {
          const viewService = yield* ViewService
          return yield* viewService.remove(params.id)
        })
      )
)

// Compose all layers
export const apiLayer = HttpApiBuilder.layer(PallyApi, {
  openapiPath: "/api/openapi.json",
}).pipe(
  Layer.provide(tasksGroupLive),
  Layer.provide(projectsGroupLive),
  Layer.provide(viewsGroupLive),
  Layer.provide(TaskService.layer),
  Layer.provide(ProjectService.layer),
  Layer.provide(ViewService.layer),
  Layer.provide(DBLive)
)
