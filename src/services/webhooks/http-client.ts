import { Effect, Layer, Result } from "effect";
import { Dns, NetAddress } from "effect/net";
import { FetchHttpClient, HttpClient, HttpClientError } from "effect/http";
import { isPublicIpAddress, isPublicWebhookUrl } from "./url";

/** DNS preflight. Network egress rules must also prevent DNS rebinding. */
export const isPublicWebhookDestination = Effect.fn(
  "Webhooks.isPublicDestination",
)(function* (url: URL) {
  if (!isPublicWebhookUrl(url)) return false;
  const hostname = url.hostname.replace(/^\[|\]$/g, "");
  if (Result.isSuccess(NetAddress.ipFromString(hostname))) return true;
  const dns = yield* Dns.Dns;
  return yield* dns.lookup(hostname).pipe(
    Effect.map((addresses) =>
      addresses.every((address) =>
        isPublicIpAddress(NetAddress.formatIp(address)),
      ),
    ),
    Effect.catch(() => Effect.succeed(false)),
  );
});

/** Built-in fetch client with public-destination checks and no redirects. */
export const layer = Layer.effect(
  HttpClient.HttpClient,
  Effect.gen(function* () {
    const client = yield* HttpClient.HttpClient;
    const dns = yield* Dns.Dns;
    return client.pipe(
      HttpClient.transform((response, request) =>
        Effect.gen(function* () {
          if (
            !(yield* isPublicWebhookDestination(new URL(request.url)).pipe(
              Effect.provideService(Dns.Dns, dns),
            ))
          ) {
            return yield* new HttpClientError.HttpClientError({
              reason: new HttpClientError.TransportError({
                request,
                description: "Webhook destination is not public",
              }),
            });
          }
          return yield* response.pipe(
            Effect.provideService(FetchHttpClient.RequestInit, {
              redirect: "error",
            }),
          );
        }),
      ),
    );
  }),
).pipe(Layer.provide(FetchHttpClient.layer));
