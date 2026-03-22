import { createFileRoute, Outlet, redirect } from "@tanstack/react-router"
import { getSession } from "@/lib/client-auth"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async ({ location }) => {
    const session = await getSession()
    if (!session) {
      throw redirect({
        to: "/login",
        search: { redirect: location.href },
      })
    }
    return { auth: session }
  },
  component: AuthenticatedLayout,
})

function AuthenticatedLayout() {
  const { auth } = Route.useRouteContext()

  return (
    <SidebarProvider>
      <AppSidebar auth={auth} />
      <SidebarInset>
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  )
}
