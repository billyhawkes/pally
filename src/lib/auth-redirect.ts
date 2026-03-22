export function sanitizeRedirect(url: unknown): string {
  if (typeof url !== "string" || !url.startsWith("/") || url.startsWith("//")) {
    return "/";
  }

  return url;
}

export function createAuthCallbackUrl(
  authPath: "/auth/login" | "/auth/signup",
  redirect: string,
) {
  const safeRedirect = sanitizeRedirect(redirect);
  return `${authPath}?redirect=${encodeURIComponent(safeRedirect)}`;
}

export async function resolvePostAuthRedirect(redirect: string) {
  const safeRedirect = sanitizeRedirect(redirect);

  if (safeRedirect !== "/") {
    return safeRedirect;
  }

  const { getActiveOrgSlug } = await import("@/lib/client-auth");
  const activeOrgSlug = await getActiveOrgSlug();

  if (!activeOrgSlug) {
    return "/auth/create-organization";
  }

  return `/org/${activeOrgSlug}/tasks?tab=table`;
}
