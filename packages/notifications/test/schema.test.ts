import { describe, expect, it } from "@effect/vitest";
import { Effect, Schema } from "effect";

import {
  BulkInboxMutationInput,
  DeliveryQueueJob,
  ListRemindersInput,
  ListSuppressionsInput,
  PublishInput,
  PublishResult,
  ReminderQueueJob,
  ReminderMutationInput,
  ResetSuppressionInput,
  SetPreferenceInput,
  SetSuppressionInput,
  UnreadCountInput,
} from "../src/schema.js";
import { NotificationTransportResult } from "../src/transport.js";

const scope = {
  recipientUserId: "user-1",
  organizationId: "org-1",
  workspaceId: null,
};

describe("notification schemas", () => {
  it.effect("decodes a channel-neutral publish snapshot", () =>
    Effect.gen(function* () {
      const decoded = yield* Schema.decodeUnknownEffect(PublishInput)({
        idempotencyKey: "event-1",
        scope,
        eventKey: "application.approved",
        eventVersion: 1,
        inbox: {
          locale: "en",
          title: "Rendered title",
          description: null,
          href: null,
          metadata: { applicationId: "application-1" },
        },
        deliveries: [
          {
            key: "email-primary",
            channel: "email",
            purpose: "notification",
            template: null,
            recipientAddress: "person@example.com",
            recipientName: null,
            payloadVersion: 1,
            payload: { subject: "Rendered subject", text: "Rendered body" },
          },
        ],
      });

      expect(decoded.deliveries[0]?.payload).toEqual({
        subject: "Rendered subject",
        text: "Rendered body",
      });
    }),
  );

  it.effect("rejects whitespace-only recipient addresses", () =>
    Effect.gen(function* () {
      const result = yield* Schema.decodeUnknownEffect(SetSuppressionInput)({
        scope,
        channel: "email",
        purpose: null,
        recipientAddress: "   ",
        reason: null,
        expiresAt: null,
      }).pipe(Effect.exit);

      expect(result._tag).toBe("Failure");
    }),
  );

  it.effect("rejects unsupported delivery purposes", () =>
    Effect.gen(function* () {
      const result = yield* Schema.decodeUnknownEffect(PublishInput)({
        idempotencyKey: "event-1",
        scope,
        eventKey: "application.approved",
        eventVersion: 1,
        inbox: {
          locale: "en",
          title: "Rendered title",
          description: null,
          href: null,
          metadata: {},
        },
        deliveries: [
          {
            key: "email-primary",
            channel: "email",
            purpose: "marketing",
            template: null,
            recipientAddress: "person@example.com",
            recipientName: null,
            payloadVersion: 1,
            payload: {},
          },
        ],
      }).pipe(Effect.exit);

      expect(result._tag).toBe("Failure");
    }),
  );

  it.effect(
    "decodes delivery-only publication for a non-account recipient with references",
    () =>
      Effect.gen(function* () {
        const decoded = yield* Schema.decodeUnknownEffect(PublishInput)({
          idempotencyKey: "external-delivery-1",
          scope: {
            recipientUserId: null,
            organizationId: "org-1",
            workspaceId: null,
          },
          eventKey: "application.received",
          eventVersion: 1,
          deliveries: [
            {
              key: "email-primary",
              channel: "email",
              purpose: "transactional",
              template: null,
              recipientAddress: "external@example.com",
              recipientName: null,
              payloadVersion: 1,
              payload: { subject: "Received", text: "Body" },
              references: [
                { namespace: "application", value: "application-1" },
                { namespace: "opportunity", value: "opportunity-1" },
                { namespace: "organization", value: "org-1" },
              ],
            },
          ],
        });
        const result = yield* Schema.decodeUnknownEffect(PublishResult)({
          notificationId: null,
          deliveryIds: ["00000000-0000-4000-8000-000000000001"],
          idempotentReplay: false,
        });

        expect(decoded.inbox).toBeUndefined();
        expect(decoded.scope.recipientUserId).toBeNull();
        expect(decoded.deliveries[0]?.references).toHaveLength(3);
        expect(result.notificationId).toBeNull();
      }),
  );

  it.effect("rejects inbox publication without a recipient user", () =>
    Effect.gen(function* () {
      const result = yield* Schema.decodeUnknownEffect(PublishInput)({
        idempotencyKey: "invalid-inbox",
        scope: {
          recipientUserId: null,
          organizationId: null,
          workspaceId: null,
        },
        eventKey: "application.received",
        eventVersion: 1,
        inbox: {
          locale: "en",
          title: "Rendered title",
          description: null,
          href: null,
          metadata: {},
        },
        deliveries: [],
      }).pipe(Effect.exit);

      expect(result._tag).toBe("Failure");
    }),
  );

  it.effect("rejects identity preferences without a recipient user", () =>
    Effect.gen(function* () {
      const result = yield* Schema.decodeUnknownEffect(SetPreferenceInput)({
        scope: {
          recipientUserId: null,
          organizationId: null,
          workspaceId: null,
        },
        eventKey: null,
        channel: "email",
        enabled: false,
      }).pipe(Effect.exit);

      expect(result._tag).toBe("Failure");
    }),
  );

  it.effect("rejects an empty publication", () =>
    Effect.gen(function* () {
      const result = yield* Schema.decodeUnknownEffect(PublishInput)({
        idempotencyKey: "empty-publication",
        scope: {
          recipientUserId: null,
          organizationId: null,
          workspaceId: null,
        },
        eventKey: "application.received",
        eventVersion: 1,
        inbox: null,
        deliveries: [],
      }).pipe(Effect.exit);

      expect(result._tag).toBe("Failure");
    }),
  );

  it.effect("rejects duplicate delivery keys within a publication", () =>
    Effect.gen(function* () {
      const delivery = {
        key: "duplicate",
        channel: "email",
        purpose: "transactional",
        template: null,
        recipientAddress: "external@example.com",
        recipientName: null,
        payloadVersion: 1,
        payload: {},
      };
      const result = yield* Schema.decodeUnknownEffect(PublishInput)({
        idempotencyKey: "duplicate-publication",
        scope: {
          recipientUserId: null,
          organizationId: null,
          workspaceId: null,
        },
        eventKey: "application.received",
        eventVersion: 1,
        deliveries: [delivery, delivery],
      }).pipe(Effect.exit);

      expect(result._tag).toBe("Failure");
    }),
  );

  it.effect("decodes nullable-recipient suppression inputs", () =>
    Effect.gen(function* () {
      const suppression = yield* Schema.decodeUnknownEffect(
        SetSuppressionInput,
      )({
        scope: {
          recipientUserId: null,
          organizationId: "org-1",
          workspaceId: null,
        },
        channel: "email",
        purpose: "notification",
        recipientAddress: "external@example.com",
        reason: "bounce",
        expiresAt: null,
      });
      const transportResult = yield* Schema.decodeUnknownEffect(
        NotificationTransportResult,
      )({ provider: "smtp", providerMessageId: null });
      const list = yield* Schema.decodeUnknownEffect(ListSuppressionsInput)({
        scope: suppression.scope,
        channel: null,
        purposes: ["notification", null],
        includeExpired: false,
      });
      const reset = yield* Schema.decodeUnknownEffect(ResetSuppressionInput)({
        scope: suppression.scope,
        channel: suppression.channel,
        purpose: suppression.purpose,
        recipientAddress: suppression.recipientAddress,
      });

      expect(suppression.scope.recipientUserId).toBeNull();
      expect(list.channel).toBeNull();
      expect(reset.recipientAddress).toBe("external@example.com");
      expect(transportResult.providerMessageId).toBeNull();
    }),
  );

  it.effect("rejects package-owned delivery reference namespaces", () =>
    Effect.gen(function* () {
      const result = yield* Schema.decodeUnknownEffect(PublishInput)({
        idempotencyKey: "reserved-reference",
        scope,
        eventKey: "application.received",
        eventVersion: 1,
        deliveries: [
          {
            key: "email-primary",
            channel: "email",
            purpose: "transactional",
            template: null,
            recipientAddress: "external@example.com",
            recipientName: null,
            payloadVersion: 1,
            payload: { subject: "Received", text: "Body" },
            references: [
              { namespace: "krakstack.publication", value: "forged" },
            ],
          },
        ],
      }).pipe(Effect.exit);

      expect(result._tag).toBe("Failure");
    }),
  );

  it.effect("decodes stable delivery and reminder queue payloads", () =>
    Effect.gen(function* () {
      const delivery = yield* Schema.decodeUnknownEffect(DeliveryQueueJob)({
        _tag: "Delivery",
        deliveryId: "00000000-0000-4000-8000-000000000001",
        generation: 2,
        attempt: 3,
      });
      const reminder = yield* Schema.decodeUnknownEffect(ReminderQueueJob)({
        _tag: "Reminder",
        reminderId: "00000000-0000-4000-8000-000000000002",
        generation: 4,
        attempt: 1,
      });

      expect(delivery).toEqual({
        _tag: "Delivery",
        deliveryId: "00000000-0000-4000-8000-000000000001",
        generation: 2,
        attempt: 3,
      });
      expect(reminder.generation).toBe(4);
    }),
  );

  it.effect("decodes exact-scope menu and reminder operations", () =>
    Effect.gen(function* () {
      const notificationId = "00000000-0000-4000-8000-000000000001";
      const reminderId = "00000000-0000-4000-8000-000000000002";
      const bulk = yield* Schema.decodeUnknownEffect(BulkInboxMutationInput)({
        scope,
        notificationIds: [notificationId],
      });
      const unread = yield* Schema.decodeUnknownEffect(UnreadCountInput)({
        scope,
      });
      const reminder = yield* Schema.decodeUnknownEffect(ReminderMutationInput)(
        {
          scope,
          reminderId,
        },
      );
      const list = yield* Schema.decodeUnknownEffect(ListRemindersInput)({
        scope,
        pagination: { limit: 20, cursor: null },
        statuses: ["scheduled", "retrying"],
      });

      expect(bulk.notificationIds).toEqual([notificationId]);
      expect(unread.scope).toEqual(scope);
      expect(reminder.reminderId).toBe(reminderId);
      expect(list.statuses).toEqual(["scheduled", "retrying"]);
    }),
  );

  it.effect("rejects duplicate ids in bulk inbox operations", () =>
    Effect.gen(function* () {
      const notificationId = "00000000-0000-4000-8000-000000000001";
      const result = yield* Schema.decodeUnknownEffect(BulkInboxMutationInput)({
        scope,
        notificationIds: [notificationId, notificationId],
      }).pipe(Effect.exit);

      expect(result._tag).toBe("Failure");
    }),
  );
});
