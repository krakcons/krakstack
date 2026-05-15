import { Context, Effect, Layer } from "effect";

import { NotificationChannelService } from "./channel";
import { NotificationEmailMessage, NotificationSendError } from "./schema";

export interface NotificationServiceShape {
  readonly send: (
    message: NotificationEmailMessage,
  ) => Effect.Effect<void, NotificationSendError>;
}

export class NotificationService extends Context.Service<
  NotificationService,
  NotificationServiceShape
>()("NotificationService", {
  make: Effect.gen(function* () {
    const channel = yield* NotificationChannelService;

    const send = Effect.fn("NotificationService.send")(
      (message: NotificationEmailMessage) => channel.send(message),
    );

    return { send };
  }),
}) {
  static readonly layer = Layer.effect(this, this.make);

  static readonly noopLayer = this.layer.pipe(
    Layer.provide(NotificationChannelService.noopLayer),
  );
}
