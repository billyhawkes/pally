import type { Project } from "@/lib/schemas";
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

type ProjectActionsMenuContentProps = {
  project: Project;
  onEditProject: (project: Project) => void;
  onRemoveProject: (project: Project) => void;
  onAction?: () => void;
};

export function ProjectActionsMenuContent({
  project,
  onEditProject,
  onRemoveProject,
  onAction,
}: ProjectActionsMenuContentProps) {
  return (
    <DropdownMenuContent align="end" className="w-52">
      <DropdownMenuLabel>{project.name}</DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        onClick={() => {
          onEditProject(project);
          onAction?.();
        }}
      >
        Edit project
      </DropdownMenuItem>
      <DropdownMenuItem
        variant="destructive"
        onClick={() => {
          onRemoveProject(project);
          onAction?.();
        }}
      >
        Delete project
      </DropdownMenuItem>
    </DropdownMenuContent>
  );
}
