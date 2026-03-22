import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { getSession, resolveOrgBySlug } from "@/lib/client-auth";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

export const Route = createFileRoute("/$orgSlug")({
  beforeLoad: async ({ params }) => {
    console.log("params", params);
    const session = await getSession();
    if (!session) {
      throw redirect({
        to: "/login",
        search: { redirect: location.href },
      });
    }
    const result = await resolveOrgBySlug({ data: params.orgSlug });

    if (result.type === "not_found") {
      throw redirect({ to: "/create-organization" });
    }

    return { orgSlug: params.orgSlug, auth: session };
  },
  component: OrgSlugLayout,
});

function OrgSlugLayout() {
  const { orgSlug, auth } = Route.useRouteContext();

  return (
    <SidebarProvider>
      <AppSidebar auth={auth} />
      <SidebarInset>
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  );
}
