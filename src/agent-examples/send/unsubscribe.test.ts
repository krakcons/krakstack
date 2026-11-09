import { describe, expect, it } from "@effect/vitest";
import { Effect, FileSystem, Layer, Path } from "effect";
import { HttpRouter } from "effect/http";
import { SendUnsubscribe } from "../../../packages/send/src/unsubscribe";
import { SendStorageError } from "../../../packages/send/src/schema";
import {
  contactId,
  makeUnsubscribeFixture,
} from "../../../packages/send/test/fixtures/unsubscribe";
import { unsubscribeOptions } from "../../../packages/send/test/fixtures/send";
import { sendUnsubscribeRoutes } from "./unsubscribe";

describe("contact unsubscribe HTTP boundary", () => {
  it.live(
    "GET is read-only; public POST requires a valid capability and form body, not a session",
    () =>
      Effect.gen(function* () {
        const fixture = makeUnsubscribeFixture();
        const serviceLayer = SendUnsubscribe.makeLayer(unsubscribeOptions).pipe(
          Layer.provide(fixture.layer),
        );
        const link = yield* SendUnsubscribe.use((service) =>
          service.createLink({ id: contactId }),
        ).pipe(Effect.provide(serviceLayer));
        const web = HttpRouter.toWebHandler(
          sendUnsubscribeRoutes.pipe(
            Layer.provideMerge(serviceLayer),
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
        expect(get.headers.get("content-type")).toBe(
          "text/html; charset=utf-8",
        );
        expect(get.headers.get("referrer-policy")).toBe("no-referrer");
        expect(get.headers.get("cache-control")).toBe("no-store");
        expect(get.headers.get("content-security-policy")).toContain(
          "form-action 'self'",
        );
        const html = yield* Effect.promise(() => get.text());
        expect(html).not.toContain("private@example.com");
        expect(html).not.toContain(contactId);
        expect(fixture.withdrawals).toEqual([]);
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
          expect(response.headers.get("set-cookie")).toBeNull();
          expect(response.headers.get("location")).toBeNull();
        }
        expect(fixture.withdrawals).toEqual([contactId, contactId]);
        for (const request of [
          new Request("https://app.example.com/send/unsubscribe?token=forged"),
          new Request(link, {
            method: "POST",
            body: new URLSearchParams({ confirm: "yes" }),
          }),
          new Request(link, {
            method: "POST",
            body: new URLSearchParams({
              "List-Unsubscribe": "One-Click",
              padding: "x".repeat(9000),
            }),
          }),
          new Request(link.replace("token=", "locale=unsupported&token=")),
        ])
          expect(
            (yield* Effect.promise(() => web.handler(request))).status,
          ).toBe(400);
        expect(fixture.withdrawals).toHaveLength(2);
      }).pipe(Effect.scoped),
  );

  it.live(
    "returns a retryable error without claiming success or exposing persistence details",
    () =>
      Effect.gen(function* () {
        const fixture = makeUnsubscribeFixture(
          new SendStorageError({ message: "password=private" }),
        );
        const serviceLayer = SendUnsubscribe.makeLayer(unsubscribeOptions).pipe(
          Layer.provide(fixture.layer),
        );
        const link = yield* SendUnsubscribe.use((service) =>
          service.createLink({ id: contactId }),
        ).pipe(Effect.provide(serviceLayer));
        const web = HttpRouter.toWebHandler(
          sendUnsubscribeRoutes.pipe(
            Layer.provideMerge(serviceLayer),
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
        expect(yield* Effect.promise(() => response.text())).not.toContain(
          "private",
        );
        expect(fixture.withdrawals).toEqual([]);
      }).pipe(Effect.scoped),
  );
});
