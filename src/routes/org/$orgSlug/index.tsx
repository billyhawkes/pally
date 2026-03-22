import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/org/$orgSlug/")({
  beforeLoad: ({ params }) => {
    console.log("params", params);
    throw redirect({
      to: "/org/$orgSlug/tasks",
      params: { orgSlug: params.orgSlug },
    });
  },
});
