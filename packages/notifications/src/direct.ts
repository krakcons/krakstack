import { Context, Effect, Layer, Schema } from "effect";

import { canonicalRecipientAddress } from "./internal/idempotency.js";
import {
  DirectNotificationInput,
  DirectNotificationValidationError,
} from "./schema.js";
import {
  NotificationTransportInput,
  NotificationTransportRegistry,
  type NotificationTransportFailure,
  type NotificationTransportResult,
} from "./transport.js";

export interface DirectNotificationDispatcherContract {
  readonly dispatch: (
    input: DirectNotificationInput,
  ) => Effect.Effect<
    NotificationTransportResult,
    NotificationTransportFailure | DirectNotificationValidationError
  >;
}

export class DirectNotificationDispatcher extends Context.Service<
  DirectNotificationDispatcher,
  DirectNotificationDispatcherContract
>()("@krak-stack/notifications/DirectNotificationDispatcher") {
  static readonly layer = Layer.effect(
    this,
    Effect.gen(function* () {
      const registry = yield* NotificationTransportRegistry;
      const dispatch = Effect.fn("DirectNotificationDispatcher.dispatch")(
        function* (rawInput: DirectNotificationInput) {
          const input = yield* Schema.decodeUnknownEffect(
            DirectNotificationInput,
          )(rawInput).pipe(
            Effect.mapError(
              (cause) =>
                new DirectNotificationValidationError({
                  message: "Invalid direct notification input",
                  cause,
                }),
            ),
          );
          const transport = yield* registry.get(input.channel);
          const transportInput = yield* Schema.decodeUnknownEffect(
            NotificationTransportInput,
          )({
            ...input,
            recipientAddress: canonicalRecipientAddress(
              input.channel,
              input.recipientAddress,
            ),
            dispatchId: globalThis.crypto.randomUUID(),
            deliveryId: null,
            attempt: 1,
          }).pipe(
            Effect.mapError(
              (cause) =>
                new DirectNotificationValidationError({
                  message: "Invalid direct transport input",
                  cause,
                }),
            ),
          );
          return yield* transport.send(transportInput);
        },
      );
      return { dispatch } satisfies DirectNotificationDispatcherContract;
    }),
  );
}

export const dispatchDirect = (input: DirectNotificationInput) =>
  DirectNotificationDispatcher.use((dispatcher) => dispatcher.dispatch(input));

export {
  DirectNotificationInput,
  DirectNotificationValidationError,
} from "./schema.js";
