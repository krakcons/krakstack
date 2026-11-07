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
import { SendCampaigns } from "../packages/send/src/campaign";
import { sendCampaignRoutes } from "../packages/send/src/campaign.api.builder";
import { withSend } from "../packages/send/test/fixtures/send";
import { sendCampaignMessages } from "../src/agent-examples/send/campaign.messages";

for (const locale of ["en", "fr"] as const) {
  test(`protected campaign admin creates, schedules, pauses, resumes and cancels in ${locale}`, async ({
    page,
    request,
  }, testInfo) => {
    if (!process.env.TEST_DATABASE_URL)
      throw new Error("TEST_DATABASE_URL is required");
    const m = sendCampaignMessages(locale);
    await Effect.runPromise(
      withSend(({ campaigns, send, runtime, transport }) =>
        Effect.gen(function* () {
          const contact = yield* send.createContact({
            email: `browser-${locale}@example.com`,
            locale,
          });
          yield* send.recordEmailConsent({
            contactId: contact.id,
            requestId: "browser-grant",
            status: "subscribed",
            source: "test",
            actor: "host",
            noticeVersion: "v1",
          });
          const admin = Layer.succeed(SendAdmin, (effect) =>
            Effect.gen(function* () {
              const req = yield* HttpServerRequest.HttpServerRequest;
              if (req.headers.cookie !== "send-test-admin=allowed")
                return yield* new HttpApiError.Forbidden({});
              return yield* effect.pipe(
                Effect.provideService(CurrentSendAdmin, {
                  reference: "test-host:admin",
                }),
              );
            }),
          );
          const app = yield* HttpRouter.toHttpEffect(
            sendCampaignRoutes.pipe(
              Layer.provide(admin),
              Layer.provide(Layer.succeed(SendCampaigns, campaigns)),
            ),
          );
          const server = yield* NodeHttpServer.make(createServer, {
            host: "127.0.0.1",
            port: 0,
          });
          yield* server.serve(app);
          if (server.address._tag === "UnixPathAddress")
            return yield* Effect.die(new Error("Expected TCP"));
          const target = `http://127.0.0.1:${server.address.port}`;
          // A loopback-only Vite host fixture, never a public application route.
          const vite = yield* Effect.acquireRelease(
            Effect.promise(() =>
              createViteServer({
                configFile: false,
                root: fileURLToPath(new URL("..", import.meta.url)),
                // Parallel hosts must not overwrite each other's optimized dependencies.
                cacheDir: testInfo.outputPath("vite-cache"),
                plugins: [
                  react(),
                  tailwind(),
                  {
                    name: "test-host-admin-guard",
                    configureServer: (s) => {
                      s.middlewares.use((req, res, next) => {
                        if (
                          req.url?.startsWith("/e2e/fixtures/campaign.html") &&
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
            return yield* Effect.die(new Error("Missing test host URL"));
          yield* Effect.promise(async () => {
            expect(
              (await request.get(`${origin}api/send/campaigns`)).status(),
            ).toBe(403);
            expect(
              (
                await request.get(`${origin}e2e/fixtures/campaign.html`)
              ).status(),
            ).toBe(403);
            await page
              .context()
              .addCookies([
                { name: "send-test-admin", value: "allowed", url: origin },
              ]);
            await page.goto(
              `${origin}e2e/fixtures/campaign.html?locale=${locale}`,
            );
            await page
              .getByRole("button", { name: m.create, exact: true })
              .click();
            const dialog = page.getByRole("dialog");
            await dialog
              .getByLabel(m.name, { exact: true })
              .fill("Browser news");
            await dialog
              .getByLabel(m.from, { exact: true })
              .fill("sender@example.com");
            for (const language of [m.english, m.french]) {
              const group = dialog.getByRole("group", {
                name: language,
                exact: true,
              });
              await group
                .getByLabel(m.subject, { exact: true })
                .fill(`${language} subject`);
              await group
                .getByLabel(m.text, { exact: true })
                .fill(`${language} body`);
            }
            await dialog
              .getByRole("button", { name: m.save, exact: true })
              .click();
            await expect(dialog).not.toBeVisible();
            await page
              .getByRole("button", { name: m.manage, exact: true })
              .click();
            await page
              .getByRole("textbox", { name: m.scheduledFor, exact: true })
              .fill("2026-01-01T00:00:00Z");
            await page
              .getByRole("button", { name: m.schedule, exact: true })
              .click();
            await expect(
              page.getByRole("button", { name: m.pause, exact: true }),
            ).toBeEnabled();
            await page
              .getByRole("button", { name: m.pause, exact: true })
              .click();
            await expect(
              page.getByRole("button", { name: m.resume, exact: true }),
            ).toBeEnabled();
            await page
              .getByRole("button", { name: m.resume, exact: true })
              .click();
            await expect(
              page.getByRole("button", { name: m.pause, exact: true }),
            ).toBeEnabled();
          });
          const list = yield* campaigns.list({});
          const campaign = list.items[0];
          expect(campaign.status).toBe("scheduled");
          yield* campaigns.processBatch({
            id: campaign.id,
            batchNumber: campaign.batchNumber,
          });
          yield* Effect.promise(async () => {
            await page
              .getByRole("button", { name: m.cancel, exact: true })
              .click();
            const dialog = page.getByRole("dialog");
            await dialog
              .getByRole("button", { name: m.confirmCancel, exact: true })
              .click();
            await expect(dialog).not.toBeVisible();
            await expect(
              page.getByRole("button", { name: m.cancel, exact: true }),
            ).not.toBeVisible();
          });
          expect((yield* campaigns.get({ id: campaign.id })).status).toBe(
            "cancelled",
          );
          yield* runtime.runDeliveryWorkerOnce;
          expect(transport.sent).toHaveLength(0);
          expect(yield* campaigns.report({ id: campaign.id })).toMatchObject({
            audience: 1,
            published: 1,
            accepted: 0,
            suppressed: 1,
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
