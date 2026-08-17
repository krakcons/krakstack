import { Context, Effect, Layer } from "effect";

import {
  NotificationChannelRegistry,
  type NotificationPersistInput,
  type NotificationPersistResult,
  type NotificationMessage,
  type NotificationSendInput,
  type NotificationChannel,
} from "./channels";
import { NotificationSendError } from "./schema";

export interface NotificationServiceContract {
  readonly send: (
    input: NotificationSendInput,
  ) => Effect.Effect<
    NotificationPersistResult | undefined,
    NotificationSendError
  >;
}

export interface NotificationPersistenceStoreContract {
  readonly persist: (
    input: NotificationPersistInput,
  ) => Effect.Effect<NotificationPersistResult, NotificationSendError>;
}

/** @deprecated Use NotificationServiceContract. */
export { type NotificationServiceContract as NotificationServiceShape };

export class NotificationPersistenceStore extends Context.Service<
  NotificationPersistenceStore,
  NotificationPersistenceStoreContract
>()("NotificationPersistenceStore") {
  static readonly noopLayer = Layer.succeed(this, {
    persist: () =>
      Effect.succeed({ deliveryIds: [], notificationId: undefined }),
  });

  static readonly layer = (store: NotificationPersistenceStoreContract) =>
    Layer.succeed(this, store);
}

const isStructuredSendInput = (
  input: NotificationSendInput,
): input is Extract<
  NotificationSendInput,
  { readonly persist: NotificationPersistInput }
> => Object.hasOwn(input, "persist");

export class NotificationService extends Context.Service<
  NotificationService,
  NotificationServiceContract
>()("NotificationService", {
  make: Effect.gen(function* () {
    const registry = yield* NotificationChannelRegistry;
    const persistence = yield* NotificationPersistenceStore;

    const dispatch = Effect.fn("NotificationService.dispatch")(
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

    const send = Effect.fn("NotificationService.send")(
      (input: NotificationSendInput) =>
        Effect.gen(function* () {
          if (!isStructuredSendInput(input)) {
            yield* dispatch(input);
            return undefined;
          }

          const persisted = yield* persistence.persist(input.persist);
          if (input.message) yield* dispatch(input.message);
          return persisted;
        }),
    );

    return { send };
  }),
}) {
  static readonly layer = Layer.effect(this, this.make);

  static readonly makeLayer = (channels: ReadonlyArray<NotificationChannel>) =>
    this.layer.pipe(
      Layer.provide(NotificationChannelRegistry.layer(channels)),
      Layer.provide(NotificationPersistenceStore.noopLayer),
    );

  static readonly makePersistentLayer = ({
    channels,
    store,
  }: {
    readonly channels: ReadonlyArray<NotificationChannel>;
    readonly store: NotificationPersistenceStoreContract;
  }) =>
    this.layer.pipe(
      Layer.provide(NotificationChannelRegistry.layer(channels)),
      Layer.provide(NotificationPersistenceStore.layer(store)),
    );

  static readonly noopLayer = Layer.succeed(this, {
    send: () => Effect.succeed(undefined),
  });

  static readonly localLayer = this.makeLayer([
    {
      key: "email",
      send: (payload) => Effect.logInfo("[fake email]", payload),
    },
  ]);
}
