import { PallyClient } from "@/lib/pally-client";

export const allProjectsAtom = PallyClient.query("projects", "listProjects", {
  timeToLive: "5 minutes",
  reactivityKeys: ["projects"],
});

export const createProjectAtom = PallyClient.mutation(
  "projects",
  "createProject",
);
export const updateProjectAtom = PallyClient.mutation(
  "projects",
  "updateProject",
);
export const deleteProjectAtom = PallyClient.mutation(
  "projects",
  "deleteProject",
);
