import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAtomValue } from "@effect/atom-react";
import { organizationsAtom } from "@/lib/atoms/organizations";
import { useProjectsAtom } from "@/lib/atoms/projects";
import { teamsAtom } from "@/lib/atoms/teams";
import { CreateProjectDialog } from "@/components/projects/create-project-dialog";
import { ProjectTableView } from "@/components/projects/project-table-view";
import type { TeamId } from "@/lib/schemas";

export const Route = createFileRoute("/org/$orgSlug/team/$teamSlug/projects/")({
  component: TeamProjectsPage,
});

function TeamProjectsPage() {
  const { orgSlug, teamSlug } = Route.useParams();
  const navigate = useNavigate({ from: Route.fullPath });
  const organizations = useAtomValue(organizationsAtom);
  const projects = useProjectsAtom();
  const organization =
    organizations._tag === "Success"
      ? (organizations.value.find((org) => org.slug === orgSlug) ?? null)
      : null;
  const orgId = organization?.id ?? null;
  const teams = useAtomValue(teamsAtom(orgId));
  const teamId = teamSlug as TeamId;
  const teamName =
    teams._tag === "Success"
      ? (teams.value.find((team) => team.id === teamId)?.name ?? teamSlug)
      : teamSlug;
  const teamNamesById =
    teams._tag === "Success"
      ? Object.fromEntries(teams.value.map((team) => [team.id, team.name]))
      : {};
  const teamOptions =
    teams._tag === "Success"
      ? teams.value.map((team) => ({ id: team.id, name: team.name }))
      : [];
  const filteredProjects =
    projects._tag === "Success"
      ? projects.value.filter(
          (project) => project.orgId === orgId && project.teamId === teamId,
        )
      : null;

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Team Projects</h1>
          <p className="text-sm text-muted-foreground">
            Browse projects in the context of {teamName}.
          </p>
        </div>
        <CreateProjectDialog
          orgId={orgId}
          teamId={teamId}
          breadcrumbs={organization ? [organization.name, teamName] : [orgSlug, teamName]}
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
            onOpenProject={(project) =>
              navigate({
                to: "/org/$orgSlug/team/$teamSlug/projects/$projectId/tasks",
                params: { orgSlug, teamSlug, projectId: project.id },
                search: {
                  tab: "table",
                  status: [],
                  priority: [],
                  projectId: project.id,
                },
              })
            }
          />
        )}
      </div>
    </div>
  );
}
