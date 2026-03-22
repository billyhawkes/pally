import { Link, createFileRoute, redirect } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { getSession, getActiveOrgSlug } from "@/lib/client-auth";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    const session = await getSession();
    if (session) {
      const slug = await getActiveOrgSlug();
      if (slug) {
        throw redirect({
          to: "/org/$orgSlug/tasks",
          params: { orgSlug: slug },
          search: { tab: "table", status: [], priority: [], projectId: null },
        });
      }
      throw redirect({ to: "/auth/create-organization" });
    }
  },
  component: HomePage,
});

function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6">
      <h1 className="text-4xl font-bold">Welcome to Pally</h1>
      <p className="text-muted-foreground">
        A project and task application with Github sync
      </p>
      <div className="flex gap-3">
        <Button asChild>
          <Link to="/auth/login" search={{ redirect: "/" }}>
            Sign in
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/auth/signup" search={{ redirect: "/" }}>
            Create account
          </Link>
        </Button>
      </div>
    </div>
  );
}
