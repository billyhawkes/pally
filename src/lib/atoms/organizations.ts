import { PallyClient } from "@/lib/pally-client";

export const organizationsAtom = PallyClient.query(
  "organizations",
  "listOrganizations",
  { timeToLive: "5 minutes", reactivityKeys: ["organizations"] },
);
