import { createFileRoute } from "@tanstack/react-router";
import { oauthProviderOpenIdConfigMetadata } from "@better-auth/oauth-provider";

import { auth } from "@/services/auth/config";

const handler = oauthProviderOpenIdConfigMetadata(auth, {
  headers: {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET",
  },
});

export const Route = createFileRoute("/api/auth/.well-known/openid-configuration")({
  server: {
    handlers: {
      GET: ({ request }) => handler(request),
    },
  },
});
