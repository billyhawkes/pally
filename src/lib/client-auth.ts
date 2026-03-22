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

export async function getActiveOrgSlug() {
  const session = await getSession();
  const { data: orgs } = await authClient.organization.list();

  if (!orgs?.length) {
    return null;
  }

  const activeOrganizationId = session?.session.activeOrganizationId;
  const activeOrg = activeOrganizationId
    ? orgs.find((org) => org.id === activeOrganizationId)
    : null;

  return activeOrg?.slug ?? orgs[0]?.slug ?? null;
}
