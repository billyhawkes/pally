import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/$orgSlug/")({
  beforeLoad: ({ params }) => {
    console.log("params", params);
    throw redirect({
      to: "/$orgSlug/tasks",
      params: { orgSlug: params.orgSlug },
    });
  },
});
