import { Pool } from "pg";
import { betterAuth } from "better-auth";
import { jwt } from "better-auth/plugins";
import { oauthProvider } from "@better-auth/oauth-provider";

const trustedOrigins = process.env.BETTER_AUTH_TRUSTED_ORIGINS?.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const validAudiences = process.env.BETTER_AUTH_VALID_AUDIENCES?.split(",")
  .map((audience) => audience.trim())
  .filter(Boolean);

const cachedTrustedClients = process.env.BETTER_AUTH_CACHED_TRUSTED_CLIENTS?.split(",")
  .map((clientId) => clientId.trim())
  .filter(Boolean);

export const auth = betterAuth({
  appName: "Krakstack Auth",
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
  plugins: [
    jwt(),
    oauthProvider({
      loginPage: "/sign-in",
      consentPage: "/consent",
      allowDynamicClientRegistration: false,
      ...(cachedTrustedClients ? { cachedTrustedClients: new Set(cachedTrustedClients) } : {}),
      scopes: ["openid", "profile", "email", "offline_access"],
      ...(validAudiences ? { validAudiences } : {}),
    }),
  ],
});

export type AuthSession = typeof auth.$Infer.Session;
