import { useAtomValue } from "@effect/atom-react";
import { Schema } from "effect";
import { AsyncResult, Atom } from "effect/unstable/reactivity";
import { PallyClient } from "@/lib/pally-client";
import {
  ProjectId as ProjectIdSchema,
  type CreateProjectPayload,
  type Project,
  type ProjectId,
  type UpdateProjectPayload,
} from "@/lib/schemas";

const serverProjectsAtom = PallyClient.query("projects", "listProjects", {
  query: {},
  timeToLive: "5 minutes",
  reactivityKeys: ["projects"],
});

const makeOptimisticProjectId = (): ProjectId =>
  Schema.decodeSync(ProjectIdSchema)(`optimistic-${crypto.randomUUID()}`);

const optimisticProject = (payload: CreateProjectPayload): Project => {
  const now = new Date();

  return {
    id: makeOptimisticProjectId(),
    name: payload.name,
    description: payload.description,
    orgId: payload.orgId,
    createdAt: now,
    updatedAt: now,
  };
};

type ProjectsResult = AsyncResult.AsyncResult<ReadonlyArray<Project>, unknown>;

const currentProjects = (result: ProjectsResult): Array<Project> =>
  result._tag === "Success" ? Array.from(result.value) : [];

const updateProjectInList = (
  projects: ReadonlyArray<Project>,
  projectId: ProjectId,
  payload: UpdateProjectPayload,
): Array<Project> =>
  projects.map((project) =>
    project.id === projectId
      ? {
          ...project,
          ...payload,
          updatedAt: new Date(),
        }
      : project,
  );

export const allProjectsAtom = Atom.optimistic(serverProjectsAtom);

export const createProjectAtom = Atom.optimisticFn(allProjectsAtom, {
  reducer: (current, args) =>
    AsyncResult.success([
      optimisticProject(args.payload),
      ...currentProjects(current),
    ]),
  fn: PallyClient.mutation("projects", "createProject"),
});

export const updateProjectAtom = Atom.optimisticFn(allProjectsAtom, {
  reducer: (current, args) =>
    AsyncResult.success(
      updateProjectInList(currentProjects(current), args.params.id, args.payload),
    ),
  fn: PallyClient.mutation("projects", "updateProject"),
});

export const deleteProjectAtom = Atom.optimisticFn(allProjectsAtom, {
  reducer: (current, args) =>
    AsyncResult.success(
      currentProjects(current).filter((project) => project.id !== args.params.id),
    ),
  fn: PallyClient.mutation("projects", "deleteProject"),
});

export const useProjectsAtom = () => useAtomValue(allProjectsAtom);
