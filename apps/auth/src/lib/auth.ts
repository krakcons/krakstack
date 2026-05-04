import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter/relations-v2";
import { admin, jwt } from "better-auth/plugins";
import { oauthProvider } from "@better-auth/oauth-provider";

import { db } from "@/services/database";
import { schema } from "@/db/schema";

const parseCsv = (value: string | undefined) =>
  value
    ?.split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const trustedOrigins = parseCsv(process.env.BETTER_AUTH_TRUSTED_ORIGINS);

const validAudiences = parseCsv(process.env.BETTER_AUTH_VALID_AUDIENCES);

export const auth = betterAuth({
  appName: "Krakstack Auth",
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  trustedOrigins,
  emailAndPassword: {
    enabled: true,
  },
  account: {
    encryptOAuthTokens: true,
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,
    },
  },
  plugins: [
    admin(),
    jwt(),
    oauthProvider({
      loginPage: "/sign-in",
      consentPage: "/consent",
      allowDynamicClientRegistration: false,
      clientPrivileges: async ({ user }) => {
        const role = (user as { role?: unknown } | undefined)?.role;
        if (typeof role !== "string") return false;

        return role.split(",").some((item) => item.trim() === "admin");
      },
      scopes: ["openid", "profile", "email", "offline_access"],
      ...(validAudiences ? { validAudiences } : {}),
    }),
  ],
});

export type AuthSession = typeof auth.$Infer.Session;
