import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAtomValue } from "@effect/atom-react";
import { Button } from "@/components/ui/button";
import type { OrganizationId, ProjectId, TaskFilters, TeamId } from "@/lib/schemas";
import { organizationsAtom } from "@/lib/atoms/organizations";
import { useProjectsAtom } from "@/lib/atoms/projects";
import { useTasksAtom } from "@/lib/atoms/tasks";
import { PallyClient } from "@/lib/pally-client";
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

export const Route = createFileRoute(
  "/org/$orgSlug/team/$teamSlug/projects/$projectId/tasks",
)({
  validateSearch: (search: Record<string, unknown>) => ({
    tab: isTaskViewMode(search.tab) ? search.tab : "table",
    ...taskFilterSearchFromFilters(taskFiltersFromSearch(search)),
  }),
  component: TeamProjectTasksPage,
});

const teamsAtom = (organizationId?: OrganizationId | null) =>
  PallyClient.query("teams", "listTeams", {
    query: { organizationId: organizationId ?? undefined },
    timeToLive: "5 minutes",
    reactivityKeys: ["teams"],
  });

function TeamProjectTasksPage() {
  const { orgSlug, teamSlug, projectId } = Route.useParams();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const organizations = useAtomValue(organizationsAtom);
  const projects = useProjectsAtom();
  const tasks = useTasksAtom();
  const organization =
    organizations._tag === "Success"
      ? (organizations.value.find((org) => org.slug === orgSlug) ?? null)
      : null;
  const orgId = organization?.id ?? null;
  const teamId = teamSlug as unknown as TeamId;
  const teams = useAtomValue(teamsAtom(orgId));
  const teamName =
    teams._tag === "Success"
      ? (teams.value.find((team) => team.id === teamId)?.name ?? teamSlug)
      : teamSlug;
  const project =
    projects._tag === "Success"
      ? (projects.value.find((entry) => entry.id === projectId) ?? null)
      : null;
  const filters = taskFiltersFromSearch(search);
  const filteredTasks =
    tasks._tag === "Success"
      ? applyTaskFilters(
          tasks.value.filter(
            (task) =>
              task.orgId === orgId &&
              task.teamId === teamId &&
              task.projectId === (projectId as unknown as ProjectId),
          ),
          filters,
        )
      : null;

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
            {teamName} tasks assigned to this project.
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
            teamId={teamId}
            projectId={projectId as unknown as ProjectId}
            breadcrumbs={
              organization
                ? [organization.name, teamName, project?.name ?? "Project"]
                : [orgSlug, teamName, project?.name ?? projectId]
            }
          />
        </div>
      </div>

      <div className="space-y-2">
        {tasks._tag === "Initial" && (
          <p className="text-muted-foreground">Loading...</p>
        )}
        {tasks._tag === "Failure" && (
          <p className="text-destructive">Failed to load tasks</p>
        )}
        {tasks._tag === "Success" && (
          <TaskViews
            tasks={filteredTasks ?? []}
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
        )}
      </div>
    </div>
  );
}
