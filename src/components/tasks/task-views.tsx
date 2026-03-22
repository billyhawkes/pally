import type { Task, TaskFilters as TaskFiltersValue } from "@/lib/schemas"
import { TaskFilters } from "@/components/tasks/task-filters"
import { TaskBoardView } from "@/components/tasks/task-board-view"
import { TaskTableView } from "@/components/tasks/task-table-view"
import { priorities, statuses } from "@/components/tasks/task-view-utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

type TaskViewsProps = {
  tasks: ReadonlyArray<Task>
  emptyMessage?: string
  view: TaskViewMode
  filters: TaskFiltersValue
  onViewChange: (view: TaskViewMode) => void
  onFiltersChange: (filters: TaskFiltersValue) => void
}

export type TaskViewMode = "table" | "board"

export function isTaskViewMode(value: unknown): value is TaskViewMode {
  return value === "table" || value === "board"
}

export function TaskViews({
  tasks,
  emptyMessage = "No tasks yet.",
  view,
  filters,
  onViewChange,
  onFiltersChange,
}: TaskViewsProps) {
  return (
    <Tabs
      value={view}
      onValueChange={(value) => {
        if (isTaskViewMode(value)) {
          onViewChange(value)
        }
      }}
      className="space-y-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <TaskFilters
          filters={filters}
          availableStatuses={statuses}
          availablePriorities={priorities}
          resultCount={tasks.length}
          onChange={onFiltersChange}
        />

        <TabsList>
          <TabsTrigger value="table">Table</TabsTrigger>
          <TabsTrigger value="board">Board</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="table">
        <TaskTableView tasks={tasks} emptyMessage={emptyMessage} />
      </TabsContent>

      <TabsContent value="board">
        <TaskBoardView tasks={tasks} emptyMessage={emptyMessage} />
      </TabsContent>
    </Tabs>
  )
}
