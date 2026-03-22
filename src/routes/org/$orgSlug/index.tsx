import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/org/$orgSlug/")({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/org/$orgSlug/tasks",
      params: { orgSlug: params.orgSlug },
      search: { tab: "table" },
    });
  },
});
