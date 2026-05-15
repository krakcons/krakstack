import { oauthProviderOpenIdConfigMetadata } from "@better-auth/oauth-provider";
import { createFileRoute } from "@tanstack/react-router";

import { effectifyWebHandler, runHttpResponse } from "@/lib/http";
import { auth } from "@/services/auth/config";

const handler = oauthProviderOpenIdConfigMetadata(auth, {
  headers: {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET",
  },
});
const handlerEffect = effectifyWebHandler((request) => handler(request));

export const Route = createFileRoute("/.well-known/openid-configuration")({
  server: {
    handlers: {
      GET: ({ request }) => runHttpResponse(request, handlerEffect(request)),
      OPTIONS: ({ request }) =>
        runHttpResponse(request, handlerEffect(request)),
    },
  },
});
