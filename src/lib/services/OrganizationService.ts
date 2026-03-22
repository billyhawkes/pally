import { Effect, Layer, Schema, ServiceMap } from "effect";
import { eq, inArray } from "drizzle-orm";
import { Organization } from "@/lib/schemas";
import { DB } from "@/db/layer";
import { dbQuery } from "@/db/query";
import { organization, member } from "@/db/auth-schema";

const decodeOrganization = Schema.decodeUnknownSync(Organization);

export class OrganizationService extends ServiceMap.Service<
  OrganizationService,
  {
    readonly listForUser: (
      userId: string,
    ) => Effect.Effect<readonly Organization[]>;
  }
>()("@pally/OrganizationService") {
  static readonly layer = Layer.effect(
    OrganizationService,
    Effect.gen(function* () {
      const db = yield* DB;

      const listForUser = Effect.fn("OrganizationService.listForUser")(
        function* (userId: string) {
          const memberships = yield* dbQuery(
            db
              .select({ organizationId: member.organizationId })
              .from(member)
              .where(eq(member.userId, userId)),
          );

          if (memberships.length === 0) return [];

          const orgIds = memberships.map((m) => m.organizationId);
          const orgs = yield* dbQuery(
            db
              .select()
              .from(organization)
              .where(inArray(organization.id, orgIds)),
          );

          return orgs.map((o) => decodeOrganization(o));
        },
      );

      return { listForUser };
    }),
  );
}
