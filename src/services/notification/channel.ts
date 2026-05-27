import { Context, Effect, Layer } from "effect";

import { NotificationMessage, NotificationSendError } from "./schema";

export interface NotificationChannelShape {
  readonly key: string;
  readonly send: (
    payload: unknown,
    message: NotificationMessage,
  ) => Effect.Effect<void, NotificationSendError>;
}

export interface NotificationChannelRegistryShape {
  readonly channels: ReadonlyArray<NotificationChannelShape>;
}

export class NotificationChannelRegistry extends Context.Service<
  NotificationChannelRegistry,
  NotificationChannelRegistryShape
>()("NotificationChannelRegistry") {
  static readonly layer = (channels: ReadonlyArray<NotificationChannelShape>) =>
    Layer.succeed(this, { channels });

  static readonly emptyLayer = Layer.succeed(this, {
    channels: [],
  });
}
