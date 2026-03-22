import { Effect, Layer, Schema, Schedule, ServiceMap, flow } from "effect"
import { and, eq } from "drizzle-orm"
import {
  FetchHttpClient,
  HttpClient,
  HttpClientRequest,
  HttpClientResponse,
} from "effect/unstable/http"
import { account } from "@/db/auth-schema"
import { DB } from "@/db/layer"
import { dbQuery } from "@/db/query"
import { projects, tasks } from "@/db/schema"
import {
  GithubAppConfig,
  createGithubAppJwt,
  isGithubAppConfigured,
  isGithubWebhookConfigured,
} from "@/lib/github-app"
import { isGithubProviderConfigured } from "@/lib/github-provider"
import {
  GithubIntegration,
  GithubInstallUrl,
  GithubInstallState,
  GithubInstallationRepository,
  Project,
  Task,
  type ProjectId,
  type TaskId,
} from "@/lib/schemas"

const decodeGithubIntegration = Schema.decodeUnknownSync(GithubIntegration)
const decodeGithubInstallUrl = Schema.decodeUnknownSync(GithubInstallUrl)
const encodeGithubInstallState = Schema.encodeSync(Schema.fromJsonString(GithubInstallState))
const decodeProject = Schema.decodeUnknownSync(Project)
const decodeTask = Schema.decodeUnknownSync(Task)
const decodeGithubInstallationRepository = Schema.decodeUnknownSync(GithubInstallationRepository)

const GithubIssueState = Schema.Literals(["open", "closed"])

const GithubIssue = Schema.Struct({
  id: Schema.Number,
  number: Schema.Number,
  html_url: Schema.String,
  title: Schema.String,
  body: Schema.NullOr(Schema.String),
  state: GithubIssueState,
})
type GithubIssue = typeof GithubIssue.Type

const GithubInstallationLookup = Schema.Struct({
  id: Schema.Number,
})

const GithubInstallationToken = Schema.Struct({
  token: Schema.String,
})

const GithubRepository = Schema.Struct({
  id: Schema.Number,
  name: Schema.String,
  full_name: Schema.String,
  private: Schema.Boolean,
})

const GithubInstallationRepositories = Schema.Struct({
  repositories: Schema.Array(GithubRepository),
})

export const GithubIssueWebhookPayload = Schema.Struct({
  action: Schema.String,
  installation: Schema.NullOr(
    Schema.Struct({
      id: Schema.Number,
    })
  ),
  repository: Schema.NullOr(
    Schema.Struct({
      full_name: Schema.String,
    })
  ),
  issue: Schema.NullOr(
    Schema.Struct({
      id: Schema.Number,
      number: Schema.Number,
      html_url: Schema.String,
      title: Schema.String,
      body: Schema.NullOr(Schema.String),
      state: GithubIssueState,
      pull_request: Schema.optionalKey(Schema.Unknown),
    })
  ),
})
export type GithubIssueWebhookPayload = typeof GithubIssueWebhookPayload.Type

export class GithubSyncError extends Schema.TaggedErrorClass<GithubSyncError>()(
  "GithubSyncError",
  {
    message: Schema.String,
  }
) {}

const issueStateToTaskStatus = (state: typeof GithubIssueState.Type): Task["status"] =>
  state === "closed" ? "done" : "todo"

const taskStatusToIssueState = (status: Task["status"]): typeof GithubIssueState.Type =>
  status === "done" ? "closed" : "open"

const toInstallationIdString = (installationId: number): string => `${installationId}`

export class GithubService extends ServiceMap.Service<
  GithubService,
  {
    readonly getIntegration: (userId: string) => Effect.Effect<GithubIntegration>
    readonly getInstallUrl: (input: {
      projectId: ProjectId
      returnTo: string
    }) => Effect.Effect<GithubInstallUrl, GithubSyncError>
    readonly listInstallationRepositories: (
      installationId: string,
    ) => Effect.Effect<readonly GithubInstallationRepository[], GithubSyncError>
    readonly syncTask: (task: Task) => Effect.Effect<Task>
    readonly closeTaskIssue: (task: Task) => Effect.Effect<void>
    readonly handleIssueWebhook: (
      payload: GithubIssueWebhookPayload,
    ) => Effect.Effect<void, GithubSyncError>
    readonly isWebhookConfigured: () => Effect.Effect<boolean>
  }
>()("@pally/GithubService") {
  static readonly layer = Layer.effect(
    GithubService,
    Effect.gen(function* () {
      const db = yield* DB
      const config = yield* GithubAppConfig
      const client = (yield* HttpClient.HttpClient).pipe(
        HttpClient.mapRequest(
          flow(
            HttpClientRequest.prependUrl("https://api.github.com"),
            HttpClientRequest.acceptJson,
            HttpClientRequest.setHeaders({
              "user-agent": "pally",
              "x-github-api-version": "2022-11-28",
            })
          )
        ),
        HttpClient.retryTransient({
          schedule: Schedule.exponential(100),
          times: 3,
        })
      )

      const failGithubResponse = Effect.fn("GithubService.failGithubResponse")(
        function* (operation: string, response: HttpClientResponse.HttpClientResponse) {
          const bodyResult = yield* response.text.pipe(Effect.result)
          const body = bodyResult._tag === "Success" ? bodyResult.success : ""
          return yield* new GithubSyncError({
            message: `${operation} failed with ${response.status}${body ? `: ${body}` : ""}`,
          })
        }
      )

      const getGithubAppJwt = Effect.fn("GithubService.getGithubAppJwt")(function* () {
        const appId = config.appId
        const privateKey = config.privateKey

        if (!appId || !privateKey || !isGithubAppConfigured(config)) {
          return yield* new GithubSyncError({
            message: "GitHub App is not configured",
          })
        }

        return createGithubAppJwt({
          appId,
          privateKey,
        })
      })

      const getGithubInstallUrl = Effect.fn("GithubService.getGithubInstallUrl")(
        function* (input: { projectId: ProjectId; returnTo: string }) {
          if (!config.appSlug || !isGithubAppConfigured(config)) {
            return yield* new GithubSyncError({
              message: "GitHub App install flow is not configured",
            })
          }

          const state = Buffer.from(encodeGithubInstallState(input), "utf8").toString("base64url")

          return decodeGithubInstallUrl({
            url: `https://github.com/apps/${config.appSlug}/installations/new?state=${state}`,
          })
        }
      )

      const findProjectById = Effect.fn("GithubService.findProjectById")(
        function* (projectId: ProjectId) {
          const rows = yield* dbQuery(
            db.select().from(projects).where(eq(projects.id, projectId as string)).limit(1)
          )

          return rows[0] ? decodeProject(rows[0]) : null
        }
      )

      const findProjectByRepository = Effect.fn("GithubService.findProjectByRepository")(
        function* (repositoryFullName: string) {
          const rows = yield* dbQuery(
            db
              .select()
              .from(projects)
              .where(eq(projects.githubRepositoryFullName, repositoryFullName))
              .limit(1)
          )

          return rows[0] ? decodeProject(rows[0]) : null
        }
      )

      const findTaskByGithubIssueId = Effect.fn("GithubService.findTaskByGithubIssueId")(
        function* (issueId: string) {
          const rows = yield* dbQuery(
            db.select().from(tasks).where(eq(tasks.githubIssueId, issueId)).limit(1)
          )

          return rows[0] ? decodeTask(rows[0]) : null
        }
      )

      const setProjectInstallationId = Effect.fn("GithubService.setProjectInstallationId")(
        function* (projectId: ProjectId, installationId: string) {
          yield* dbQuery(
            db
              .update(projects)
              .set({
                githubInstallationId: installationId,
              })
              .where(eq(projects.id, projectId as string))
          )
        }
      )

      const updateTaskGithubIssueMetadata = Effect.fn(
        "GithubService.updateTaskGithubIssueMetadata"
      )(function* (taskId: TaskId, issue: GithubIssue) {
        yield* dbQuery(
          db
            .update(tasks)
            .set({
              githubIssueId: `${issue.id}`,
              githubIssueNumber: issue.number,
              githubIssueUrl: issue.html_url,
            })
            .where(eq(tasks.id, taskId as string))
        )

        const rows = yield* dbQuery(
          db.select().from(tasks).where(eq(tasks.id, taskId as string)).limit(1)
        )

        if (!rows[0]) {
          return yield* new GithubSyncError({
            message: `Task ${taskId} no longer exists after GitHub sync`,
          })
        }

        return decodeTask(rows[0])
      })

      const getInstallationIdForProject = Effect.fn("GithubService.getInstallationIdForProject")(
        function* (project: Project) {
          if (project.githubInstallationId) {
            return project.githubInstallationId
          }

          if (!project.githubRepositoryFullName) {
            return null
          }

          const jwt = yield* getGithubAppJwt()
          const response = yield* HttpClientRequest.get(
            `/repos/${project.githubRepositoryFullName}/installation`
          ).pipe(
            HttpClientRequest.setHeaders({
              authorization: `Bearer ${jwt}`,
            }),
            client.execute
          )

          if (response.status === 404) {
            return null
          }

          if (response.status !== 200) {
            return yield* failGithubResponse("Looking up repository installation", response)
          }

          const installation = yield* HttpClientResponse.schemaBodyJson(GithubInstallationLookup)(
            response
          ).pipe(
            Effect.mapError(
              () =>
                new GithubSyncError({
                  message: "GitHub installation lookup returned an unexpected payload",
                })
            )
          )

          const installationId = toInstallationIdString(installation.id)
          yield* setProjectInstallationId(project.id, installationId)
          return installationId
        }
      )

      const getInstallationAccessToken = Effect.fn("GithubService.getInstallationAccessToken")(
        function* (installationId: string) {
          const jwt = yield* getGithubAppJwt()
          const response = yield* HttpClientRequest.post(
            `/app/installations/${installationId}/access_tokens`
          ).pipe(
            HttpClientRequest.setHeaders({
              authorization: `Bearer ${jwt}`,
            }),
            client.execute
          )

          if (response.status !== 201) {
            return yield* failGithubResponse("Creating installation access token", response)
          }

          const tokenPayload = yield* HttpClientResponse.schemaBodyJson(GithubInstallationToken)(
            response
          ).pipe(
            Effect.mapError(
              () =>
                new GithubSyncError({
                  message: "GitHub installation token response was invalid",
                })
            )
          )

          return tokenPayload.token
        }
      )

      const listInstallationRepositories = Effect.fn(
        "GithubService.listInstallationRepositories"
      )(function* (installationId: string) {
        return yield* Effect.gen(function* () {
          if (!isGithubAppConfigured(config)) {
            return yield* new GithubSyncError({
              message: "GitHub App is not configured",
            })
          }

          const token = yield* getInstallationAccessToken(installationId)
          const response = yield* HttpClientRequest.get("/installation/repositories").pipe(
            HttpClientRequest.setHeaders({
              authorization: `Bearer ${token}`,
            }),
            client.execute
          )

          if (response.status !== 200) {
            return yield* failGithubResponse("Listing installation repositories", response)
          }

          const payload = yield* HttpClientResponse.schemaBodyJson(GithubInstallationRepositories)(
            response
          ).pipe(
            Effect.mapError(
              () =>
                new GithubSyncError({
                  message: "GitHub installation repositories response was invalid",
                })
            )
          )

          return payload.repositories.map((repository) =>
            decodeGithubInstallationRepository({
              id: repository.id,
              name: repository.name,
              fullName: repository.full_name,
              private: repository.private,
            })
          )
        }).pipe(
          Effect.mapError((error) =>
            error._tag === "GithubSyncError"
              ? error
              : new GithubSyncError({
                  message: "Failed to list GitHub installation repositories",
                })
          )
        )
      })

      const createGithubIssue = Effect.fn("GithubService.createGithubIssue")(
        function* (project: Project, task: Task) {
          const installationId = yield* getInstallationIdForProject(project)

          if (!installationId || !project.githubRepositoryFullName) {
            return null
          }

          const token = yield* getInstallationAccessToken(installationId)
          const response = yield* HttpClientRequest.post(
            `/repos/${project.githubRepositoryFullName}/issues`
          ).pipe(
            HttpClientRequest.setHeaders({
              authorization: `Bearer ${token}`,
            }),
            HttpClientRequest.bodyJsonUnsafe({
              title: task.title,
              body: task.description ?? "",
            }),
            client.execute
          )

          if (response.status !== 201) {
            return yield* failGithubResponse("Creating GitHub issue", response)
          }

          return yield* HttpClientResponse.schemaBodyJson(GithubIssue)(response).pipe(
            Effect.mapError(
              () =>
                new GithubSyncError({
                  message: "GitHub issue creation response was invalid",
                })
            )
          )
        }
      )

      const updateGithubIssue = Effect.fn("GithubService.updateGithubIssue")(
        function* (project: Project, task: Task) {
          const installationId = yield* getInstallationIdForProject(project)

          if (!installationId || !project.githubRepositoryFullName || task.githubIssueNumber === null) {
            return null
          }

          const token = yield* getInstallationAccessToken(installationId)
          const response = yield* HttpClientRequest.patch(
            `/repos/${project.githubRepositoryFullName}/issues/${task.githubIssueNumber}`
          ).pipe(
            HttpClientRequest.setHeaders({
              authorization: `Bearer ${token}`,
            }),
            HttpClientRequest.bodyJsonUnsafe({
              title: task.title,
              body: task.description ?? "",
              state: taskStatusToIssueState(task.status),
            }),
            client.execute
          )

          if (response.status !== 200) {
            return yield* failGithubResponse("Updating GitHub issue", response)
          }

          return yield* HttpClientResponse.schemaBodyJson(GithubIssue)(response).pipe(
            Effect.mapError(
              () =>
                new GithubSyncError({
                  message: "GitHub issue update response was invalid",
                })
            )
          )
        }
      )

      const syncTaskOrFail = Effect.fn("GithubService.syncTaskOrFail")(
        function* (task: Task) {
          if (!task.projectId || !isGithubAppConfigured(config)) {
            return task
          }

          const project = yield* findProjectById(task.projectId)

          if (!project?.githubRepositoryFullName) {
            return task
          }

          const issue =
            task.githubIssueId === null
              ? yield* createGithubIssue(project, task)
              : yield* updateGithubIssue(project, task)

          if (!issue) {
            return task
          }

          return yield* updateTaskGithubIssueMetadata(task.id, issue)
        }
      )

      const closeTaskIssueOrFail = Effect.fn("GithubService.closeTaskIssueOrFail")(
        function* (task: Task) {
          if (!task.projectId || task.githubIssueNumber === null || !isGithubAppConfigured(config)) {
            return
          }

          const project = yield* findProjectById(task.projectId)

          if (!project?.githubRepositoryFullName) {
            return
          }

          const installationId = yield* getInstallationIdForProject(project)

          if (!installationId) {
            return
          }

          const token = yield* getInstallationAccessToken(installationId)
          const response = yield* HttpClientRequest.patch(
            `/repos/${project.githubRepositoryFullName}/issues/${task.githubIssueNumber}`
          ).pipe(
            HttpClientRequest.setHeaders({
              authorization: `Bearer ${token}`,
            }),
            HttpClientRequest.bodyJsonUnsafe({
              state: "closed",
            }),
            client.execute
          )

          if (response.status !== 200) {
            return yield* failGithubResponse("Closing GitHub issue", response)
          }
        }
      )

      const upsertTaskFromIssue = Effect.fn("GithubService.upsertTaskFromIssue")(
        function* (project: Project, issue: GithubIssue) {
          const existingTask = yield* findTaskByGithubIssueId(`${issue.id}`)

          if (existingTask) {
            yield* dbQuery(
              db
                .update(tasks)
                .set({
                  title: issue.title,
                  description: issue.body,
                  status: issueStateToTaskStatus(issue.state),
                  projectId: project.id,
                  orgId: project.orgId,
                  teamId: project.teamId,
                  githubIssueId: `${issue.id}`,
                  githubIssueNumber: issue.number,
                  githubIssueUrl: issue.html_url,
                  updatedAt: new Date(),
                })
                .where(eq(tasks.id, existingTask.id as string))
            )

            return
          }

          const taskId = `task-github-${issue.id}`
          const now = new Date()

          yield* dbQuery(
            db.insert(tasks).values({
              id: taskId,
              title: issue.title,
              description: issue.body,
              status: issueStateToTaskStatus(issue.state),
              priority: "medium",
              orgId: project.orgId,
              projectId: project.id,
              teamId: project.teamId,
              githubIssueId: `${issue.id}`,
              githubIssueNumber: issue.number,
              githubIssueUrl: issue.html_url,
              createdAt: now,
              updatedAt: now,
            })
          )
        }
      )

      const deleteTaskByIssueId = Effect.fn("GithubService.deleteTaskByIssueId")(
        function* (issueId: string) {
          yield* dbQuery(db.delete(tasks).where(eq(tasks.githubIssueId, issueId)))
        }
      )

      const getIntegration = Effect.fn("GithubService.getIntegration")(function* (userId: string) {
        const rows = yield* dbQuery(
          db
            .select({
              accountId: account.accountId,
              scope: account.scope,
              createdAt: account.createdAt,
            })
            .from(account)
            .where(and(eq(account.userId, userId), eq(account.providerId, "github")))
            .limit(1)
        )

        const connectedAccount = rows[0] ?? null

        return decodeGithubIntegration({
          provider: "github",
          providerConfigured: isGithubProviderConfigured(),
          appConfigured: Boolean(config.appSlug) && isGithubAppConfigured(config),
          connected: connectedAccount !== null,
          accountId: connectedAccount?.accountId ?? null,
          scope: connectedAccount?.scope ?? null,
          connectedAt: connectedAccount?.createdAt ?? null,
        })
      })

      const syncTask = Effect.fn("GithubService.syncTask")(function* (task: Task) {
        const result = yield* syncTaskOrFail(task).pipe(Effect.result)

        if (result._tag === "Failure") {
          return task
        }

        return result.success
      })

      const closeTaskIssue = Effect.fn("GithubService.closeTaskIssue")(function* (task: Task) {
        yield* closeTaskIssueOrFail(task).pipe(Effect.result)
      })

      const handleIssueWebhook = Effect.fn("GithubService.handleIssueWebhook")(
        function* (payload: GithubIssueWebhookPayload) {
          if (!payload.issue || payload.issue.pull_request) {
            return
          }

          if (!payload.repository?.full_name) {
            return yield* new GithubSyncError({
              message: "GitHub issue webhook is missing repository information",
            })
          }

          const project = yield* findProjectByRepository(payload.repository.full_name)

          if (!project) {
            return
          }

          if (payload.installation?.id) {
            yield* setProjectInstallationId(project.id, toInstallationIdString(payload.installation.id))
          }

          const issue = {
            id: payload.issue.id,
            number: payload.issue.number,
            html_url: payload.issue.html_url,
            title: payload.issue.title,
            body: payload.issue.body,
            state: payload.issue.state,
          } satisfies GithubIssue

          switch (payload.action) {
            case "opened":
            case "edited":
            case "reopened":
            case "closed": {
              yield* upsertTaskFromIssue(project, issue)
              return
            }
            case "deleted": {
              yield* deleteTaskByIssueId(`${payload.issue.id}`)
              return
            }
            default:
              return
          }
        }
      )

      const isWebhookConfigured = Effect.fn("GithubService.isWebhookConfigured")(function* () {
        return isGithubWebhookConfigured(config)
      })

      return {
        getIntegration,
        getInstallUrl: getGithubInstallUrl,
        listInstallationRepositories,
        syncTask,
        closeTaskIssue,
        handleIssueWebhook,
        isWebhookConfigured,
      }
    })
  ).pipe(Layer.provide(FetchHttpClient.layer), Layer.provide(GithubAppConfig.layer))
}
