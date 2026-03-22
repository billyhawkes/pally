import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { resolveOrgBySlug } from "@/lib/client-auth";

export const Route = createFileRoute("/_authenticated/$orgSlug")({
  beforeLoad: async ({ params }) => {
    const result = await resolveOrgBySlug({ data: params.orgSlug });

    if (result.type === "not_found") {
      throw redirect({ to: "/create-organization" });
    }

    return { orgSlug: params.orgSlug };
  },
  component: OrgSlugLayout,
});

function OrgSlugLayout() {
  return <Outlet />;
}
