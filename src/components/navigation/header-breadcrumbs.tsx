import { useAtomValue } from "@effect/atom-react";
import { useRouter } from "@tanstack/react-router";
import { AsyncResult } from "effect/unstable/reactivity";
import { ChevronRight } from "lucide-react";
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
  const pathname = router.state.location.pathname;
  const pathSegments = pathname.split("/").filter(Boolean);
  const orgSlug = pathSegments[0] === "org" ? (pathSegments[1] ?? "") : "";
  const teamSlug = pathSegments[2] === "team" ? (pathSegments[3] ?? null) : null;
  const projectSegmentIndex = pathSegments.indexOf("projects");
  const projectId =
    projectSegmentIndex >= 0
      ? ((pathSegments[projectSegmentIndex + 1] as ProjectId | undefined) ?? null)
      : null;
  const organizations = useAtomValue(organizationsAtom);
  const projects = useProjectsAtom();
  const organizationEntries = AsyncResult.match(organizations, {
    onInitial: () => [],
    onFailure: () => [],
    onSuccess: ({ value }) => value,
  });
  const organization = organizationEntries.find((org) => org.slug === orgSlug) ?? null;
  const teams = useAtomValue(teamsAtom(organization?.id ?? null));
  const teamEntries = AsyncResult.match(teams, {
    onInitial: () => [],
    onFailure: () => [],
    onSuccess: ({ value }) => value,
  });
  const team = teamEntries.find((entry) => entry.id === (teamSlug as TeamId)) ?? null;
  const projectEntries = AsyncResult.match(projects, {
    onInitial: () => [],
    onFailure: () => [],
    onSuccess: ({ value }) => value,
  });
  const project = projectEntries.find((entry) => entry.id === projectId) ?? null;

  const crumbs: Array<{
    label: string;
    current: boolean;
    onClick?: () => void;
  }> = [
    {
      label: orgName,
      current:
        !teamSlug && !pathname.includes("/projects") && !pathname.endsWith("/tasks"),
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
