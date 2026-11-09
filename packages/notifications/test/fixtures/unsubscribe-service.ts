import { Effect, Layer } from "effect";

import {
  NotificationService,
  type NotificationServiceContract,
} from "../../src/index.js";

export const makeUnsubscribeTestService = (
  options: Partial<Pick<NotificationServiceContract, "unsubscribeEmail">> = {},
) => {
  const recipients: Array<string> = [];
  const unused = () =>
    Effect.die(new Error("Unexpected notification operation"));
  const layer = Layer.succeed(NotificationService, {
    publish: unused,
    listInbox: unused,
    unreadCount: unused,
    markRead: unused,
    markUnread: unused,
    archive: unused,
    restore: unused,
    removeInbox: unused,
    markReadBulk: unused,
    archiveBulk: unused,
    listPreferences: unused,
    setPreference: unused,
    resetPreference: unused,
    resolvePreference: unused,
    listSuppressions: unused,
    setSuppression: unused,
    resetSuppression: unused,
    listDeliveries: unused,
    getDelivery: unused,
    cancelDelivery: unused,
    retryDelivery: unused,
    scheduleReminder: unused,
    getReminder: unused,
    listReminders: unused,
    rescheduleReminder: unused,
    cancelReminder: unused,
    getEmailSubscription: unused,
    unsubscribeEmail:
      options.unsubscribeEmail ??
      (({ recipientUserId }) =>
        Effect.sync(() => {
          recipients.push(recipientUserId);
          return { recipientUserId, unsubscribedAt: new Date(0) };
        })),
  });
  return { layer, recipients };
};
