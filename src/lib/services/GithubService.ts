import { Effect, Layer, Schema, ServiceMap } from "effect";
import { and, eq } from "drizzle-orm";
import { account } from "@/db/auth-schema";
import { DB } from "@/db/layer";
import { dbQuery } from "@/db/query";
import { isGithubProviderConfigured } from "@/lib/github-provider";
import { GithubIntegration } from "@/lib/schemas";

const decodeGithubIntegration = Schema.decodeUnknownSync(GithubIntegration);

export class GithubService extends ServiceMap.Service<
  GithubService,
  {
    readonly getIntegration: (
      userId: string,
    ) => Effect.Effect<GithubIntegration>;
  }
>()("@pally/GithubService") {
  static readonly layer = Layer.effect(
    GithubService,
    Effect.gen(function* () {
      const db = yield* DB;

      const getIntegration = Effect.fn("GithubService.getIntegration")(
        function* (userId: string) {
          const rows = yield* dbQuery(
            db
              .select({
                accountId: account.accountId,
                scope: account.scope,
                createdAt: account.createdAt,
              })
              .from(account)
              .where(
                and(eq(account.userId, userId), eq(account.providerId, "github")),
              )
              .limit(1),
          );

          const connectedAccount = rows[0] ?? null;

          return decodeGithubIntegration({
            provider: "github",
            providerConfigured: isGithubProviderConfigured(),
            connected: connectedAccount !== null,
            accountId: connectedAccount?.accountId ?? null,
            scope: connectedAccount?.scope ?? null,
            connectedAt: connectedAccount?.createdAt ?? null,
          });
        },
      );

      return { getIntegration };
    }),
  );
}
