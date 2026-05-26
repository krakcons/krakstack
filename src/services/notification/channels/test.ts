import { Effect, Layer } from "effect";

import { NotificationChannelRegistry } from "../channel";
import { NotificationService } from "../index";

export const testNotificationChannelLayer = Layer.succeed(
  NotificationChannelRegistry,
  {
    channels: [
      {
        key: "test",
        send: (payload: unknown) =>
          Effect.sync(() => {
            console.log("[notification:test]", payload);
          }),
      },
    ],
  },
);

export const testNotificationServiceLayer = NotificationService.layer.pipe(
  Layer.provide(testNotificationChannelLayer),
);
