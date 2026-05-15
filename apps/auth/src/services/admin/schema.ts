import { Schema } from "effect";

export const OAuthClientStats = Schema.Struct({
  id: Schema.String,
  clientId: Schema.String,
  name: Schema.NullOr(Schema.String),
  icon: Schema.NullOr(Schema.String),
  disabled: Schema.NullOr(Schema.Boolean),
  userCount: Schema.Number,
}).annotate({
  identifier: "OAuthClientStats",
  title: "OAuth client stats",
  description: "Usage statistics for a registered OAuth client.",
  examples: [
    {
      id: "client-row-id",
      clientId: "oauth-client-id",
      name: "Example app",
      icon: null,
      disabled: false,
      userCount: 12,
    },
  ],
});

export const OAuthStatsResponse = Schema.Struct({
  totalUsers: Schema.Number,
  totalClients: Schema.Number,
  clients: Schema.Array(OAuthClientStats),
}).annotate({
  identifier: "OAuthStatsResponse",
  title: "OAuth stats response",
  description: "Administrative OAuth usage statistics.",
  examples: [
    {
      totalUsers: 42,
      totalClients: 1,
      clients: [
        {
          id: "client-row-id",
          clientId: "oauth-client-id",
          name: "Example app",
          icon: null,
          disabled: false,
          userCount: 12,
        },
      ],
    },
  ],
});
