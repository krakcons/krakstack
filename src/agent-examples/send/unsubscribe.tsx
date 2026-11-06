import { HttpServerResponse } from "effect/http";
import { renderToStaticMarkup } from "react-dom/server";
import { makeSendUnsubscribeRoutes } from "../../../packages/send/src/unsubscribe.routes";
import * as m from "../../paraglide/messages";

// Mount separately from host login, cookie-CSRF and locale-redirect middleware.
// Installed applications import makeSendUnsubscribeRoutes from @krak-stack/send/unsubscribe.routes.
// Supply SendUnsubscribe.makeLayer(...) with the host's shared KrakSend layer.
export const sendUnsubscribeRoutes = makeSendUnsubscribeRoutes({
  path: "/send/unsubscribe",
  confirmation: (locale) =>
    HttpServerResponse.html(
      renderToStaticMarkup(
        <html lang={locale}>
          <head>
            <meta charSet="utf-8" />
            <title>{m.kraksend_unsubscribe_title({}, { locale })}</title>
          </head>
          <body>
            <main>
              <h1>{m.kraksend_unsubscribe_title({}, { locale })}</h1>
              <p>{m.kraksend_unsubscribe_description({}, { locale })}</p>
              <form method="post">
                <input
                  type="hidden"
                  name="List-Unsubscribe"
                  value="One-Click"
                />
                <button type="submit">
                  {m.kraksend_contacts_withdraw({}, { locale })}
                </button>
              </form>
            </main>
          </body>
        </html>,
      ),
    ),
  messages: {
    en: {
      invalid: m.kraksend_unsubscribe_invalid({}, { locale: "en" }),
      unavailable: m.kraksend_unsubscribe_unavailable({}, { locale: "en" }),
      success: m.kraksend_unsubscribe_success({}, { locale: "en" }),
    },
    fr: {
      invalid: m.kraksend_unsubscribe_invalid({}, { locale: "fr" }),
      unavailable: m.kraksend_unsubscribe_unavailable({}, { locale: "fr" }),
      success: m.kraksend_unsubscribe_success({}, { locale: "fr" }),
    },
  },
});
