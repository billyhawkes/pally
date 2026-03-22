import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization, openAPI } from "better-auth/plugins";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { db } from "@/db/layer";
import { seedOrganizationData } from "@/db/seed";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    organization({
      allowUserToCreateOrganization: true,
      organizationLimit: 5,
      membershipLimit: 100,
      teams: {
        enabled: true,
      },
      organizationHooks: {
        afterCreateOrganization: async ({ organization, user }) => {
          await seedOrganizationData({
            organizationId: organization.id,
            userId: user.id,
          });
        },
      },
    }),
    openAPI({
      path: "/docs",
    }),
    tanstackStartCookies(),
  ],
});

export type Session = typeof auth.$Infer.Session;
