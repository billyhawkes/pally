import type { Project } from "@/lib/schemas";
import { DropdownMenu, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ProjectActionsMenuContent } from "@/components/projects/project-actions-menu";

export type ProjectContextMenuState = {
  project: Project;
  x: number;
  y: number;
};

type ProjectContextMenuProps = {
  contextMenu: ProjectContextMenuState | null;
  setContextMenu: (value: ProjectContextMenuState | null) => void;
  onEditProject: (project: Project) => void;
  onRemoveProject: (project: Project) => void;
};

export function ProjectContextMenu({
  contextMenu,
  setContextMenu,
  onEditProject,
  onRemoveProject,
}: ProjectContextMenuProps) {
  return (
    <DropdownMenu
      open={contextMenu !== null}
      onOpenChange={(open) => {
        if (!open) {
          setContextMenu(null);
        }
      }}
    >
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-hidden="true"
          className="fixed size-0"
          style={{
            left: contextMenu?.x ?? 0,
            top: contextMenu?.y ?? 0,
          }}
        />
      </DropdownMenuTrigger>

      {contextMenu ? (
        <ProjectActionsMenuContent
          project={contextMenu.project}
          onEditProject={onEditProject}
          onRemoveProject={onRemoveProject}
          onAction={() => setContextMenu(null)}
        />
      ) : null}
    </DropdownMenu>
  );
}
