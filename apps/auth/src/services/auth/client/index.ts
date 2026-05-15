import { createAuthClient } from "better-auth/react";
import {
  adminClient,
  emailOTPClient,
  organizationClient,
  twoFactorClient,
} from "better-auth/client/plugins";
import { oauthProviderClient } from "@better-auth/oauth-provider/client";
import { apiKeyClient } from "@better-auth/api-key/client";

export const authClient = createAuthClient({
  plugins: [
    adminClient(),
    emailOTPClient(),
    organizationClient(),
    twoFactorClient({
      twoFactorPage: "/2fa",
    }),
    apiKeyClient(),
    oauthProviderClient(),
  ],
});
