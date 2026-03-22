import { useMemo, useState } from "react"
import { useAtomSet } from "@effect/atom-react"
import { GripVertical } from "lucide-react"
import { deleteTaskAtom, updateTaskAtom } from "@/lib/atoms/tasks"
import type { Task } from "@/lib/schemas"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  CreateTaskDialog,
} from "@/components/tasks/create-task-dialog"
import {
  TaskActionsMenuContent,
  TaskActionsMenuTriggerButton,
} from "@/components/tasks/task-actions-menu"
import {
  TaskContextMenu,
  type TaskContextMenuState,
} from "@/components/tasks/task-context-menu"
import {
  formatDate,
  statusColors,
  statusLabels,
  statuses,
} from "@/components/tasks/task-view-utils"
import {
  TaskPriorityBadgeSelect,
  TaskStatusBadgeSelect,
} from "@/components/tasks/task-property-badges"

type TaskBoardViewProps = {
  tasks: ReadonlyArray<Task>
  emptyMessage?: string
}

export function TaskBoardView({
  tasks,
  emptyMessage = "No tasks yet.",
}: TaskBoardViewProps) {
  const update = useAtomSet(updateTaskAtom)
  const remove = useAtomSet(deleteTaskAtom)
  const [draggedTaskId, setDraggedTaskId] = useState<Task["id"] | null>(null)
  const [dropStatus, setDropStatus] = useState<Task["status"] | null>(null)
  const [contextMenu, setContextMenu] = useState<TaskContextMenuState | null>(null)
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  const tasksByStatus = useMemo(
    () => {
      const grouped: Record<Task["status"], Array<Task>> = {
        todo: [],
        in_progress: [],
        done: [],
      }

      const sortedTasks = [...tasks].sort(
        (left, right) => right.updatedAt.getTime() - left.updatedAt.getTime(),
      )

      for (const task of sortedTasks) {
        grouped[task.status].push(task)
      }

      return grouped
    },
    [tasks],
  )

  const moveTask = (task: Task, status: Task["status"]) => {
    if (task.status === status) {
      return
    }

    update({
      params: { id: task.id },
      payload: { status },
      reactivityKeys: ["tasks"],
    })
  }

  const draggedTask = draggedTaskId
    ? tasks.find((task) => task.id === draggedTaskId) ?? null
    : null

  const removeTask = (task: Task) => {
    remove({
      params: { id: task.id },
      reactivityKeys: ["tasks"],
    })
  }

  const changePriority = (task: Task, priority: Task["priority"]) => {
    if (task.priority === priority) {
      return
    }

    update({
      params: { id: task.id },
      payload: { priority },
      reactivityKeys: ["tasks"],
    })
  }

  if (tasks.length === 0) {
    return <p className="text-muted-foreground">{emptyMessage}</p>
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-3">
        {statuses.map((status) => {
          const columnTasks = tasksByStatus[status]

          return (
            <section
              key={status}
              className={cn(
                "rounded-2xl border bg-muted/40 p-3 transition-colors",
                dropStatus === status && "border-primary bg-primary/5",
              )}
              onDragOver={(event) => {
                event.preventDefault()
                event.dataTransfer.dropEffect = "move"
                setDropStatus(status)
              }}
              onDragLeave={() => {
                setDropStatus((current) => (current === status ? null : current))
              }}
              onDrop={(event) => {
                event.preventDefault()
                setDropStatus(null)

                if (draggedTask) {
                  moveTask(draggedTask, status)
                }

                setDraggedTaskId(null)
              }}
            >
              <div className="mb-3 flex items-center justify-between gap-3 px-1">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">{statusLabels[status]}</p>
                  <p className="text-xs text-muted-foreground">
                    {columnTasks.length} {columnTasks.length === 1 ? "task" : "tasks"}
                  </p>
                </div>
                <Badge className={statusColors[status]}>{statusLabels[status]}</Badge>
              </div>

              <div className="space-y-3">
                {columnTasks.length === 0 ? (
                  <div className="rounded-xl border border-dashed bg-background/80 px-4 py-8 text-center text-sm text-muted-foreground">
                    Drop a task here
                  </div>
                ) : (
                  columnTasks.map((task) => (
                    <Card
                      key={task.id}
                      draggable
                      className={cn(
                        "cursor-pointer border bg-background/95 shadow-sm",
                        draggedTaskId === task.id && "opacity-60",
                      )}
                      onClick={() => {
                        setEditingTask(task)
                      }}
                      onContextMenu={(event) => {
                        event.preventDefault()
                        setContextMenu({
                          task,
                          x: event.clientX,
                          y: event.clientY,
                        })
                      }}
                      onDragStart={(event) => {
                        event.dataTransfer.effectAllowed = "move"
                        event.dataTransfer.setData("text/plain", task.id)
                        setDraggedTaskId(task.id)
                      }}
                      onDragEnd={() => {
                        setDraggedTaskId(null)
                        setDropStatus(null)
                      }}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                              <GripVertical className="size-4 text-muted-foreground" />
                              <CardTitle>{task.title}</CardTitle>
                            </div>
                            {task.description ? (
                              <CardDescription className="line-clamp-3">
                                {task.description}
                              </CardDescription>
                            ) : null}
                          </div>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <div
                                onClick={(event) => {
                                  event.stopPropagation()
                                }}
                              >
                                <TaskActionsMenuTriggerButton />
                              </div>
                            </DropdownMenuTrigger>
                            <TaskActionsMenuContent
                              task={task}
                              moveTask={moveTask}
                              changePriority={changePriority}
                              removeTask={removeTask}
                              onEditTask={setEditingTask}
                            />
                          </DropdownMenu>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-3 pt-0">
                        <div className="flex flex-wrap gap-2">
                          <TaskStatusBadgeSelect
                            status={task.status}
                            onStatusChange={(status) => moveTask(task, status)}
                          />
                          <TaskPriorityBadgeSelect
                            priority={task.priority}
                            onPriorityChange={(priority) => changePriority(task, priority)}
                          />
                        </div>

                        <p className="text-xs text-muted-foreground">
                          Updated {formatDate(task.updatedAt)}
                        </p>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </section>
          )
        })}
      </div>

      <TaskContextMenu
        contextMenu={contextMenu}
        setContextMenu={setContextMenu}
        moveTask={moveTask}
        changePriority={changePriority}
        removeTask={removeTask}
        onEditTask={setEditingTask}
      />

      {editingTask ? (
        <CreateTaskDialog
          task={editingTask}
          open
          onOpenChange={(open) => {
            if (!open) {
              setEditingTask(null)
            }
          }}
        />
      ) : null}
    </>
  )
}
