import { useAtomValue } from "@effect/atom-react";
import { useMatches, useRouter } from "@tanstack/react-router";
import { AsyncResult } from "effect/unstable/reactivity";
import {
  Building2,
  ChevronRight,
  ClipboardList,
  FolderKanban,
  type LucideIcon,
  Users,
} from "lucide-react";
import type { ProjectId, TeamId } from "@/lib/schemas";
import { organizationsAtom } from "@/lib/atoms/organizations";
import { teamsAtom } from "@/lib/atoms/teams";
import { useProjectsAtom } from "@/lib/atoms/projects";
import { Badge } from "@/components/ui/badge";

type HeaderBreadcrumbsProps = {
  orgName: string;
};

export function HeaderBreadcrumbs({ orgName }: HeaderBreadcrumbsProps) {
  const router = useRouter();
  const matches = useMatches();
  const findParam = (key: "orgSlug" | "teamSlug" | "projectId") => {
    for (const match of matches) {
      const params = match.params as Partial<Record<typeof key, string>>;

      if (params[key] !== undefined) {
        return params[key];
      }
    }

    return undefined;
  };
  const currentRouteId = matches[matches.length - 1]?.routeId;
  const orgSlug = findParam("orgSlug") ?? "";
  const teamSlug = findParam("teamSlug") ?? null;
  const projectId = (findParam("projectId") as ProjectId | undefined) ?? null;
  const isOrgTasksPage = currentRouteId === "/org/$orgSlug/tasks/";
  const isTeamTasksPage =
    currentRouteId === "/org/$orgSlug/team/$teamSlug/tasks";
  const isProjectsPage =
    currentRouteId === "/org/$orgSlug/projects/" ||
    currentRouteId === "/org/$orgSlug/team/$teamSlug/projects/";
  const isProjectTasksPage =
    currentRouteId === "/org/$orgSlug/projects/$projectId/tasks" ||
    currentRouteId === "/org/$orgSlug/team/$teamSlug/projects/$projectId/tasks";
  const organizations = useAtomValue(organizationsAtom);
  const projects = useProjectsAtom();
  const organizationEntries = AsyncResult.match(organizations, {
    onInitial: () => [],
    onFailure: () => [],
    onSuccess: ({ value }) => value,
  });
  const organization =
    organizationEntries.find((org) => org.slug === orgSlug) ?? null;
  const teams = useAtomValue(teamsAtom(organization?.id ?? null));
  const teamEntries = AsyncResult.match(teams, {
    onInitial: () => [],
    onFailure: () => [],
    onSuccess: ({ value }) => value,
  });
  const team =
    teamEntries.find((entry) => entry.id === (teamSlug as TeamId)) ?? null;
  const projectEntries = AsyncResult.match(projects, {
    onInitial: () => [],
    onFailure: () => [],
    onSuccess: ({ value }) => value,
  });
  const project =
    projectEntries.find((entry) => entry.id === projectId) ?? null;

  const crumbs: Array<{
    label: string;
    icon: LucideIcon;
    current: boolean;
    onClick?: () => void;
  }> = [
    {
      label: orgName,
      icon: Building2,
      current: isOrgTasksPage,
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
            icon: Users,
            current: isTeamTasksPage,
            onClick: () =>
              router.navigate({
                to: "/org/$orgSlug/team/$teamSlug/tasks",
                params: {
                  orgSlug,
                  teamSlug,
                },
                search: {
                  tab: "table",
                  status: [],
                  priority: [],
                  projectId: null,
                },
              }),
          },
        ]
      : []),
    ...(isProjectsPage || isProjectTasksPage
      ? [
          {
            label: "Projects",
            icon: FolderKanban,
            current: isProjectsPage,
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
            icon: FolderKanban,
            current: false,
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
    ...(isOrgTasksPage || isTeamTasksPage || isProjectTasksPage
      ? [
          {
            label: "Tasks",
            icon: ClipboardList,
            current: true,
          },
        ]
      : []),
  ];

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-1.5">
      {crumbs.map((crumb, index) => (
        <div
          key={`${crumb.label}-${index}`}
          className="flex items-center gap-1.5"
        >
          {index > 0 ? (
            <ChevronRight className="size-3 text-muted-foreground/70" />
          ) : null}
          {crumb.onClick && !crumb.current ? (
            <button type="button" onClick={crumb.onClick}>
              <Badge
                variant="outline"
                className="h-6 cursor-pointer rounded-full px-2"
              >
                <crumb.icon className="size-3.5" />
                {crumb.label}
              </Badge>
            </button>
          ) : (
            <Badge
              variant={crumb.current ? "secondary" : "outline"}
              className="h-6 rounded-full px-2"
            >
              <crumb.icon className="size-3.5" />
              {crumb.label}
            </Badge>
          )}
        </div>
      ))}
    </div>
  );
}
