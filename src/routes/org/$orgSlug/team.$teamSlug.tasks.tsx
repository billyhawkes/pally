import { createFileRoute } from "@tanstack/react-router";
import { useAtomValue, useAtomSet } from "@effect/atom-react";
import type { Task, TeamId } from "@/lib/schemas";
import { PallyClient } from "@/lib/pally-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/org/$orgSlug/team/$teamSlug/tasks")({
  component: TeamTasksPage,
});

function TeamTasksPage() {
  const { teamSlug } = Route.useParams();
  const teamId = teamSlug as unknown as TeamId;

  const tasksAtom = PallyClient.query("tasks", "listTasks", {
    query: { teamId },
    timeToLive: "5 minutes",
    reactivityKeys: ["tasks"],
  });

  const tasks = useAtomValue(tasksAtom);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Team Tasks</h1>

      <CreateTaskForm teamId={teamId} />

      <div className="space-y-2">
        {tasks._tag === "Initial" && (
          <p className="text-muted-foreground">Loading...</p>
        )}
        {tasks._tag === "Failure" && (
          <p className="text-destructive">Failed to load tasks</p>
        )}
        {tasks._tag === "Success" &&
          (tasks.value.length === 0 ? (
            <p className="text-muted-foreground">No tasks yet.</p>
          ) : (
            tasks.value.map((task) => <TaskCard key={task.id} task={task} />)
          ))}
      </div>
    </div>
  );
}

function CreateTaskForm({ teamId }: { teamId: TeamId }) {
  const create = useAtomSet(PallyClient.mutation("tasks", "createTask"));

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
            projectId: null,
            teamId,
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

const statusColors: Record<Task["status"], string> = {
  todo: "bg-gray-100 text-gray-800",
  in_progress: "bg-blue-100 text-blue-800",
  done: "bg-green-100 text-green-800",
};

const priorityColors: Record<Task["priority"], string> = {
  low: "bg-gray-100 text-gray-600",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-orange-100 text-orange-800",
  urgent: "bg-red-100 text-red-800",
};

const statuses = ["todo", "in_progress", "done"] as const;

function TaskCard({ task }: { task: Task }) {
  const update = useAtomSet(PallyClient.mutation("tasks", "updateTask"));
  const remove = useAtomSet(PallyClient.mutation("tasks", "deleteTask"));
  const nextStatus =
    statuses[(statuses.indexOf(task.status) + 1) % statuses.length];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 py-3">
        <CardTitle className="text-base font-medium">{task.title}</CardTitle>
        <div className="flex items-center gap-2">
          <Badge
            className={`cursor-pointer ${statusColors[task.status]}`}
            onClick={() =>
              update({
                params: { id: task.id },
                payload: { status: nextStatus },
                reactivityKeys: ["tasks"],
              })
            }
          >
            {task.status}
          </Badge>
          <Badge className={priorityColors[task.priority]}>
            {task.priority}
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              remove({
                params: { id: task.id },
                reactivityKeys: ["tasks"],
              })
            }
          >
            Delete
          </Button>
        </div>
      </CardHeader>
      {task.description && (
        <CardContent className="pt-0 pb-3">
          <p className="text-sm text-muted-foreground">{task.description}</p>
        </CardContent>
      )}
    </Card>
  );
}
