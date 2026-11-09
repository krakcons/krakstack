import { describe, expect, it } from "@effect/vitest";
import { Effect } from "effect";

import {
  sesEmailRequest,
  smtpEmailRequest,
} from "../src/internal/email-requests.js";
import {
  decodeEmailPayloadV1,
  decodeEmailRecipient,
} from "../src/transport/email.js";

describe("email adapter requests", () => {
  it.effect(
    "maps validated unsubscribe headers into the real SES and SMTP request builders",
    () =>
      Effect.gen(function* () {
        const email = yield* decodeEmailPayloadV1({
          subject: "Subject",
          text: "Body",
          html: "<p>Body</p>",
          replyTo: "reply@example.com",
          unsubscribeUrl: "https://example.com/unsubscribe?token=signed",
        });
        const recipient = yield* decodeEmailRecipient({
          address: "recipient@example.com",
          name: "Recipient",
        });
        const request = { email, recipient, from: "sender@example.com" };
        expect(sesEmailRequest(request)).toEqual({
          FromEmailAddress: "sender@example.com",
          Destination: { ToAddresses: ['"Recipient" <recipient@example.com>'] },
          ReplyToAddresses: ["reply@example.com"],
          Content: {
            Simple: {
              Subject: { Data: "Subject", Charset: "UTF-8" },
              Body: {
                Text: { Data: "Body", Charset: "UTF-8" },
                Html: { Data: "<p>Body</p>", Charset: "UTF-8" },
              },
              Headers: [
                {
                  Name: "List-Unsubscribe",
                  Value: "<https://example.com/unsubscribe?token=signed>",
                },
                {
                  Name: "List-Unsubscribe-Post",
                  Value: "List-Unsubscribe=One-Click",
                },
              ],
            },
          },
        });
        expect(smtpEmailRequest(request)).toEqual({
          from: "sender@example.com",
          to: { address: "recipient@example.com", name: "Recipient" },
          replyTo: "reply@example.com",
          subject: "Subject",
          text: "Body",
          html: "<p>Body</p>",
          headers: [
            {
              key: "List-Unsubscribe",
              value: "<https://example.com/unsubscribe?token=signed>",
            },
            {
              key: "List-Unsubscribe-Post",
              value: "List-Unsubscribe=One-Click",
            },
          ],
          disableFileAccess: true,
          disableUrlAccess: true,
        });
        const withoutLink = {
          ...request,
          email: yield* decodeEmailPayloadV1({
            subject: "Subject",
            text: "Body",
          }),
        };
        expect(
          sesEmailRequest(withoutLink).Content?.Simple?.Headers,
        ).toBeUndefined();
        expect(smtpEmailRequest(withoutLink).headers).toBeUndefined();
      }),
  );
});
