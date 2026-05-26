import { Schema } from "effect";

export const SesEmailAddress = Schema.NonEmptyString.annotate({
  identifier: "SesEmailAddress",
  title: "SES email address",
  description: "An email address used by the SES notification channel.",
  examples: ["user@example.com"],
});

export const SesEmailNotification = Schema.Struct({
  from: Schema.optional(SesEmailAddress),
  to: Schema.Union([SesEmailAddress, Schema.NonEmptyArray(SesEmailAddress)]),
  cc: Schema.optional(Schema.Array(SesEmailAddress)),
  bcc: Schema.optional(Schema.Array(SesEmailAddress)),
  replyTo: Schema.optional(Schema.Array(SesEmailAddress)),
  subject: Schema.NonEmptyString,
  text: Schema.optional(Schema.NonEmptyString),
  html: Schema.optional(Schema.NonEmptyString),
}).annotate({
  identifier: "SesEmailNotification",
  title: "SES email notification",
  description:
    "Email notification payload handled by the SES notification channel. At least one of text or html must be provided when sending.",
  examples: [
    {
      from: "KrakStack <no-reply@example.com>",
      to: "user@example.com",
      subject: "Welcome",
      text: "Thanks for signing up.",
      html: "<p>Thanks for signing up.</p>",
    },
  ],
});

export type SesEmailNotification = typeof SesEmailNotification.Type;
