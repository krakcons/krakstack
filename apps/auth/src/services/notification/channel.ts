import { Context, Effect, Layer } from "effect";

import { NotificationEmailMessage, NotificationSendError } from "./schema";

export interface NotificationChannelServiceShape {
  readonly send: (
    message: NotificationEmailMessage,
  ) => Effect.Effect<void, NotificationSendError>;
}

export class NotificationChannelService extends Context.Service<
  NotificationChannelService,
  NotificationChannelServiceShape
>()("NotificationChannelService") {
  static readonly noopLayer = Layer.succeed(this, {
    send: () => Effect.void,
  });
}
