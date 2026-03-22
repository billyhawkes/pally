import { createFileRoute } from "@tanstack/react-router";
import { useAtomValue, useAtomSet } from "@effect/atom-react";
import type { Task } from "@/lib/schemas";
import { organizationsAtom } from "@/lib/atoms/organizations";
import {
  createTaskAtom,
  useTasksAtom,
} from "@/lib/atoms/tasks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TaskTableView } from "@/components/tasks/task-table-view";

export const Route = createFileRoute("/org/$orgSlug/tasks/")({
  component: TasksPage,
});

function TasksPage() {
  const { orgSlug } = Route.useParams();
  const tasks = useTasksAtom();
  const organizations = useAtomValue(organizationsAtom);
  const orgId =
    organizations._tag === "Success"
      ? (organizations.value.find((org) => org.slug === orgSlug)?.id ?? null)
      : null;
  const filteredTasks =
    tasks._tag === "Success"
      ? tasks.value.filter((task) => task.orgId === orgId)
      : null;
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Tasks</h1>

      <CreateTaskForm orgId={orgId} />

      <div className="space-y-2">
        {tasks._tag === "Initial" && (
          <p className="text-muted-foreground">Loading...</p>
        )}
        {tasks._tag === "Failure" && (
          <p className="text-destructive">Failed to load tasks</p>
        )}
        {tasks._tag === "Success" &&
          (filteredTasks?.length === 0 ? (
            <p className="text-muted-foreground">No tasks yet.</p>
          ) : (
            <TaskTableView tasks={filteredTasks ?? []} />
          ))}
      </div>
    </div>
  );
}

function CreateTaskForm({ orgId }: { orgId: Task["orgId"] }) {
  const create = useAtomSet(createTaskAtom);

  return (
    <form
      className="flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        const form = e.target as HTMLFormElement;
        const data = new FormData(form);
        const title = data.get("title") as string;
        if (!title.trim()) return;
        create({
          payload: {
            title: title.trim(),
            description: null,
            status: "todo",
            priority: "medium",
            orgId,
            projectId: null,
            teamId: null,
          },
          reactivityKeys: ["tasks"],
        });
        form.reset();
      }}
    >
      <Input name="title" placeholder="New task..." className="flex-1" />
      <Button type="submit">Add</Button>
    </form>
  );
}
