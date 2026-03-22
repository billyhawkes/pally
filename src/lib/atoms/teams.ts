import type { OrganizationId } from "@/lib/schemas";
import { PallyClient } from "@/lib/pally-client";

export const teamsAtom = (organizationId?: OrganizationId | null) =>
  PallyClient.query("teams", "listTeams", {
    query: { organizationId: organizationId ?? undefined },
    timeToLive: "5 minutes",
    reactivityKeys: ["teams"],
  });
