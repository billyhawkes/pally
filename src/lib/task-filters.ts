import { Schema } from "effect"
import type { Task } from "@/lib/schemas"
import {
  TaskFilters as TaskFiltersSchema,
  type TaskFilters,
} from "@/lib/schemas"

const decodeTaskFilters = Schema.decodeUnknownSync(TaskFiltersSchema)

export const emptyTaskFilters: TaskFilters = decodeTaskFilters({
  status: null,
  priority: null,
  projectId: null,
})

const parseStringArrayParam = (value: unknown): Array<string> | null => {
  const values = Array.isArray(value) ? value : [value]

  const parsed = values.flatMap((entry) =>
    typeof entry === "string"
      ? entry
          .split(",")
          .map((part) => part.trim())
          .filter((part) => part.length > 0)
      : [],
  )

  return parsed.length > 0 ? Array.from(new Set(parsed)) : null
}

export const taskFiltersFromSearch = (search: Record<string, unknown>): TaskFilters =>
  decodeTaskFilters({
    status: parseStringArrayParam(search.status),
    priority: parseStringArrayParam(search.priority),
    projectId: typeof search.projectId === "string" ? search.projectId : null,
  })

export const taskFilterSearchFromFilters = (filters: TaskFilters) => ({
  status: filters.status ?? [],
  priority: filters.priority ?? [],
  projectId: filters.projectId ?? null,
})

export const applyTaskFilters = (
  tasks: ReadonlyArray<Task>,
  filters: TaskFilters,
): Array<Task> =>
  tasks.filter(
    (task) =>
      (filters.status === null || filters.status.includes(task.status)) &&
      (filters.priority === null || filters.priority.includes(task.priority)) &&
      (filters.projectId === null || task.projectId === filters.projectId),
  )
