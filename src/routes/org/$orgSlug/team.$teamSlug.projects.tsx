import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/org/$orgSlug/team/$teamSlug/projects")({
  component: TeamProjectsLayout,
});

function TeamProjectsLayout() {
  return <Outlet />;
}
