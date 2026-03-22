import type { Task } from "@/lib/schemas"
import { TaskBoardView } from "@/components/tasks/task-board-view"
import { TaskTableView } from "@/components/tasks/task-table-view"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

type TaskViewsProps = {
  tasks: ReadonlyArray<Task>
  emptyMessage?: string
  view: TaskViewMode
  onViewChange: (view: TaskViewMode) => void
}

export type TaskViewMode = "table" | "board"

export function isTaskViewMode(value: unknown): value is TaskViewMode {
  return value === "table" || value === "board"
}

export function TaskViews({
  tasks,
  emptyMessage = "No tasks yet.",
  view,
  onViewChange,
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
        <div>
          <p className="text-sm font-medium text-foreground">Task views</p>
          <p className="text-sm text-muted-foreground">
            Switch between the table and drag-and-drop board.
          </p>
        </div>

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
