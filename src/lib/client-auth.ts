import { authClient } from "@/lib/auth-client";

export async function getSession() {
  const { data } = await authClient.getSession();
  return data ?? null;
}

export async function resolveOrgBySlug({ data: slug }: { data: string }) {
  const { data: orgs } = await authClient.organization.list();
  const org = orgs?.find((o) => o.slug === slug);
  if (!org) return { type: "not_found" as const };
  return { type: "found" as const, data: org };
}

export async function getFirstOrgSlug() {
  const { data: orgs } = await authClient.organization.list();
  return orgs?.[0]?.slug ?? null;
}
