import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAtomValue } from "@effect/atom-react";
import { AsyncResult } from "effect/unstable/reactivity";
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
  const organizationEntries = AsyncResult.match(organizations, {
    onInitial: () => [],
    onFailure: () => [],
    onSuccess: ({ value }) => value,
  });
  const organization = organizationEntries.find((org) => org.slug === orgSlug) ?? null;
  const orgId = organization?.id ?? null;
  const teams = useAtomValue(teamsAtom(orgId));
  const teamId = teamSlug as TeamId;
  const teamEntries = AsyncResult.match(teams, {
    onInitial: () => [],
    onFailure: () => [],
    onSuccess: ({ value }) => value,
  });
  const teamName = teamEntries.find((team) => team.id === teamId)?.name ?? teamSlug;
  const teamNamesById = Object.fromEntries(teamEntries.map((team) => [team.id, team.name]));
  const teamOptions = teamEntries.map((team) => ({ id: team.id, name: team.name }));
  const projectsContent = AsyncResult.match(projects, {
    onInitial: () => <p className="text-muted-foreground">Loading...</p>,
    onFailure: () => <p className="text-destructive">Failed to load projects</p>,
    onSuccess: ({ value }) => (
      <ProjectTableView
        projects={value.filter((project) => project.orgId === orgId && project.teamId === teamId)}
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
    ),
  });

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
        {projectsContent}
      </div>
    </div>
  );
}
