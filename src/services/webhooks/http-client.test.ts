import { describe, expect, it } from "@effect/vitest";
import { Effect, Layer } from "effect";
import { FetchHttpClient, HttpClient } from "effect/http";
import { Dns, NetAddress } from "effect/net";
import { vi } from "vitest";
import {
  isAllowedWebhookDestination,
  isPublicWebhookDestination,
  layer,
} from "./http-client";
import { WebhookAllowLoopback } from "./url";

const dnsLayer = (addresses: readonly string[]) =>
  Layer.succeed(
    Dns.Dns,
    Dns.make({
      lookup: () =>
        Effect.succeed(addresses.map(NetAddress.ipFromStringUnsafe)),
    }),
  );

describe("Webhook destination checks", () => {
  it.effect(
    "allows only explicit loopback hosts when opted in and leaves default checks strict",
    () =>
      Effect.gen(function* () {
        for (const url of [
          "http://localhost:3000/hook",
          "http://127.0.0.1:3000/hook",
          "http://[::1]:3000/hook",
        ]) {
          expect(yield* isAllowedWebhookDestination(new URL(url))).toBe(false);
          expect(
            yield* isAllowedWebhookDestination(new URL(url)).pipe(
              Effect.provideService(WebhookAllowLoopback, true),
            ),
          ).toBe(true);
        }
        for (const url of [
          "http://10.0.0.1/hook",
          "http://169.254.169.254/hook",
          "http://localhost.example/hook",
          "http://user:pass@localhost/hook",
          "file:///etc/passwd",
        ]) {
          expect(
            yield* isAllowedWebhookDestination(new URL(url)).pipe(
              Effect.provideService(WebhookAllowLoopback, true),
            ),
          ).toBe(false);
        }
      }).pipe(Effect.provide(dnsLayer([]))),
  );
  it.effect("rejects private literals without DNS", () =>
    Effect.gen(function* () {
      expect(
        yield* isPublicWebhookDestination(new URL("https://127.0.0.1/private")),
      ).toBe(false);
    }).pipe(Effect.provide(dnsLayer([]))),
  );

  it.effect("accepts public IPv6 literals without DNS", () =>
    Effect.gen(function* () {
      expect(
        yield* isPublicWebhookDestination(
          new URL("https://[2606:4700:4700::1111]/hook"),
        ),
      ).toBe(true);
    }).pipe(Effect.provide(dnsLayer([]))),
  );

  it.effect("rejects a public hostname with any private DNS answer", () =>
    Effect.gen(function* () {
      expect(
        yield* isPublicWebhookDestination(
          new URL("https://receiver.example/hook"),
        ),
      ).toBe(false);
    }).pipe(Effect.provide(dnsLayer(["8.8.8.8", "169.254.169.254"]))),
  );

  it.effect("fails closed on empty DNS results", () =>
    Effect.gen(function* () {
      expect(
        yield* isPublicWebhookDestination(
          new URL("https://receiver.example/hook"),
        ),
      ).toBe(false);
    }).pipe(Effect.provide(dnsLayer([]))),
  );

  it.effect("fails closed on DNS errors", () =>
    Effect.gen(function* () {
      expect(
        yield* isPublicWebhookDestination(
          new URL("https://receiver.example/hook"),
        ),
      ).toBe(false);
    }).pipe(
      Effect.provideService(
        Dns.Dns,
        Dns.make({
          lookup: (hostname) =>
            Effect.fail(
              new Dns.DnsError({
                reason: "NotFound",
                method: "lookup",
                hostname,
              }),
            ),
        }),
      ),
    ),
  );

  it.effect("accepts public IPv4 and IPv6 answers", () =>
    Effect.gen(function* () {
      expect(
        yield* isPublicWebhookDestination(
          new URL("https://receiver.example/hook"),
        ),
      ).toBe(true);
    }).pipe(Effect.provide(dnsLayer(["8.8.8.8", "2606:4700:4700::1111"]))),
  );
});

describe("Webhook HTTP client", () => {
  it.effect(
    "delivers to a real local HTTP listener with the explicit loopback override",
    () =>
      Effect.gen(function* () {
        let calls = 0;
        const server = yield* Effect.acquireRelease(
          Effect.sync(() =>
            Bun.serve({
              hostname: "127.0.0.1",
              port: 0,
              fetch: () => {
                calls++;
                return new Response(null, { status: 204 });
              },
            }),
          ),
          (server) => Effect.promise(() => server.stop(true)),
        );
        const client = yield* HttpClient.HttpClient;
        const response = yield* client.post(
          `http://localhost:${server.port}/api/webhooks/auth`,
        );
        expect(response.status).toBe(204);
        expect(calls).toBe(1);
      }).pipe(
        Effect.scoped,
        Effect.provide(
          layer.pipe(
            Layer.provide(Layer.succeed(WebhookAllowLoopback, true)),
            Layer.provideMerge(dnsLayer([])),
          ),
        ),
      ),
  );
  it.effect("sends opted-in loopback requests without allowing redirects", () =>
    Effect.gen(function* () {
      const fetch = vi
        .fn<typeof globalThis.fetch>()
        .mockResolvedValue(new Response(null, { status: 204 }));
      const client = yield* HttpClient.HttpClient;
      const response = yield* client
        .post("http://localhost:3000/api/webhooks/auth")
        .pipe(Effect.provideService(FetchHttpClient.Fetch, fetch));
      expect(response.status).toBe(204);
      expect(fetch).toHaveBeenCalledWith(
        expect.any(URL),
        expect.objectContaining({ redirect: "error" }),
      );
    }).pipe(
      Effect.scoped,
      Effect.provide(
        layer.pipe(
          Layer.provide(Layer.succeed(WebhookAllowLoopback, true)),
          Layer.provideMerge(dnsLayer([])),
        ),
      ),
    ),
  );
  it.effect("blocks private DNS destinations before sending", () =>
    Effect.gen(function* () {
      const fetch = vi.fn<typeof globalThis.fetch>();
      const client = yield* HttpClient.HttpClient;
      const error = yield* client
        .post("https://receiver.example/hook")
        .pipe(Effect.provideService(FetchHttpClient.Fetch, fetch), Effect.flip);
      expect(error.reason._tag).toBe("TransportError");
      expect(fetch).not.toHaveBeenCalled();
    }).pipe(
      Effect.provide(layer.pipe(Layer.provideMerge(dnsLayer(["10.0.0.1"])))),
    ),
  );

  it.effect("disables redirects even when the caller enables them", () =>
    Effect.gen(function* () {
      const fetch = vi
        .fn<typeof globalThis.fetch>()
        .mockResolvedValue(new Response(null, { status: 204 }));
      const client = yield* HttpClient.HttpClient;
      const response = yield* client.post("https://receiver.example/hook").pipe(
        Effect.provideService(FetchHttpClient.Fetch, fetch),
        Effect.provideService(FetchHttpClient.RequestInit, {
          redirect: "follow",
        }),
      );
      expect(response.status).toBe(204);
      expect(fetch).toHaveBeenCalledWith(
        expect.any(URL),
        expect.objectContaining({ redirect: "error" }),
      );
    }).pipe(
      Effect.scoped,
      Effect.provide(layer.pipe(Layer.provideMerge(dnsLayer(["8.8.8.8"])))),
    ),
  );
});
