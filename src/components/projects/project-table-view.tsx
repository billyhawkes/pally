import { useMemo, useRef, useState } from "react";
import { useAtomSet } from "@effect/atom-react";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type ColumnDef,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowUpDown, Ellipsis, Github } from "lucide-react";
import type { Project, TeamId } from "@/lib/schemas";
import { ProjectActionsMenuContent } from "@/components/projects/project-actions-menu";
import {
  ProjectContextMenu,
  type ProjectContextMenuState,
} from "@/components/projects/project-context-menu";
import { deleteProjectAtom, updateProjectAtom } from "@/lib/atoms/projects";
import { TeamBadgeSelect } from "@/components/projects/project-team-badge-select";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
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
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/components/tasks/task-view-utils";

type ProjectTableViewProps = {
  projects: ReadonlyArray<Project>;
  emptyMessage?: string;
  onOpenProject?: (project: Project) => void;
  teamNamesById?: Readonly<Record<string, string>>;
  teamOptions?: ReadonlyArray<{ id: string; name: string }>;
};

export function ProjectTableView({
  projects,
  emptyMessage = "No projects yet.",
  onOpenProject,
  teamNamesById = {},
  teamOptions = [],
}: ProjectTableViewProps) {
  const remove = useAtomSet(deleteProjectAtom);
  const update = useAtomSet(updateProjectAtom);
  const data = useMemo(() => Array.from(projects), [projects]);
  const [sorting, setSorting] = useState<SortingState>([
    { id: "updatedAt", desc: true },
  ]);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [contextMenu, setContextMenu] = useState<ProjectContextMenuState | null>(null);
  const suppressOpenProjectRef = useRef(false);

  const removeProject = (project: Project) => {
    remove({
      params: { id: project.id },
      reactivityKeys: ["projects"],
    });
  };

  const updateProjectTeam = (project: Project, teamId: TeamId | null) => {
    update({
      params: { id: project.id },
      payload: { teamId },
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
        accessorKey: "teamId",
        header: ({ column }) => (
          <Button
            type="button"
            variant="ghost"
            className="-ml-3"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Team
            <ArrowUpDown className="size-4" />
          </Button>
        ),
        sortingFn: (left, right) => {
          const leftLabel = left.original.teamId
            ? (teamNamesById[left.original.teamId] ?? left.original.teamId)
            : "";
          const rightLabel = right.original.teamId
            ? (teamNamesById[right.original.teamId] ?? right.original.teamId)
            : "";

          return leftLabel.localeCompare(rightLabel);
        },
        cell: ({ row }) => {
          return (
            <TeamBadgeSelect
              value={row.original.teamId}
              teamNamesById={teamNamesById}
              teamOptions={teamOptions}
              onValueChange={(teamId) => updateProjectTeam(row.original, teamId)}
              onTriggerClick={(event) => {
                event.stopPropagation();
              }}
            />
          );
        },
      },
      {
        accessorKey: "githubRepositoryFullName",
        header: ({ column }) => (
          <Button
            type="button"
            variant="ghost"
            className="-ml-3"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Repository
            <ArrowUpDown className="size-4" />
          </Button>
        ),
        cell: ({ row }) => {
          const repository = row.original.githubRepositoryFullName;

          if (!repository) {
            return <span className="text-sm text-muted-foreground">-</span>;
          }

          return (
            <Badge asChild variant="outline" className="h-6 rounded-full px-2">
              <a
                href={`https://github.com/${repository}`}
                target="_blank"
                rel="noreferrer"
                onClick={(event) => {
                  event.stopPropagation();
                }}
              >
                <Github className="size-3.5" />
                {repository}
              </a>
            </Badge>
          );
        },
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
              <ProjectActionsMenuContent
                project={row.original}
                onEditProject={setEditingProject}
                onRemoveProject={removeProject}
              />
            </DropdownMenu>
          </div>
        ),
      },
    ],
    [teamNamesById, teamOptions],
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
              onClick={(event) => {
                if (event.ctrlKey || suppressOpenProjectRef.current) {
                  suppressOpenProjectRef.current = false;
                  return;
                }

                onOpenProject?.(row.original);
              }}
              onContextMenu={(event) => {
                event.preventDefault();
                suppressOpenProjectRef.current = true;
                setContextMenu({
                  project: row.original,
                  x: event.clientX,
                  y: event.clientY,
                });
              }}
            >
              {row.getVisibleCells().map((cell) => (
                <TableCell
                  key={cell.id}
                  onClick={(event) => {
                    if (cell.column.id === "actions" || cell.column.id === "teamId") {
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

      <ProjectContextMenu
        contextMenu={contextMenu}
        setContextMenu={setContextMenu}
        onEditProject={setEditingProject}
        onRemoveProject={removeProject}
      />

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
