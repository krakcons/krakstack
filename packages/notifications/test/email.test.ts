import { describe, expect, it } from "@effect/vitest";
import { Effect } from "effect";

import { classifySesTransportError } from "../src/transport/email-ses.js";
import { classifySmtpTransportError } from "../src/transport/email-smtp.js";
import {
  decodeEmailPayloadV1,
  decodeEmailRecipient,
  emailUnsubscribeHeaders,
  formatEmailRecipient,
} from "../src/transport/email.js";

describe("email payload v1", () => {
  it.effect(
    "emits one-click headers only when an HTTPS unsubscribe URL is supplied",
    () =>
      Effect.gen(function* () {
        const withoutLink = yield* decodeEmailPayloadV1({
          subject: "Subject",
          text: "Body",
        });
        expect(emailUnsubscribeHeaders(withoutLink)).toEqual([]);
        const withLink = yield* decodeEmailPayloadV1({
          subject: "Subject",
          html: "<p>Body</p>",
          unsubscribeUrl: "https://example.com/unsubscribe?token=signed",
        });
        expect(emailUnsubscribeHeaders(withLink)).toEqual([
          {
            name: "List-Unsubscribe",
            value: "<https://example.com/unsubscribe?token=signed>",
          },
          {
            name: "List-Unsubscribe-Post",
            value: "List-Unsubscribe=One-Click",
          },
        ]);
        expect(withLink.html).toBe("<p>Body</p>");
        for (const unsubscribeUrl of [
          "http://example.com",
          "https://example.com/\r\nBcc:injected@example.com",
          "https://example.com/<bad>",
          "https://example.com#fragment",
          "/unsubscribe",
          `https://example.com/${"a".repeat(978)}`,
          "https://example.com/é",
        ]) {
          const result = yield* decodeEmailPayloadV1({
            subject: "Subject",
            text: "Body",
            unsubscribeUrl,
          }).pipe(Effect.exit);
          expect(result._tag).toBe("Failure");
        }
      }),
  );
  it.effect("decodes content without changing rendered bodies", () =>
    Effect.gen(function* () {
      const text = "Exact text\nwith spacing";
      const html = "<main>Exact HTML</main>";
      const decoded = yield* decodeEmailPayloadV1({
        from: "sender@example.com",
        fromName: "Équipe française",
        replyTo: "reply@example.com",
        subject: "Rendered subject",
        text,
        html,
      });

      expect(decoded.text).toBe(text);
      expect(decoded.html).toBe(html);
      expect(decoded.replyTo).toBe("reply@example.com");
      expect(decoded.fromName).toBe("Équipe française");
    }),
  );

  it.effect("accepts one rendered body", () =>
    Effect.gen(function* () {
      const decoded = yield* decodeEmailPayloadV1({
        subject: "Rendered subject",
        text: "Body",
      });

      expect(decoded.html).toBeUndefined();
    }),
  );

  it.effect("rejects empty sender names and sender-name header injection", () =>
    Effect.gen(function* () {
      for (const fromName of [
        "",
        "Team\r\nBcc: attacker@example.com",
        "Team\nInjected",
        "Team\rInjected",
      ]) {
        const result = yield* decodeEmailPayloadV1({
          fromName,
          subject: "Subject",
          text: "Body",
        }).pipe(Effect.exit);
        expect(result._tag).toBe("Failure");
      }
    }),
  );

  it.effect(
    "rejects missing or empty bodies and invalid sender addresses",
    () =>
      Effect.gen(function* () {
        const missingBody = yield* decodeEmailPayloadV1({
          subject: "Rendered subject",
        }).pipe(Effect.exit);
        const emptyBody = yield* decodeEmailPayloadV1({
          subject: "Rendered subject",
          html: "",
        }).pipe(Effect.exit);
        const invalidSender = yield* decodeEmailPayloadV1({
          from: "not-an-email",
          subject: "Rendered subject",
          text: "Body",
        }).pipe(Effect.exit);

        expect(missingBody._tag).toBe("Failure");
        expect(emptyBody._tag).toBe("Failure");
        expect(invalidSender._tag).toBe("Failure");
      }),
  );

  it.effect("derives the sole destination from the ledger recipient", () =>
    Effect.gen(function* () {
      const decoded = yield* decodeEmailPayloadV1({
        to: "payload-override@example.com",
        cc: ["copy@example.com"],
        bcc: ["blind@example.com"],
        subject: "Rendered subject",
        text: "Body",
      });
      const recipient = yield* decodeEmailRecipient({
        address: "ledger@example.com",
        name: "Ledger Recipient",
      });

      expect(decoded).not.toHaveProperty("to");
      expect(decoded).not.toHaveProperty("cc");
      expect(decoded).not.toHaveProperty("bcc");
      expect(formatEmailRecipient(recipient)).toBe(
        '"Ledger Recipient" <ledger@example.com>',
      );
    }),
  );
});

describe("SES error classification", () => {
  it("classifies throttling, server, authentication, and request errors", () => {
    expect(
      classifySesTransportError({
        name: "TooManyRequestsException",
        $metadata: { httpStatusCode: 400 },
      }),
    ).toBe("retryable");
    expect(
      classifySesTransportError({ $metadata: { httpStatusCode: 503 } }),
    ).toBe("retryable");
    expect(
      classifySesTransportError({ name: "CredentialsProviderError" }),
    ).toBe("unavailable");
    expect(
      classifySesTransportError({
        name: "MessageRejected",
        $metadata: { httpStatusCode: 400 },
      }),
    ).toBe("permanent");
    expect(classifySesTransportError({ code: "ECONNRESET" })).toBe("retryable");
  });
});

describe("SMTP error classification", () => {
  it("classifies transient, authentication, message, and network failures", () => {
    expect(classifySmtpTransportError({ responseCode: 451 })).toBe("retryable");
    expect(classifySmtpTransportError({ code: "EAUTH" })).toBe("unavailable");
    expect(classifySmtpTransportError({ responseCode: 535 })).toBe(
      "unavailable",
    );
    expect(classifySmtpTransportError({ code: "EENVELOPE" })).toBe("permanent");
    expect(
      classifySmtpTransportError({ code: "EENVELOPE", responseCode: 451 }),
    ).toBe("retryable");
    expect(classifySmtpTransportError({ responseCode: 550 })).toBe("permanent");
    expect(classifySmtpTransportError({ code: "ECONNECTION" })).toBe(
      "retryable",
    );
  });
});
