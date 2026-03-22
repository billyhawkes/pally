import type { Task } from "@/lib/schemas"

export const statuses = ["todo", "in_progress", "done"] as const satisfies ReadonlyArray<Task["status"]>

export const statusLabels: Record<Task["status"], string> = {
  todo: "To do",
  in_progress: "In progress",
  done: "Done",
}

export const statusColors: Record<Task["status"], string> = {
  todo: "bg-gray-100 text-gray-800 hover:bg-gray-200",
  in_progress: "bg-blue-100 text-blue-800 hover:bg-blue-200",
  done: "bg-green-100 text-green-800 hover:bg-green-200",
}

export const priorityColors: Record<Task["priority"], string> = {
  low: "bg-gray-100 text-gray-600",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-orange-100 text-orange-800",
  urgent: "bg-red-100 text-red-800",
}

export const priorities = ["low", "medium", "high", "urgent"] as const satisfies ReadonlyArray<Task["priority"]>

export const priorityLabels: Record<Task["priority"], string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
}

export const formatDate = (value: Date) =>
  new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(value)
