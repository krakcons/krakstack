import { createAuthUiClient } from "@krak-stack/auth";

export const centralAuthBaseUrl = import.meta.env.VITE_KRAKSTACK_AUTH_URL;

export const centralLoginUrl = (
  callbackURL: string,
  locale: "en" | "fr" = "en",
) => {
  const url = new URL(`/${locale}/sign-in`, centralAuthBaseUrl);
  url.searchParams.set("redirect", callbackURL);
  return url.toString();
};

export const authClient = createAuthUiClient(centralAuthBaseUrl);
