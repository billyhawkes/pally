import { Clock, Effect, Layer, Option, ServiceMap } from "effect"
import {
  CreateProjectPayload,
  Project,
  ProjectId,
  ProjectNotFoundError,
  UpdateProjectPayload,
} from "../schemas"

// Seed data
const seedProjects: Project[] = [
  new Project({
    id: ProjectId.makeUnsafe("project-1"),
    name: "Pally",
    description: Option.some("A web-first project and task application with Github sync"),
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  }),
  new Project({
    id: ProjectId.makeUnsafe("project-2"),
    name: "Website",
    description: Option.some("Company website redesign"),
    createdAt: new Date("2024-01-05"),
    updatedAt: new Date("2024-01-05"),
  }),
]

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
      let projects = [...seedProjects]

      const list = Effect.fn("ProjectService.list")(function* () {
        return projects
      })

      const findById = Effect.fn("ProjectService.findById")(function* (id: ProjectId) {
        const project = projects.find((p) => p.id === id)
        if (!project) {
          return yield* Effect.fail(new ProjectNotFoundError({ id }))
        }
        return project
      })

      const create = Effect.fn("ProjectService.create")(function* (payload: CreateProjectPayload) {
        const now = yield* Clock.currentTimeMillis
        const project = new Project({
          id: ProjectId.makeUnsafe(`project-${now}-${Math.random().toString(36).slice(2, 7)}`),
          name: payload.name,
          description: payload.description,
          createdAt: new Date(now),
          updatedAt: new Date(now),
        })
        projects = [...projects, project]
        return project
      })

      const update = Effect.fn("ProjectService.update")(
        function* (id: ProjectId, payload: UpdateProjectPayload) {
          const index = projects.findIndex((p) => p.id === id)
          if (index === -1) {
            return yield* Effect.fail(new ProjectNotFoundError({ id }))
          }
          const now = yield* Clock.currentTimeMillis
          const existing = projects[index]!
          const updated = new Project({
            id: existing.id,
            name: "name" in payload ? (payload.name as string) : existing.name,
            description: "description" in payload ? payload.description as Option.Option<string> : existing.description,
            createdAt: existing.createdAt,
            updatedAt: new Date(now),
          })
          projects = projects.map((p, i) => (i === index ? updated : p))
          return updated
        }
      )

      const remove = Effect.fn("ProjectService.remove")(function* (id: ProjectId) {
        const index = projects.findIndex((p) => p.id === id)
        if (index === -1) {
          return yield* Effect.fail(new ProjectNotFoundError({ id }))
        }
        const project = projects[index]!
        projects = projects.filter((p) => p.id !== id)
        return project
      })

      return { list, findById, create, update, remove }
    })
  )
}
