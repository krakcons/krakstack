import { describe, expect, it } from "@effect/vitest";
import { Effect, Schema } from "effect";
import { normalizeSesFeedback } from "../src/feedback.ses.js";
import { SesFeedbackNotification } from "../src/schema.js";

const timestamp = "2026-11-06T12:00:00Z";
const mail = { messageId: "ses-message" };
describe("SES feedback normalization", () => {
  it.effect(
    "normalizes permanent bounces per recipient and preserves the stable envelope ID",
    () =>
      Effect.gen(function* () {
        const events = yield* normalizeSesFeedback({
          eventId: "sns-envelope-id",
          notification: {
            eventType: "Bounce",
            mail,
            bounce: {
              bounceType: "Permanent",
              timestamp,
              bouncedRecipients: [
                { emailAddress: " One@Example.com " },
                { emailAddress: "two@example.com" },
              ],
            },
          },
        });
        expect(events.map((event) => event.recipientAddress)).toEqual([
          "one@example.com",
          "two@example.com",
        ]);
        expect(
          events.every(
            (event) =>
              event.kind === "hard_bounce" &&
              event.provider === "ses" &&
              event.eventId === "sns-envelope-id" &&
              event.providerMessageId === mail.messageId,
          ),
        ).toBe(true);
        expect(events[0].occurredAt.toISOString()).toBe(
          "2026-11-06T12:00:00.000Z",
        );
      }),
  );

  it.effect(
    "does not turn transient or undetermined bounces into permanent suppression",
    () =>
      Effect.gen(function* () {
        for (const bounceType of ["Transient", "Undetermined"] as const) {
          const events = yield* normalizeSesFeedback({
            eventId: bounceType,
            notification: {
              eventType: "Bounce",
              mail,
              bounce: {
                bounceType,
                timestamp,
                bouncedRecipients: [{ emailAddress: "one@example.com" }],
              },
            },
          });
          expect(events[0].kind).toBe("soft_bounce");
        }
        const complaint = yield* normalizeSesFeedback({
          eventId: "complaint",
          notification: {
            eventType: "Complaint",
            mail,
            complaint: {
              timestamp,
              complainedRecipients: [{ emailAddress: "one@example.com" }],
            },
          },
        });
        expect(complaint[0].kind).toBe("complaint");
        const delivery = yield* normalizeSesFeedback({
          eventId: "delivery",
          notification: {
            eventType: "Delivery",
            mail,
            delivery: { timestamp, recipients: ["one@example.com"] },
          },
        });
        expect(delivery[0].kind).toBe("delivered");
      }),
  );

  it.effect(
    "rejects unsupported events and missing/invalid correlation data at the boundary",
    () =>
      Effect.gen(function* () {
        for (const notification of [
          { eventType: "Open", mail },
          {
            eventType: "Complaint",
            mail,
            complaint: { timestamp, complainedRecipients: [] },
          },
          {
            eventType: "Delivery",
            mail: { messageId: "" },
            delivery: { timestamp, recipients: ["one@example.com"] },
          },
          {
            eventType: "Bounce",
            mail,
            bounce: {
              bounceType: "Permanent",
              timestamp: "not-a-date",
              bouncedRecipients: [{ emailAddress: "not-an-address" }],
            },
          },
        ])
          expect(
            (yield* Schema.decodeUnknownEffect(SesFeedbackNotification)(
              notification,
            ).pipe(Effect.exit))._tag,
          ).toBe("Failure");
      }),
  );
});
