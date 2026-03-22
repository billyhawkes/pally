import { Clock, Effect, Layer, Schema, ServiceMap } from "effect";
import { and, eq } from "drizzle-orm";
import {
  CreateTaskPayload,
  OrganizationId,
  ProjectId,
  Task,
  TaskId,
  TaskNotFoundError,
  TeamId,
  UpdateTaskPayload,
} from "@/lib/schemas";
import type { TaskPriority, TaskStatus } from "@/lib/schemas";
import { DB } from "@/db/layer";
import { dbQuery } from "@/db/query";
import { tasks } from "@/db/schema";

const decodeTask = Schema.decodeUnknownSync(Task);

export class TaskService extends ServiceMap.Service<
  TaskService,
  {
    readonly list: (filters?: {
      orgId?: OrganizationId | undefined;
      status?: TaskStatus | undefined;
      priority?: TaskPriority | undefined;
      projectId?: ProjectId | undefined;
      teamId?: TeamId | undefined;
    }) => Effect.Effect<readonly Task[]>;
    readonly findById: (id: TaskId) => Effect.Effect<Task, TaskNotFoundError>;
    readonly create: (payload: CreateTaskPayload) => Effect.Effect<Task>;
    readonly update: (
      id: TaskId,
      payload: UpdateTaskPayload,
    ) => Effect.Effect<Task, TaskNotFoundError>;
    readonly remove: (id: TaskId) => Effect.Effect<Task, TaskNotFoundError>;
  }
>()("@pally/TaskService") {
  static readonly layer = Layer.effect(
    TaskService,
    Effect.gen(function* () {
      const db = yield* DB;

      const list = Effect.fn("TaskService.list")(function* (filters?: {
        orgId?: OrganizationId | undefined;
        status?: TaskStatus | undefined;
        priority?: TaskPriority | undefined;
        projectId?: ProjectId | undefined;
        teamId?: TeamId | undefined;
      }) {
        const conditions = [];
        if (filters?.orgId) {
          conditions.push(eq(tasks.orgId, filters.orgId as string));
        }
        if (filters?.status) {
          conditions.push(eq(tasks.status, filters.status));
        }
        if (filters?.priority) {
          conditions.push(eq(tasks.priority, filters.priority));
        }
        if (filters?.projectId) {
          conditions.push(eq(tasks.projectId, filters.projectId as string));
        }
        if (filters?.teamId) {
          conditions.push(eq(tasks.teamId, filters.teamId as string));
        }

        const query =
          conditions.length > 0
            ? db
                .select()
                .from(tasks)
                .where(and(...conditions))
            : db.select().from(tasks);

        const rows = yield* dbQuery(query);
        return rows.map((row) => decodeTask(row));
      });

      const findById = Effect.fn("TaskService.findById")(function* (
        id: TaskId,
      ) {
        const rows = yield* dbQuery(
          db
            .select()
            .from(tasks)
            .where(eq(tasks.id, id as string))
            .limit(1),
        );
        if (rows.length === 0) {
          return yield* new TaskNotFoundError({ id });
        }
        return decodeTask(rows[0]!);
      });

      const create = Effect.fn("TaskService.create")(function* (
        payload: CreateTaskPayload,
      ) {
        const now = yield* Clock.currentTimeMillis;
        const id = `task-${now}-${Math.random().toString(36).slice(2, 7)}`;
        yield* dbQuery(
          db.insert(tasks).values({
            id,
            title: payload.title,
            description: payload.description,
            status: payload.status,
            priority: payload.priority,
            orgId: payload.orgId,
            projectId: payload.projectId,
            teamId: payload.teamId,
          }),
        );
        return decodeTask({
          id,
          title: payload.title,
          description: payload.description,
          status: payload.status,
          priority: payload.priority,
          orgId: payload.orgId,
          projectId: payload.projectId,
          teamId: payload.teamId,
          createdAt: new Date(now),
          updatedAt: new Date(now),
        });
      });

      const update = Effect.fn("TaskService.update")(function* (
        id: TaskId,
        payload: UpdateTaskPayload,
      ) {
        const existing = yield* findById(id);
        const now = yield* Clock.currentTimeMillis;

        const setValues: Record<string, unknown> = { updatedAt: new Date(now) };
        if ("title" in payload) setValues.title = payload.title;
        if ("description" in payload)
          setValues.description = payload.description ?? null;
        if ("status" in payload) setValues.status = payload.status;
        if ("priority" in payload) setValues.priority = payload.priority;
        if ("orgId" in payload) setValues.orgId = payload.orgId ?? null;
        if ("projectId" in payload)
          setValues.projectId = payload.projectId ?? null;
        if ("teamId" in payload)
          setValues.teamId = payload.teamId ?? null;

        yield* dbQuery(
          db
            .update(tasks)
            .set(setValues)
            .where(eq(tasks.id, id as string)),
        );

        return decodeTask({
          id: existing.id,
          title: "title" in payload ? payload.title : existing.title,
          description:
            "description" in payload
              ? (payload.description ?? null)
              : existing.description,
          status: "status" in payload ? payload.status : existing.status,
          priority:
            "priority" in payload ? payload.priority : existing.priority,
          orgId: "orgId" in payload ? (payload.orgId ?? null) : existing.orgId,
          projectId:
            "projectId" in payload
              ? (payload.projectId ?? null)
              : existing.projectId,
          teamId:
            "teamId" in payload
              ? (payload.teamId ?? null)
              : existing.teamId,
          createdAt: existing.createdAt,
          updatedAt: new Date(now),
        });
      });

      const remove = Effect.fn("TaskService.remove")(function* (id: TaskId) {
        const existing = yield* findById(id);
        yield* dbQuery(db.delete(tasks).where(eq(tasks.id, id as string)));
        return existing;
      });

      return { list, findById, create, update, remove };
    }),
  );
}
