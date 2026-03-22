import { Effect, Layer, Schema, ServiceMap } from "effect";
import { eq } from "drizzle-orm";
import { OrganizationId, Team } from "@/lib/schemas";
import { DB } from "@/db/layer";
import { dbQuery } from "@/db/query";
import { team } from "@/db/auth-schema";

const decodeTeam = Schema.decodeUnknownSync(Team);

export class TeamService extends ServiceMap.Service<
  TeamService,
  {
    readonly listByOrg: (
      organizationId?: OrganizationId,
    ) => Effect.Effect<readonly Team[]>;
  }
>()("@pally/TeamService") {
  static readonly layer = Layer.effect(
    TeamService,
    Effect.gen(function* () {
      const db = yield* DB;

      const listByOrg = Effect.fn("TeamService.listByOrg")(
        function* (organizationId?: OrganizationId) {
          if (!organizationId) {
            return [];
          }

          const rows = yield* dbQuery(
            db
              .select()
              .from(team)
              .where(eq(team.organizationId, organizationId)),
          );
          return rows.map((row) => decodeTeam(row));
        },
      );

      return { listByOrg };
    }),
  );
}
