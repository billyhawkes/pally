import { createFileRoute, Outlet } from "@tanstack/react-router"

export const Route = createFileRoute("/org/$orgSlug/team/$teamSlug")({
  component: TeamLayout,
})

function TeamLayout() {
  return <Outlet />
}
