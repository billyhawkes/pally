import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization, openAPI } from "better-auth/plugins";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { db } from "@/db/layer";
import { seedOrganizationData } from "@/db/seed";

const githubClientId = process.env.GITHUB_CLIENT_ID;
const githubClientSecret = process.env.GITHUB_CLIENT_SECRET;

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders:
    githubClientId && githubClientSecret
      ? {
          github: {
            clientId: githubClientId,
            clientSecret: githubClientSecret,
            scope: ["read:user", "user:email"],
          },
        }
      : undefined,
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
