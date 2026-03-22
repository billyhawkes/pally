import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAtomValue } from "@effect/atom-react";
import { AsyncResult } from "effect/unstable/reactivity";
import { Button } from "@/components/ui/button";
import { organizationsAtom } from "@/lib/atoms/organizations";
import { useProjectsAtom } from "@/lib/atoms/projects";
import { teamsAtom } from "@/lib/atoms/teams";
import { useTasksAtom } from "@/lib/atoms/tasks";
import type { ProjectId, TaskFilters } from "@/lib/schemas";
import {
  applyTaskFilters,
  taskFilterSearchFromFilters,
  taskFiltersFromSearch,
} from "@/lib/task-filters";
import { CreateProjectDialog } from "@/components/projects/create-project-dialog";
import { CreateTaskDialog } from "@/components/tasks/create-task-dialog";
import {
  isTaskViewMode,
  TaskViews,
  type TaskViewMode,
} from "@/components/tasks/task-views";

export const Route = createFileRoute("/org/$orgSlug/projects/$projectId/tasks")({
  validateSearch: (search: Record<string, unknown>) => ({
    tab: isTaskViewMode(search.tab) ? search.tab : "table",
    ...taskFilterSearchFromFilters(taskFiltersFromSearch(search)),
  }),
  component: ProjectTasksPage,
});

function ProjectTasksPage() {
  const { orgSlug, projectId } = Route.useParams();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const organizations = useAtomValue(organizationsAtom);
  const projects = useProjectsAtom();
  const tasks = useTasksAtom();
  const organizationEntries = AsyncResult.match(organizations, {
    onInitial: () => [],
    onFailure: () => [],
    onSuccess: ({ value }) => value,
  });
  const organization = organizationEntries.find((org) => org.slug === orgSlug) ?? null;
  const orgId = organization?.id ?? null;
  const teams = useAtomValue(teamsAtom(orgId));
  const projectEntries = AsyncResult.match(projects, {
    onInitial: () => [],
    onFailure: () => [],
    onSuccess: ({ value }) => value,
  });
  const project =
    projectEntries.find((entry) => entry.id === projectId && entry.orgId === orgId) ?? null;
  const teamEntries = AsyncResult.match(teams, {
    onInitial: () => [],
    onFailure: () => [],
    onSuccess: ({ value }) => value,
  });
  const teamName = project?.teamId
    ? (teamEntries.find((team) => team.id === project.teamId)?.name ?? null)
    : null;
  const filters = taskFiltersFromSearch(search);
  const tasksContent = AsyncResult.match(tasks, {
    onInitial: () => <p className="text-muted-foreground">Loading...</p>,
    onFailure: () => <p className="text-destructive">Failed to load tasks</p>,
    onSuccess: ({ value }) => (
      <TaskViews
        tasks={applyTaskFilters(
          value.filter(
            (task) =>
              task.orgId === orgId &&
              task.projectId === (projectId as unknown as ProjectId),
          ),
          filters,
        )}
        view={search.tab}
        filters={filters}
        onViewChange={(tab: TaskViewMode) => updateSearchFilters({ tab })}
        onFiltersChange={(nextFilters) =>
          updateSearchFilters({
            filters: {
              ...nextFilters,
              projectId: projectId as unknown as ProjectId,
            },
          })
        }
      />
    ),
  });

  const updateSearchFilters = (next: {
    tab?: TaskViewMode;
    filters?: TaskFilters;
  }) =>
    navigate({
      search: (prev) => ({
        ...prev,
        ...(next.tab === undefined ? {} : { tab: next.tab }),
        ...taskFilterSearchFromFilters(next.filters ?? taskFiltersFromSearch(prev)),
      }),
      replace: true,
    });

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">{project?.name ?? "Project Tasks"}</h1>
          <p className="text-sm text-muted-foreground">
            {teamName ? `${teamName} tasks assigned to this project.` : "Tasks assigned to this project."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {project ? (
            <CreateProjectDialog
              project={project}
              trigger={
                <Button type="button" variant="outline">
                  Edit project
                </Button>
              }
            />
          ) : null}
          <CreateTaskDialog
            orgId={orgId}
            teamId={project?.teamId ?? undefined}
            projectId={projectId as unknown as ProjectId}
            breadcrumbs={
              organization
                ? [organization.name, ...(teamName ? [teamName] : []), project?.name ?? "Project"]
                : [orgSlug, ...(teamName ? [teamName] : []), project?.name ?? projectId]
            }
          />
        </div>
      </div>

      <div className="space-y-2">
        {tasksContent}
      </div>
    </div>
  );
}
