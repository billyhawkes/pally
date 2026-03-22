import { useAtomValue } from "@effect/atom-react";
import { Schema } from "effect";
import { AsyncResult, Atom } from "effect/unstable/reactivity";
import { PallyClient } from "@/lib/pally-client";
import {
  TaskId as TaskIdSchema,
  type CreateTaskPayload,
  type Task,
  type TaskId,
  type UpdateTaskPayload,
} from "@/lib/schemas";

const serverTasksAtom = PallyClient.query("tasks", "listTasks", {
  query: {},
  timeToLive: "5 minutes",
  reactivityKeys: ["tasks"],
});

const makeOptimisticTaskId = (): TaskId =>
  Schema.decodeSync(TaskIdSchema)(`optimistic-${crypto.randomUUID()}`);

const optimisticTask = (payload: CreateTaskPayload): Task => {
  const now = new Date();

  return {
    id: makeOptimisticTaskId(),
    title: payload.title,
    description: payload.description,
    status: payload.status,
    priority: payload.priority,
    orgId: payload.orgId,
    projectId: payload.projectId,
    teamId: payload.teamId,
    githubIssueNumber: null,
    githubIssueId: null,
    githubIssueUrl: null,
    createdAt: now,
    updatedAt: now,
  };
};

type TasksResult = AsyncResult.AsyncResult<ReadonlyArray<Task>, unknown>;

const currentTasks = (result: TasksResult): Array<Task> =>
  result._tag === "Success" ? Array.from(result.value) : [];

const updateTaskInList = (
  tasks: ReadonlyArray<Task>,
  taskId: TaskId,
  payload: UpdateTaskPayload,
): Array<Task> =>
  tasks.map((task) =>
    task.id === taskId
      ? {
          ...task,
          ...payload,
          updatedAt: new Date(),
        }
      : task,
  );

export const allTasksAtom = Atom.optimistic(serverTasksAtom);

export const createTaskAtom = Atom.optimisticFn(allTasksAtom, {
  reducer: (current, args) =>
    AsyncResult.success([
      optimisticTask(args.payload),
      ...currentTasks(current),
    ]),
  fn: PallyClient.mutation("tasks", "createTask"),
});

export const updateTaskAtom = Atom.optimisticFn(allTasksAtom, {
  reducer: (current, args) =>
    AsyncResult.success(
      updateTaskInList(currentTasks(current), args.params.id, args.payload),
    ),
  fn: PallyClient.mutation("tasks", "updateTask"),
});

export const deleteTaskAtom = Atom.optimisticFn(allTasksAtom, {
  reducer: (current, args) =>
    AsyncResult.success(
      currentTasks(current).filter((task) => task.id !== args.params.id),
    ),
  fn: PallyClient.mutation("tasks", "deleteTask"),
});

export const useTasksAtom = () => useAtomValue(allTasksAtom);
