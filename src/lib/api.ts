import { Schema } from "effect"
import { HttpApi, HttpApiEndpoint, HttpApiGroup } from "effect/unstable/httpapi"
import { Authentication } from "./auth-middleware"
import {
  CreateProjectPayload,
  CreateTaskPayload,
  CreateViewPayload,
  Organization,
  Project,
  ProjectId,
  ProjectNotFoundError,
  Task,
  TaskId,
  TaskNotFoundError,
  TaskPriority,
  TaskStatus,
  Team,
  TeamId,
  UpdateProjectPayload,
  UpdateTaskPayload,
  UpdateViewPayload,
  View,
  ViewId,
  ViewNotFoundError,
} from "./schemas"

// Task endpoints
const listTasks = HttpApiEndpoint.get("listTasks", "/tasks", {
  query: Schema.Struct({
    status: Schema.optionalKey(TaskStatus),
    priority: Schema.optionalKey(TaskPriority),
    projectId: Schema.optionalKey(ProjectId),
    teamId: Schema.optionalKey(TeamId),
  }),
  success: Schema.Array(Task),
})

const getTask = HttpApiEndpoint.get("getTask", "/tasks/:id", {
  params: Schema.Struct({
    id: TaskId,
  }),
  success: Task,
  error: TaskNotFoundError,
})

const createTask = HttpApiEndpoint.post("createTask", "/tasks", {
  payload: CreateTaskPayload,
  success: Task,
})

const updateTask = HttpApiEndpoint.patch("updateTask", "/tasks/:id", {
  params: Schema.Struct({
    id: TaskId,
  }),
  payload: UpdateTaskPayload,
  success: Task,
  error: TaskNotFoundError,
})

const deleteTask = HttpApiEndpoint.delete("deleteTask", "/tasks/:id", {
  params: Schema.Struct({
    id: TaskId,
  }),
  success: Task,
  error: TaskNotFoundError,
})

const tasksGroup = HttpApiGroup.make("tasks")
  .add(listTasks, getTask, createTask, updateTask, deleteTask)
  .middleware(Authentication)

// Project endpoints
const listProjects = HttpApiEndpoint.get("listProjects", "/projects", {
  success: Schema.Array(Project),
})

const getProject = HttpApiEndpoint.get("getProject", "/projects/:id", {
  params: Schema.Struct({
    id: ProjectId,
  }),
  success: Project,
  error: ProjectNotFoundError,
})

const createProject = HttpApiEndpoint.post("createProject", "/projects", {
  payload: CreateProjectPayload,
  success: Project,
})

const updateProject = HttpApiEndpoint.patch("updateProject", "/projects/:id", {
  params: Schema.Struct({
    id: ProjectId,
  }),
  payload: UpdateProjectPayload,
  success: Project,
  error: ProjectNotFoundError,
})

const deleteProject = HttpApiEndpoint.delete("deleteProject", "/projects/:id", {
  params: Schema.Struct({
    id: ProjectId,
  }),
  success: Project,
  error: ProjectNotFoundError,
})

const projectsGroup = HttpApiGroup.make("projects")
  .add(listProjects, getProject, createProject, updateProject, deleteProject)
  .middleware(Authentication)

// View endpoints
const listViews = HttpApiEndpoint.get("listViews", "/views", {
  success: Schema.Array(View),
})

const getView = HttpApiEndpoint.get("getView", "/views/:id", {
  params: Schema.Struct({
    id: ViewId,
  }),
  success: View,
  error: ViewNotFoundError,
})

const createView = HttpApiEndpoint.post("createView", "/views", {
  payload: CreateViewPayload,
  success: View,
})

const updateView = HttpApiEndpoint.patch("updateView", "/views/:id", {
  params: Schema.Struct({
    id: ViewId,
  }),
  payload: UpdateViewPayload,
  success: View,
  error: ViewNotFoundError,
})

const deleteView = HttpApiEndpoint.delete("deleteView", "/views/:id", {
  params: Schema.Struct({
    id: ViewId,
  }),
  success: View,
  error: ViewNotFoundError,
})

const viewsGroup = HttpApiGroup.make("views")
  .add(listViews, getView, createView, updateView, deleteView)
  .middleware(Authentication)

// Organization endpoints
const listOrganizations = HttpApiEndpoint.get("listOrganizations", "/organizations", {
  success: Schema.Array(Organization),
})

const organizationsGroup = HttpApiGroup.make("organizations")
  .add(listOrganizations)
  .middleware(Authentication)

// Team endpoints
const listTeams = HttpApiEndpoint.get("listTeams", "/teams", {
  query: Schema.Struct({
    organizationId: Schema.String,
  }),
  success: Schema.Array(Team),
})

const teamsGroup = HttpApiGroup.make("teams")
  .add(listTeams)
  .middleware(Authentication)

// Main API
export const PallyApi = HttpApi.make("PallyApi")
  .add(tasksGroup)
  .add(projectsGroup)
  .add(viewsGroup)
  .add(organizationsGroup)
  .add(teamsGroup)
