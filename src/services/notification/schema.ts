import { Schema } from "effect";

export const NotificationMessageSchema = Schema.Record(
  Schema.String,
  Schema.Unknown,
).annotate({
  identifier: "NotificationMessage",
  title: "Notification message",
  description:
    "A dynamic notification envelope keyed by channel capability. Installed channels send the payload matching their key.",
  examples: [
    {
      email: {
        to: "user@example.com",
        subject: "Welcome",
        text: "Thanks for signing up.",
      },
      discord: {
        content: "A user signed up.",
      },
    },
  ],
});

export class NotificationSendError extends Schema.TaggedErrorClass<NotificationSendError>()(
  "NotificationSendError",
  {
    message: Schema.String,
    channel: Schema.optional(Schema.String),
    error: Schema.optional(Schema.Defect()),
  },
) {}

export type { NotificationMessage } from "./channels";
