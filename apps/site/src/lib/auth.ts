import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter/relations-v2";
import { rawdb } from "@/services/database";

const trustedOrigins = process.env.BETTER_AUTH_TRUSTED_ORIGINS?.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

export const auth = betterAuth({
  appName: "Krakstack Site",
  database: drizzleAdapter(rawdb, {
    provider: "pg",
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
});

export type AuthSession = typeof auth.$Infer.Session;
