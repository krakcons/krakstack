import { describe, expect, it } from "@effect/vitest";
import { Effect, Schema } from "effect";
import {
  ContactListQuery,
  CreateContact,
  QueueEmail,
  RecordEmailConsent,
} from "../src/schema.js";

describe("KrakSend boundary validation", () => {
  it.effect(
    "normalizes surrounding address whitespace and rejects malformed addresses and header injection",
    () =>
      Effect.gen(function* () {
        expect(
          (yield* Schema.decodeEffect(CreateContact)({
            email: " person@example.com ",
          })).email,
        ).toBe("person@example.com");
        for (const input of [
          { email: "not-an-address" },
          {
            email: "person@example.com",
            name: "Person\r\nBcc: other@example.com",
          },
          { email: "person@example.com", locale: "unsupported" },
        ])
          expect(
            (yield* Schema.decodeUnknownEffect(CreateContact)(input).pipe(
              Effect.exit,
            ))._tag,
          ).toBe("Failure");
      }),
  );

  it.effect(
    "requires an unsubscribe capability for optional email, but not transactional email",
    () =>
      Effect.gen(function* () {
        const input = {
          requestId: "one",
          contactId: "019a0000-0000-7000-8000-000000000001",
          eventKey: "notice",
          email: { subject: "Subject", text: "Body" },
        };
        for (const purpose of ["notification", "marketing"]) {
          expect(
            (yield* Schema.decodeUnknownEffect(QueueEmail)({
              ...input,
              purpose,
            }).pipe(Effect.exit))._tag,
          ).toBe("Failure");
          yield* Schema.decodeUnknownEffect(QueueEmail)({
            ...input,
            purpose,
            email: {
              ...input.email,
              unsubscribeUrl: "https://example.com/unsubscribe?token=signed",
            },
          });
        }
        yield* Schema.decodeEffect(QueueEmail)({
          ...input,
          purpose: "transactional",
        });
      }),
  );

  it.effect(
    "bounds pagination and requires explicit attributable consent changes",
    () =>
      Effect.gen(function* () {
        expect(
          (yield* Schema.decodeEffect(ContactListQuery)({
            limit: 101,
          }).pipe(Effect.exit))._tag,
        ).toBe("Failure");
        const change = {
          requestId: "change",
          contactId: "019a0000-0000-7000-8000-000000000001",
          status: "subscribed",
          source: "host",
          actor: "host:admin",
          noticeVersion: "v1",
        };
        yield* Schema.decodeUnknownEffect(RecordEmailConsent)(change);
        expect(
          (yield* Schema.decodeUnknownEffect(RecordEmailConsent)({
            ...change,
            actor: "",
          }).pipe(Effect.exit))._tag,
        ).toBe("Failure");
        expect(
          (yield* Schema.decodeUnknownEffect(RecordEmailConsent)({
            ...change,
            status: "unknown",
          }).pipe(Effect.exit))._tag,
        ).toBe("Failure");
      }),
  );
});
