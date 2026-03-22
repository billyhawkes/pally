import { useAtomValue } from "@effect/atom-react";
import { useParams, useRouter } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import type { OrganizationId, ProjectId, TeamId } from "@/lib/schemas";
import { organizationsAtom } from "@/lib/atoms/organizations";
import { useProjectsAtom } from "@/lib/atoms/projects";
import { PallyClient } from "@/lib/pally-client";
import { Badge } from "@/components/ui/badge";

type HeaderBreadcrumbsProps = {
  orgName: string;
};

const teamsAtom = (organizationId?: OrganizationId | null) =>
  PallyClient.query("teams", "listTeams", {
    query: { organizationId: organizationId ?? undefined },
    timeToLive: "5 minutes",
    reactivityKeys: ["teams"],
  });

export function HeaderBreadcrumbs({ orgName }: HeaderBreadcrumbsProps) {
  const params = useParams({ strict: false });
  const router = useRouter();
  const pathname = router.state.location.pathname;
  const orgSlug = params.orgSlug ?? "";
  const teamSlug = params.teamSlug ?? null;
  const projectId = (params.projectId as ProjectId | undefined) ?? null;
  const organizations = useAtomValue(organizationsAtom);
  const projects = useProjectsAtom();
  const organization =
    organizations._tag === "Success"
      ? (organizations.value.find((org) => org.slug === orgSlug) ?? null)
      : null;
  const teams = useAtomValue(teamsAtom(organization?.id ?? null));
  const team =
    teams._tag === "Success"
      ? (teams.value.find((entry) => entry.id === (teamSlug as TeamId)) ?? null)
      : null;
  const project =
    projects._tag === "Success"
      ? (projects.value.find((entry) => entry.id === projectId) ?? null)
      : null;

  const crumbs: Array<{
    label: string;
    current: boolean;
    onClick?: () => void;
  }> = [
    {
      label: orgName,
      current:
        !params.teamSlug && !pathname.includes("/projects") && !pathname.endsWith("/tasks"),
      onClick: () =>
        router.navigate({
          to: "/org/$orgSlug/tasks",
          params: { orgSlug },
          search: { tab: "table", status: [], priority: [], projectId: null },
        }),
    },
    ...(teamSlug
      ? [
          {
            label: team?.name ?? teamSlug,
            current: !pathname.includes("/projects") && pathname.endsWith("/tasks"),
            onClick: () =>
              router.navigate({
                to: "/org/$orgSlug/team/$teamSlug/tasks",
                params: {
                  orgSlug,
                  teamSlug,
                },
                search: { tab: "table", status: [], priority: [], projectId: null },
              }),
          },
        ]
      : []),
    ...(pathname.includes("/projects")
      ? [
          {
            label: "Projects",
            current: !projectId,
            onClick: () =>
              teamSlug
                ? router.navigate({
                    to: "/org/$orgSlug/team/$teamSlug/projects",
                    params: {
                      orgSlug,
                      teamSlug,
                    },
                  })
                : router.navigate({
                    to: "/org/$orgSlug/projects",
                    params: {
                      orgSlug,
                    },
                  }),
          },
        ]
      : []),
    ...(projectId
      ? [
          {
            label: project?.name ?? projectId,
            current: !pathname.endsWith("/tasks"),
            onClick: () =>
              teamSlug
                ? router.navigate({
                    to: "/org/$orgSlug/team/$teamSlug/projects/$projectId/tasks",
                    params: {
                      orgSlug,
                      teamSlug,
                      projectId,
                    },
                    search: {
                      tab: "table",
                      status: [],
                      priority: [],
                      projectId,
                    },
                  })
                : router.navigate({
                    to: "/org/$orgSlug/projects/$projectId/tasks",
                    params: {
                      orgSlug,
                      projectId,
                    },
                    search: {
                      tab: "table",
                      status: [],
                      priority: [],
                      projectId,
                    },
                  }),
          },
        ]
      : []),
    ...(pathname.endsWith("/tasks")
      ? [
          {
            label: "Tasks",
            current: true,
          },
        ]
      : []),
  ];

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-1.5">
      {crumbs.map((crumb, index) => (
        <div key={`${crumb.label}-${index}`} className="flex items-center gap-1.5">
          {index > 0 ? <ChevronRight className="size-3 text-muted-foreground/70" /> : null}
          {crumb.onClick && !crumb.current ? (
            <button type="button" onClick={crumb.onClick}>
              <Badge variant="outline" className="h-6 cursor-pointer rounded-full px-2">
                {crumb.label}
              </Badge>
            </button>
          ) : (
            <Badge
              variant={crumb.current ? "secondary" : "outline"}
              className="h-6 rounded-full px-2"
            >
              {crumb.label}
            </Badge>
          )}
        </div>
      ))}
    </div>
  );
}
