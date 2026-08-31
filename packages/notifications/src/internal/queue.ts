import { Context, Duration, Effect, Layer } from "effect";
import { PersistedQueue } from "effect/unstable/persistence";

import {
  DeliveryQueueJob,
  ReminderQueueJob,
  type DeliveryQueueJob as DeliveryQueueJobType,
  type ReminderQueueJob as ReminderQueueJobType,
} from "../schema.js";

export const NOTIFICATION_QUEUE_TABLE = "krakstack_notification_jobs";
export const DELIVERY_QUEUE_NAME = "krakstack.notifications.delivery";
export const REMINDER_QUEUE_NAME = "krakstack.notifications.reminder";
export const NOTIFICATION_QUEUE_LOCK_REFRESH_MILLIS = 30_000;
export const NOTIFICATION_QUEUE_LOCK_EXPIRATION_MILLIS = 120_000;

export interface NotificationQueues {
  readonly deliveries: PersistedQueue.PersistedQueue<DeliveryQueueJobType>;
  readonly reminders: PersistedQueue.PersistedQueue<ReminderQueueJobType>;
}

export class NotificationQueueService extends Context.Service<
  NotificationQueueService,
  NotificationQueues
>()("@krak-stack/notifications/internal/NotificationQueueService") {}

export const makeNotificationQueues = Effect.gen(function* () {
  const store = yield* PersistedQueue.makeStoreSql({
    tableName: NOTIFICATION_QUEUE_TABLE,
    lockRefreshInterval: Duration.millis(
      NOTIFICATION_QUEUE_LOCK_REFRESH_MILLIS,
    ),
    lockExpiration: Duration.millis(NOTIFICATION_QUEUE_LOCK_EXPIRATION_MILLIS),
  });
  const factory = yield* PersistedQueue.makeFactory.pipe(
    Effect.provideService(PersistedQueue.PersistedQueueStore, store),
  );
  const deliveries = yield* factory.make({
    name: DELIVERY_QUEUE_NAME,
    schema: DeliveryQueueJob,
  });
  const reminders = yield* factory.make({
    name: REMINDER_QUEUE_NAME,
    schema: ReminderQueueJob,
  });

  return {
    deliveries,
    reminders,
  } satisfies NotificationQueues;
});

export const notificationQueueLayer = Layer.effect(
  NotificationQueueService,
  makeNotificationQueues,
);
