import { useMemo, useState } from "react";
import { useAtomSet } from "@effect/atom-react";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type ColumnDef,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowUpDown, Ellipsis } from "lucide-react";
import type { Project } from "@/lib/schemas";
import { deleteProjectAtom } from "@/lib/atoms/projects";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CreateProjectDialog } from "@/components/projects/create-project-dialog";
import { formatDate } from "@/components/tasks/task-view-utils";

type ProjectTableViewProps = {
  projects: ReadonlyArray<Project>;
  emptyMessage?: string;
  onOpenProject?: (project: Project) => void;
};

export function ProjectTableView({
  projects,
  emptyMessage = "No projects yet.",
  onOpenProject,
}: ProjectTableViewProps) {
  const remove = useAtomSet(deleteProjectAtom);
  const data = useMemo(() => Array.from(projects), [projects]);
  const [sorting, setSorting] = useState<SortingState>([
    { id: "updatedAt", desc: true },
  ]);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const removeProject = (project: Project) => {
    remove({
      params: { id: project.id },
      reactivityKeys: ["projects"],
    });
  };

  const columns = useMemo<ColumnDef<Project>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => (
          <Button
            type="button"
            variant="ghost"
            className="-ml-3"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Project
            <ArrowUpDown className="size-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="min-w-52 space-y-1">
            <p className="font-medium text-foreground">{row.original.name}</p>
            {row.original.description ? (
              <p className="line-clamp-2 text-sm text-muted-foreground">
                {row.original.description}
              </p>
            ) : null}
          </div>
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
                    event.stopPropagation();
                  }}
                >
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    className="-mr-1"
                  >
                    <Ellipsis className="size-4" />
                    <span className="sr-only">Open project actions</span>
                  </Button>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel>{row.original.name}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setEditingProject(row.original)}>
                  Edit project
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => removeProject(row.original)}
                >
                  Delete project
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    [],
  );

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (projects.length === 0) {
    return <p className="text-muted-foreground">{emptyMessage}</p>;
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
              className={onOpenProject ? "cursor-pointer" : undefined}
              onClick={() => {
                onOpenProject?.(row.original);
              }}
            >
              {row.getVisibleCells().map((cell) => (
                <TableCell
                  key={cell.id}
                  onClick={(event) => {
                    if (cell.column.id === "actions") {
                      event.stopPropagation();
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

      {editingProject ? (
        <CreateProjectDialog
          project={editingProject}
          open
          onOpenChange={(open) => {
            if (!open) {
              setEditingProject(null);
            }
          }}
        />
      ) : null}
    </div>
  );
}
