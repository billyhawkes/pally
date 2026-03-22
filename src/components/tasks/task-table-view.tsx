import { useMemo, useState } from "react"
import { useAtomSet } from "@effect/atom-react"
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
import { deleteTaskAtom, updateTaskAtom } from "@/lib/atoms/tasks"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const statusColors: Record<Task["status"], string> = {
  todo: "bg-gray-100 text-gray-800 hover:bg-gray-200",
  in_progress: "bg-blue-100 text-blue-800 hover:bg-blue-200",
  done: "bg-green-100 text-green-800 hover:bg-green-200",
}

const priorityColors: Record<Task["priority"], string> = {
  low: "bg-gray-100 text-gray-600",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-orange-100 text-orange-800",
  urgent: "bg-red-100 text-red-800",
}

const statuses = ["todo", "in_progress", "done"] as const

const formatDate = (value: Date) =>
  new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(value)

type TaskTableViewProps = {
  tasks: ReadonlyArray<Task>
  emptyMessage?: string
}

export function TaskTableView({
  tasks,
  emptyMessage = "No tasks yet.",
}: TaskTableViewProps) {
  const update = useAtomSet(updateTaskAtom)
  const remove = useAtomSet(deleteTaskAtom)
  const data = useMemo(() => Array.from(tasks), [tasks])
  const [sorting, setSorting] = useState<SortingState>([
    { id: "updatedAt", desc: true },
  ])

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
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const nextStatus =
            statuses[
              (statuses.indexOf(row.original.status) + 1) % statuses.length
            ]

          return (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={`rounded-full px-2 py-0 ${statusColors[row.original.status]}`}
              onClick={() =>
                update({
                  params: { id: row.original.id },
                  payload: { status: nextStatus },
                  reactivityKeys: ["tasks"],
                })
              }
            >
              {row.original.status}
            </Button>
          )
        },
      },
      {
        accessorKey: "priority",
        header: "Priority",
        cell: ({ row }) => (
          <Badge className={priorityColors[row.original.priority]}>
            {row.original.priority}
          </Badge>
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
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() =>
                remove({
                  params: { id: row.original.id },
                  reactivityKeys: ["tasks"],
                })
              }
            >
              Delete
            </Button>
          </div>
        ),
      },
    ],
    [remove, update],
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
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
