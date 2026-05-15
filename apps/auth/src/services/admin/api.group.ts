import {
  HttpApiEndpoint,
  HttpApiError,
  HttpApiGroup,
  OpenApi,
} from "effect/unstable/httpapi";

import { OAuthStatsResponse } from "./schema";

export const AdminApiGroup = HttpApiGroup.make("admin")
  .add(
    HttpApiEndpoint.get("oauthStats", "/admin/oauth-stats", {
      success: OAuthStatsResponse,
      error: [
        HttpApiError.Unauthorized,
        HttpApiError.Forbidden,
        HttpApiError.InternalServerError,
      ],
    }).annotateMerge(
      OpenApi.annotations({
        title: "OAuth stats",
        summary: "Get OAuth usage statistics",
        description:
          "Returns OAuth client and consent counts for authenticated administrators.",
      }),
    ),
  )
  .annotateMerge(
    OpenApi.annotations({
      title: "Admin",
      description: "Administrative KrakStack authentication endpoints.",
    }),
  );
