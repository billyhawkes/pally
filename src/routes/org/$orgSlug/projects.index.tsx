import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAtomValue } from "@effect/atom-react";
import { AsyncResult } from "effect/unstable/reactivity";
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
  const organizationEntries = AsyncResult.match(organizations, {
    onInitial: () => [],
    onFailure: () => [],
    onSuccess: ({ value }) => value,
  });
  const organization = organizationEntries.find((org) => org.slug === orgSlug) ?? null;
  const orgId = organization?.id ?? null;
  const teams = useAtomValue(teamsAtom(orgId));
  const teamEntries = AsyncResult.match(teams, {
    onInitial: () => [],
    onFailure: () => [],
    onSuccess: ({ value }) => value,
  });
  const teamOptions = teamEntries.map((team) => ({ id: team.id, name: team.name }));
  const teamNamesById = Object.fromEntries(teamEntries.map((team) => [team.id, team.name]));
  const projectsContent = AsyncResult.match(projects, {
    onInitial: () => <p className="text-muted-foreground">Loading...</p>,
    onFailure: () => <p className="text-destructive">Failed to load projects</p>,
    onSuccess: ({ value }) => (
      <ProjectTableView
        projects={value.filter((project) => project.orgId === orgId)}
        teamNamesById={teamNamesById}
        teamOptions={teamOptions}
        onOpenProject={(project) => {
          if (project.teamId) {
            navigate({
              to: "/org/$orgSlug/team/$teamSlug/projects/$projectId/tasks",
              params: {
                orgSlug,
                teamSlug: project.teamId,
                projectId: project.id,
              },
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
    ),
  });

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
        {projectsContent}
      </div>
    </div>
  );
}
