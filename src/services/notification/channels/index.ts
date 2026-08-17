import { Context, Effect, Layer } from "effect";
import type { Json } from "effect/Schema";

import { NotificationSendError } from "../schema";

export interface NotificationChannels {}

export type NotificationMessage<FallbackPayload = Json> =
  keyof NotificationChannels extends never
    ? Record<string, FallbackPayload>
    : Partial<{
        readonly [Key in keyof NotificationChannels]: NotificationChannels[Key];
      }>;

export interface NotificationChannel<
  Key extends string = string,
  Payload = Json,
> {
  readonly key: Key;
  readonly send: (
    payload: Payload,
    message: NotificationMessage,
  ) => Effect.Effect<void, NotificationSendError>;

  readonly payload?: Payload;
}

export interface NotificationChannelRegistryService {
  readonly channels: ReadonlyArray<NotificationChannel>;
}

/** @deprecated Use the domain-owned names without the Shape suffix. */
export {
  type NotificationChannel as NotificationChannelShape,
  type NotificationChannelRegistryService as NotificationChannelRegistryShape,
};

export class NotificationChannelRegistry extends Context.Service<
  NotificationChannelRegistry,
  NotificationChannelRegistryService
>()("NotificationChannelRegistry") {
  static readonly make = (
    ...channels: ReadonlyArray<NotificationChannel>
  ): NotificationChannelRegistryService => ({ channels });

  static readonly layer = (channels: ReadonlyArray<NotificationChannel>) =>
    Layer.succeed(this, this.make(...channels));

  static readonly emptyLayer = Layer.succeed(this, this.make());
}
