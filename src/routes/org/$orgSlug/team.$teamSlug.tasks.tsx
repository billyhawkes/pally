import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAtomValue } from "@effect/atom-react";
import { AsyncResult } from "effect/unstable/reactivity";
import type { TaskFilters, TeamId } from "@/lib/schemas";
import { organizationsAtom } from "@/lib/atoms/organizations";
import { teamsAtom } from "@/lib/atoms/teams";
import { useTasksAtom } from "@/lib/atoms/tasks";
import {
  applyTaskFilters,
  taskFiltersFromSearch,
  taskFilterSearchFromFilters,
} from "@/lib/task-filters";
import { CreateTaskDialog } from "@/components/tasks/create-task-dialog";
import {
  isTaskViewMode,
  TaskViews,
  type TaskViewMode,
} from "@/components/tasks/task-views";

export const Route = createFileRoute("/org/$orgSlug/team/$teamSlug/tasks")({
  validateSearch: (search: Record<string, unknown>) => ({
    tab: isTaskViewMode(search.tab) ? search.tab : "table",
    ...taskFilterSearchFromFilters(taskFiltersFromSearch(search)),
  }),
  component: TeamTasksPage,
});

function TeamTasksPage() {
  const { orgSlug, teamSlug } = Route.useParams();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const organizations = useAtomValue(organizationsAtom);
  const organizationEntries = AsyncResult.match(organizations, {
    onInitial: () => [],
    onFailure: () => [],
    onSuccess: ({ value }) => value,
  });
  const organization = organizationEntries.find((org) => org.slug === orgSlug) ?? null;
  const orgId = organization?.id ?? null;
  const teamId = teamSlug as unknown as TeamId;
  const teams = useAtomValue(teamsAtom(orgId));
  const teamEntries = AsyncResult.match(teams, {
    onInitial: () => [],
    onFailure: () => [],
    onSuccess: ({ value }) => value,
  });
  const teamName = teamEntries.find((team) => team.id === teamId)?.name ?? teamSlug;
  const tasks = useTasksAtom();
  const filters = taskFiltersFromSearch(search);
  const tasksContent = AsyncResult.match(tasks, {
    onInitial: () => <p className="text-muted-foreground">Loading...</p>,
    onFailure: () => <p className="text-destructive">Failed to load tasks</p>,
    onSuccess: ({ value }) => (
      <TaskViews
        tasks={applyTaskFilters(
          value.filter((task) => task.orgId === orgId && task.teamId === teamId),
          filters,
        )}
        view={search.tab}
        filters={filters}
        onViewChange={(tab: TaskViewMode) => updateSearchFilters({ tab })}
        onFiltersChange={(nextFilters) =>
          updateSearchFilters({ filters: nextFilters })
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
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{teamName} Tasks</h1>
        <CreateTaskDialog
          orgId={orgId}
          teamId={teamId}
          breadcrumbs={organization ? [organization.name, teamName] : [orgSlug, teamName]}
        />
      </div>

      <div className="space-y-2">
        {tasksContent}
      </div>
    </div>
  );
}
