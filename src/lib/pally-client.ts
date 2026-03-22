import { FetchHttpClient } from "effect/unstable/http"
import { AtomHttpApi } from "effect/unstable/reactivity"
import { PallyApi } from "./api"

export class PallyClient extends AtomHttpApi.Service<PallyClient>()("PallyClient", {
  api: PallyApi,
  httpClient: FetchHttpClient.layer,
  baseUrl: typeof window !== "undefined"
    ? window.location.origin
    : "http://localhost:3000",
}) {}
