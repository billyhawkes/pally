import { createHmac, createPrivateKey, createSign, timingSafeEqual } from "node:crypto"
import { Config, Effect, Layer, Option, ServiceMap } from "effect"

export class GithubAppConfig extends ServiceMap.Service<
  GithubAppConfig,
  {
    readonly appId: string | null
    readonly appSlug: string | null
    readonly privateKey: string | null
    readonly webhookSecret: string | null
  }
>()("@pally/GithubAppConfig") {
  static readonly layer = Layer.effect(
    GithubAppConfig,
    Effect.gen(function* () {
      const appId = yield* Config.option(Config.string("GITHUB_APP_ID"))
      const appSlug = yield* Config.option(Config.string("GITHUB_APP_SLUG"))
      const privateKey = yield* Config.option(Config.string("GITHUB_APP_PRIVATE_KEY"))
      const webhookSecret = yield* Config.option(Config.string("GITHUB_APP_WEBHOOK_SECRET"))

      return {
        appId: Option.getOrNull(appId),
        appSlug: Option.getOrNull(appSlug),
        privateKey: Option.match(privateKey, {
          onNone: () => null,
          onSome: (value) => value.replace(/\\n/g, "\n"),
        }),
        webhookSecret: Option.getOrNull(webhookSecret),
      }
    })
  )
}

const encodeBase64Url = (value: string): string => Buffer.from(value).toString("base64url")

export const isGithubAppConfigured = (config: {
  appId: string | null
  appSlug?: string | null
  privateKey: string | null
}): boolean => Boolean(config.appId && config.privateKey)

export const isGithubWebhookConfigured = (config: {
  webhookSecret: string | null
}): boolean => Boolean(config.webhookSecret)

export const createGithubAppJwt = (config: {
  appId: string
  privateKey: string
}): string => {
  const nowInSeconds = Math.floor(Date.now() / 1000)
  const header = encodeBase64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }))
  const payload = encodeBase64Url(
    JSON.stringify({
      iat: nowInSeconds - 60,
      exp: nowInSeconds + 9 * 60,
      iss: config.appId,
    })
  )

  const signer = createSign("RSA-SHA256")
  signer.update(`${header}.${payload}`)
  signer.end()

  const signature = signer.sign(createPrivateKey(config.privateKey)).toString("base64url")

  return `${header}.${payload}.${signature}`
}

export const verifyGithubWebhookSignature = (
  body: string,
  signatureHeader: string | null,
  secret: string,
): boolean => {
  if (!signatureHeader || !signatureHeader.startsWith("sha256=")) {
    return false
  }

  const expected = Buffer.from(`sha256=${createHmac("sha256", secret).update(body).digest("hex")}`)
  const received = Buffer.from(signatureHeader)

  if (expected.length !== received.length) {
    return false
  }

  return timingSafeEqual(expected, received)
}
