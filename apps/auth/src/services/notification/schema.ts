import { Schema } from "effect";

export const NotificationEmailAddress = Schema.NonEmptyString.annotate({
  identifier: "NotificationEmailAddress",
  title: "Notification email address",
  description: "An email address used by the notification service.",
  examples: ["user@example.com"],
});

export const NotificationEmailContent = Schema.Struct({
  subject: Schema.NonEmptyString,
  text: Schema.optional(Schema.NonEmptyString),
  html: Schema.optional(Schema.NonEmptyString),
}).annotate({
  identifier: "NotificationEmailContent",
  title: "Notification email content",
  description:
    "Email notification content. At least one of text or html must be provided when sending.",
  examples: [
    {
      subject: "Welcome",
      text: "Thanks for signing up.",
      html: "<p>Thanks for signing up.</p>",
    },
  ],
});

export const NotificationEmailMessage = Schema.Struct({
  from: NotificationEmailAddress,
  to: Schema.NonEmptyArray(NotificationEmailAddress),
  cc: Schema.optional(Schema.Array(NotificationEmailAddress)),
  bcc: Schema.optional(Schema.Array(NotificationEmailAddress)),
  replyTo: Schema.optional(Schema.Array(NotificationEmailAddress)),
  content: NotificationEmailContent,
}).annotate({
  identifier: "NotificationEmailMessage",
  title: "Notification email message",
  description: "A composable email notification message.",
  examples: [
    {
      from: "KrakStack <no-reply@example.com>",
      to: ["user@example.com"],
      content: {
        subject: "Welcome",
        text: "Thanks for signing up.",
      },
    },
  ],
});

export class NotificationSendError extends Schema.TaggedErrorClass<NotificationSendError>()(
  "NotificationSendError",
  {
    message: Schema.String,
    error: Schema.optional(Schema.Defect),
  },
) {}

export type NotificationEmailMessage = typeof NotificationEmailMessage.Type;
