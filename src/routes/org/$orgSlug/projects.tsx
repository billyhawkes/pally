import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/org/$orgSlug/projects")({
  component: ProjectsLayout,
});

function ProjectsLayout() {
  return <Outlet />;
}
