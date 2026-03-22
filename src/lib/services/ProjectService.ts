import { Clock, Effect, Layer, Schema, ServiceMap } from "effect"
import { eq, and } from "drizzle-orm"
import {
  CreateProjectPayload,
  OrganizationId,
  Project,
  ProjectId,
  ProjectNotFoundError,
  TeamId,
  UpdateProjectPayload,
} from "@/lib/schemas"
import { DB } from "@/db/layer"
import { dbQuery } from "@/db/query"
import { projects } from "@/db/schema"

const decodeProject = Schema.decodeUnknownSync(Project)

export class ProjectService extends ServiceMap.Service<
  ProjectService,
  {
    readonly list: (filters?: {
      orgId?: OrganizationId | undefined;
      teamId?: TeamId | undefined;
    }) => Effect.Effect<readonly Project[]>
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

      const list = Effect.fn("ProjectService.list")(function* (filters?: {
        orgId?: OrganizationId | undefined
        teamId?: TeamId | undefined
      }) {
        const conditions = []
        if (filters?.orgId) {
          conditions.push(eq(projects.orgId, filters.orgId as string))
        }
        if (filters?.teamId) {
          conditions.push(eq(projects.teamId, filters.teamId as string))
        }

        const query =
          conditions.length > 0
            ? db.select().from(projects).where(and(...conditions))
            : db.select().from(projects)

        const rows = yield* dbQuery(query)
        return rows.map((row) => decodeProject(row))
      })

      const findById = Effect.fn("ProjectService.findById")(function* (id: ProjectId) {
        const rows = yield* dbQuery(
          db.select().from(projects).where(eq(projects.id, id as string)).limit(1)
        )
        if (rows.length === 0) {
          return yield* new ProjectNotFoundError({ id })
        }
        return decodeProject(rows[0]!)
      })

      const create = Effect.fn("ProjectService.create")(function* (payload: CreateProjectPayload) {
        const now = yield* Clock.currentTimeMillis
        const id = `project-${now}-${Math.random().toString(36).slice(2, 7)}`
        yield* dbQuery(
          db.insert(projects).values({
            id,
            name: payload.name,
            description: payload.description,
            orgId: payload.orgId,
            teamId: payload.teamId,
            githubRepositoryFullName: payload.githubRepositoryFullName ?? null,
            githubInstallationId: payload.githubInstallationId ?? null,
          })
        )
        return decodeProject({
          id,
          name: payload.name,
          description: payload.description,
          orgId: payload.orgId,
          teamId: payload.teamId,
          githubRepositoryFullName: payload.githubRepositoryFullName ?? null,
          githubInstallationId: payload.githubInstallationId ?? null,
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
          if ("description" in payload) setValues.description = payload.description ?? null
          if ("orgId" in payload) setValues.orgId = payload.orgId ?? null
          if ("teamId" in payload) setValues.teamId = payload.teamId ?? null
          if ("githubRepositoryFullName" in payload) {
            setValues.githubRepositoryFullName = payload.githubRepositoryFullName ?? null
          }
          if ("githubInstallationId" in payload) {
            setValues.githubInstallationId = payload.githubInstallationId ?? null
          }

          yield* dbQuery(
            db.update(projects).set(setValues).where(eq(projects.id, id as string))
          )

          return decodeProject({
            id: existing.id,
            name: "name" in payload ? payload.name : existing.name,
            description: "description" in payload ? (payload.description ?? null) : existing.description,
            orgId: "orgId" in payload ? (payload.orgId ?? null) : existing.orgId,
            teamId: "teamId" in payload ? (payload.teamId ?? null) : existing.teamId,
            githubRepositoryFullName:
              "githubRepositoryFullName" in payload
                ? (payload.githubRepositoryFullName ?? null)
                : existing.githubRepositoryFullName,
            githubInstallationId:
              "githubInstallationId" in payload
                ? (payload.githubInstallationId ?? null)
                : existing.githubInstallationId,
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
