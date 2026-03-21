import { Schema } from "effect"

// Branded IDs
export const TaskId = Schema.String.pipe(Schema.brand("TaskId"))
export type TaskId = typeof TaskId.Type

export const ProjectId = Schema.String.pipe(Schema.brand("ProjectId"))
export type ProjectId = typeof ProjectId.Type

export const ViewId = Schema.String.pipe(Schema.brand("ViewId"))
export type ViewId = typeof ViewId.Type

// Enums
export const TaskStatus = Schema.Literals(["todo", "in_progress", "done"])
export type TaskStatus = typeof TaskStatus.Type

export const TaskPriority = Schema.Literals(["low", "medium", "high", "urgent"])
export type TaskPriority = typeof TaskPriority.Type

// Domain models
export class Task extends Schema.Class("Task")({
  id: TaskId,
  title: Schema.NonEmptyString,
  description: Schema.Option(Schema.String),
  status: TaskStatus,
  priority: TaskPriority,
  projectId: Schema.Option(ProjectId),
  createdAt: Schema.Date,
  updatedAt: Schema.Date,
}) {}

export class CreateTaskPayload extends Schema.Class("CreateTaskPayload")({
  title: Schema.NonEmptyString,
  description: Schema.Option(Schema.String),
  status: TaskStatus,
  priority: TaskPriority,
  projectId: Schema.Option(ProjectId),
}) {}

export class UpdateTaskPayload extends Schema.Class("UpdateTaskPayload")({
  title: Schema.optionalKey(Schema.NonEmptyString),
  description: Schema.optionalKey(Schema.Option(Schema.String)),
  status: Schema.optionalKey(TaskStatus),
  priority: Schema.optionalKey(TaskPriority),
  projectId: Schema.optionalKey(Schema.Option(ProjectId)),
}) {}

export class Project extends Schema.Class("Project")({
  id: ProjectId,
  name: Schema.NonEmptyString,
  description: Schema.Option(Schema.String),
  createdAt: Schema.Date,
  updatedAt: Schema.Date,
}) {}

export class CreateProjectPayload extends Schema.Class("CreateProjectPayload")({
  name: Schema.NonEmptyString,
  description: Schema.Option(Schema.String),
}) {}

export class UpdateProjectPayload extends Schema.Class("UpdateProjectPayload")({
  name: Schema.optionalKey(Schema.NonEmptyString),
  description: Schema.optionalKey(Schema.Option(Schema.String)),
}) {}

export class View extends Schema.Class("View")({
  id: ViewId,
  name: Schema.NonEmptyString,
  filters: Schema.Struct({
    status: Schema.Option(Schema.Array(TaskStatus)),
    priority: Schema.Option(Schema.Array(TaskPriority)),
    projectId: Schema.Option(ProjectId),
  }),
  createdAt: Schema.Date,
  updatedAt: Schema.Date,
}) {}

export class CreateViewPayload extends Schema.Class("CreateViewPayload")({
  name: Schema.NonEmptyString,
  filters: Schema.Struct({
    status: Schema.Option(Schema.Array(TaskStatus)),
    priority: Schema.Option(Schema.Array(TaskPriority)),
    projectId: Schema.Option(ProjectId),
  }),
}) {}

export class UpdateViewPayload extends Schema.Class("UpdateViewPayload")({
  name: Schema.optionalKey(Schema.NonEmptyString),
  filters: Schema.optionalKey(
    Schema.Struct({
      status: Schema.Option(Schema.Array(TaskStatus)),
      priority: Schema.Option(Schema.Array(TaskPriority)),
      projectId: Schema.Option(ProjectId),
    })
  ),
}) {}

// Error types
export class TaskNotFoundError extends Schema.TaggedClass("TaskNotFoundError")("TaskNotFoundError", {
  id: TaskId,
}) {}

export class ProjectNotFoundError extends Schema.TaggedClass("ProjectNotFoundError")("ProjectNotFoundError", {
  id: ProjectId,
}) {}

export class ViewNotFoundError extends Schema.TaggedClass("ViewNotFoundError")("ViewNotFoundError", {
  id: ViewId,
}) {}
