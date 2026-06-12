import { apiKeyClient } from "@better-auth/api-key/client";
import { createAuthClient } from "better-auth/react";
import {
  organizationClient,
  twoFactorClient,
} from "better-auth/client/plugins";

export const centralAuthUrl = (path: string) =>
  new URL(path, import.meta.env.VITE_KRAKSTACK_AUTH_URL).toString();

export const centralLoginUrl = (
  callbackURL: string,
  locale: "en" | "fr" = "en",
) => {
  const url = new URL(
    `/${locale}/sign-in`,
    import.meta.env.VITE_KRAKSTACK_AUTH_URL,
  );
  url.searchParams.set("redirect", callbackURL);
  return url.toString();
};

export const centralAuthClient = createAuthClient({
  baseURL: import.meta.env.VITE_KRAKSTACK_AUTH_URL,
  fetchOptions: {
    credentials: "include",
  },
  plugins: [
    twoFactorClient({
      twoFactorPage: `${import.meta.env.VITE_KRAKSTACK_AUTH_URL}/2fa`,
    }),
    organizationClient(),
    apiKeyClient(),
  ],
});
