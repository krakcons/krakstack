import { apiKeyClient } from "@better-auth/api-key/client";
import { createAuthClient } from "better-auth/react";
import {
  organizationClient,
  twoFactorClient,
} from "better-auth/client/plugins";

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
