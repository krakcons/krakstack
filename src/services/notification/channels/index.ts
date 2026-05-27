import { Context, Effect, Layer } from "effect";

import { NotificationSendError } from "../schema";

export interface NotificationChannels {}

export type NotificationMessage = keyof NotificationChannels extends never
  ? Record<string, unknown>
  : Partial<{
      readonly [Key in keyof NotificationChannels]: NotificationChannels[Key];
    }>;

export interface NotificationChannelShape<
  Key extends string = string,
  Payload = unknown,
> {
  readonly key: Key;
  readonly send: (
    payload: unknown,
    message: NotificationMessage,
  ) => Effect.Effect<void, NotificationSendError>;

  readonly payload?: Payload;
}

export interface NotificationChannelRegistryShape {
  readonly channels: ReadonlyArray<NotificationChannelShape>;
}

export class NotificationChannelRegistry extends Context.Service<
  NotificationChannelRegistry,
  NotificationChannelRegistryShape
>()("NotificationChannelRegistry") {
  static readonly make = (
    ...channels: ReadonlyArray<NotificationChannelShape>
  ): NotificationChannelRegistryShape => ({ channels });

  static readonly layer = (channels: ReadonlyArray<NotificationChannelShape>) =>
    Layer.succeed(this, this.make(...channels));

  static readonly emptyLayer = Layer.succeed(this, this.make());
}
