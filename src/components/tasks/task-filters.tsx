import { Funnel, X } from "lucide-react"
import type {
  TaskFilters as TaskFiltersValue,
  TaskPriority,
  TaskStatus,
} from "@/lib/schemas"
import { emptyTaskFilters } from "@/lib/task-filters"
import { priorityLabels, statusLabels } from "@/components/tasks/task-view-utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type TaskFiltersProps = {
  filters: TaskFiltersValue
  availableStatuses: ReadonlyArray<TaskStatus>
  availablePriorities: ReadonlyArray<TaskPriority>
  resultCount: number
  onChange: (filters: TaskFiltersValue) => void
}

const getFilterLabel = (label: string, count: number) =>
  count > 0 ? `${label} (${count})` : `All ${label.toLowerCase()}`

export function TaskFilters({
  filters,
  availableStatuses,
  availablePriorities,
  resultCount,
  onChange,
}: TaskFiltersProps) {
  const selectedStatuses = filters.status ?? []
  const selectedPriorities = filters.priority ?? []
  const hasFilters =
    filters.status !== null || filters.priority !== null || filters.projectId !== null

  const toggleStatus = (status: TaskStatus, checked: boolean) => {
    const nextStatuses = checked
      ? Array.from(new Set([...selectedStatuses, status]))
      : selectedStatuses.filter((value) => value !== status)

    onChange({
      ...filters,
      status: nextStatuses.length > 0 ? nextStatuses : null,
    })
  }

  const togglePriority = (priority: TaskPriority, checked: boolean) => {
    const nextPriorities = checked
      ? Array.from(new Set([...selectedPriorities, priority]))
      : selectedPriorities.filter((value) => value !== priority)

    onChange({
      ...filters,
      priority: nextPriorities.length > 0 ? nextPriorities : null,
    })
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2 rounded-full"
          >
            <Funnel className="size-4" />
            {getFilterLabel("Statuses", selectedStatuses.length)}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          <DropdownMenuLabel>Filter by status</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {availableStatuses.map((status) => (
            <DropdownMenuCheckboxItem
              key={status}
              checked={selectedStatuses.includes(status)}
              onCheckedChange={(checked) => toggleStatus(status, checked === true)}
            >
              {statusLabels[status]}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" variant="outline" size="sm" className="rounded-full">
            {getFilterLabel("Priorities", selectedPriorities.length)}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          <DropdownMenuLabel>Filter by priority</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {availablePriorities.map((priority) => (
            <DropdownMenuCheckboxItem
              key={priority}
              checked={selectedPriorities.includes(priority)}
              onCheckedChange={(checked) =>
                togglePriority(priority, checked === true)
              }
            >
              {priorityLabels[priority]}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {hasFilters ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="rounded-full"
          onClick={() => onChange(emptyTaskFilters)}
        >
          <X className="size-4" />
          Clear
        </Button>
      ) : null}

      <Badge variant="outline" className="h-8 rounded-full px-3 text-xs font-medium">
        {resultCount} {resultCount === 1 ? "task" : "tasks"}
      </Badge>
    </div>
  )
}
