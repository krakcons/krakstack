import { test, expect } from "@playwright/test";
import { createServer } from "node:http";
import { NodeHttpServer, NodeServices } from "@effect/platform-node";
import { Effect, Layer } from "effect";
import { HttpRouter } from "effect/http";
import { SendUnsubscribe } from "../packages/send/src/unsubscribe";
import { withSend } from "../packages/send/test/fixtures/send";
import { sendUnsubscribeRoutes } from "../src/agent-examples/send/unsubscribe";
import * as m from "../src/paraglide/messages";

for (const locale of ["en", "fr"] as const) {
  test(`contact unsubscribes in ${locale} without login and queued optional email is blocked`, async ({
    page,
  }) => {
    if (!process.env.TEST_DATABASE_URL)
      throw new Error(
        "TEST_DATABASE_URL is required for database-backed E2E tests",
      );
    await Effect.runPromise(
      withSend(({ send, unsubscribe, runtime, notifications, transport }) =>
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
          const link = new URL(
            yield* unsubscribe.createLink({ id: contact.id }),
          );
          link.searchParams.set("locale", locale);
          const queued = yield* send.queueEmail({
            contactId: contact.id,
            requestId: "browser-email",
            purpose: "marketing",
            eventKey: "browser-test",
            email: {
              subject: "Test",
              text: "Body",
              unsubscribeUrl: link.toString(),
            },
          });
          const app = yield* HttpRouter.toHttpEffect(
            sendUnsubscribeRoutes.pipe(
              Layer.provideMerge(Layer.succeed(SendUnsubscribe, unsubscribe)),
            ),
          );
          const server = yield* NodeHttpServer.make(createServer, {
            host: "127.0.0.1",
            port: 0,
          });
          yield* server
            .serve(app)
            .pipe(Effect.provideService(SendUnsubscribe, unsubscribe));
          if (server.address._tag === "UnixPathAddress")
            return yield* Effect.die(
              new Error("Expected a loopback TCP server"),
            );
          // Only the browser harness uses loopback HTTP; production link creation
          // continues to require HTTPS and the installation-specific audience.
          const browserLink = new URL(
            link.pathname + link.search,
            `http://127.0.0.1:${server.address.port}`,
          ).toString();
          yield* Effect.promise(() => page.goto(browserLink));
          yield* Effect.promise(() =>
            expect(
              page.getByRole("button", {
                name: m.kraksend_contacts_withdraw({}, { locale }),
                exact: true,
              }),
            ).toBeVisible(),
          );
          expect(
            (yield* send.getContact({ id: contact.id })).emailConsent,
          ).toBe("subscribed");
          yield* Effect.promise(async () => {
            await page
              .getByRole("button", {
                name: m.kraksend_contacts_withdraw({}, { locale }),
                exact: true,
              })
              .click();
            await expect(
              page.getByText(m.kraksend_unsubscribe_success({}, { locale }), {
                exact: true,
              }),
            ).toBeVisible();
          });
          expect(
            (yield* send.getContact({ id: contact.id })).emailConsent,
          ).toBe("unsubscribed");
          yield* runtime.runDeliveryWorkerOnce;
          const detail = yield* notifications.getDelivery({
            scope: {
              recipientUserId: null,
              organizationId: null,
              workspaceId: null,
            },
            deliveryId: queued.deliveryId,
          });
          expect(detail.delivery.status).toBe("suppressed");
          expect(transport.sent).toHaveLength(0);
        }).pipe(Effect.scoped, Effect.provide(NodeServices.layer)),
      ),
    );
  });
}
