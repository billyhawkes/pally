import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAtomValue } from "@effect/atom-react";
import { organizationsAtom } from "@/lib/atoms/organizations";
import { useProjectsAtom } from "@/lib/atoms/projects";
import { teamsAtom } from "@/lib/atoms/teams";
import { CreateProjectDialog } from "@/components/projects/create-project-dialog";
import { ProjectTableView } from "@/components/projects/project-table-view";

export const Route = createFileRoute("/org/$orgSlug/projects/")({
  component: ProjectsPage,
});

function ProjectsPage() {
  const { orgSlug } = Route.useParams();
  const navigate = useNavigate({ from: Route.fullPath });
  const projects = useProjectsAtom();
  const organizations = useAtomValue(organizationsAtom);
  const organization =
    organizations._tag === "Success"
      ? (organizations.value.find((org) => org.slug === orgSlug) ?? null)
      : null;
  const orgId = organization?.id ?? null;
  const teams = useAtomValue(teamsAtom(orgId));
  const teamOptions =
    teams._tag === "Success"
      ? teams.value.map((team) => ({ id: team.id, name: team.name }))
      : [];
  const teamNamesById =
    teams._tag === "Success"
      ? Object.fromEntries(teams.value.map((team) => [team.id, team.name]))
      : {};
  const filteredProjects =
    projects._tag === "Success"
      ? projects.value.filter((project) => project.orgId === orgId)
      : null;

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Projects</h1>
          <p className="text-sm text-muted-foreground">
            Track the work streams your tasks roll up into.
          </p>
        </div>
        <CreateProjectDialog
          orgId={orgId}
          breadcrumbs={organization ? [organization.name] : [orgSlug]}
        />
      </div>

      <div className="space-y-2">
        {projects._tag === "Initial" && (
          <p className="text-muted-foreground">Loading...</p>
        )}
        {projects._tag === "Failure" && (
          <p className="text-destructive">Failed to load projects</p>
        )}
        {projects._tag === "Success" && (
          <ProjectTableView
            projects={filteredProjects ?? []}
            teamNamesById={teamNamesById}
            teamOptions={teamOptions}
            onOpenProject={(project) => {
              if (project.teamId) {
                navigate({
                  to: "/org/$orgSlug/team/$teamSlug/projects/$projectId/tasks",
                  params: { orgSlug, teamSlug: project.teamId, projectId: project.id },
                  search: {
                    tab: "table",
                    status: [],
                    priority: [],
                    projectId: project.id,
                  },
                });
                return;
              }

              navigate({
                to: "/org/$orgSlug/projects/$projectId/tasks",
                params: { orgSlug, projectId: project.id },
                search: {
                  tab: "table",
                  status: [],
                  priority: [],
                  projectId: project.id,
                },
              });
            }}
          />
        )}
      </div>
    </div>
  );
}
