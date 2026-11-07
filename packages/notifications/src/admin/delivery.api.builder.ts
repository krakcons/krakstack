import { Effect, Layer } from "effect";
import { HttpApiBuilder, HttpApiError } from "effect/http-api";
import { CurrentDeliveryAdmin, DeliveryAdminApi } from "./delivery.api.js";
import { NotificationDeliveryAdmin } from "./deliveries.js";
import { SendStorageError } from "./schema.js";

const redact = <A, E, R>(effect: Effect.Effect<A, E | SendStorageError, R>) =>
  effect.pipe(
    Effect.catchTag("SendStorageError", () =>
      Effect.fail(new HttpApiError.InternalServerError({})),
    ),
  );
export const deliveryAdminHandlers = HttpApiBuilder.group(
  DeliveryAdminApi,
  "notificationDeliveries",
  Effect.fn(function* (handlers) {
    const deliveries = yield* NotificationDeliveryAdmin;
    return handlers
      .handle("overview", ({ query }) =>
        Effect.gen(function* () {
          const { access } = yield* CurrentDeliveryAdmin;
          return yield* deliveries.overview({ access, query });
        }).pipe(redact),
      )
      .handle("activityTable", ({ query }) =>
        Effect.gen(function* () {
          const { access } = yield* CurrentDeliveryAdmin;
          return yield* deliveries.activityTable({ access, query });
        }).pipe(redact),
      )
      .handle("inspect", ({ params, query }) =>
        Effect.gen(function* () {
          const { access } = yield* CurrentDeliveryAdmin;
          return yield* deliveries.inspect({
            access,
            id: params.id,
            selection: query,
          });
        }).pipe(redact),
      );
  }),
);
export const deliveryAdminRoutes = HttpApiBuilder.layer(DeliveryAdminApi).pipe(
  Layer.provide(deliveryAdminHandlers),
);
