import { apiKeyClient } from "@better-auth/api-key/client";
import { createAuthClient } from "better-auth/react";
import {
  genericOAuthClient,
  organizationClient,
  twoFactorClient,
} from "better-auth/client/plugins";

export const centralAuthBaseUrl = import.meta.env.VITE_KRAKSTACK_AUTH_URL;

export const centralAuthUrl = (path: string) =>
  new URL(path, centralAuthBaseUrl).toString();

export const centralLoginUrl = (
  callbackURL: string,
  locale: "en" | "fr" = "en",
) => {
  const url = new URL(`/${locale}/sign-in`, centralAuthBaseUrl);
  url.searchParams.set("redirect", callbackURL);
  return url.toString();
};

export const authClient = createAuthClient({
  baseURL: centralAuthBaseUrl,
  fetchOptions: {
    credentials: "include",
  },
  plugins: [
    genericOAuthClient(),
    twoFactorClient({
      twoFactorPage: centralAuthUrl("/2fa"),
    }),
    organizationClient(),
    apiKeyClient(),
  ],
});
