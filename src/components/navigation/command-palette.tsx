import { useCallback, useEffect, useMemo, useState } from "react";
import { useAtomValue } from "@effect/atom-react";
import { AsyncResult } from "effect/unstable/reactivity";
import { formatForDisplay, useHotkey } from "@tanstack/react-hotkeys";
import { useRouter } from "@tanstack/react-router";
import {
  Building2,
  ClipboardList,
  FolderKanban,
  LogOut,
  Plus,
  Search,
  SquarePen,
  Star,
  Users,
} from "lucide-react";

import { CreateProjectDialog } from "@/components/projects/create-project-dialog";
import { CreateTeamDialog } from "@/components/teams/create-team-dialog";
import { CreateTaskDialog } from "@/components/tasks/create-task-dialog";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { organizationsAtom } from "@/lib/atoms/organizations";
import { useProjectsAtom } from "@/lib/atoms/projects";
import { teamsAtom } from "@/lib/atoms/teams";
import { authClient } from "@/lib/auth-client";
import type { ProjectId, TeamId } from "@/lib/schemas";
import { isTaskViewMode } from "@/components/tasks/task-views";

type PaletteAction = {
  id: string;
  label: string;
  group: string;
  icon: typeof ClipboardList;
  keywords?: ReadonlyArray<string>;
  shortcut?: string;
  onSelect: () => void;
};

const favoriteStorageKey = "pally.command-palette.favorites";

export function CommandPalette() {
  const router = useRouter();
  const organizationsResult = useAtomValue(organizationsAtom);
  const projectsResult = useProjectsAtom();
  const [open, setOpen] = useState(false);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [teamDialogOpen, setTeamDialogOpen] = useState(false);
  const [favoriteActionIds, setFavoriteActionIds] = useState<
    ReadonlyArray<string>
  >([]);

  const organizations = AsyncResult.match(organizationsResult, {
    onInitial: () => [],
    onFailure: () => [],
    onSuccess: ({ value }) => value,
  });
  const pathSegments = router.state.location.pathname.split("/").filter(Boolean);
  const orgSlug = pathSegments[0] === "org" ? (pathSegments[1] ?? "") : "";
  const teamSlug = pathSegments[2] === "team" ? (pathSegments[3] ?? null) : null;
  const projectSegmentIndex = pathSegments.indexOf("projects");
  const projectIdParam =
    projectSegmentIndex >= 0 ? (pathSegments[projectSegmentIndex + 1] ?? null) : null;
  const locationSearch = router.state.location.search as { tab?: string };
  const taskTab = isTaskViewMode(locationSearch.tab)
    ? locationSearch.tab
    : "table";

  const activeOrg =
    organizations.find((organization) => organization.slug === orgSlug) ?? null;
  const teamsResult = useAtomValue(teamsAtom(activeOrg?.id ?? null));
  const teams = AsyncResult.match(teamsResult, {
    onInitial: () => [],
    onFailure: () => [],
    onSuccess: ({ value }) => value,
  });
  const currentTeam = teams.find((team) => team.id === teamSlug) ?? null;
  const projects = AsyncResult.match(projectsResult, {
    onInitial: () => [],
    onFailure: () => [],
    onSuccess: ({ value }) => value,
  });
  const currentProject =
    projects.find((project) => project.id === projectIdParam) ?? null;
  const openShortcut = formatForDisplay("Mod+K");
  const taskShortcut = formatForDisplay("Alt+T");
  const projectShortcut = formatForDisplay("Alt+P");

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(favoriteStorageKey);

      if (!stored) {
        return;
      }

      const parsed = JSON.parse(stored);

      if (
        Array.isArray(parsed) &&
        parsed.every((value) => typeof value === "string")
      ) {
        setFavoriteActionIds(parsed);
      }
    } catch {
      setFavoriteActionIds([]);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(favoriteStorageKey, JSON.stringify(favoriteActionIds));
  }, [favoriteActionIds]);

  const openAfterClose = useCallback((callback: () => void) => {
    setOpen(false);
    window.setTimeout(callback, 0);
  }, []);

  useHotkey(
    "Mod+K",
    () => {
      setOpen((currentOpen) => !currentOpen);
    },
    {
      preventDefault: true,
      requireReset: true,
    },
  );

  useHotkey(
    "Alt+T",
    () => {
      openAfterClose(() => setTaskDialogOpen(true));
    },
    {
      enabled: activeOrg !== null,
      preventDefault: true,
      requireReset: true,
    },
  );

  useHotkey(
    "Alt+P",
    () => {
      openAfterClose(() => setProjectDialogOpen(true));
    },
    {
      enabled: activeOrg !== null,
      preventDefault: true,
      requireReset: true,
    },
  );

  const navigateToOrgTasks = useCallback((nextOrgSlug: string) => {
    router.navigate({
      to: "/org/$orgSlug/tasks",
      params: { orgSlug: nextOrgSlug },
      search: { tab: taskTab, status: [], priority: [], projectId: null },
    });
  }, [router, taskTab]);

  const actions = useMemo<ReadonlyArray<PaletteAction>>(() => {
    if (!activeOrg) {
      return [];
    }

    const nextActions: Array<PaletteAction> = [
      {
        id: "open-org-tasks",
        label: `${activeOrg.name} tasks`,
        group: "Navigation",
        icon: ClipboardList,
        keywords: ["tasks", "issues", "list"],
        onSelect: () => {
          setOpen(false);
          navigateToOrgTasks(activeOrg.slug);
        },
      },
      {
        id: "open-org-projects",
        label: `${activeOrg.name} projects`,
        group: "Navigation",
        icon: FolderKanban,
        keywords: ["projects", "repositories"],
        onSelect: () => {
          setOpen(false);
          router.navigate({
            to: "/org/$orgSlug/projects",
            params: { orgSlug: activeOrg.slug },
          });
        },
      },
      {
        id: "create-task",
        label: currentProject
          ? `Create task in ${currentProject.name}`
          : "Create task",
        group: "Create",
        icon: Plus,
        keywords: [
          "new",
          "task",
          currentTeam?.name ?? "",
          currentProject?.name ?? "",
        ],
        shortcut: taskShortcut,
        onSelect: () => openAfterClose(() => setTaskDialogOpen(true)),
      },
      {
        id: "create-project",
        label: currentTeam
          ? `Create project for ${currentTeam.name}`
          : "Create project",
        group: "Create",
        icon: FolderKanban,
        keywords: ["new", "project", currentTeam?.name ?? ""],
        shortcut: projectShortcut,
        onSelect: () => openAfterClose(() => setProjectDialogOpen(true)),
      },
      {
        id: "create-team",
        label: "Create team",
        group: "Create",
        icon: Users,
        keywords: ["new", "team", "organization"],
        onSelect: () => openAfterClose(() => setTeamDialogOpen(true)),
      },
      {
        id: "create-organization",
        label: "Create organization",
        group: "Create",
        icon: Building2,
        keywords: ["new", "organization", "workspace"],
        onSelect: () => {
          setOpen(false);
          router.navigate({ to: "/auth/create-organization" });
        },
      },
      {
        id: "sign-out",
        label: "Sign out",
        group: "Account",
        icon: LogOut,
        keywords: ["logout", "account"],
        onSelect: async () => {
          setOpen(false);
          await authClient.signOut();
          router.navigate({ to: "/auth/login", search: { redirect: "/" } });
        },
      },
    ];

    if (currentProject) {
      nextActions.splice(4, 0, {
        id: "edit-project",
        label: `Edit ${currentProject.name}`,
        group: "Create",
        icon: SquarePen,
        keywords: ["edit", "rename", currentProject.name],
        onSelect: () => openAfterClose(() => setProjectDialogOpen(true)),
      });
    }

    for (const team of teams) {
      nextActions.push(
        {
          id: `team-${team.id}-tasks`,
          label: `${team.name} tasks`,
          group: "Teams",
          icon: ClipboardList,
          keywords: ["team", "tasks", team.name],
          onSelect: () => {
            setOpen(false);
            router.navigate({
              to: "/org/$orgSlug/team/$teamSlug/tasks",
              params: { orgSlug: activeOrg.slug, teamSlug: team.id },
              search: {
                tab: taskTab,
                status: [],
                priority: [],
                projectId: null,
              },
            });
          },
        },
        {
          id: `team-${team.id}-projects`,
          label: `${team.name} projects`,
          group: "Teams",
          icon: FolderKanban,
          keywords: ["team", "projects", team.name],
          onSelect: () => {
            setOpen(false);
            router.navigate({
              to: "/org/$orgSlug/team/$teamSlug/projects",
              params: { orgSlug: activeOrg.slug, teamSlug: team.id },
            });
          },
        },
      );
    }

    for (const organization of organizations) {
      nextActions.push({
        id: `org-${organization.id}`,
        label: `Switch to ${organization.name}`,
        group: "Organizations",
        icon: Building2,
        keywords: ["switch", "organization", organization.name],
        onSelect: async () => {
          setOpen(false);
          await authClient.organization.setActive({
            organizationId: organization.id,
          });
          navigateToOrgTasks(organization.slug);
        },
      });
    }

    return nextActions;
  }, [
    activeOrg,
    currentProject,
    currentTeam,
    navigateToOrgTasks,
    organizations,
    projectShortcut,
    router,
    taskTab,
    taskShortcut,
    teams,
  ]);

  const toggleFavorite = useCallback((actionId: string) => {
    setFavoriteActionIds((currentIds) =>
      currentIds.includes(actionId)
        ? currentIds.filter((id) => id !== actionId)
        : [actionId, ...currentIds],
    );
  }, []);

  const actionGroups = useMemo(() => {
    const grouped = new Map<string, Array<PaletteAction>>();
    const actionsById = new Map(actions.map((action) => [action.id, action]));
    const favoriteActionIdSet = new Set(favoriteActionIds);
    const favoriteActions = favoriteActionIds
      .map((id) => actionsById.get(id) ?? null)
      .filter((action): action is PaletteAction => action !== null);

    const createTaskAction =
      actions.find((action) => action.id === "create-task") ?? null;

    if (createTaskAction) {
      grouped.set("Quick actions", [createTaskAction]);
    }

    if (favoriteActions.length > 0) {
      grouped.set(
        "Favorites",
        favoriteActions.filter((action) => action.id !== createTaskAction?.id),
      );
    }

    for (const action of actions) {
      if (action.id === createTaskAction?.id) {
        continue;
      }

      if (favoriteActionIdSet.has(action.id)) {
        continue;
      }

      const group = grouped.get(action.group) ?? [];
      group.push(action);
      grouped.set(action.group, group);
    }

    return Array.from(grouped.entries()).filter(
      ([, groupActions]) => groupActions.length > 0,
    );
  }, [actions, favoriteActionIds]);

  useEffect(() => {
    const validActionIds = new Set(actions.map((action) => action.id));

    setFavoriteActionIds((currentIds) => {
      const nextIds = currentIds.filter((id) => validActionIds.has(id));

      return nextIds.length === currentIds.length ? currentIds : nextIds;
    });
  }, [actions]);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="min-w-0 justify-start gap-2 text-muted-foreground"
        onClick={() => setOpen(true)}
      >
        <Search data-icon="inline-start" />
        <span className="hidden sm:inline">Search actions...</span>
        <span className="sm:hidden">Search</span>
        <span className="ml-auto hidden rounded-md border bg-muted px-1.5 py-0.5 text-[11px] tracking-wide text-muted-foreground md:inline">
          {openShortcut}
        </span>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <Command>
          <CommandInput placeholder="Search actions, teams, and organizations..." />
          <CommandList>
            <CommandEmpty>No matching actions found.</CommandEmpty>
            {actionGroups.map(([group, groupActions], index) => (
              <div key={group}>
                {index > 0 ? <CommandSeparator /> : null}
                <CommandGroup heading={group}>
                  {groupActions.map((action) => {
                    const Icon = action.icon;

                    return (
                      <CommandItem
                        key={action.id}
                        value={action.label}
                        keywords={
                          action.keywords ? [...action.keywords] : undefined
                        }
                        onSelect={action.onSelect}
                      >
                        <Icon className="size-4 text-muted-foreground" />
                        <span>{action.label}</span>
                        <button
                          type="button"
                          aria-label={
                            favoriteActionIds.includes(action.id)
                              ? `Remove ${action.label} from favorites`
                              : `Add ${action.label} to favorites`
                          }
                          className="rounded p-1 text-muted-foreground transition-colors hover:text-foreground"
                          onMouseDown={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                          }}
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            toggleFavorite(action.id);
                          }}
                        >
                          <Star
                            className={
                              favoriteActionIds.includes(action.id)
                                ? "size-4 fill-current text-amber-500"
                                : "size-4"
                            }
                          />
                        </button>
                        {action.shortcut ? (
                          <CommandShortcut>{action.shortcut}</CommandShortcut>
                        ) : null}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </div>
            ))}
          </CommandList>
        </Command>
      </CommandDialog>

      {activeOrg ? (
        <CreateTaskDialog
          open={taskDialogOpen}
          onOpenChange={setTaskDialogOpen}
          hideDefaultTrigger
          orgId={activeOrg.id}
          teamId={(currentTeam?.id as TeamId | undefined) ?? undefined}
          projectId={(projectIdParam as ProjectId | undefined) ?? undefined}
          breadcrumbs={[
            activeOrg.name,
            ...(currentTeam ? [currentTeam.name] : []),
            ...(currentProject ? [currentProject.name] : []),
          ]}
        />
      ) : null}

      {activeOrg ? (
        currentProject ? (
          <CreateProjectDialog
            open={projectDialogOpen}
            onOpenChange={setProjectDialogOpen}
            hideDefaultTrigger
            project={currentProject}
          />
        ) : (
          <CreateProjectDialog
            open={projectDialogOpen}
            onOpenChange={setProjectDialogOpen}
            hideDefaultTrigger
            orgId={activeOrg.id}
            teamId={(currentTeam?.id as TeamId | undefined) ?? undefined}
            breadcrumbs={[
              activeOrg.name,
              ...(currentTeam ? [currentTeam.name] : []),
            ]}
          />
        )
      ) : null}

      <CreateTeamDialog
        open={teamDialogOpen}
        onOpenChange={setTeamDialogOpen}
        organizationId={activeOrg?.id ?? null}
      />
    </>
  );
}
