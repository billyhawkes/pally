import { Effect, Layer, ServiceMap } from "effect"
import { auth } from "@/lib/auth"
import { authClient } from "@/lib/auth-client"
import { UnauthorizedError } from "@/lib/schemas"

export async function getSession() {
  const { data } = await authClient.getSession()
  return data ?? null
}

type AuthSession = {
  user: {
    id: string
    name: string
    email: string
    emailVerified: boolean
    createdAt: Date
    updatedAt: Date
    image?: string | null
  }
  session: {
    id: string
    userId: string
    expiresAt: Date
    createdAt: Date
    updatedAt: Date
    token: string
  }
} | null

export class AuthService extends ServiceMap.Service<
  AuthService,
  {
    readonly getSession: (headers: Headers) => Effect.Effect<AuthSession>
    readonly requireSession: (
      headers: Headers
    ) => Effect.Effect<NonNullable<AuthSession>, UnauthorizedError>
  }
>()("@pally/AuthService") {
  static readonly layer = Layer.effect(
    AuthService,
    Effect.gen(function* () {
      const getSession = Effect.fn("AuthService.getSession")(
        function* (headers: Headers) {
          const result = yield* Effect.promise(
            () => auth.api.getSession({ headers })
          )
          return result as AuthSession
        }
      )

      const requireSession = Effect.fn("AuthService.requireSession")(
        function* (headers: Headers) {
          const session = yield* getSession(headers)
          if (!session) {
            return yield* new UnauthorizedError({ message: "Authentication required" })
          }
          return session as NonNullable<AuthSession>
        }
      )

      return { getSession, requireSession }
    })
  )
}
