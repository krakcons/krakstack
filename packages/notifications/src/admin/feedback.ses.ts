// SES notification feedback adapter.
import { Effect, Schema } from "effect";
import {
  NormalizeSesFeedback,
  type RecordFeedback,
  SendValidationError,
} from "./schema.js";

// Call only after authenticating SNS or reading an IAM-protected SQS queue and
// verifying the expected installation topic/account/configuration set. Parsing
// an SES-shaped payload is not authentication. No remote certificate fetches or
// subscription confirmations are performed here.
export const normalizeSesFeedback = Effect.fn(
  "SendFeedback.normalizeSesFeedback",
)(function* (raw: typeof NormalizeSesFeedback.Encoded) {
  const { eventId, notification } = yield* Schema.decodeEffect(
    NormalizeSesFeedback,
  )(raw).pipe(
    Effect.mapError(
      () =>
        new SendValidationError({
          message: "Unsupported or invalid SES feedback",
        }),
    ),
  );
  const base = {
    provider: "ses",
    eventId,
    providerMessageId: notification.mail.messageId,
  };
  switch (notification.eventType) {
    case "Bounce":
      return notification.bounce.bouncedRecipients.map(
        ({ emailAddress }): RecordFeedback => ({
          ...base,
          recipientAddress: emailAddress.toLowerCase(),
          kind:
            notification.bounce.bounceType === "Permanent"
              ? "hard_bounce"
              : "soft_bounce",
          occurredAt: notification.bounce.timestamp,
        }),
      );
    case "Complaint":
      return notification.complaint.complainedRecipients.map(
        ({ emailAddress }): RecordFeedback => ({
          ...base,
          recipientAddress: emailAddress.toLowerCase(),
          kind: "complaint",
          occurredAt: notification.complaint.timestamp,
        }),
      );
    case "Delivery":
      return notification.delivery.recipients.map(
        (address): RecordFeedback => ({
          ...base,
          recipientAddress: address.toLowerCase(),
          kind: "delivered",
          occurredAt: notification.delivery.timestamp,
        }),
      );
  }
});
