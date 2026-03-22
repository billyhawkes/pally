import { Argument, Command, Flag } from "effect/unstable/cli"
import { BunServices, BunRuntime } from "@effect/platform-bun"
import { Console, Effect, Layer, Option } from "effect"
import { TaskService, ProjectService, ViewService } from "./lib/services/index"
import { TaskId, ProjectId, ViewId, TaskStatus, TaskPriority } from "./lib/schemas"
import { DBLive } from "./db/layer"
import { seed } from "./db/seed"

// Task list command with filters
const taskListStatus = Flag.string("status").pipe(
  Flag.withAlias("s"),
  Flag.optional,
  Flag.withDescription("Filter by status (todo, in_progress, done)")
)

const taskListPriority = Flag.string("priority").pipe(
  Flag.withAlias("p"),
  Flag.optional,
  Flag.withDescription("Filter by priority (low, medium, high, urgent)")
)

const taskListCommand = Command.make("list", { status: taskListStatus, priority: taskListPriority }, ({ status, priority }) =>
  Effect.gen(function* () {
    const taskService = yield* TaskService
    const filters: {
      status?: typeof TaskStatus.Type
      priority?: typeof TaskPriority.Type
    } = {}
    
    if (Option.isSome(status)) {
      const s = status.value
      if (s === "todo" || s === "in_progress" || s === "done") {
        filters.status = s
      }
    }
    if (Option.isSome(priority)) {
      const p = priority.value
      if (p === "low" || p === "medium" || p === "high" || p === "urgent") {
        filters.priority = p
      }
    }
    
    const tasks = yield* taskService.list(filters)

    if (tasks.length === 0) {
      yield* Console.log("No tasks.")
      return
    }

    for (const task of tasks) {
      const statusIcon = task.status === "done" ? "✓" : task.status === "in_progress" ? "◐" : "○"
      yield* Console.log(`${statusIcon} [${task.priority}] #${task.id} ${task.title}`)
    }
  })
).pipe(Command.withDescription("List tasks"))

// Task create command
const taskTitle = Argument.string("title").pipe(
  Argument.withDescription("Task title")
)

const taskCreateCommand = Command.make("create", { title: taskTitle }, ({ title }) =>
  Effect.gen(function* () {
    const taskService = yield* TaskService
    const task = yield* taskService.create({
      title,
      description: null,
      status: "todo",
      priority: "medium",
      orgId: null,
      projectId: null,
      teamId: null,
    })
    yield* Console.log(`Created task #${task.id}: ${task.title}`)
  })
).pipe(Command.withDescription("Create a new task"))

// Task get command
const taskIdArg = Argument.string("id").pipe(
  Argument.withSchema(TaskId),
  Argument.withDescription("Task ID")
)

const taskGetCommand = Command.make("get", { id: taskIdArg }, ({ id }) =>
  Effect.gen(function* () {
    const taskService = yield* TaskService
    const task = yield* taskService.findById(id)
    yield* Console.log(`#${task.id} ${task.title}`)
    yield* Console.log(`  Status: ${task.status}`)
    yield* Console.log(`  Priority: ${task.priority}`)
    if (task.description) {
      yield* Console.log(`  Description: ${task.description}`)
    }
  })
).pipe(Command.withDescription("Get a task by ID"))

// Task delete command
const taskDeleteCommand = Command.make("delete", { id: taskIdArg }, ({ id }) =>
  Effect.gen(function* () {
    const taskService = yield* TaskService
    const task = yield* taskService.remove(id)
    yield* Console.log(`Deleted task: ${task.title}`)
  })
).pipe(Command.withDescription("Delete a task"))

// Task command group
const taskCommand = Command.make("task").pipe(
  Command.withDescription("Manage tasks"),
  Command.withSubcommands([taskListCommand, taskCreateCommand, taskGetCommand, taskDeleteCommand])
)

// Project commands
const projectListCommand = Command.make("list", {}, () =>
  Effect.gen(function* () {
    const projectService = yield* ProjectService
    const projects = yield* projectService.list()

    if (projects.length === 0) {
      yield* Console.log("No projects.")
      return
    }

    for (const project of projects) {
      yield* Console.log(`📁 #${project.id} ${project.name}`)
    }
  })
).pipe(Command.withDescription("List projects"))

const projectNameArg = Argument.string("name").pipe(
  Argument.withDescription("Project name")
)

const projectCreateCommand = Command.make("create", { name: projectNameArg }, ({ name }) =>
  Effect.gen(function* () {
    const projectService = yield* ProjectService
      const project = yield* projectService.create({
        name,
        description: null,
        orgId: null,
      })
    yield* Console.log(`Created project #${project.id}: ${project.name}`)
  })
).pipe(Command.withDescription("Create a new project"))

const projectIdArg = Argument.string("id").pipe(
  Argument.withSchema(ProjectId),
  Argument.withDescription("Project ID")
)

const projectGetCommand = Command.make("get", { id: projectIdArg }, ({ id }) =>
  Effect.gen(function* () {
    const projectService = yield* ProjectService
    const project = yield* projectService.findById(id)
    yield* Console.log(`#${project.id} ${project.name}`)
    if (project.description) {
      yield* Console.log(`  Description: ${project.description}`)
    }
  })
).pipe(Command.withDescription("Get a project by ID"))

const projectDeleteCommand = Command.make("delete", { id: projectIdArg }, ({ id }) =>
  Effect.gen(function* () {
    const projectService = yield* ProjectService
    const project = yield* projectService.remove(id)
    yield* Console.log(`Deleted project: ${project.name}`)
  })
).pipe(Command.withDescription("Delete a project"))

const projectCommand = Command.make("project").pipe(
  Command.withDescription("Manage projects"),
  Command.withSubcommands([projectListCommand, projectCreateCommand, projectGetCommand, projectDeleteCommand])
)

// View commands
const viewListCommand = Command.make("list", {}, () =>
  Effect.gen(function* () {
    const viewService = yield* ViewService
    const views = yield* viewService.list()

    if (views.length === 0) {
      yield* Console.log("No views.")
      return
    }

    for (const view of views) {
      yield* Console.log(`👁 #${view.id} ${view.name}`)
    }
  })
).pipe(Command.withDescription("List views"))

const viewNameArg = Argument.string("name").pipe(
  Argument.withDescription("View name")
)

const viewCreateCommand = Command.make("create", { name: viewNameArg }, ({ name }) =>
  Effect.gen(function* () {
    const viewService = yield* ViewService
      const view = yield* viewService.create({
        name,
        orgId: null,
        filters: {
          status: null,
          priority: null,
        projectId: null,
      },
    })
    yield* Console.log(`Created view #${view.id}: ${view.name}`)
  })
).pipe(Command.withDescription("Create a new view"))

const viewIdArg = Argument.string("id").pipe(
  Argument.withSchema(ViewId),
  Argument.withDescription("View ID")
)

const viewGetCommand = Command.make("get", { id: viewIdArg }, ({ id }) =>
  Effect.gen(function* () {
    const viewService = yield* ViewService
    const view = yield* viewService.findById(id)
    yield* Console.log(`#${view.id} ${view.name}`)
  })
).pipe(Command.withDescription("Get a view by ID"))

const viewDeleteCommand = Command.make("delete", { id: viewIdArg }, ({ id }) =>
  Effect.gen(function* () {
    const viewService = yield* ViewService
    const view = yield* viewService.remove(id)
    yield* Console.log(`Deleted view: ${view.name}`)
  })
).pipe(Command.withDescription("Delete a view"))

const viewCommand = Command.make("view").pipe(
  Command.withDescription("Manage views"),
  Command.withSubcommands([viewListCommand, viewCreateCommand, viewGetCommand, viewDeleteCommand])
)

// Main CLI app
const app = Command.make("pally").pipe(
  Command.withDescription("Pally - A web-first project and task application"),
  Command.withSubcommands([taskCommand, projectCommand, viewCommand])
)

// Run CLI
const program = Command.run(app, { version: "0.1.0" })

const servicesWithDB = TaskService.layer.pipe(
  Layer.provideMerge(ProjectService.layer),
  Layer.provideMerge(ViewService.layer),
  Layer.provideMerge(DBLive)
)
const mainLayer = Layer.merge(servicesWithDB, BunServices.layer)

Effect.gen(function* () {
  yield* seed
  yield* program
}).pipe(Effect.provide(mainLayer), BunRuntime.runMain)
