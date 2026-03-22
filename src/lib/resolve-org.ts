import { createServerFn } from "@tanstack/react-start"
import { getRequest } from "@tanstack/react-start/server"
import { auth } from "./auth"

export type OrgInfo = {
  id: string
  name: string
  slug: string
}

export const resolveOrgBySlug = createServerFn({ method: "GET" })
  .inputValidator((slug: string) => slug)
  .handler(async ({ data: slug }) => {
    const request = getRequest()
    const headers = request.headers

    if (slug === "personal") {
      await auth.api.setActiveOrganization({
        headers,
        body: { organizationId: null },
      })
      return { type: "personal" as const }
    }

    const orgs = await auth.api.listOrganizations({ headers })
    const org = orgs?.find((o: { slug: string | null }) => o.slug === slug)

    if (!org) {
      return { type: "not_found" as const }
    }

    await auth.api.setActiveOrganization({
      headers,
      body: { organizationId: org.id },
    })

    return {
      type: "org" as const,
      org: { id: org.id, name: org.name, slug: org.slug ?? slug },
    }
  })

export const getFirstOrgSlug = createServerFn({ method: "GET" }).handler(
  async () => {
    const request = getRequest()
    const headers = request.headers

    const session = await auth.api.getSession({ headers })
    if (!session) return null

    const orgs = await auth.api.listOrganizations({ headers })

    const sessionData = session as unknown as {
      session: { activeOrganizationId?: string | null }
    }
    const activeOrgId = sessionData.session.activeOrganizationId

    if (activeOrgId) {
      const active = orgs?.find((o: { id: string }) => o.id === activeOrgId)
      if (active?.slug) return active.slug
    }

    return "personal"
  },
)
