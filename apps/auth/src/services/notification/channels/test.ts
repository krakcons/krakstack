import { Effect, Layer } from "effect";

import { NotificationService } from "../index";
import { NotificationChannelService } from "../channel";
import type { NotificationEmailMessage } from "../schema";

export const testNotificationChannelLayer = Layer.succeed(
  NotificationChannelService,
  {
    send: (message: NotificationEmailMessage) =>
      Effect.sync(() => {
        console.log("[notification:test] email", message);
      }),
  },
);

export const testNotificationServiceLayer = NotificationService.layer.pipe(
  Layer.provide(testNotificationChannelLayer),
);
