import { describe, expect, it } from "@effect/vitest";
import { Effect } from "effect";
import { getTableConfig } from "drizzle-orm/pg-core";

import {
  notificationDeliveries,
  notificationSettings,
  notifications,
} from "./drizzle";
import { decodeNotificationDeliveryPayload } from "./schema";

describe("notification persistence tables", () => {
  it("defines the three notification domain tables", () => {
    expect(getTableConfig(notifications).name).toBe("notifications");
    expect(getTableConfig(notificationSettings).name).toBe(
      "notification_settings",
    );
    expect(getTableConfig(notificationDeliveries).name).toBe(
      "notification_deliveries",
    );
  });

  it("defines idempotency, scope, claim, and lifecycle constraints", () => {
    const inbox = getTableConfig(notifications);
    const settings = getTableConfig(notificationSettings);
    const deliveries = getTableConfig(notificationDeliveries);

    expect(inbox.indexes.map((item) => item.config.name)).toContain(
      "notifications_idempotency_key_uidx",
    );
    expect(settings.indexes.map((item) => item.config.name)).toContain(
      "notification_settings_scope_channel_uidx",
    );
    expect(deliveries.indexes.map((item) => item.config.name)).toContain(
      "notification_deliveries_claim_idx",
    );
    expect(deliveries.checks.map((item) => item.name)).toEqual(
      expect.arrayContaining([
        "notification_deliveries_attempts_check",
        "notification_deliveries_lease_check",
        "notification_deliveries_status_check",
      ]),
    );
  });
});

describe("notification delivery payloads", () => {
  it.effect("decodes an email payload version 1 snapshot", () =>
    Effect.gen(function* () {
      const decoded = yield* decodeNotificationDeliveryPayload({
        channel: "email",
        payloadVersion: 1,
        payload: {
          to: "volunteer@example.com",
          subject: "Application approved",
          text: "Your application was approved.",
        },
      });

      expect(decoded.channel).toBe("email");
      expect(decoded.payload.subject).toBe("Application approved");
    }),
  );

  it.effect("rejects email snapshots without text or html", () =>
    Effect.gen(function* () {
      const result = yield* decodeNotificationDeliveryPayload({
        channel: "email",
        payloadVersion: 1,
        payload: {
          to: "volunteer@example.com",
          subject: "Application approved",
        },
      }).pipe(Effect.exit);

      expect(result._tag).toBe("Failure");
    }),
  );

  it.effect("rejects unsupported payload versions", () =>
    Effect.gen(function* () {
      const result = yield* decodeNotificationDeliveryPayload({
        channel: "email",
        payloadVersion: 2,
        payload: {
          to: "volunteer@example.com",
          subject: "Application approved",
          text: "Your application was approved.",
        },
      }).pipe(Effect.exit);

      expect(result._tag).toBe("Failure");
    }),
  );
});
