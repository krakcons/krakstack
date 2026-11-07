import { describe, expect, it } from "@effect/vitest";
import { Option, Schema } from "effect";
import {
  PublicationRequest,
  resolvePublication,
} from "../src/internal/publication.js";
import { publicationFingerprint } from "../src/internal/idempotency.js";
import { PublicationInput, PublishInput } from "../src/schema.js";

const publication = (): PublicationInput => ({
  idempotencyKey: "receipt-1",
  scope: { recipientUserId: null, organizationId: "org-1", workspaceId: null },
  eventKey: "order.receipt",
  eventVersion: 1,
  deliveries: [
    {
      key: "email",
      channel: "email",
      recipient: { address: "Person@Example.com", name: null },
      policy: { kind: "transactional" },
      template: "receipt",
      payloadVersion: 1,
      payload: { subject: "Receipt", text: "Content" },
    },
  ],
});

describe("canonical publication contract", () => {
  it("requires explicit consent and unsubscribe for optional external email", () => {
    const input = publication();
    expect(Option.isSome(Schema.decodeOption(PublicationInput)(input))).toBe(
      true,
    );
    const delivery = input.deliveries[0];
    for (const policy of [
      { kind: "notification" },
      { kind: "marketing" },
      { kind: "marketing", consent: true },
    ]) {
      expect(
        Option.isNone(
          Schema.decodeUnknownOption(PublicationRequest)({
            ...input,
            deliveries: [{ ...delivery, policy }],
          }),
        ),
      ).toBe(true);
    }
  });

  it("cannot fall back to legacy publication when canonical policy is invalid", () => {
    const input = publication();
    const mixed = {
      ...input.deliveries[0],
      purpose: "transactional",
      recipientAddress: "person@example.com",
      recipientName: null,
      policy: { kind: "marketing" },
    };
    expect(
      Option.isNone(
        Schema.decodeUnknownOption(PublicationRequest)({
          ...input,
          deliveries: [mixed],
        }),
      ),
    ).toBe(true);
    expect(
      Option.isNone(
        Schema.decodeOption(PublishInput)({
          ...input,
          deliveries: [
            {
              purpose: "marketing",
              recipientAddress: "person@example.com",
              recipientName: null,
              key: "email",
              channel: "email",
              template: null,
              payloadVersion: 1,
              payload: {},
            },
          ],
        }),
      ),
    ).toBe(true);
  });

  it("fingerprints canonical policy, associations and checks without changing legacy fingerprints", () => {
    const input = publication();
    const resolved = resolvePublication(input);
    const fingerprint = publicationFingerprint(resolved);
    expect(resolved.deliveries[0].recipientAddress).toBe("person@example.com");
    expect(
      publicationFingerprint(
        resolvePublication({
          ...input,
          deliveries: input.deliveries.map((delivery) => ({
            ...delivery,
            recipient: { ...delivery.recipient, address: "person@example.com" },
          })),
        }),
      ),
    ).toBe(fingerprint);
    expect(
      publicationFingerprint(
        resolvePublication({
          ...input,
          deliveries: input.deliveries.map((delivery) => ({
            ...delivery,
            checks: [
              {
                key: "eligibility",
                version: 1,
                subject: { namespace: "recipient", value: "1" },
              },
            ],
          })),
        }),
      ),
    ).not.toBe(fingerprint);
    const legacy = Schema.decodeSync(PublishInput)({
      ...input,
      deliveries: [
        {
          key: "email",
          channel: "email",
          purpose: "transactional",
          recipientAddress: "person@example.com",
          recipientName: null,
          template: "receipt",
          payloadVersion: 1,
          payload: { subject: "Receipt", text: "Content" },
        },
      ],
    });
    expect(publicationFingerprint(resolvePublication(legacy))).toBe(
      publicationFingerprint(legacy),
    );
    expect(publicationFingerprint(legacy)).not.toBe(fingerprint);
  });
});
