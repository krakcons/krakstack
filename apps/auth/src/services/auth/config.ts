import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter/relations-v2";
import {
  admin,
  emailOTP,
  jwt,
  openAPI,
  organization,
  twoFactor,
} from "better-auth/plugins";
import { oauthProvider } from "@better-auth/oauth-provider";
import { apiKey } from "@better-auth/api-key";

import { db } from "../../services/database";
import { schema } from "../../db/schema";
import { parseCsv, trustedOrigins } from "@/lib/trusted-origins";
import {
  sendResetPasswordEmail,
  sendEmailVerificationOtpEmail,
  sendTwoFactorOtpEmail,
} from "@/services/auth/email";

const isDev = process.env.NODE_ENV === "development";

const validAudiences = parseCsv(process.env.BETTER_AUTH_VALID_AUDIENCES);

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

export const auth = betterAuth({
  appName: "Krakstack Auth",
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  advanced: {
    cookiePrefix: "krakstack-auth",
    defaultCookieAttributes: {
      sameSite: isDev ? "lax" : "none",
      secure: !isDev,
      httpOnly: true,
    },
  },
  trustedOrigins,
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    revokeSessionsOnPasswordReset: true,
    resetPasswordTokenExpiresIn: 60 * 60,
    sendResetPassword: async ({ user, url }, request) => {
      await sendResetPasswordEmail({ request, to: user.email, url });
    },
  },
  ...(googleClientId && googleClientSecret
    ? {
        socialProviders: {
          google: {
            clientId: googleClientId,
            clientSecret: googleClientSecret,
          },
        },
      }
    : {}),
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
    openAPI(),
    admin(),
    jwt(),
    emailOTP({
      overrideDefaultEmailVerification: true,
      sendVerificationOnSignUp: true,
      storeOTP: "encrypted",
      allowedAttempts: 5,
      sendVerificationOTP: async ({ email, otp, type }, context) => {
        await sendEmailVerificationOtpEmail({
          request: context?.request,
          to: email,
          otp,
          type,
        });
      },
    }),
    twoFactor({
      issuer: "Krakstack Auth",
      otpOptions: {
        sendOTP: async ({ user, otp }, context) => {
          await sendTwoFactorOtpEmail({
            request: context?.request,
            to: user.email,
            otp,
          });
        },
        period: 5,
        allowedAttempts: 5,
        storeOTP: "encrypted",
      },
    }),
    organization({
      allowUserToCreateOrganization: true,
      organizationLimit: 10,
      membershipLimit: 100,
    }),
    apiKey([
      {
        configId: "user",
        defaultPrefix: "user_",
        references: "user",
      },
      {
        configId: "organization",
        defaultPrefix: "org_",
        references: "organization",
      },
    ]),
    oauthProvider({
      loginPage: "/sign-in",
      consentPage: "/consent",
      allowDynamicClientRegistration: false,
      silenceWarnings: {
        oauthAuthServerConfig: true,
      },
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
