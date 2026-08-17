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

export interface NotificationInboxInput {
  readonly description?: string | undefined;
  readonly href?: string | undefined;
  readonly metadata?: Json | undefined;
  readonly title: string;
}

export interface NotificationDeliveryInput {
  readonly channel: string;
  readonly idempotencyKey?: string | undefined;
  readonly maxAttempts?: number | undefined;
  readonly payload: Json;
  readonly payloadVersion?: number | undefined;
  readonly purpose: "transactional" | "notification";
  readonly recipientAddress: string;
  readonly recipientName?: string | undefined;
  readonly recipientUserId?: string | undefined;
  readonly scheduledFor?: Date | undefined;
  readonly template?: string | undefined;
}

export interface NotificationPersistInput {
  readonly deliveries?: ReadonlyArray<NotificationDeliveryInput> | undefined;
  readonly eventKey: string;
  readonly eventVersion?: number | undefined;
  readonly idempotencyKey: string;
  readonly inbox?: NotificationInboxInput | undefined;
  readonly locale?: string | undefined;
  readonly organizationId?: string | undefined;
  readonly recipientUserId?: string | undefined;
  readonly workspaceId?: string | undefined;
}

export interface NotificationPersistResult {
  readonly deliveryIds: ReadonlyArray<string>;
  readonly notificationId: string | undefined;
}

export type NotificationSendInput =
  | NotificationMessage
  | {
      readonly message?: NotificationMessage | undefined;
      readonly persist: NotificationPersistInput;
    };

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
