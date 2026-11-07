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
import { dataTableMessages } from "../src/components/ui/data-table";
import {
  CurrentDeliveryAdmin,
  DeliveryAdmin,
} from "../packages/notifications/src/admin/delivery.api";
import { deliveryAdminRoutes } from "../packages/notifications/src/admin/delivery.api.builder";
import { NotificationDeliveryAdmin } from "../packages/notifications/src/admin/deliveries";
import { notificationDeliveryMessages } from "../src/agent-examples/send/delivery.messages";

for (const locale of ["en", "fr"] as const) {
  test(`operations console exposes bounce evidence, audited suppression changes and recipient history in ${locale}`, async ({
    page,
    request,
  }, testInfo) => {
    if (!process.env.TEST_DATABASE_URL)
      throw new Error("TEST_DATABASE_URL is required");
    const m = sendOperationsMessages(locale);
    const tableMessages = dataTableMessages(locale);
    const cm = sendCampaignMessages(locale);
    const dm = notificationDeliveryMessages(locale);
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
          for (let n = 0; n < 23; n++)
            yield* f.send.createContact({
              email: `table-${String(n).padStart(2, "0")}@example.com`,
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
          const staffScope = {
            recipientUserId: "staff-account",
            organizationId: "staff-org",
            workspaceId: null,
          };
          const staffGuard = Layer.succeed(DeliveryAdmin, (effect) =>
            Effect.gen(function* () {
              const req = yield* HttpServerRequest.HttpServerRequest;
              if (!req.headers.cookie?.includes("staff-test-admin=allowed"))
                return yield* new HttpApiError.Forbidden({});
              return yield* effect.pipe(
                Effect.provideService(CurrentDeliveryAdmin, {
                  reference: "host:test-staff",
                  access: {
                    contactManaged: true,
                    engineScopes: [{ _tag: "Exact", scope: staffScope }],
                    referenceNamespaces: ["order"],
                  },
                }),
              );
            }),
          );
          const routes = Layer.mergeAll(
            sendAdminRoutes,
            sendCampaignRoutes,
            sendOperationsRoutes,
            deliveryAdminRoutes,
          ).pipe(
            Layer.provide(guard),
            Layer.provide(staffGuard),
            Layer.provide(
              Layer.mergeAll(
                Layer.succeed(KrakSend, f.send),
                Layer.succeed(SendCampaigns, f.campaigns),
                Layer.succeed(SendOperations, f.operations),
                Layer.succeed(NotificationDeliveryAdmin, f.deliveries),
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
              .getByRole("button", {
                name: messages.kraksend_contacts_title({}, o),
                exact: true,
              })
              .click();
            await page
              .getByRole("button", {
                name: tableMessages.goToNextPage,
                exact: true,
              })
              .click();
            await expect(
              page.getByText("table-22@example.com", { exact: true }),
            ).toBeVisible();
            await page
              .getByPlaceholder(tableMessages.filter, { exact: true })
              .fill(email);
            await expect(page.getByText(email, { exact: true })).toBeVisible();
            await expect(
              page.getByText("table-22@example.com", { exact: true }),
            ).not.toBeVisible();
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
            await page
              .getByRole("menuitem", {
                name: tableMessages.filters,
                exact: true,
              })
              .click();
            await page
              .getByRole("menuitem", { name: m.correlation, exact: true })
              .hover();
            await page
              .getByRole("menuitemcheckbox", { name: m.pending, exact: true })
              .click();
            await page.keyboard.press("Escape");
            await page.keyboard.press("Escape");
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
          // Product emails already published through the engine need no contact
          // records, republishing, or dispatch-policy changes to become visible.
          const publishProduct = (
            key: string,
            organizationId = staffScope.organizationId,
          ) =>
            f.notifications.publish({
              idempotencyKey: key,
              scope: { ...staffScope, organizationId },
              eventKey: key,
              eventVersion: 1,
              deliveries: [
                {
                  key: "email",
                  channel: "email",
                  purpose: "transactional",
                  template: "order-receipt-v2",
                  recipientAddress: `${key}@example.com`,
                  recipientName: null,
                  payloadVersion: 1,
                  payload: {
                    text: "Private product body",
                    token: "private-product-token",
                  },
                  references: [
                    { namespace: "order", value: "order-browser" },
                    {
                      namespace: "internal",
                      value: "private-product-reference",
                    },
                  ],
                },
              ],
            });
          for (let n = 0; n < 23; n++)
            yield* publishProduct(`staff-order-${String(n).padStart(2, "0")}`);
          yield* f.runtime.runDeliveryWorkerOnce;
          const hidden = yield* publishProduct("hidden-product", "another-org");
          yield* Effect.promise(async () => {
            expect(
              (
                await page.request.get(
                  `${origin}api/send/staff/deliveries/overview`,
                )
              ).status(),
            ).toBe(403);
            await page
              .context()
              .addCookies([
                { name: "staff-test-admin", value: "allowed", url: origin },
              ]);
            const forbidden = await page.request.get(
              `${origin}api/send/staff/deliveries/${hidden.deliveryIds[0]}`,
            );
            expect(forbidden.status()).toBe(404);
            await page
              .getByRole("navigation")
              .getByRole("button", { name: dm.title, exact: true })
              .click();
            await expect(
              page
                .getByRole("group", { name: m.metrics.total, exact: true })
                .getByText("25", { exact: true }),
            ).toBeVisible();
            await expect(
              page.getByText(dm.feedbackNotice, { exact: true }),
            ).toBeVisible();
            await page
              .getByRole("tab", { name: dm.sources.engine, exact: true })
              .click();
            await expect(
              page
                .getByRole("group", { name: m.metrics.total, exact: true })
                .getByText("23", { exact: true }),
            ).toBeVisible();
            await expect(
              page
                .getByRole("group", {
                  name: dm.feedbackUnavailable,
                  exact: true,
                })
                .getByText("23", { exact: true }),
            ).toBeVisible();
            await page
              .getByRole("tab", { name: m.views.activity, exact: true })
              .click();
            await page
              .getByRole("button", {
                name: tableMessages.goToNextPage,
                exact: true,
              })
              .click();
            await expect(
              page.getByText("staff-order-22", { exact: true }),
            ).toBeVisible();
            await page
              .getByPlaceholder(tableMessages.filter, { exact: true })
              .fill("staff-order-00");
            const product = page.getByRole("row").filter({
              has: page.getByText("staff-order-00@example.com", {
                exact: true,
              }),
            });
            await product
              .getByRole("button", { name: m.inspect, exact: true })
              .click();
            const detail = page.getByRole("dialog");
            await expect(
              detail.getByText("order-receipt-v2", { exact: true }),
            ).toBeVisible();
            await expect(
              detail.getByText("order-browser", { exact: true }),
            ).toBeVisible();
            await expect(
              detail.getByText("staff-account", { exact: true }),
            ).toBeVisible();
            await expect(
              detail.getByRole("cell", { name: m.outcomes.Sent, exact: true }),
            ).toBeVisible();
            await expect(
              detail.getByRole("button", { name: m.contactId, exact: true }),
            ).toHaveCount(0);
            await expect(
              detail.getByRole("button", {
                name: m.addSuppression,
                exact: true,
              }),
            ).toHaveCount(0);
            const body = await detail.textContent();
            expect(body).not.toMatch(
              /Private product body|private-product-token|private-product-reference/,
            );
            await page.keyboard.press("Escape");
            await expect(detail).not.toBeVisible();
            await page
              .getByRole("tab", { name: dm.sources.contacts, exact: true })
              .click();
            await expect(
              page
                .getByRole("group", { name: m.metrics.total, exact: true })
                .getByText("2", { exact: true }),
            ).toBeVisible();
            await page
              .getByRole("tab", { name: m.views.activity, exact: true })
              .click();
            const contactRow = page
              .getByRole("row")
              .filter({ has: page.getByText(email, { exact: true }) });
            await contactRow
              .getByRole("button", { name: m.inspect, exact: true })
              .click();
            await expect(
              detail.getByText(email, { exact: true }),
            ).toBeVisible();
            // Revocation must hide rows, pagination totals and inspection data.
            await page.context().clearCookies({ name: "staff-test-admin" });
            await detail
              .getByRole("button", { name: m.refresh, exact: true })
              .click();
            await expect(detail.getByRole("alert")).toHaveText(m.failed);
            await expect(detail.getByText(email, { exact: true })).toHaveCount(
              0,
            );
            await page.keyboard.press("Escape");
            await expect(detail).not.toBeVisible();
            await expect(contactRow).toHaveCount(0);
            await expect(
              page.getByText(tableMessages.results(0), { exact: true }),
            ).toBeVisible();
          });
          expect((yield* f.send.listContacts({})).items).toHaveLength(25);
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
