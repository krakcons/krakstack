import { betterAuth } from "better-auth";
import { genericOAuth } from "better-auth/plugins";

export const auth = betterAuth({
  appName: "Krakstack Site",
  account: {
    encryptOAuthTokens: true,
    storeStateStrategy: "cookie",
    storeAccountCookie: true,
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60 * 24 * 7,
      strategy: "jwe",
      refreshCache: true,
    },
  },
  plugins: [
    genericOAuth({
      config: [
        {
          providerId: "krakstack-auth",
          clientId: process.env.KRAKSTACK_AUTH_CLIENT_ID!,
          clientSecret: process.env.KRAKSTACK_AUTH_CLIENT_SECRET!,
          discoveryUrl: process.env.KRAKSTACK_AUTH_URL + "/.well-known/openid-configuration",
          redirectURI: process.env.BETTER_AUTH_URL + "/api/auth/callback/krakstack-auth",
          pkce: true,
        },
      ],
    }),
  ],
});

export type AuthSession = typeof auth.$Infer.Session;
