import { PallyClient } from "@/lib/pally-client";

export const allTasksAtom = PallyClient.query("tasks", "listTasks", {
  query: {},
  timeToLive: "5 minutes",
  reactivityKeys: ["tasks"],
});

export const createTaskAtom = PallyClient.mutation("tasks", "createTask");
export const updateTaskAtom = PallyClient.mutation("tasks", "updateTask");
export const deleteTaskAtom = PallyClient.mutation("tasks", "deleteTask");
