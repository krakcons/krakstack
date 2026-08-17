import { Context, Effect, Layer } from "effect";

import {
  NotificationChannelRegistry,
  type NotificationMessage,
  type NotificationChannel,
} from "./channels";
import { NotificationSendError } from "./schema";

export interface NotificationServiceContract {
  readonly send: (
    message: NotificationMessage,
  ) => Effect.Effect<void, NotificationSendError>;
}

/** @deprecated Use NotificationServiceContract. */
export { type NotificationServiceContract as NotificationServiceShape };

export class NotificationService extends Context.Service<
  NotificationService,
  NotificationServiceContract
>()("NotificationService", {
  make: Effect.gen(function* () {
    const registry = yield* NotificationChannelRegistry;

    const send = Effect.fn("NotificationService.send")(
      (message: NotificationMessage) =>
        Effect.gen(function* () {
          for (const [key, payload] of Object.entries(message)) {
            const channels = registry.channels.filter(
              (item) => item.key === key,
            );

            if (channels.length === 0) {
              return yield* new NotificationSendError({
                channel: key,
                message: `No notification channel installed for ${key}`,
              });
            }

            yield* Effect.forEach(channels, (channel) =>
              channel.send(payload, message),
            );
          }
        }),
    );

    return { send };
  }),
}) {
  static readonly layer = Layer.effect(this, this.make);

  static readonly makeLayer = (channels: ReadonlyArray<NotificationChannel>) =>
    this.layer.pipe(Layer.provide(NotificationChannelRegistry.layer(channels)));

  static readonly noopLayer = Layer.succeed(this, {
    send: () => Effect.void,
  });

  static readonly localLayer = this.makeLayer([
    {
      key: "email",
      send: (payload) => Effect.logInfo("[fake email]", payload),
    },
  ]);
}
