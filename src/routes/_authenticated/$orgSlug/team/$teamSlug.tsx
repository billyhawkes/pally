import { createFileRoute, Outlet } from "@tanstack/react-router"

export const Route = createFileRoute("/_authenticated/$orgSlug/team/$teamSlug")({
  component: TeamLayout,
})

function TeamLayout() {
  return <Outlet />
}
