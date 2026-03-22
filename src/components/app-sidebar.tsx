import { useState } from "react";
import { Link, useRouter, useParams } from "@tanstack/react-router";
import { useAtomValue } from "@effect/atom-react";
import { AsyncResult } from "effect/unstable/reactivity";
import {
  ClipboardList,
  LogOut,
  ChevronsUpDown,
  Check,
  Building2,
  FolderKanban,
  Users,
  Plus,
  Github,
  LoaderCircle,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CreateTeamDialog } from "@/components/teams/create-team-dialog";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import type { AuthState } from "@/lib/auth-context";
import { githubIntegrationAtom } from "@/lib/atoms/github";
import { organizationsAtom } from "@/lib/atoms/organizations";
import { teamsAtom } from "@/lib/atoms/teams";
import { getTeamTheme } from "@/lib/team-color-theme";
import { isTaskViewMode } from "@/components/tasks/task-views";
import { cn } from "@/lib/utils";

export function AppSidebar({
  auth,
}: {
  auth: NonNullable<AuthState["session"]>;
}) {
  const router = useRouter();
  const params = useParams({ from: "/org/$orgSlug" });
  const currentOrgSlug = params.orgSlug;
  const currentPath = router.state.location.pathname;
  const locationSearch = router.state.location.search as { tab?: string };
  const taskTab = isTaskViewMode(locationSearch.tab)
    ? locationSearch.tab
    : "table";

  const orgsResult = useAtomValue(organizationsAtom);
  const organizations = AsyncResult.match(orgsResult, {
    onInitial: () => [],
    onFailure: () => [],
    onSuccess: ({ value }) => value,
  });
  const githubIntegrationResult = useAtomValue(githubIntegrationAtom);

  const activeOrg = currentOrgSlug
    ? (organizations.find((o) => o.slug === currentOrgSlug) ?? null)
    : null;

  const teamsResult = useAtomValue(teamsAtom(activeOrg?.id));
  const teams = AsyncResult.match(teamsResult, {
    onInitial: () => [],
    onFailure: () => [],
    onSuccess: ({ value }) => value,
  });

  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [isGithubSubmitting, setIsGithubSubmitting] = useState(false);
  const [githubConnectedOverride, setGithubConnectedOverride] = useState<
    boolean | null
  >(null);

  const { githubIntegration, isGithubLoading } = AsyncResult.match(
    githubIntegrationResult,
    {
      onInitial: () => ({ githubIntegration: null, isGithubLoading: true }),
      onFailure: () => ({ githubIntegration: null, isGithubLoading: true }),
      onSuccess: ({ value }) => ({ githubIntegration: value, isGithubLoading: false }),
    },
  );
  const isGithubLoadingState = githubConnectedOverride === null && isGithubLoading;
  const isGithubConfigured = githubIntegration?.providerConfigured ?? false;
  const isGithubConnected =
    githubConnectedOverride ?? githubIntegration?.connected ?? false;

  async function handleSetActiveOrg(
    org: { id: string; slug: string | null } | null,
  ) {
    if (!org?.slug) return;
    await authClient.organization.setActive({
      organizationId: org.id,
    });
    router.navigate({
      to: "/org/$orgSlug/tasks",
      params: { orgSlug: org.slug },
      search: { tab: taskTab, status: [], priority: [], projectId: null },
    });
  }

  async function handleSignOut() {
    await authClient.signOut();
    router.navigate({ to: "/auth/login", search: { redirect: "/" } });
  }

  async function handleGithubConnectionToggle() {
    setIsGithubSubmitting(true);

    try {
      if (!isGithubConfigured) {
        return;
      }

      if (isGithubConnected) {
        await authClient.unlinkAccount({ providerId: "github" });
        setGithubConnectedOverride(false);
        return;
      }

      await authClient.linkSocial({
        provider: "github",
        callbackURL: `${window.location.pathname}${window.location.search}`,
      });
    } finally {
      setIsGithubSubmitting(false);
    }
  }

  const userInitials = auth.user.name
    ? auth.user.name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : auth.user.email.slice(0, 2).toUpperCase();

  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                    <Building2 className="size-4" />
                  </div>
                  <div className="flex flex-col gap-0.5 leading-none">
                    <span className="font-semibold">
                      {activeOrg?.name ?? "Select organization"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {activeOrg ? "Organization" : "No organization selected"}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="w-[--radix-dropdown-menu-trigger-width]"
              >
                {organizations.map((org) => (
                  <DropdownMenuItem
                    key={org.id}
                    onClick={() => handleSetActiveOrg(org)}
                  >
                    <Building2 className="mr-2 size-4" />
                    {org.name}
                    {activeOrg?.id === org.id && (
                      <Check className="ml-auto size-4" />
                    )}
                  </DropdownMenuItem>
                ))}
                {organizations?.length > 0 && <DropdownMenuSeparator />}
                <DropdownMenuItem asChild>
                  <Link to="/auth/create-organization">
                    <Plus className="mr-2 size-4" />
                    Create organization
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link
                    to="/org/$orgSlug/tasks"
                    params={{ orgSlug: currentOrgSlug }}
                    search={{ tab: taskTab, status: [], priority: [], projectId: null }}
                  >
                    <ClipboardList className="size-4" />
                    <span>Tasks</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link
                    to="/org/$orgSlug/projects"
                    params={{ orgSlug: currentOrgSlug }}
                  >
                    <FolderKanban className="size-4" />
                    <span>Projects</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {activeOrg && (
          <SidebarGroup>
            <SidebarGroupLabel className="flex items-center justify-between">
              <span>Teams</span>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={() => setShowCreateTeam(true)}
                className="text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              >
                <Plus className="size-3.5" />
              </Button>
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {teams.map((team) => (
                  <SidebarMenuItem key={team.id}>
                    {(() => {
                      const theme = getTeamTheme(team.id);

                      return (
                        <>
                          <SidebarMenuButton className={cn("mb-1", theme.group)}>
                            <span
                              className={cn(
                                "flex size-5 items-center justify-center rounded-md",
                                theme.icon,
                              )}
                            >
                              <Users className="size-3.5" />
                            </span>
                            <span>{team.name}</span>
                          </SidebarMenuButton>
                          <SidebarMenuSub className={theme.sub}>
                            <SidebarMenuSubItem>
                              <SidebarMenuSubButton
                                asChild
                                isActive={currentPath === `/org/${currentOrgSlug}/team/${team.id}/tasks`}
                              >
                                <Link
                                  to="/org/$orgSlug/team/$teamSlug/tasks"
                                  params={{
                                    orgSlug: currentOrgSlug,
                                    teamSlug: team.id,
                                  }}
                                  search={{ tab: taskTab, status: [], priority: [], projectId: null }}
                                >
                                  <span>Tasks</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                            <SidebarMenuSubItem>
                              <SidebarMenuSubButton
                                asChild
                                isActive={
                                  currentPath === `/org/${currentOrgSlug}/team/${team.id}/projects` ||
                                  currentPath.startsWith(
                                    `/org/${currentOrgSlug}/team/${team.id}/projects/`,
                                  )
                                }
                              >
                                <Link
                                  to="/org/$orgSlug/team/$teamSlug/projects"
                                  params={{
                                    orgSlug: currentOrgSlug,
                                    teamSlug: team.id,
                                  }}
                                >
                                  <span>Projects</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          </SidebarMenuSub>
                        </>
                      );
                    })()}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <CreateTeamDialog
        open={showCreateTeam}
        onOpenChange={setShowCreateTeam}
        organizationId={activeOrg?.id ?? null}
      />

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="size-8">
                    <AvatarImage src={auth.user.image ?? undefined} />
                    <AvatarFallback>{userInitials}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col gap-0.5 leading-none">
                    <span className="font-medium">
                      {auth.user.name ?? "User"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {auth.user.email}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="w-[--radix-dropdown-menu-trigger-width]"
              >
                <DropdownMenuItem disabled>
                  <Github className="mr-2 size-4" />
                  {isGithubLoadingState
                    ? "Checking GitHub account"
                    : !isGithubConfigured
                      ? "GitHub not configured"
                    : isGithubConnected
                      ? "GitHub account connected"
                      : "GitHub account not connected"}
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={isGithubLoadingState || isGithubSubmitting || !isGithubConfigured}
                  onClick={handleGithubConnectionToggle}
                >
                  {isGithubSubmitting ? (
                    <LoaderCircle className="mr-2 size-4 animate-spin" />
                  ) : (
                    <Github className="mr-2 size-4" />
                  )}
                  {isGithubSubmitting
                    ? isGithubConnected
                      ? "Disconnecting account..."
                      : "Connecting account..."
                    : !isGithubConfigured
                      ? "Add GitHub OAuth env vars"
                    : isGithubConnected
                      ? "Disconnect GitHub account"
                      : "Connect GitHub account"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 size-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
