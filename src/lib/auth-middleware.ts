import { Effect, Layer, ServiceMap } from "effect"
import { HttpApiMiddleware, HttpApiError } from "effect/unstable/httpapi"
import { HttpServerRequest } from "effect/unstable/http"
import { AuthService } from "./services/AuthService"

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
}

export class CurrentSession extends ServiceMap.Service<
  CurrentSession,
  AuthSession
>()("@pally/CurrentSession") {}

export class Authentication extends HttpApiMiddleware.Service<
  Authentication,
  {
    provides: CurrentSession
    error: HttpApiError.Unauthorized
  }
>()("@pally/Authentication", {
  error: HttpApiError.Unauthorized
}) {}

export const AuthenticationLive = Layer.effect(
  Authentication,
  Effect.gen(function* () {
    const authService = yield* AuthService

    return (httpEffect) =>
      Effect.gen(function* () {
        const request = yield* HttpServerRequest.HttpServerRequest
        const headers = request.headers

        const standardHeaders = new Headers(headers as Record<string, string>)

        const session = yield* authService.requireSession(standardHeaders).pipe(
          Effect.mapError(() => new HttpApiError.Unauthorized())
        )

        return yield* httpEffect.pipe(
          Effect.provideService(CurrentSession, session)
        )
      })
  })
)
