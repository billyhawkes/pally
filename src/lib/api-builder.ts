import { Effect, Layer } from "effect";
import { HttpApiBuilder } from "effect/unstable/httpapi";
import { PallyApi } from "./api";
import { CurrentSession, AuthenticationLive } from "./auth-middleware";
import {
  TaskService,
  ProjectService,
  ViewService,
  OrganizationService,
  TeamService,
  AuthService,
  GithubService,
} from "./services/index";
import { DBLive } from "@/db/layer";

// Tasks group implementation
const tasksGroupLive = HttpApiBuilder.group(PallyApi, "tasks", (handlers) =>
  handlers
    .handle("listTasks", ({ query }) =>
      Effect.gen(function* () {
        const taskService = yield* TaskService;
        return yield* taskService.list({
          orgId: query.orgId,
          status: query.status,
          priority: query.priority,
          projectId: query.projectId,
          teamId: query.teamId,
        });
      }),
    )
    .handle("getTask", ({ params }) =>
      Effect.gen(function* () {
        const taskService = yield* TaskService;
        return yield* taskService.findById(params.id);
      }),
    )
    .handle("createTask", ({ payload }) =>
      Effect.gen(function* () {
        const taskService = yield* TaskService;
        return yield* taskService.create(payload);
      }),
    )
    .handle("updateTask", ({ params, payload }) =>
      Effect.gen(function* () {
        const taskService = yield* TaskService;
        return yield* taskService.update(params.id, payload);
      }),
    )
    .handle("deleteTask", ({ params }) =>
      Effect.gen(function* () {
        const taskService = yield* TaskService;
        return yield* taskService.remove(params.id);
      }),
    ),
);

// Projects group implementation
const projectsGroupLive = HttpApiBuilder.group(
  PallyApi,
  "projects",
  (handlers) =>
    handlers
      .handle("listProjects", ({ query }) =>
        Effect.gen(function* () {
          const projectService = yield* ProjectService;
          return yield* projectService.list({ orgId: query.orgId });
        }),
      )
      .handle("getProject", ({ params }) =>
        Effect.gen(function* () {
          const projectService = yield* ProjectService;
          return yield* projectService.findById(params.id);
        }),
      )
      .handle("createProject", ({ payload }) =>
        Effect.gen(function* () {
          const projectService = yield* ProjectService;
          return yield* projectService.create(payload);
        }),
      )
      .handle("updateProject", ({ params, payload }) =>
        Effect.gen(function* () {
          const projectService = yield* ProjectService;
          return yield* projectService.update(params.id, payload);
        }),
      )
      .handle("deleteProject", ({ params }) =>
        Effect.gen(function* () {
          const projectService = yield* ProjectService;
          return yield* projectService.remove(params.id);
        }),
      ),
);

// Views group implementation
const viewsGroupLive = HttpApiBuilder.group(PallyApi, "views", (handlers) =>
  handlers
    .handle("listViews", ({ query }) =>
      Effect.gen(function* () {
        const viewService = yield* ViewService;
        return yield* viewService.list({ orgId: query.orgId });
      }),
    )
    .handle("getView", ({ params }) =>
      Effect.gen(function* () {
        const viewService = yield* ViewService;
        return yield* viewService.findById(params.id);
      }),
    )
    .handle("createView", ({ payload }) =>
      Effect.gen(function* () {
        const viewService = yield* ViewService;
        return yield* viewService.create(payload);
      }),
    )
    .handle("updateView", ({ params, payload }) =>
      Effect.gen(function* () {
        const viewService = yield* ViewService;
        return yield* viewService.update(params.id, payload);
      }),
    )
    .handle("deleteView", ({ params }) =>
      Effect.gen(function* () {
        const viewService = yield* ViewService;
        return yield* viewService.remove(params.id);
      }),
    ),
);

// Organizations group implementation
const organizationsGroupLive = HttpApiBuilder.group(
  PallyApi,
  "organizations",
  (handlers) =>
    handlers.handle("listOrganizations", () =>
      Effect.gen(function* () {
        const session = yield* CurrentSession;
        const orgService = yield* OrganizationService;
        return yield* orgService.listForUser(session.user.id);
      }),
    ),
);

// Teams group implementation
const teamsGroupLive = HttpApiBuilder.group(PallyApi, "teams", (handlers) =>
  handlers.handle("listTeams", ({ query }) =>
    Effect.gen(function* () {
      const teamService = yield* TeamService;
      return yield* teamService.listByOrg(query.organizationId);
    }),
  ),
);

// GitHub group implementation
const githubGroupLive = HttpApiBuilder.group(PallyApi, "github", (handlers) =>
  handlers.handle("getGithubIntegration", () =>
    Effect.gen(function* () {
      const session = yield* CurrentSession;
      const githubService = yield* GithubService;
      return yield* githubService.getIntegration(session.user.id);
    }),
  ),
);

// Compose all layers
const authLayer = AuthenticationLive.pipe(Layer.provide(AuthService.layer));

export const apiLayer = HttpApiBuilder.layer(PallyApi, {
  openapiPath: "/api/openapi.json",
}).pipe(
  Layer.provide(tasksGroupLive),
  Layer.provide(projectsGroupLive),
  Layer.provide(viewsGroupLive),
  Layer.provide(organizationsGroupLive),
  Layer.provide(teamsGroupLive),
  Layer.provide(githubGroupLive),
  Layer.provide(authLayer),
  Layer.provide(TaskService.layer),
  Layer.provide(ProjectService.layer),
  Layer.provide(ViewService.layer),
  Layer.provide(OrganizationService.layer),
  Layer.provide(TeamService.layer),
  Layer.provide(GithubService.layer),
  Layer.provide(DBLive),
);
