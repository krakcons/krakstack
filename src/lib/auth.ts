import { Pool } from "pg";
import { betterAuth } from "better-auth";

const trustedOrigins = process.env.BETTER_AUTH_TRUSTED_ORIGINS?.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

export const auth = betterAuth({
  appName: "Krakstack Site",
  database: new Pool({
    connectionString: process.env.DATABASE_URL,
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
