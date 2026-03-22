import type { Task } from "@/lib/schemas"
import { DropdownMenu, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { TaskActionsMenuContent } from "@/components/tasks/task-actions-menu"

export type TaskContextMenuState = {
  task: Task
  x: number
  y: number
}

type TaskContextMenuProps = {
  contextMenu: TaskContextMenuState | null
  setContextMenu: (value: TaskContextMenuState | null) => void
  moveTask: (task: Task, status: Task["status"]) => void
  changePriority: (task: Task, priority: Task["priority"]) => void
  removeTask: (task: Task) => void
}

export function TaskContextMenu({
  contextMenu,
  setContextMenu,
  moveTask,
  changePriority,
  removeTask,
}: TaskContextMenuProps) {
  return (
    <DropdownMenu
      open={contextMenu !== null}
      onOpenChange={(open) => {
        if (!open) {
          setContextMenu(null)
        }
      }}
    >
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-hidden="true"
          className="fixed size-0"
          style={{
            left: contextMenu?.x ?? 0,
            top: contextMenu?.y ?? 0,
          }}
        />
      </DropdownMenuTrigger>

      {contextMenu ? (
        <TaskActionsMenuContent
          task={contextMenu.task}
          moveTask={moveTask}
          changePriority={changePriority}
          removeTask={removeTask}
          onAction={() => setContextMenu(null)}
        />
      ) : null}
    </DropdownMenu>
  )
}
