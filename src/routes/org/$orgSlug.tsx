import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { getSession, resolveOrgBySlug } from "@/lib/client-auth";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

export const Route = createFileRoute("/org/$orgSlug")({
  beforeLoad: async ({ params, location }) => {
    console.log("params", params);
    const session = await getSession();
    if (!session) {
      throw redirect({
        to: "/auth/login",
        search: {
          redirect: `${location.pathname}${location.search}${location.hash}`,
        },
      });
    }
    const result = await resolveOrgBySlug({ data: params.orgSlug });

    if (result.type === "not_found") {
      throw redirect({ to: "/auth/create-organization" });
    }

    return {
      orgSlug: params.orgSlug,
      orgName: result.data.name,
      auth: session,
    };
  },
  component: OrgSlugLayout,
});

function OrgSlugLayout() {
  const { auth, orgName } = Route.useRouteContext();

  return (
    <SidebarProvider>
      <AppSidebar auth={auth} />
      <SidebarInset>
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b bg-background/95 px-4 py-3 backdrop-blur md:hidden">
          <SidebarTrigger />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{orgName}</p>
          </div>
        </header>
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  );
}
