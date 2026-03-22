import { createServerFn } from "@tanstack/react-start"
import { getRequest } from "@tanstack/react-start/server"
import { auth } from "./auth"

export type TeamInfo = {
  id: string
  name: string
  organizationId: string
}

export const listTeamsForOrg = createServerFn({ method: "GET" })
  .inputValidator((orgId: string) => orgId)
  .handler(async ({ data: orgId }) => {
    const request = getRequest()
    const headers = request.headers

    const result = await auth.api.listOrganizationTeams({
      headers,
      query: { organizationId: orgId },
    })

    if (!result) return []

    return (result as Array<{ id: string; name: string; organizationId: string }>).map(
      (t) => ({
        id: t.id,
        name: t.name,
        organizationId: t.organizationId,
      }),
    )
  })
