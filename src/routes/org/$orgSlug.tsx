import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { getSession, resolveOrgBySlug } from "@/lib/client-auth";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
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

    return { orgSlug: params.orgSlug, auth: session };
  },
  component: OrgSlugLayout,
});

function OrgSlugLayout() {
  const { auth } = Route.useRouteContext();

  return (
    <SidebarProvider>
      <AppSidebar auth={auth} />
      <SidebarInset>
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  );
}
