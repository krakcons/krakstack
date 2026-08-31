import { Context, Effect, Layer, Schema } from "effect";

import {
  NotificationTransportConfigurationError,
  NotificationTransportUnavailable,
  type NotificationTransportFailure,
  type NotificationTransportInput,
  type NotificationTransportResult,
} from "./schema.js";

export interface NotificationTransport {
  readonly channel: string;
  readonly send: (
    input: NotificationTransportInput,
  ) => Effect.Effect<NotificationTransportResult, NotificationTransportFailure>;
}

export interface NotificationTransportRegistryContract {
  readonly get: (
    channel: string,
  ) => Effect.Effect<NotificationTransport, NotificationTransportUnavailable>;
  readonly channels: ReadonlyArray<string>;
}

export class NotificationTransportRegistry extends Context.Service<
  NotificationTransportRegistry,
  NotificationTransportRegistryContract
>()("@krak-stack/notifications/NotificationTransportRegistry") {
  static readonly layer = (transports: ReadonlyArray<NotificationTransport>) =>
    Layer.effect(
      this,
      Effect.gen(function* () {
        const byChannel = new Map<string, NotificationTransport>();
        for (const transport of transports) {
          const channel = yield* Schema.decodeUnknownEffect(
            Schema.NonEmptyString,
          )(transport.channel).pipe(
            Effect.mapError(
              () =>
                new NotificationTransportConfigurationError({
                  channel: "invalid",
                  message: "Transport channels must be non-empty",
                }),
            ),
          );
          if (byChannel.has(channel)) {
            return yield* new NotificationTransportConfigurationError({
              channel,
              message: `Duplicate notification transport: ${channel}`,
            });
          }
          byChannel.set(channel, transport);
        }

        const get = Effect.fn("NotificationTransportRegistry.get")(function* (
          channel: string,
        ) {
          const transport = byChannel.get(channel);
          if (transport === undefined) {
            return yield* new NotificationTransportUnavailable({
              channel,
              message: `No notification transport registered for ${channel}`,
            });
          }
          return transport;
        });

        return {
          get,
          channels: Array.from(byChannel.keys()).sort(),
        } satisfies NotificationTransportRegistryContract;
      }),
    );

  static readonly emptyLayer = this.layer([]);
}

export {
  NotificationTransportConfigurationError,
  NotificationTransportInput,
  NotificationTransportPermanent,
  NotificationTransportResult,
  NotificationTransportRetryable,
  NotificationTransportUnavailable,
} from "./schema.js";
export type { NotificationTransportFailure } from "./schema.js";
