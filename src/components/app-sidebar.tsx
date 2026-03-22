import { useState } from "react";
import { Link, useRouter, useParams } from "@tanstack/react-router";
import { useAtomValue } from "@effect/atom-react";
import {
  ClipboardList,
  LogOut,
  ChevronsUpDown,
  Check,
  Building2,
  Users,
  Plus,
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
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { PallyClient } from "@/lib/pally-client";
import type { AuthState } from "@/lib/auth-context";
import type { OrganizationId } from "@/lib/schemas";
import { organizationsAtom } from "@/lib/atoms/organizations";

const navItems = [{ title: "Tasks", icon: ClipboardList }] as const;

const teamsAtom = (orgId?: OrganizationId) =>
  PallyClient.query("teams", "listTeams", {
    query: { organizationId: orgId },
    timeToLive: "5 minutes",
    reactivityKeys: ["teams"],
  });

export function AppSidebar({
  auth,
}: {
  auth: NonNullable<AuthState["session"]>;
}) {
  const router = useRouter();
  const params = useParams({ from: "/org/$orgSlug" });
  const currentOrgSlug = params.orgSlug;

  const orgsResult = useAtomValue(organizationsAtom);
  const organizations = orgsResult._tag === "Success" ? orgsResult.value : [];

  console.log(orgsResult, currentOrgSlug);

  const activeOrg = currentOrgSlug
    ? (organizations.find((o) => o.slug === currentOrgSlug) ?? null)
    : null;

  const teamsResult = useAtomValue(teamsAtom(activeOrg?.id));
  const teams = teamsResult._tag === "Success" ? teamsResult.value : [];

  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");

  async function handleCreateTeam(e: React.FormEvent) {
    e.preventDefault();
    if (!newTeamName.trim() || !activeOrg) return;
    await authClient.organization.createTeam({
      name: newTeamName.trim(),
      organizationId: activeOrg.id,
    });
    setNewTeamName("");
    setShowCreateTeam(false);
  }

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
    });
  }

  async function handleSignOut() {
    await authClient.signOut();
    router.navigate({ to: "/auth/login", search: { redirect: "/" } });
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
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link
                      to="/org/$orgSlug/tasks"
                      params={{ orgSlug: currentOrgSlug }}
                    >
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {activeOrg && (
          <SidebarGroup>
            <SidebarGroupLabel className="flex items-center justify-between">
              <span>Teams</span>
              <button
                onClick={() => setShowCreateTeam(!showCreateTeam)}
                className="rounded p-0.5 hover:bg-sidebar-accent"
              >
                <Plus className="size-3.5" />
              </button>
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {showCreateTeam && (
                  <SidebarMenuItem>
                    <form
                      onSubmit={handleCreateTeam}
                      className="flex gap-1 px-2 py-1"
                    >
                      <Input
                        value={newTeamName}
                        onChange={(e) => setNewTeamName(e.target.value)}
                        placeholder="Team name"
                        className="h-7 text-sm"
                        autoFocus
                      />
                      <button
                        type="submit"
                        className="rounded px-2 text-xs hover:bg-sidebar-accent"
                      >
                        Add
                      </button>
                    </form>
                  </SidebarMenuItem>
                )}
                {teams.map((team) => (
                  <SidebarMenuItem key={team.id}>
                    <SidebarMenuButton asChild>
                      <Link
                        to="/org/$orgSlug/team/$teamSlug/tasks"
                        params={{
                          orgSlug: currentOrgSlug,
                          teamSlug: team.id,
                        }}
                      >
                        <Users className="size-4" />
                        <span>{team.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

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
