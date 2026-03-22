import { Schema, SchemaGetter } from "effect";

// Date schema that accepts both Date objects (server/DB) and ISO strings (HTTP JSON)
export const DateFromHttp = Schema.Date.pipe(
  Schema.encodeTo(Schema.Union([Schema.String, Schema.Date]), {
    decode: SchemaGetter.Date(),
    encode: SchemaGetter.String(),
  }),
);

// Branded IDs
export const TaskId = Schema.String.pipe(Schema.brand("TaskId"));
export type TaskId = typeof TaskId.Type;

export const ProjectId = Schema.String.pipe(Schema.brand("ProjectId"));
export type ProjectId = typeof ProjectId.Type;

export const ViewId = Schema.String.pipe(Schema.brand("ViewId"));
export type ViewId = typeof ViewId.Type;

export const OrganizationId = Schema.String.pipe(Schema.brand("OrganizationId"));
export type OrganizationId = typeof OrganizationId.Type;

export const TeamId = Schema.String.pipe(Schema.brand("TeamId"));
export type TeamId = typeof TeamId.Type;

// Enums
export const TaskStatus = Schema.Literals(["todo", "in_progress", "done"]);
export type TaskStatus = typeof TaskStatus.Type;

export const TaskPriority = Schema.Literals([
  "low",
  "medium",
  "high",
  "urgent",
]);
export type TaskPriority = typeof TaskPriority.Type;

// Domain models
export const Task = Schema.Struct({
  id: TaskId,
  title: Schema.NonEmptyString,
  description: Schema.NullOr(Schema.String),
  status: TaskStatus,
  priority: TaskPriority,
  orgId: Schema.NullOr(OrganizationId),
  projectId: Schema.NullOr(ProjectId),
  teamId: Schema.NullOr(TeamId),
  githubIssueNumber: Schema.NullOr(Schema.Number),
  githubIssueId: Schema.NullOr(Schema.String),
  githubIssueUrl: Schema.NullOr(Schema.String),
  createdAt: DateFromHttp,
  updatedAt: DateFromHttp,
});
export type Task = typeof Task.Type;

export const CreateTaskPayload = Schema.Struct({
  title: Schema.NonEmptyString,
  description: Schema.NullOr(Schema.String),
  status: TaskStatus,
  priority: TaskPriority,
  orgId: Schema.NullOr(OrganizationId),
  projectId: Schema.NullOr(ProjectId),
  teamId: Schema.NullOr(TeamId),
});
export type CreateTaskPayload = typeof CreateTaskPayload.Type;

export const UpdateTaskPayload = Schema.Struct({
  title: Schema.optionalKey(Schema.NonEmptyString),
  description: Schema.optionalKey(Schema.NullOr(Schema.String)),
  status: Schema.optionalKey(TaskStatus),
  priority: Schema.optionalKey(TaskPriority),
  orgId: Schema.optionalKey(Schema.NullOr(OrganizationId)),
  projectId: Schema.optionalKey(Schema.NullOr(ProjectId)),
  teamId: Schema.optionalKey(Schema.NullOr(TeamId)),
});
export type UpdateTaskPayload = typeof UpdateTaskPayload.Type;

export const Project = Schema.Struct({
  id: ProjectId,
  name: Schema.NonEmptyString,
  description: Schema.NullOr(Schema.String),
  orgId: Schema.NullOr(OrganizationId),
  teamId: Schema.NullOr(TeamId),
  githubRepositoryFullName: Schema.NullOr(Schema.String),
  githubInstallationId: Schema.NullOr(Schema.String),
  createdAt: DateFromHttp,
  updatedAt: DateFromHttp,
});
export type Project = typeof Project.Type;

export const CreateProjectPayload = Schema.Struct({
  name: Schema.NonEmptyString,
  description: Schema.NullOr(Schema.String),
  orgId: Schema.NullOr(OrganizationId),
  teamId: Schema.NullOr(TeamId),
  githubRepositoryFullName: Schema.optionalKey(Schema.NullOr(Schema.String)),
  githubInstallationId: Schema.optionalKey(Schema.NullOr(Schema.String)),
});
export type CreateProjectPayload = typeof CreateProjectPayload.Type;

export const UpdateProjectPayload = Schema.Struct({
  name: Schema.optionalKey(Schema.NonEmptyString),
  description: Schema.optionalKey(Schema.NullOr(Schema.String)),
  orgId: Schema.optionalKey(Schema.NullOr(OrganizationId)),
  teamId: Schema.optionalKey(Schema.NullOr(TeamId)),
  githubRepositoryFullName: Schema.optionalKey(Schema.NullOr(Schema.String)),
  githubInstallationId: Schema.optionalKey(Schema.NullOr(Schema.String)),
});
export type UpdateProjectPayload = typeof UpdateProjectPayload.Type;

export const TaskFilters = Schema.Struct({
  status: Schema.NullOr(Schema.Array(TaskStatus)),
  priority: Schema.NullOr(Schema.Array(TaskPriority)),
  projectId: Schema.NullOr(ProjectId),
});
export type TaskFilters = typeof TaskFilters.Type;

export const View = Schema.Struct({
  id: ViewId,
  name: Schema.NonEmptyString,
  orgId: Schema.NullOr(OrganizationId),
  filters: TaskFilters,
  createdAt: DateFromHttp,
  updatedAt: DateFromHttp,
});
export type View = typeof View.Type;

export const CreateViewPayload = Schema.Struct({
  name: Schema.NonEmptyString,
  orgId: Schema.NullOr(OrganizationId),
  filters: TaskFilters,
});
export type CreateViewPayload = typeof CreateViewPayload.Type;

export const UpdateViewPayload = Schema.Struct({
  name: Schema.optionalKey(Schema.NonEmptyString),
  orgId: Schema.optionalKey(Schema.NullOr(OrganizationId)),
  filters: Schema.optionalKey(TaskFilters),
});
export type UpdateViewPayload = typeof UpdateViewPayload.Type;

// Auth types
export const User = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  email: Schema.String,
  emailVerified: Schema.Boolean,
  createdAt: DateFromHttp,
  updatedAt: DateFromHttp,
});
export type User = typeof User.Type;

export const Session = Schema.Struct({
  id: Schema.String,
  userId: Schema.String,
  expiresAt: DateFromHttp,
  createdAt: DateFromHttp,
  updatedAt: DateFromHttp,
  token: Schema.String,
});
export type Session = typeof Session.Type;

export const SessionData = Schema.Struct({
  user: User,
  session: Session,
});
export type SessionData = typeof SessionData.Type;

// Organization and Team types
export const Organization = Schema.Struct({
  id: OrganizationId,
  name: Schema.String,
  slug: Schema.String,
  logo: Schema.NullOr(Schema.String),
  createdAt: DateFromHttp,
});
export type Organization = typeof Organization.Type;

export const Team = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  organizationId: OrganizationId,
  createdAt: DateFromHttp,
});
export type Team = typeof Team.Type;

export const GithubIntegration = Schema.Struct({
  provider: Schema.Literal("github"),
  providerConfigured: Schema.Boolean,
  appConfigured: Schema.Boolean,
  connected: Schema.Boolean,
  accountId: Schema.NullOr(Schema.String),
  scope: Schema.NullOr(Schema.String),
  connectedAt: Schema.NullOr(DateFromHttp),
});
export type GithubIntegration = typeof GithubIntegration.Type;

export const GithubInstallUrl = Schema.Struct({
  url: Schema.String,
});
export type GithubInstallUrl = typeof GithubInstallUrl.Type;

export const GithubInstallationRepository = Schema.Struct({
  id: Schema.Number,
  name: Schema.String,
  fullName: Schema.String,
  private: Schema.Boolean,
});
export type GithubInstallationRepository = typeof GithubInstallationRepository.Type;

export const GithubInstallState = Schema.Struct({
  projectId: Schema.String,
  returnTo: Schema.String,
});
export type GithubInstallState = typeof GithubInstallState.Type;

// Error types
export class UnauthorizedError extends Schema.TaggedErrorClass(
  "UnauthorizedError",
)("UnauthorizedError", {
  message: Schema.String,
}) {}

export class TaskNotFoundError extends Schema.TaggedErrorClass(
  "TaskNotFoundError",
)("TaskNotFoundError", {
  id: TaskId,
}) {}

export class ProjectNotFoundError extends Schema.TaggedErrorClass(
  "ProjectNotFoundError",
)("ProjectNotFoundError", {
  id: ProjectId,
}) {}

export class ViewNotFoundError extends Schema.TaggedErrorClass(
  "ViewNotFoundError",
)("ViewNotFoundError", {
  id: ViewId,
}) {}
