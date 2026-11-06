import { Effect, Layer } from "effect";
import { HttpApiBuilder, HttpApiError } from "effect/http-api";

import { CurrentSendAdmin, SendAdminApi } from "./api.js";
import { KrakSend } from "./index.js";
import { SendStorageError } from "./schema.js";

const hideStorageFailure = <A, E, R>(
  effect: Effect.Effect<A, E | SendStorageError, R>,
) =>
  Effect.catchTag(effect, "SendStorageError", () =>
    Effect.fail(new HttpApiError.InternalServerError({})),
  );

export const sendAdminHandlers = HttpApiBuilder.group(
  SendAdminApi,
  "send",
  Effect.fn(function* (handlers) {
    const send = yield* KrakSend;
    return handlers
      .handle("listContacts", ({ query }) =>
        send.listContacts(query).pipe(hideStorageFailure),
      )
      .handle("createContact", ({ payload }) =>
        send.createContact(payload).pipe(hideStorageFailure),
      )
      .handle("getContact", ({ params }) =>
        send.getContact(params).pipe(hideStorageFailure),
      )
      .handle("updateContact", ({ params, payload }) =>
        send.updateContact({ id: params.id, payload }).pipe(hideStorageFailure),
      )
      .handle("recordEmailConsent", ({ params, payload }) =>
        Effect.gen(function* () {
          const admin = yield* CurrentSendAdmin;
          return yield* send.recordEmailConsent({
            ...payload,
            contactId: params.id,
            source: "admin",
            actor: admin.reference,
          });
        }).pipe(hideStorageFailure),
      )
      .handle("listEmailConsentEvents", ({ params, query }) =>
        send
          .listEmailConsentEvents({ contactId: params.id, query })
          .pipe(hideStorageFailure),
      );
  }),
);

export const sendAdminRoutes = HttpApiBuilder.layer(SendAdminApi).pipe(
  // Keep SendAdmin unprovided: no administrative routes can be acquired until
  // the host supplies its authorization layer.
  Layer.provide(sendAdminHandlers),
);
