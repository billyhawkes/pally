import { Schema } from "effect";

// Branded IDs
export const TaskId = Schema.String.pipe(Schema.brand("TaskId"));
export type TaskId = typeof TaskId.Type;

export const ProjectId = Schema.String.pipe(Schema.brand("ProjectId"));
export type ProjectId = typeof ProjectId.Type;

export const ViewId = Schema.String.pipe(Schema.brand("ViewId"));
export type ViewId = typeof ViewId.Type;

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
  projectId: Schema.NullOr(ProjectId),
  createdAt: Schema.Date,
  updatedAt: Schema.Date,
})
export type Task = typeof Task.Type

export const CreateTaskPayload = Schema.Struct({
  title: Schema.NonEmptyString,
  description: Schema.NullOr(Schema.String),
  status: TaskStatus,
  priority: TaskPriority,
  projectId: Schema.NullOr(ProjectId),
})
export type CreateTaskPayload = typeof CreateTaskPayload.Type

export const UpdateTaskPayload = Schema.Struct({
  title: Schema.optionalKey(Schema.NonEmptyString),
  description: Schema.optionalKey(Schema.NullOr(Schema.String)),
  status: Schema.optionalKey(TaskStatus),
  priority: Schema.optionalKey(TaskPriority),
  projectId: Schema.optionalKey(Schema.NullOr(ProjectId)),
})
export type UpdateTaskPayload = typeof UpdateTaskPayload.Type

export const Project = Schema.Struct({
  id: ProjectId,
  name: Schema.NonEmptyString,
  description: Schema.NullOr(Schema.String),
  createdAt: Schema.Date,
  updatedAt: Schema.Date,
})
export type Project = typeof Project.Type

export const CreateProjectPayload = Schema.Struct({
  name: Schema.NonEmptyString,
  description: Schema.NullOr(Schema.String),
})
export type CreateProjectPayload = typeof CreateProjectPayload.Type

export const UpdateProjectPayload = Schema.Struct({
  name: Schema.optionalKey(Schema.NonEmptyString),
  description: Schema.optionalKey(Schema.NullOr(Schema.String)),
})
export type UpdateProjectPayload = typeof UpdateProjectPayload.Type

export const View = Schema.Struct({
  id: ViewId,
  name: Schema.NonEmptyString,
  filters: Schema.Struct({
    status: Schema.NullOr(Schema.Array(TaskStatus)),
    priority: Schema.NullOr(Schema.Array(TaskPriority)),
    projectId: Schema.NullOr(ProjectId),
  }),
  createdAt: Schema.Date,
  updatedAt: Schema.Date,
})
export type View = typeof View.Type

export const CreateViewPayload = Schema.Struct({
  name: Schema.NonEmptyString,
  filters: Schema.Struct({
    status: Schema.NullOr(Schema.Array(TaskStatus)),
    priority: Schema.NullOr(Schema.Array(TaskPriority)),
    projectId: Schema.NullOr(ProjectId),
  }),
})
export type CreateViewPayload = typeof CreateViewPayload.Type

export const UpdateViewPayload = Schema.Struct({
  name: Schema.optionalKey(Schema.NonEmptyString),
  filters: Schema.optionalKey(
    Schema.Struct({
      status: Schema.NullOr(Schema.Array(TaskStatus)),
      priority: Schema.NullOr(Schema.Array(TaskPriority)),
      projectId: Schema.NullOr(ProjectId),
    }),
  ),
})
export type UpdateViewPayload = typeof UpdateViewPayload.Type

// Auth types
export const User = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  email: Schema.String,
  emailVerified: Schema.Boolean,
  createdAt: Schema.Date,
  updatedAt: Schema.Date,
})
export type User = typeof User.Type

export const Session = Schema.Struct({
  id: Schema.String,
  userId: Schema.String,
  expiresAt: Schema.Date,
  createdAt: Schema.Date,
  updatedAt: Schema.Date,
  token: Schema.String,
})
export type Session = typeof Session.Type

export const SessionData = Schema.Struct({
  user: User,
  session: Session,
})
export type SessionData = typeof SessionData.Type

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
