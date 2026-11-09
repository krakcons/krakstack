import { Schema } from "effect";
import {
  PublicationInput,
  PublishInput,
  type PublicationDeliveryMetadata,
  type NotificationDeliveryPurpose,
  type PublishDeliveryInput,
} from "../schema.js";
import { canonicalRecipientAddress } from "./idempotency.js";

export type ResolvedDelivery = Omit<
  PublishDeliveryInput,
  "recipient" | "policy" | "publication" | "purpose"
> & {
  readonly purpose: NotificationDeliveryPurpose;
  readonly publication?: PublicationDeliveryMetadata;
};
export type ResolvedPublication = Omit<PublishInput, "deliveries"> & {
  readonly deliveries: ReadonlyArray<ResolvedDelivery>;
};

// A canonical request must never fall back to the legacy policy-free shape.
export const PublicationRequest = Schema.Union([
  PublicationInput,
  PublishInput,
]);
export type PublicationRequest = typeof PublicationRequest.Type;

export const resolvePublication = (
  input: PublicationRequest,
): ResolvedPublication => ({
  ...input,
  deliveries: input.deliveries.map((delivery) => {
    if (delivery.recipient === undefined) return delivery;
    const { recipient, policy, checks, ...fields } = delivery;
    const snapshot = {
      ...recipient,
      address: canonicalRecipientAddress(delivery.channel, recipient.address),
    };
    return {
      ...fields,
      purpose: policy.kind,
      recipientAddress: snapshot.address,
      recipientName: snapshot.name,
      publication: {
        version: 1,
        recipient: snapshot,
        policy,
        checks: checks ?? [],
      },
    };
  }),
});
