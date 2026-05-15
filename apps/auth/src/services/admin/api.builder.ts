import { Effect } from "effect";
import { count } from "drizzle-orm";
import { HttpApiBuilder, HttpApiError } from "effect/unstable/httpapi";

import { Api } from "@/api";
import { oauthClient, oauthConsent, user } from "@/db/auth-schema";
import { auth } from "@/services/auth/config";
import { db } from "@/services/database";

const userRole = (value: unknown) => {
  if (typeof value !== "object" || value === null || !("role" in value)) {
    return undefined;
  }
  return Reflect.get(value, "role");
};

const hasAdminRole = (role: unknown) =>
  typeof role === "string" &&
  role.split(",").some((item) => item.trim() === "admin");

const internalServerError = (error: unknown) => {
  console.error("Failed to fetch OAuth stats:", error);
  return new HttpApiError.InternalServerError({});
};

export const adminApiHandler = HttpApiBuilder.group(Api, "admin", (handlers) =>
  handlers.handle("oauthStats", ({ request }) =>
    Effect.gen(function* () {
      const session = yield* Effect.tryPromise({
        try: () => auth.api.getSession({ headers: request.headers }),
        catch: internalServerError,
      });

      if (!session) {
        return yield* new HttpApiError.Unauthorized({});
      }

      if (!hasAdminRole(userRole(session.user))) {
        return yield* new HttpApiError.Forbidden({});
      }

      const clients = yield* Effect.tryPromise({
        try: () =>
          db
            .select({
              id: oauthClient.id,
              clientId: oauthClient.clientId,
              name: oauthClient.name,
              icon: oauthClient.icon,
              disabled: oauthClient.disabled,
            })
            .from(oauthClient),
        catch: internalServerError,
      });

      const consentCounts = yield* Effect.tryPromise({
        try: () =>
          db
            .select({
              clientId: oauthConsent.clientId,
              userCount: count(oauthConsent.userId),
            })
            .from(oauthConsent)
            .groupBy(oauthConsent.clientId),
        catch: internalServerError,
      });

      const userTotals = yield* Effect.tryPromise({
        try: () => db.select({ count: count() }).from(user),
        catch: internalServerError,
      });

      const totalUsers = Number(userTotals[0]?.count ?? 0);
      const consentMap = new Map(
        consentCounts.map((c) => [c.clientId, Number(c.userCount)]),
      );

      const clientStats = clients.map((client) => ({
        ...client,
        userCount: consentMap.get(client.clientId) ?? 0,
      }));

      return {
        totalUsers,
        totalClients: clients.length,
        clients: clientStats,
      };
    }),
  ),
);
