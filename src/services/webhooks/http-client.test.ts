import { describe, expect, it } from "@effect/vitest";
import { Effect, Layer } from "effect";
import { FetchHttpClient, HttpClient } from "effect/http";
import { Dns, NetAddress } from "effect/net";
import { vi } from "vitest";
import { isPublicWebhookDestination, layer } from "./http-client";

const dnsLayer = (addresses: readonly string[]) =>
  Layer.succeed(
    Dns.Dns,
    Dns.make({
      lookup: () =>
        Effect.succeed(addresses.map(NetAddress.ipFromStringUnsafe)),
    }),
  );

describe("Webhook destination checks", () => {
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
  it.effect("blocks private DNS destinations before sending", () =>
    Effect.gen(function* () {
      const fetch = vi.fn<typeof globalThis.fetch>();
      const client = yield* HttpClient.HttpClient;
      const error = yield* client
        .post("https://receiver.example/hook")
        .pipe(Effect.provideService(FetchHttpClient.Fetch, fetch), Effect.flip);
      expect(error.reason._tag).toBe("TransportError");
      expect(fetch).not.toHaveBeenCalled();
    }).pipe(Effect.provide(layer), Effect.provide(dnsLayer(["10.0.0.1"]))),
  );

  it.effect("disables redirects even when the caller enables them", () =>
    Effect.gen(function* () {
      const fetch = vi
        .fn<typeof globalThis.fetch>()
        .mockResolvedValue(new Response(null, { status: 204 }));
      const client = yield* HttpClient.HttpClient;
      const response = yield* client
        .post("https://receiver.example/hook")
        .pipe(
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
      Effect.provide(layer),
      Effect.provide(dnsLayer(["8.8.8.8"])),
    ),
  );
});
