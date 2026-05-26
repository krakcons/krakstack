import { Context, Effect, Layer } from "effect";

import {
  NotificationChannelRegistry,
  type NotificationChannelShape,
} from "./channel";
import { NotificationMessage, NotificationSendError } from "./schema";

export interface NotificationServiceShape {
  readonly send: (
    message: NotificationMessage,
  ) => Effect.Effect<void, NotificationSendError>;
}

export class NotificationService extends Context.Service<
  NotificationService,
  NotificationServiceShape
>()("NotificationService", {
  make: Effect.gen(function* () {
    const registry = yield* NotificationChannelRegistry;

    const send = Effect.fn("NotificationService.send")(
      (message: NotificationMessage) =>
        Effect.gen(function* () {
          for (const [key, payload] of Object.entries(message)) {
            const channel = registry.channels.find((item) => item.key === key);

            if (!channel) {
              return yield* new NotificationSendError({
                channel: key,
                message: `No notification channel installed for ${key}`,
              });
            }

            yield* channel.send(payload, message);
          }
        }),
    );

    return { send };
  }),
}) {
  static readonly layer = Layer.effect(this, this.make);

  static readonly makeLayer = (
    channels: ReadonlyArray<NotificationChannelShape>,
  ) =>
    this.layer.pipe(Layer.provide(NotificationChannelRegistry.layer(channels)));

  static readonly noopLayer = Layer.succeed(this, {
    send: () => Effect.void,
  });
}
