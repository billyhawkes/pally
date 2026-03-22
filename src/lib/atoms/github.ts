import { PallyClient } from "@/lib/pally-client";

export const githubIntegrationAtom = PallyClient.query(
  "github",
  "getGithubIntegration",
  {
    timeToLive: "1 minute",
    reactivityKeys: ["github"],
  },
);
