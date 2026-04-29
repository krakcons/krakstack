import { createFileRoute } from "@tanstack/react-router";
import { count } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@/services/database";
import { oauthClient, oauthConsent, user } from "@/db/auth-schema";

export const Route = createFileRoute("/api/admin/oauth-stats")({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        const session = await auth.api.getSession({
          headers: request.headers,
        });

        if (!session) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }

        const role = (session.user as Record<string, unknown> | undefined)
          ?.role;
        const isAdmin =
          typeof role === "string" &&
          role.split(",").some((item) => item.trim() === "admin");

        if (!isAdmin) {
          return new Response(JSON.stringify({ error: "Forbidden" }), {
            status: 403,
            headers: { "Content-Type": "application/json" },
          });
        }

        try {
          const clients = await db
            .select({
              id: oauthClient.id,
              clientId: oauthClient.clientId,
              name: oauthClient.name,
              icon: oauthClient.icon,
              disabled: oauthClient.disabled,
            })
            .from(oauthClient);

          const consentCounts = await db
            .select({
              clientId: oauthConsent.clientId,
              userCount: count(oauthConsent.userId),
            })
            .from(oauthConsent)
            .groupBy(oauthConsent.clientId);

          const [{ count: totalUsers }] = await db
            .select({ count: count() })
            .from(user);

          const consentMap = new Map(
            consentCounts.map((c) => [c.clientId, c.userCount]),
          );

          const clientStats = clients.map((c) => ({
            ...c,
            userCount: consentMap.get(c.clientId) ?? 0,
          }));

          return new Response(
            JSON.stringify({
              totalUsers,
              totalClients: clients.length,
              clients: clientStats,
            }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          );
        } catch (err) {
          console.error("Failed to fetch OAuth stats:", err);
          return new Response(
            JSON.stringify({ error: "Internal server error" }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }
      },
    },
  },
});