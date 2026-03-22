import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAtomValue } from "@effect/atom-react";
import { organizationsAtom } from "@/lib/atoms/organizations";
import { useTasksAtom } from "@/lib/atoms/tasks";
import { CreateTaskDialog } from "@/components/tasks/create-task-dialog";
import {
  isTaskViewMode,
  TaskViews,
  type TaskViewMode,
} from "@/components/tasks/task-views";

export const Route = createFileRoute("/org/$orgSlug/tasks/")({
  validateSearch: (search: Record<string, unknown>) => ({
    tab: isTaskViewMode(search.tab) ? search.tab : "table",
  }),
  component: TasksPage,
});

function TasksPage() {
  const { orgSlug } = Route.useParams();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const tasks = useTasksAtom();
  const organizations = useAtomValue(organizationsAtom);
  const organization =
    organizations._tag === "Success"
      ? (organizations.value.find((org) => org.slug === orgSlug) ?? null)
      : null;
  const orgId =
    organization?.id ?? null;
  const filteredTasks =
    tasks._tag === "Success"
      ? tasks.value.filter((task) => task.orgId === orgId)
      : null;
  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Tasks</h1>
        <CreateTaskDialog
          orgId={orgId}
          breadcrumbs={organization ? [organization.name] : [orgSlug]}
        />
      </div>

      <div className="space-y-2">
        {tasks._tag === "Initial" && (
          <p className="text-muted-foreground">Loading...</p>
        )}
        {tasks._tag === "Failure" && (
          <p className="text-destructive">Failed to load tasks</p>
        )}
        {tasks._tag === "Success" &&
          <TaskViews
            tasks={filteredTasks ?? []}
            view={search.tab}
            onViewChange={(tab: TaskViewMode) =>
              navigate({
                search: (prev) => ({ ...prev, tab }),
                replace: true,
              })
            }
          />}
      </div>
    </div>
  );
}
