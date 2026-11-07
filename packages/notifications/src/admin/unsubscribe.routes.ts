// Public unsubscribe routes remain distinct from administration.
import { ByteSize, Effect } from "effect";
import { HttpRouter, HttpServerRequest, HttpServerResponse } from "effect/http";
import { SendUnsubscribePost, SendUnsubscribeSearch } from "./schema.js";
import { SendUnsubscribe } from "./unsubscribe.js";

const headers = {
  "cache-control": "no-store",
  "referrer-policy": "no-referrer",
  "x-robots-tag": "noindex, nofollow",
  "content-security-policy":
    "default-src 'none'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'",
  "x-content-type-options": "nosniff",
};

export interface SendUnsubscribeRouteOptions {
  readonly path: `/${string}`;
  // Render escaped, host-localized HTML with a POST form to the same URL and
  // a hidden List-Unsubscribe=One-Click input. Never include contact data.
  readonly confirmation: (
    locale: "en" | "fr",
  ) => HttpServerResponse.HttpServerResponse;
  readonly messages: Readonly<
    Record<
      "en" | "fr",
      {
        readonly invalid: string;
        readonly unavailable: string;
        readonly success: string;
      }
    >
  >;
}

export const makeSendUnsubscribeRoutes = (
  options: SendUnsubscribeRouteOptions,
) => {
  const failure = (locale: "en" | "fr", status: 400 | 503) =>
    HttpServerResponse.text(
      status === 400
        ? options.messages[locale].invalid
        : options.messages[locale].unavailable,
      { status, headers, contentType: "text/plain; charset=utf-8" },
    );
  const get = Effect.gen(function* () {
    const query = yield* HttpServerRequest.schemaSearchParams(
      SendUnsubscribeSearch,
    );
    const locale = query.locale ?? "en";
    const service = yield* SendUnsubscribe;
    return yield* service.validateToken(query).pipe(
      Effect.map(() =>
        options
          .confirmation(locale)
          .pipe(
            HttpServerResponse.setHeaders(headers),
            HttpServerResponse.setHeader(
              "content-type",
              "text/html; charset=utf-8",
            ),
          ),
      ),
      Effect.catchTags({
        SendUnsubscribeTokenError: () => Effect.succeed(failure(locale, 400)),
        SendUnsubscribeCryptoError: () => Effect.succeed(failure(locale, 503)),
      }),
    );
  }).pipe(
    Effect.catchTag("SchemaError", () => Effect.succeed(failure("en", 400))),
  );
  const post = Effect.gen(function* () {
    const query = yield* HttpServerRequest.schemaSearchParams(
      SendUnsubscribeSearch,
    );
    const locale = query.locale ?? "en";
    const body = yield* HttpServerRequest.schemaBodyForm(
      SendUnsubscribePost,
    ).pipe(Effect.result);
    if (body._tag === "Failure") return failure(locale, 400);
    const service = yield* SendUnsubscribe;
    return yield* service.unsubscribe(query).pipe(
      Effect.as(
        HttpServerResponse.text(options.messages[locale].success, {
          headers,
          contentType: "text/plain; charset=utf-8",
        }),
      ),
      Effect.catchTag("SendUnsubscribeTokenError", () =>
        Effect.succeed(failure(locale, 400)),
      ),
      Effect.orElseSucceed(() => failure(locale, 503)),
    );
  }).pipe(
    Effect.catchTag("SchemaError", () => Effect.succeed(failure("en", 400))),
    Effect.provideService(HttpServerRequest.MaxBodySize, ByteSize.kibibytes(8)),
  );
  return HttpRouter.addAll([
    HttpRouter.route("GET", options.path, get),
    HttpRouter.route("POST", options.path, post),
  ]);
};
