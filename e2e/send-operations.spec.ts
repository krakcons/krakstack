import { test, expect } from "@playwright/test";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import { createServer as createViteServer } from "vite";
import react from "@vitejs/plugin-react";
import tailwind from "@tailwindcss/vite";
import { NodeHttpServer, NodeServices } from "@effect/platform-node";
import { Effect, Layer } from "effect";
import { HttpRouter, HttpServer, HttpServerRequest } from "effect/http";
import { HttpApiError } from "effect/http-api";
import { CurrentSendAdmin, SendAdmin } from "../packages/send/src/api";
import { KrakSend } from "../packages/send/src/index";
import { SendCampaigns } from "../packages/send/src/campaign";
import { SendOperations } from "../packages/send/src/operations";
import { sendAdminRoutes } from "../packages/send/src/api.builder";
import { sendCampaignRoutes } from "../packages/send/src/campaign.api.builder";
import { sendOperationsRoutes } from "../packages/send/src/operations.api.builder";
import { withSend } from "../packages/send/test/fixtures/send";
import { sendOperationsMessages } from "../src/agent-examples/send/operations.messages";
import { sendCampaignMessages } from "../src/agent-examples/send/campaign.messages";
import * as messages from "../src/paraglide/messages";

for (const locale of ["en", "fr"] as const) {
  test(`operations console exposes bounce evidence, audited suppression changes and recipient history in ${locale}`, async ({
    page,
    request,
  }, testInfo) => {
    if (!process.env.TEST_DATABASE_URL)
      throw new Error("TEST_DATABASE_URL is required");
    const m = sendOperationsMessages(locale);
    const cm = sendCampaignMessages(locale);
    const o = { locale };
    await Effect.runPromise(
      withSend((f) =>
        Effect.gen(function* () {
          const email = `browser-${locale}@example.com`;
          const contact = yield* f.send.createContact({
            email,
            locale,
            name: "Browser recipient",
          });
          yield* f.send.recordEmailConsent({
            contactId: contact.id,
            requestId: "grant",
            status: "subscribed",
            source: "browser-fixture",
            actor: "host:fixture",
            noticeVersion: "v1",
          });
          yield* f.send.withdrawEmailConsent({ id: contact.id });
          const queued = yield* f.send.queueEmail({
            requestId: "accepted",
            contactId: contact.id,
            purpose: "transactional",
            eventKey: "browser-ops",
            email: { subject: "Operational message", text: "Private content" },
          });
          yield* f.runtime.runDeliveryWorkerOnce;
          const detail = yield* f.notifications.getDelivery({
            scope: {
              recipientUserId: null,
              organizationId: null,
              workspaceId: null,
            },
            deliveryId: queued.deliveryId,
          });
          const providerMessageId = detail.delivery.providerMessageId;
          if (!providerMessageId)
            return yield* Effect.die(new Error("Missing provider acceptance"));
          for (const eventId of ["bounce-one", "bounce-two"])
            yield* f.feedback.record({
              provider: "fake",
              eventId,
              providerMessageId,
              recipientAddress: email,
              kind: "hard_bounce",
              occurredAt: new Date(),
            });
          yield* f.feedback.record({
            provider: "fake",
            eventId: "unmatched-bounce",
            providerMessageId: "unknown",
            recipientAddress: "pending@example.com",
            kind: "hard_bounce",
            occurredAt: new Date(),
          });
          const other = yield* f.send.createContact({
            email: "other@example.com",
          });
          yield* f.send.queueEmail({
            requestId: "pending",
            contactId: other.id,
            purpose: "transactional",
            eventKey: "browser-ops",
            email: { subject: "Pending message", text: "Body" },
          });
          yield* f.send.recordEmailConsent({
            contactId: other.id,
            requestId: "other-grant",
            status: "subscribed",
            source: "browser-fixture",
            actor: "host:fixture",
            noticeVersion: "v1",
          });
          const campaign = yield* f.campaigns.create({
            actor: "host:fixture",
            payload: {
              requestId: "campaign",
              name: "Visibility campaign",
              from: "sender@example.com",
              audience: { _tag: "AllSubscribed" },
              content: {
                en: {
                  subject: "News",
                  text: "Body",
                  unsubscribeText: "Unsubscribe",
                },
                fr: {
                  subject: "Nouvelles",
                  text: "Texte",
                  unsubscribeText: "Désabonner",
                },
              },
            },
          });
          yield* f.campaigns.schedule({
            id: campaign.id,
            scheduledFor: new Date(0),
          });
          yield* f.campaigns.transition({ id: campaign.id, action: "cancel" });
          const guard = Layer.succeed(SendAdmin, (effect) =>
            Effect.gen(function* () {
              const req = yield* HttpServerRequest.HttpServerRequest;
              if (req.headers.cookie !== "send-test-admin=allowed")
                return yield* new HttpApiError.Forbidden({});
              return yield* effect.pipe(
                Effect.provideService(CurrentSendAdmin, {
                  reference: "host:test-admin",
                }),
              );
            }),
          );
          const routes = Layer.mergeAll(
            sendAdminRoutes,
            sendCampaignRoutes,
            sendOperationsRoutes,
          ).pipe(
            Layer.provide(guard),
            Layer.provide(
              Layer.mergeAll(
                Layer.succeed(KrakSend, f.send),
                Layer.succeed(SendCampaigns, f.campaigns),
                Layer.succeed(SendOperations, f.operations),
              ),
            ),
          );
          const app = yield* HttpRouter.toHttpEffect(routes);
          const server = yield* NodeHttpServer.make(createServer, {
            host: "127.0.0.1",
            port: 0,
          });
          yield* server.serve(app);
          if (server.address._tag === "UnixPathAddress")
            return yield* Effect.die(new Error("Expected TCP"));
          const target = `http://127.0.0.1:${server.address.port}`;
          const vite = yield* Effect.acquireRelease(
            Effect.promise(() =>
              createViteServer({
                configFile: false,
                root: fileURLToPath(new URL("..", import.meta.url)),
                cacheDir: testInfo.outputPath("vite-cache"),
                plugins: [
                  react(),
                  tailwind(),
                  {
                    name: "operations-test-guard",
                    configureServer: (s) => {
                      s.middlewares.use((req, res, next) => {
                        if (
                          req.url?.startsWith(
                            "/e2e/fixtures/operations.html",
                          ) &&
                          req.headers.cookie !== "send-test-admin=allowed"
                        ) {
                          res.statusCode = 403;
                          res.end();
                          return;
                        }
                        next();
                      });
                    },
                  },
                ],
                resolve: {
                  alias: {
                    "@": fileURLToPath(new URL("../src", import.meta.url)),
                  },
                  dedupe: ["react", "react-dom", "effect"],
                },
                server: {
                  host: "127.0.0.1",
                  port: 0,
                  proxy: { "/api": target },
                },
              }).then((s) => s.listen()),
            ),
            (s) => Effect.promise(() => s.close()),
          );
          const origin = vite.resolvedUrls?.local[0];
          if (!origin)
            return yield* Effect.die(new Error("Missing host origin"));
          yield* Effect.promise(async () => {
            expect(
              (
                await request.get(`${origin}api/send/operations/overview`)
              ).status(),
            ).toBe(403);
            expect(
              (
                await request.get(`${origin}e2e/fixtures/operations.html`)
              ).status(),
            ).toBe(403);
            await page
              .context()
              .addCookies([
                { name: "send-test-admin", value: "allowed", url: origin },
              ]);
            await page.goto(
              `${origin}e2e/fixtures/operations.html?locale=${locale}`,
            );
            await expect(
              page
                .getByRole("group", { name: m.metrics.total, exact: true })
                .getByText("2", { exact: true }),
            ).toBeVisible();
            await expect(
              page
                .getByRole("group", { name: m.metrics.accepted, exact: true })
                .getByText("1", { exact: true }),
            ).toBeVisible();
            await expect(
              page
                .getByRole("group", {
                  name: m.metrics.hardBounced,
                  exact: true,
                })
                .getByText("1", { exact: true }),
            ).toBeVisible();
            await page
              .getByRole("tab", { name: m.views.activity, exact: true })
              .click();
            const deliveryRow = page
              .getByRole("row")
              .filter({ has: page.getByText(email, { exact: true }) });
            await deliveryRow
              .getByRole("button", { name: m.inspect, exact: true })
              .click();
            const inspection = page.getByRole("dialog");
            await expect(
              inspection.getByText(providerMessageId, { exact: true }).first(),
            ).toBeVisible();
            await inspection
              .getByRole("button", { name: m.contactId, exact: true })
              .click();
            await expect(
              page.getByRole("heading", {
                name: messages.kraksend_ops_contact_history({}, o),
              }),
            ).toBeVisible();
            await expect(
              page.getByText("browser-fixture", { exact: true }),
            ).toBeVisible();
            await page
              .getByRole("navigation")
              .getByRole("button", { name: m.title, exact: true })
              .click();
            await page
              .getByRole("tab", { name: m.views.feedback, exact: true })
              .click();
            await expect(
              page.getByText("bounce-one", { exact: true }),
            ).toBeVisible();
            await expect(
              page.getByText("unmatched-bounce", { exact: true }),
            ).toBeVisible();
            await page.getByLabel(m.correlation, { exact: true }).click();
            await page
              .getByRole("option", { name: m.pending, exact: true })
              .click();
            await page
              .getByRole("button", { name: m.apply, exact: true })
              .click();
            await expect(
              page.getByText("bounce-one", { exact: true }),
            ).not.toBeVisible();
            await expect(
              page.getByText("unmatched-bounce", { exact: true }),
            ).toBeVisible();
            await page
              .getByRole("tab", { name: m.views.suppressions, exact: true })
              .click();
            await page
              .getByRole("button", { name: m.removeSuppression, exact: true })
              .click();
            const remove = page.getByRole("dialog");
            await remove
              .getByLabel(m.reason, { exact: true })
              .fill("Reviewed bounce evidence");
            await remove
              .getByRole("button", { name: m.confirm, exact: true })
              .click();
            await expect(remove).not.toBeVisible();
            await expect(
              page.getByRole("button", {
                name: m.removeSuppression,
                exact: true,
              }),
            ).not.toBeVisible();
            await page
              .getByRole("button", { name: m.addSuppression, exact: true })
              .click();
            const add = page.getByRole("dialog");
            await add
              .getByLabel(m.email, { exact: true })
              .fill("other@example.com");
            await add
              .getByLabel(m.reason, { exact: true })
              .fill("Operator investigation");
            await add
              .getByRole("button", { name: m.confirm, exact: true })
              .click();
            await expect(add).not.toBeVisible();
            await expect(
              page.getByRole("button", {
                name: m.removeSuppression,
                exact: true,
              }),
            ).toBeVisible();
            await page
              .getByRole("tab", { name: m.views.audit, exact: true })
              .click();
            await expect(
              page.getByText("Reviewed bounce evidence", { exact: true }),
            ).toBeVisible();
            await expect(
              page.getByText("host:test-admin", { exact: true }).first(),
            ).toBeVisible();
            await page
              .getByRole("navigation")
              .getByRole("button", { name: cm.title, exact: true })
              .click();
            await page
              .getByRole("button", { name: cm.manage, exact: true })
              .click();
            await page
              .getByRole("button", { name: cm.metrics.audience, exact: true })
              .click();
            await expect(
              page.getByText("campaign_cancelled", { exact: true }),
            ).toBeVisible();
          });
          expect(
            (yield* f.send.getContact({ id: contact.id })).emailConsent,
          ).toBe("unsubscribed");
          yield* f.runtime.runDeliveryWorkerOnce;
          expect(yield* f.operations.overview({})).toMatchObject({
            total: 2,
            accepted: 1,
            hardBounced: 1,
            suppressed: 1,
            activeSuppressions: 1,
          });
          yield* Effect.promise(async () => {
            await page
              .getByRole("tab", { name: m.views.overview, exact: true })
              .click();
            await page
              .getByRole("button", { name: m.refresh, exact: true })
              .click();
            await expect(
              page
                .getByRole("group", { name: m.metrics.suppressed, exact: true })
                .getByText("1", { exact: true }),
            ).toBeVisible();
          });
        }).pipe(
          Effect.scoped,
          Effect.provide(
            HttpServer.layerServices.pipe(
              Layer.provideMerge(NodeServices.layer),
            ),
          ),
        ),
      ),
    );
  });
}
