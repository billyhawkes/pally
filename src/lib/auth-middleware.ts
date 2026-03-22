import { Effect, Layer } from "effect"
import { HttpApiError } from "effect/unstable/httpapi"
import { HttpServerRequest } from "effect/unstable/http"
import { AuthService } from "./services/AuthService"
import { CurrentSession, Authentication } from "./api"

export { CurrentSession, Authentication }

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
