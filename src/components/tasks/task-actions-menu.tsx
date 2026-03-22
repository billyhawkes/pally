import { Ellipsis } from "lucide-react"
import type { Task } from "@/lib/schemas"
import { Button } from "@/components/ui/button"
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu"
import {
  priorityLabels,
  priorities,
  statusLabels,
  statuses,
} from "@/components/tasks/task-view-utils"

type TaskActionsMenuContentProps = {
  task: Task
  moveTask: (task: Task, status: Task["status"]) => void
  changePriority: (task: Task, priority: Task["priority"]) => void
  removeTask: (task: Task) => void
  onAction?: () => void
}

export function TaskActionsMenuContent({
  task,
  moveTask,
  changePriority,
  removeTask,
  onAction,
}: TaskActionsMenuContentProps) {
  return (
    <DropdownMenuContent align="end" className="w-52">
      <DropdownMenuLabel>{task.title}</DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>Change status</DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
          {statuses.map((status) => (
            <DropdownMenuItem
              key={status}
              onClick={() => {
                moveTask(task, status)
                onAction?.()
              }}
            >
              {statusLabels[status]}
            </DropdownMenuItem>
          ))}
        </DropdownMenuSubContent>
      </DropdownMenuSub>
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>Change priority</DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
          {priorities.map((priority) => (
            <DropdownMenuItem
              key={priority}
              onClick={() => {
                changePriority(task, priority)
                onAction?.()
              }}
            >
              {priorityLabels[priority]}
            </DropdownMenuItem>
          ))}
        </DropdownMenuSubContent>
      </DropdownMenuSub>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        variant="destructive"
        onClick={() => {
          removeTask(task)
          onAction?.()
        }}
      >
        Delete task
      </DropdownMenuItem>
    </DropdownMenuContent>
  )
}

export function TaskActionsMenuTriggerButton() {
  return (
    <Button type="button" variant="ghost" size="icon-xs" className="-mr-1">
      <Ellipsis className="size-4" />
      <span className="sr-only">Open task actions</span>
    </Button>
  )
}
