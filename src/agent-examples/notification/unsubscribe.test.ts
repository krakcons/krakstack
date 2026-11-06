import { describe, expect, it } from "@effect/vitest";
import { Effect, FileSystem, Layer, Path, Redacted } from "effect";
import { HttpRouter } from "effect/http";

import { EmailUnsubscribe } from "../../../packages/notifications/src/unsubscribe";
import { makeUnsubscribeTestService } from "../../../packages/notifications/test/fixtures/unsubscribe-service";
import { NotificationStorageError } from "../../../packages/notifications/src/schema";
import { notificationUnsubscribeRoutes } from "./unsubscribe";

describe("application unsubscribe routes", () => {
  it.live(
    "returns a retryable failure rather than claiming success when persistence fails",
    () => {
      const fixture = makeUnsubscribeTestService({
        unsubscribeEmail: () =>
          Effect.fail(
            new NotificationStorageError({
              operation: "unsubscribeEmail",
              message: "Database unavailable",
            }),
          ),
      });
      const unsubscribeLayer = EmailUnsubscribe.makeLayer({
        secret: Redacted.make("route-test-secret-with-at-least-32-characters"),
        audience: "test-app",
        endpoint: "https://app.example.com/notifications/unsubscribe",
      }).pipe(Layer.provide(fixture.layer));
      return Effect.gen(function* () {
        const link = yield* EmailUnsubscribe.use((module) =>
          module.createLink({ recipientUserId: "user-1" }),
        ).pipe(Effect.provide(unsubscribeLayer));
        const web = HttpRouter.toWebHandler(
          notificationUnsubscribeRoutes.pipe(
            Layer.provideMerge(unsubscribeLayer),
            Layer.provideMerge(
              Layer.mergeAll(Path.layer, FileSystem.layerNoop({})),
            ),
          ),
          { disableLogger: true },
        );
        yield* Effect.addFinalizer(() => Effect.promise(web.dispose));
        const response = yield* Effect.promise(() =>
          web.handler(
            new Request(link, {
              method: "POST",
              body: new URLSearchParams({ "List-Unsubscribe": "One-Click" }),
            }),
          ),
        );
        expect(response.status).toBe(503);
        expect(response.headers.get("location")).toBeNull();
        expect(response.headers.get("cache-control")).toBe("no-store");
      }).pipe(Effect.scoped);
    },
  );

  it.live(
    "GET never mutates; browser and mail-client form POSTs need no session or redirect",
    () => {
      const fixture = makeUnsubscribeTestService();
      const unsubscribeLayer = EmailUnsubscribe.makeLayer({
        secret: Redacted.make("route-test-secret-with-at-least-32-characters"),
        audience: "test-app",
        endpoint: "https://app.example.com/notifications/unsubscribe?locale=fr",
      }).pipe(Layer.provide(fixture.layer));
      return Effect.gen(function* () {
        const link = yield* EmailUnsubscribe.use((module) =>
          module.createLink({ recipientUserId: "user-1" }),
        ).pipe(Effect.provide(unsubscribeLayer));
        const web = HttpRouter.toWebHandler(
          notificationUnsubscribeRoutes.pipe(
            Layer.provideMerge(unsubscribeLayer),
            Layer.provideMerge(
              Layer.mergeAll(
                Path.layer,
                FileSystem.layerNoop({
                  makeTempDirectoryScoped: () =>
                    Effect.succeed("/virtual-multipart"),
                }),
              ),
            ),
          ),
          { disableLogger: true },
        );
        yield* Effect.addFinalizer(() => Effect.promise(web.dispose));
        const get = yield* Effect.promise(() => web.handler(new Request(link)));
        expect(get.status).toBe(200);
        expect(get.headers.get("cache-control")).toBe("no-store");
        expect(get.headers.get("referrer-policy")).toBe("no-referrer");
        expect(fixture.recipients).toEqual([]);

        for (const body of [
          new URLSearchParams({ "List-Unsubscribe": "One-Click" }),
          (() => {
            const form = new FormData();
            form.set("List-Unsubscribe", "One-Click");
            return form;
          })(),
        ]) {
          const response = yield* Effect.promise(() =>
            web.handler(new Request(link, { method: "POST", body })),
          );
          expect(response.status).toBe(200);
          expect(response.headers.get("location")).toBeNull();
          expect(response.headers.get("set-cookie")).toBeNull();
        }
        expect(fixture.recipients).toEqual(["user-1", "user-1"]);

        for (const request of [
          new Request(link, {
            method: "POST",
            body: new URLSearchParams({ confirm: "yes" }),
          }),
          new Request(
            "https://app.example.com/notifications/unsubscribe?token=forged",
            {
              method: "POST",
              body: new URLSearchParams({ "List-Unsubscribe": "One-Click" }),
            },
          ),
          new Request("https://app.example.com/notifications/unsubscribe"),
        ]) {
          const response = yield* Effect.promise(() => web.handler(request));
          expect(response.status).toBe(400);
        }
        expect(fixture.recipients).toHaveLength(2);
      }).pipe(Effect.scoped);
    },
  );
});
