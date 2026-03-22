import { createFileRoute, redirect } from "@tanstack/react-router"

export const Route = createFileRoute("/_authenticated/$orgSlug/")({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/$orgSlug/tasks",
      params: { orgSlug: params.orgSlug },
    })
  },
})
