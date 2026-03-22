import { createFileRoute, redirect } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { getSession, getFirstOrgSlug } from "@/lib/client-auth";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    const session = await getSession();
    if (session) {
      const slug = await getFirstOrgSlug();
      if (slug) {
        throw redirect({
          to: "/$orgSlug/tasks",
          params: { orgSlug: slug },
        });
      }
      throw redirect({ to: "/create-organization" });
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
          <a href="/login">Sign in</a>
        </Button>
        <Button variant="outline" asChild>
          <a href="/signup">Create account</a>
        </Button>
      </div>
    </div>
  );
}
