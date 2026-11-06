import { ByteSize, Effect } from "effect";
import { HttpRouter, HttpServerRequest, HttpServerResponse } from "effect/http";
import { renderToStaticMarkup } from "react-dom/server";

import {
  EmailUnsubscribe,
  EmailUnsubscribePost,
} from "../../../packages/notifications/src/unsubscribe";
import * as m from "../../paraglide/messages";
import { UnsubscribeSearch } from "./schema";

const headers = {
  "cache-control": "no-store",
  "referrer-policy": "no-referrer",
  "x-robots-tag": "noindex, nofollow",
  "content-security-policy":
    "default-src 'none'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'",
};

const failure = (locale: "en" | "fr", status: 400 | 503) =>
  HttpServerResponse.text(
    status === 400
      ? m.notification_unsubscribe_invalid({}, { locale })
      : m.notification_unsubscribe_unavailable({}, { locale }),
    { status, headers },
  );

const confirmation = (locale: "en" | "fr") =>
  HttpServerResponse.html(
    renderToStaticMarkup(
      <html lang={locale}>
        <head>
          <title>{m.notification_unsubscribe_title({}, { locale })}</title>
        </head>
        <body>
          <main>
            <h1>{m.notification_unsubscribe_title({}, { locale })}</h1>
            <p>{m.notification_unsubscribe_description({}, { locale })}</p>
            <form method="post">
              <input type="hidden" name="List-Unsubscribe" value="One-Click" />
              <button type="submit">
                {m.notification_unsubscribe_action({}, { locale })}
              </button>
            </form>
          </main>
        </body>
      </html>,
    ),
  ).pipe(HttpServerResponse.setHeaders(headers));

const get = Effect.gen(function* () {
  const query = yield* HttpServerRequest.schemaSearchParams(UnsubscribeSearch);
  const locale = query.locale ?? "en";
  const unsubscribe = yield* EmailUnsubscribe;
  return yield* unsubscribe.validateToken(query).pipe(
    Effect.map(() => confirmation(locale)),
    Effect.catchTags({
      EmailUnsubscribeTokenError: () => Effect.succeed(failure(locale, 400)),
      EmailUnsubscribeCryptoError: () => Effect.succeed(failure(locale, 503)),
    }),
  );
}).pipe(
  Effect.catchTag("SchemaError", () => Effect.succeed(failure("en", 400))),
);

const post = Effect.gen(function* () {
  const query = yield* HttpServerRequest.schemaSearchParams(UnsubscribeSearch);
  const locale = query.locale ?? "en";
  const body = yield* HttpServerRequest.schemaBodyForm(
    EmailUnsubscribePost,
  ).pipe(Effect.result);
  if (body._tag === "Failure") return failure(locale, 400);
  const unsubscribe = yield* EmailUnsubscribe;
  return yield* unsubscribe.unsubscribe(query).pipe(
    Effect.as(
      HttpServerResponse.text(
        m.notification_unsubscribe_success({}, { locale }),
        { headers },
      ),
    ),
    Effect.catchTag("EmailUnsubscribeTokenError", () =>
      Effect.succeed(failure(locale, 400)),
    ),
    Effect.orElseSucceed(() => failure(locale, 503)),
  );
}).pipe(
  Effect.catchTag("SchemaError", () => Effect.succeed(failure("en", 400))),
  Effect.provideService(HttpServerRequest.MaxBodySize, ByteSize.kibibytes(8)),
);

// In an installed application, import the SDK from @krak-stack/notifications/unsubscribe.
// Keep these routes outside login, CSRF-cookie, locale-redirect and analytics middleware.
export const notificationUnsubscribeRoutes = HttpRouter.addAll([
  HttpRouter.route("GET", "/notifications/unsubscribe", get),
  HttpRouter.route("POST", "/notifications/unsubscribe", post),
]);
