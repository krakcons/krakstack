import { describe, expect, it } from "@effect/vitest";
import { Effect, Layer } from "effect";

import { DirectNotificationDispatcher } from "../src/direct.js";
import { makeFakeTransport } from "../src/testing.js";
import { NotificationTransportRegistry } from "../src/transport.js";

const input = {
  scope: {
    recipientUserId: null,
    organizationId: null,
    workspaceId: null,
  },
  eventKey: "system.test",
  eventVersion: 1,
  channel: "email",
  template: null,
  recipientAddress: " Person@Example.COM ",
  recipientName: null,
  payloadVersion: 1,
  payload: { subject: "Test", text: "Body" },
};

describe("direct notification dispatcher", () => {
  it.effect("dispatches without SQL or a persisted queue", () => {
    const fake = makeFakeTransport({ channel: "email" });
    const layer = DirectNotificationDispatcher.layer.pipe(
      Layer.provide(fake.layer),
    );

    return Effect.gen(function* () {
      const dispatcher = yield* DirectNotificationDispatcher;
      const result = yield* dispatcher.dispatch(input);

      expect(result.provider).toBe("fake");
      expect(fake.sent).toHaveLength(1);
      expect(fake.sent[0]?.deliveryId).toBeNull();
      expect(fake.sent[0]?.recipientAddress).toBe("person@example.com");
      expect(fake.sent[0]?.payload).toEqual(input.payload);
    }).pipe(Effect.provide(layer));
  });

  it.effect("returns typed unavailable failures for missing channels", () =>
    Effect.gen(function* () {
      const dispatcher = yield* DirectNotificationDispatcher;
      const result = yield* dispatcher.dispatch(input).pipe(Effect.exit);

      expect(result._tag).toBe("Failure");
    }).pipe(
      Effect.provide(
        DirectNotificationDispatcher.layer.pipe(
          Layer.provide(NotificationTransportRegistry.emptyLayer),
        ),
      ),
    ),
  );
});
