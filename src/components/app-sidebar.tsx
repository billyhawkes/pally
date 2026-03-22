import { useEffect, useState } from "react"
import { Link, useRouter } from "@tanstack/react-router"
import {
  ClipboardList,
  LogOut,
  ChevronsUpDown,
  Check,
  Building2,
} from "lucide-react"

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
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { authClient } from "@/lib/auth-client"
import type { AuthState } from "@/lib/auth-context"

const navItems = [{ title: "Tasks", url: "/tasks" as const, icon: ClipboardList }]

type OrganizationData = {
  id: string
  name: string
  slug: string | null
  logo?: string | null
  metadata?: unknown
  createdAt: Date
}

export function AppSidebar({
  auth,
}: {
  auth: NonNullable<AuthState["session"]>
}) {
  const router = useRouter()
  const [organizations, setOrganizations] = useState<OrganizationData[]>([])
  const [activeOrg, setActiveOrg] = useState<OrganizationData | null>(null)

  useEffect(() => {
    loadOrganizations()
  }, [])

  async function loadOrganizations() {
    const { data } = await authClient.organization.list()
    if (data) {
      const orgs = data as unknown as OrganizationData[]
      setOrganizations(orgs)
      const sessionData = auth.session as unknown as {
        activeOrganizationId?: string | null
      }
      if (sessionData.activeOrganizationId) {
        const active = orgs.find(
          (org) => org.id === sessionData.activeOrganizationId,
        )
        setActiveOrg(active ?? null)
      }
    }
  }

  async function handleSetActiveOrg(org: OrganizationData | null) {
    await authClient.organization.setActive({
      organizationId: org?.id ?? null,
    })
    setActiveOrg(org)
    router.invalidate()
  }

  async function handleSignOut() {
    await authClient.signOut()
    router.navigate({ to: "/login", search: { redirect: "/" } })
  }

  const userInitials = auth.user.name
    ? auth.user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : auth.user.email.slice(0, 2).toUpperCase()

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
                      {activeOrg?.name ?? "Personal"}
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
                <DropdownMenuItem onClick={() => handleSetActiveOrg(null)}>
                  <Building2 className="mr-2 size-4" />
                  Personal
                  {!activeOrg && <Check className="ml-auto size-4" />}
                </DropdownMenuItem>
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
                    <Link to={item.url}>
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
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
  )
}
