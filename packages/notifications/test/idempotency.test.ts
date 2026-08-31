import { describe, expect, it } from "@effect/vitest";

import {
  canonicalRecipientAddress,
  deliveryIdempotencyKey,
  publicationFingerprint,
  reminderFingerprint,
} from "../src/internal/idempotency.js";
import type { PublishInput, ScheduleReminderInput } from "../src/schema.js";

const scope = {
  recipientUserId: "user-1",
  organizationId: "organization-1",
  workspaceId: null,
};

const publication = (): PublishInput => ({
  idempotencyKey: "publication-1",
  scope,
  eventKey: "application.received",
  eventVersion: 1,
  inbox: {
    locale: "en",
    title: "Application received",
    description: null,
    href: "/applications/1",
    metadata: { nested: { second: 2, first: 1 } },
  },
  deliveries: [
    {
      key: "primary",
      channel: "email",
      purpose: "notification",
      template: null,
      recipientAddress: "person@example.com",
      recipientName: "Person",
      payloadVersion: 1,
      payload: { text: "Body", subject: "Subject" },
      scheduledFor: new Date("2026-01-01T00:00:00.000Z"),
      expiresAt: new Date("2026-01-02T00:00:00.000Z"),
      maxAttempts: 3,
      references: [
        { namespace: "opportunity", value: "opportunity-1" },
        { namespace: "application", value: "application-1" },
      ],
    },
  ],
});

describe("notification idempotency", () => {
  it("canonicalizes email recipient addresses only", () => {
    expect(canonicalRecipientAddress("email", " Person@Example.COM ")).toBe(
      "person@example.com",
    );
    expect(canonicalRecipientAddress("sms", " +1 555 0100 ")).toBe(
      " +1 555 0100 ",
    );
  });

  it("uses injective tuple encoding for delivery keys", () => {
    expect(deliveryIdempotencyKey("a:b", "c")).not.toBe(
      deliveryIdempotencyKey("a", "b:c"),
    );
  });

  it("canonicalizes JSON keys and caller reference order", () => {
    const input = publication();
    const inbox = input.inbox;
    if (inbox === undefined || inbox === null) {
      throw new Error("Test publication requires an inbox");
    }
    const reordered: PublishInput = {
      ...input,
      inbox: {
        ...inbox,
        metadata: { nested: { first: 1, second: 2 } },
      },
      deliveries: input.deliveries.map((delivery) => ({
        ...delivery,
        payload: { subject: "Subject", text: "Body" },
        references: [...(delivery.references ?? [])].reverse(),
      })),
    };

    expect(publicationFingerprint(reordered)).toBe(
      publicationFingerprint(input),
    );
  });

  it("changes the fingerprint for immutable publication content", () => {
    const input = publication();
    const changed: PublishInput = {
      ...input,
      deliveries: input.deliveries.map((delivery) => ({
        ...delivery,
        payload: { subject: "Changed", text: "Body" },
      })),
    };

    expect(publicationFingerprint(changed)).not.toBe(
      publicationFingerprint(input),
    );
    expect(publicationFingerprint(input)).toMatch(/^[a-f0-9]{64}$/);
  });

  it("fingerprints reminder scope, handler, payload, schedule, and budget", () => {
    const reminder: ScheduleReminderInput = {
      idempotencyKey: "reminder-1",
      scope,
      handlerKey: "follow-up",
      handlerVersion: 1,
      payload: { applicationId: "application-1" },
      scheduledFor: new Date("2026-01-01T00:00:00.000Z"),
      expiresAt: null,
      maxAttempts: 3,
    };

    expect(reminderFingerprint({ ...reminder, handlerVersion: 2 })).not.toBe(
      reminderFingerprint(reminder),
    );
    expect(reminderFingerprint({ ...reminder, maxAttempts: 4 })).not.toBe(
      reminderFingerprint(reminder),
    );
  });
});
