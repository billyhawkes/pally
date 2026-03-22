import { useMemo, useState } from "react"
import { useAtomSet } from "@effect/atom-react"
import { AsyncResult } from "effect/unstable/reactivity"
import { Link, useRouter } from "@tanstack/react-router"
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type ColumnDef,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"
import type { Task } from "@/lib/schemas"
import { useProjectsAtom } from "@/lib/atoms/projects"
import { deleteTaskAtom, updateTaskAtom } from "@/lib/atoms/tasks"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
} from "@/components/tasks/task-view-utils"
import {
  TaskPriorityBadgeSelect,
  TaskStatusBadgeSelect,
} from "@/components/tasks/task-property-badges"

type TaskTableViewProps = {
  tasks: ReadonlyArray<Task>
  emptyMessage?: string
}

export function TaskTableView({
  tasks,
  emptyMessage = "No tasks yet.",
}: TaskTableViewProps) {
  const router = useRouter()
  const pathSegments = router.state.location.pathname.split("/").filter(Boolean)
  const orgSlug = pathSegments[0] === "org" ? (pathSegments[1] ?? null) : null
  const update = useAtomSet(updateTaskAtom)
  const remove = useAtomSet(deleteTaskAtom)
  const projects = useProjectsAtom()
  const data = useMemo(() => Array.from(tasks), [tasks])
  const [sorting, setSorting] = useState<SortingState>([
    { id: "updatedAt", desc: true },
  ])
  const [contextMenu, setContextMenu] = useState<TaskContextMenuState | null>(null)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const projectNames = useMemo(
    () =>
      AsyncResult.match(projects, {
        onInitial: () => new Map(),
        onFailure: () => new Map(),
        onSuccess: ({ value }) => new Map(value.map((project) => [project.id, project.name])),
      }),
    [projects],
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

  const columns = useMemo<ColumnDef<Task>[]>(
    () => [
      {
        accessorKey: "title",
        header: ({ column }) => (
          <Button
            type="button"
            variant="ghost"
            className="-ml-3"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Task
            <ArrowUpDown className="size-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="min-w-52 space-y-1">
            <p className="font-medium text-foreground">{row.original.title}</p>
            {row.original.description ? (
              <p className="line-clamp-2 text-sm text-muted-foreground">
                {row.original.description}
              </p>
            ) : null}
          </div>
        ),
      },
      {
        id: "project",
        header: "Project",
        enableSorting: false,
        cell: ({ row }) => {
          const projectId = row.original.projectId
          const projectName = projectId
            ? (projectNames.get(projectId) ?? "Unknown project")
            : null

          return (
            projectId && orgSlug ? (
              <Link
                to={
                  row.original.teamId
                    ? "/org/$orgSlug/team/$teamSlug/projects/$projectId/tasks"
                    : "/org/$orgSlug/projects/$projectId/tasks"
                }
                params={
                  row.original.teamId
                    ? {
                        orgSlug,
                        teamSlug: row.original.teamId,
                        projectId,
                      }
                    : {
                        orgSlug,
                        projectId,
                      }
                }
                search={{
                  tab: "table",
                  status: [],
                  priority: [],
                  projectId,
                }}
                className="text-sm text-foreground underline decoration-dotted underline-offset-4 hover:text-primary"
                onClick={(event) => {
                  event.stopPropagation()
                }}
              >
                {projectName}
              </Link>
            ) : (
              <span className="text-sm text-muted-foreground">
                {projectName ?? "Unassigned"}
              </span>
            )
          )
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <TaskStatusBadgeSelect
            status={row.original.status}
            onStatusChange={(status) => moveTask(row.original, status)}
          />
        ),
      },
      {
        accessorKey: "priority",
        header: "Priority",
        cell: ({ row }) => (
          <TaskPriorityBadgeSelect
            priority={row.original.priority}
            onPriorityChange={(priority) => changePriority(row.original, priority)}
          />
        ),
      },
      {
        accessorKey: "updatedAt",
        header: ({ column }) => (
          <Button
            type="button"
            variant="ghost"
            className="-ml-3"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Updated
            <ArrowUpDown className="size-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {formatDate(row.original.updatedAt)}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex justify-end">
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
                task={row.original}
                moveTask={moveTask}
                changePriority={changePriority}
                removeTask={removeTask}
                onEditTask={setEditingTask}
              />
            </DropdownMenu>
          </div>
        ),
      },
    ],
    [changePriority, moveTask, projectNames, removeTask],
  )

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  if (tasks.length === 0) {
    return <p className="text-muted-foreground">{emptyMessage}</p>
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow
              key={row.id}
              className="cursor-pointer"
              onClick={() => {
                setEditingTask(row.original)
              }}
              onContextMenu={(event) => {
                event.preventDefault()
                setContextMenu({
                  task: row.original,
                  x: event.clientX,
                  y: event.clientY,
                })
              }}
            >
              {row.getVisibleCells().map((cell) => (
                <TableCell
                  key={cell.id}
                  onClick={(event) => {
                    if (cell.column.id === "actions") {
                      event.stopPropagation()
                    }
                  }}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>

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
    </div>
  )
}
