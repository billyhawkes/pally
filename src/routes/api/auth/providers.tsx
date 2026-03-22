import { createFileRoute } from "@tanstack/react-router";
import { isGithubProviderConfigured } from "@/lib/github-provider";

export const Route = createFileRoute("/api/auth/providers")({
  server: {
    handlers: {
      GET: async () =>
        Response.json({
          github: {
            configured: isGithubProviderConfigured(),
          },
        }),
    },
  },
});
