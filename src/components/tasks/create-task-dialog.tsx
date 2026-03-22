import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Schema } from "effect";
import { useAtomSet } from "@effect/atom-react";
import { ChevronRight } from "lucide-react";
import {
  CreateTaskPayload,
  UpdateTaskPayload,
  type Task,
  type TeamId,
} from "@/lib/schemas";
import { createTaskAtom, updateTaskAtom } from "@/lib/atoms/tasks";
import {
  TaskPriorityBadgeSelect,
  TaskStatusBadgeSelect,
} from "@/components/tasks/task-property-badges";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const decodeCreateTaskPayload = Schema.decodeUnknownSync(CreateTaskPayload);
const decodeUpdateTaskPayload = Schema.decodeUnknownSync(UpdateTaskPayload);

const initialValues = {
  title: "",
  description: "",
  status: "todo" as const,
  priority: "medium" as const,
};

type CreateTaskDialogProps = {
  orgId: Task["orgId"];
  teamId?: TeamId | null;
  breadcrumbs?: ReadonlyArray<string>;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: ReactNode;
  task?: never;
};

type EditTaskDialogProps = {
  task: Task;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: ReactNode;
  orgId?: never;
  teamId?: never;
  breadcrumbs?: never;
};

type TaskDialogProps = CreateTaskDialogProps | EditTaskDialogProps;

function getTaskDialogErrorMessage(isEditing: boolean, error: unknown) {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return isEditing
    ? "Failed to save task. Try again."
    : "Failed to create task. Try again.";
}

export function TaskDialog({ trigger, ...props }: TaskDialogProps) {
  const create = useAtomSet(createTaskAtom);
  const update = useAtomSet(updateTaskAtom);
  const [internalOpen, setInternalOpen] = useState(false);
  const [title, setTitle] = useState(initialValues.title);
  const [description, setDescription] = useState(initialValues.description);
  const [status, setStatus] = useState<CreateTaskPayload["status"]>(
    initialValues.status,
  );
  const [priority, setPriority] = useState<CreateTaskPayload["priority"]>(
    initialValues.priority,
  );
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const editingTask = "task" in props ? (props.task ?? null) : null;
  const isEditing = editingTask !== null;
  const open = props.open ?? internalOpen;
  const orgId = isEditing ? editingTask.orgId : props.orgId;
  const teamId = isEditing ? editingTask.teamId : (props.teamId ?? null);
  const projectId = isEditing ? editingTask.projectId : null;

  const breadcrumbs = useMemo(
    () => (isEditing ? [] : (props.breadcrumbs?.filter(Boolean) ?? [])),
    [isEditing, props.breadcrumbs],
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    if (editingTask) {
      setTitle(editingTask.title);
      setDescription(editingTask.description ?? "");
      setStatus(editingTask.status);
      setPriority(editingTask.priority);
      setError("");
      setIsSubmitting(false);
      return;
    }

    setTitle(initialValues.title);
    setDescription(initialValues.description);
    setStatus(initialValues.status);
    setPriority(initialValues.priority);
    setError("");
    setIsSubmitting(false);
  }, [editingTask, open]);

  const resetForm = () => {
    setTitle(initialValues.title);
    setDescription(initialValues.description);
    setStatus(initialValues.status);
    setPriority(initialValues.priority);
    setError("");
    setIsSubmitting(false);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (props.open === undefined) {
      setInternalOpen(nextOpen);
    }

    props.onOpenChange?.(nextOpen);

    if (!nextOpen && !isEditing) {
      resetForm();
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    if (title.trim().length === 0) {
      setError(
        isEditing
          ? "Title is required to update a task."
          : "Title is required to create a task.",
      );
      setIsSubmitting(false);
      return;
    }

    try {
      if (editingTask) {
        const payload = decodeUpdateTaskPayload({
          title: title.trim(),
          description: description.trim() || null,
          status,
          priority,
          orgId,
          projectId,
          teamId,
        });

        await Promise.resolve(
          update({
            params: { id: editingTask.id },
            payload,
            reactivityKeys: ["tasks"],
          }),
        );
      } else {
        const payload = decodeCreateTaskPayload({
          title: title.trim(),
          description: description.trim() || null,
          status,
          priority,
          orgId,
          projectId,
          teamId,
        });

        await Promise.resolve(
          create({
            payload,
            reactivityKeys: ["tasks"],
          }),
        );
      }

      handleOpenChange(false);
    } catch (error) {
      setError(getTaskDialogErrorMessage(isEditing, error));
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : !isEditing ? (
        <DialogTrigger asChild>
          <Button type="button">Create task</Button>
        </DialogTrigger>
      ) : null}

      <DialogContent
        showCloseButton={false}
        className="overflow-hidden border-0 bg-background/95 p-0 shadow-2xl ring-1 ring-foreground/8 supports-backdrop-filter:backdrop-blur-xl sm:max-w-2xl"
      >
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-3 bg-linear-to-b from-muted/25 to-transparent px-5 pt-5">
            {isEditing ? (
              <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
                Edit task
              </p>
            ) : (
              <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                {breadcrumbs.map((crumb, index) => (
                  <div
                    key={`${crumb}-${index}`}
                    className="flex items-center gap-1.5"
                  >
                    {index > 0 ? <ChevronRight className="size-3.5" /> : null}
                    <Badge
                      variant="outline"
                      className="h-6 rounded-full px-2 normal-case"
                    >
                      {crumb}
                    </Badge>
                  </div>
                ))}
                {breadcrumbs.length > 0 ? (
                  <ChevronRight className="size-3.5" />
                ) : null}
                <span className="font-medium normal-case">Create task</span>
              </div>
            )}

            <Input
              id="task-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Task title"
              autoFocus
              aria-invalid={error ? true : undefined}
              className="h-auto border-0 bg-transparent px-0 py-0 text-xl leading-tight font-semibold shadow-none ring-0 placeholder:text-muted-foreground/70 focus-visible:border-transparent focus-visible:ring-0 md:text-2xl rounded-none"
            />

            <Textarea
              id="task-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Add description..."
              className="min-h-28 w-full resize-none border-0 bg-transparent px-0 py-0 text-sm leading-6 text-muted-foreground outline-none placeholder:text-muted-foreground/70 md:text-base focus-visible:border-transparent focus-visible:ring-0 rounded-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 px-5">
            <TaskStatusBadgeSelect status={status} onStatusChange={setStatus} />
            <TaskPriorityBadgeSelect
              priority={priority}
              onPriorityChange={setPriority}
            />
          </div>

          <div className="flex items-center justify-between border-t bg-muted/20 px-5 py-3">
            <div className="min-h-5 text-sm text-destructive">
              {error ? error : null}
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => handleOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? isEditing
                    ? "Saving..."
                    : "Creating..."
                  : isEditing
                    ? "Save changes"
                    : "Create task"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export { TaskDialog as CreateTaskDialog };
