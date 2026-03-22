import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Schema } from "effect";
import { useAtomSet } from "@effect/atom-react";
import { ChevronRight } from "lucide-react";
import {
  CreateProjectPayload,
  UpdateProjectPayload,
  type Project,
} from "@/lib/schemas";
import {
  createProjectAtom,
  updateProjectAtom,
} from "@/lib/atoms/projects";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const decodeCreateProjectPayload = Schema.decodeUnknownSync(CreateProjectPayload);
const decodeUpdateProjectPayload = Schema.decodeUnknownSync(UpdateProjectPayload);

const initialValues = {
  name: "",
  description: "",
};

type CreateProjectDialogProps = {
  orgId: Project["orgId"];
  breadcrumbs?: ReadonlyArray<string>;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: ReactNode;
  hideDefaultTrigger?: boolean;
  project?: never;
};

type EditProjectDialogProps = {
  project: Project;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: ReactNode;
  hideDefaultTrigger?: boolean;
  orgId?: never;
  breadcrumbs?: never;
};

type ProjectDialogProps = CreateProjectDialogProps | EditProjectDialogProps;

function getProjectDialogErrorMessage(isEditing: boolean, error: unknown) {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return isEditing
    ? "Failed to save project. Try again."
    : "Failed to create project. Try again.";
}

export function ProjectDialog({ trigger, ...props }: ProjectDialogProps) {
  const create = useAtomSet(createProjectAtom);
  const update = useAtomSet(updateProjectAtom);
  const [internalOpen, setInternalOpen] = useState(false);
  const [name, setName] = useState(initialValues.name);
  const [description, setDescription] = useState(initialValues.description);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const editingProject = "project" in props ? (props.project ?? null) : null;
  const isEditing = editingProject !== null;
  const open = props.open ?? internalOpen;
  const orgId = isEditing ? editingProject.orgId : props.orgId;

  const breadcrumbs = useMemo(
    () => (isEditing ? [] : (props.breadcrumbs?.filter(Boolean) ?? [])),
    [isEditing, props.breadcrumbs],
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    if (editingProject) {
      setName(editingProject.name);
      setDescription(editingProject.description ?? "");
      setError("");
      setIsSubmitting(false);
      return;
    }

    setName(initialValues.name);
    setDescription(initialValues.description);
    setError("");
    setIsSubmitting(false);
  }, [editingProject, open]);

  const resetForm = () => {
    setName(initialValues.name);
    setDescription(initialValues.description);
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

    if (name.trim().length === 0) {
      setError(
        isEditing
          ? "Name is required to update a project."
          : "Name is required to create a project.",
      );
      setIsSubmitting(false);
      return;
    }

    try {
      if (editingProject) {
        const payload = decodeUpdateProjectPayload({
          name: name.trim(),
          description: description.trim() || null,
          orgId,
        });

        await Promise.resolve(
          update({
            params: { id: editingProject.id },
            payload,
            reactivityKeys: ["projects"],
          }),
        );
      } else {
        const payload = decodeCreateProjectPayload({
          name: name.trim(),
          description: description.trim() || null,
          orgId,
        });

        await Promise.resolve(
          create({
            payload,
            reactivityKeys: ["projects"],
          }),
        );
      }

      handleOpenChange(false);
    } catch (error) {
      setError(getProjectDialogErrorMessage(isEditing, error));
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : !isEditing && !props.hideDefaultTrigger ? (
        <DialogTrigger asChild>
          <Button type="button">Create project</Button>
        </DialogTrigger>
      ) : null}

      <DialogContent
        showCloseButton={false}
        className="overflow-hidden border-0 bg-background/95 p-0 shadow-2xl ring-1 ring-foreground/8 supports-backdrop-filter:backdrop-blur-xl sm:max-w-2xl"
      >
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-3 bg-linear-to-b from-muted/25 to-transparent px-5 pt-5">
            {isEditing ? (
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Edit project
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
                <span className="font-medium normal-case">Create project</span>
              </div>
            )}

            <Input
              id="project-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Project name"
              autoFocus
              aria-invalid={error ? true : undefined}
              className="h-auto rounded-none border-0 bg-transparent px-0 py-0 text-xl font-semibold leading-tight shadow-none ring-0 placeholder:text-muted-foreground/70 focus-visible:border-transparent focus-visible:ring-0 md:text-2xl"
            />

            <Textarea
              id="project-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Add description..."
              className="min-h-28 w-full resize-none rounded-none border-0 bg-transparent px-0 py-0 text-sm leading-6 text-muted-foreground outline-none placeholder:text-muted-foreground/70 focus-visible:border-transparent focus-visible:ring-0 md:text-base"
            />
          </div>

          <div className="flex items-center justify-between border-t bg-muted/20 px-5 py-3">
            <div className="min-h-5 text-sm text-destructive">{error || null}</div>

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
                    : "Create project"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export { ProjectDialog as CreateProjectDialog };
