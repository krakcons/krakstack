import { createHash } from "node:crypto";

import { Option, Schema } from "effect";

import type { PublishInput, ScheduleReminderInput } from "../schema.js";

type Json = typeof Schema.Json.Type;

const decodeJsonArray = Schema.decodeUnknownOption(Schema.Array(Schema.Json));
const decodeJsonObject = Schema.decodeUnknownOption(
  Schema.Record(Schema.String, Schema.Json),
);

const compareStrings = (left: string, right: string): number =>
  left < right ? -1 : left > right ? 1 : 0;

export const canonicalRecipientAddress = (channel: string, address: string) =>
  channel === "email" ? address.trim().toLowerCase() : address;

const canonicalizeJson = (value: Json): Json => {
  const array = decodeJsonArray(value);
  if (Option.isSome(array)) return array.value.map(canonicalizeJson);

  const object = decodeJsonObject(value);
  if (Option.isNone(object)) return value;

  const sorted: Record<string, Json> = {};
  for (const key of Object.keys(object.value).sort(compareStrings)) {
    const child = object.value[key];
    if (child !== undefined) sorted[key] = canonicalizeJson(child);
  }
  return sorted;
};

export const canonicalJsonString = (value: Json): string =>
  JSON.stringify(canonicalizeJson(value));

const sha256 = (value: Json): string =>
  createHash("sha256").update(canonicalJsonString(value)).digest("hex");

const canonicalReferences = (
  references: PublishInput["deliveries"][number]["references"],
): Json =>
  [...(references ?? [])]
    .sort((left, right) => {
      const namespace = compareStrings(left.namespace, right.namespace);
      return namespace === 0
        ? compareStrings(left.value, right.value)
        : namespace;
    })
    .map(({ namespace, value }) => ({ namespace, value }));

export const deliveryIdempotencyKey = (
  publicationKey: string,
  deliveryKey: string,
): string => JSON.stringify([publicationKey, deliveryKey]);

export const publicationFingerprint = (input: PublishInput): string => {
  const request: Json = {
    version: 1,
    idempotencyKey: input.idempotencyKey,
    scope: input.scope,
    eventKey: input.eventKey,
    eventVersion: input.eventVersion,
    inbox:
      input.inbox === undefined || input.inbox === null
        ? null
        : {
            locale: input.inbox.locale,
            title: input.inbox.title,
            description: input.inbox.description,
            href: input.inbox.href,
            metadata: input.inbox.metadata,
          },
    deliveries: [...input.deliveries]
      .sort((left, right) => compareStrings(left.key, right.key))
      .map((delivery) => ({
        key: delivery.key,
        channel: delivery.channel,
        purpose: delivery.purpose,
        template: delivery.template,
        recipientAddress: canonicalRecipientAddress(
          delivery.channel,
          delivery.recipientAddress,
        ),
        recipientName: delivery.recipientName,
        payloadVersion: delivery.payloadVersion,
        payload: delivery.payload,
        scheduledFor: delivery.scheduledFor?.toISOString() ?? null,
        expiresAt: delivery.expiresAt?.toISOString() ?? null,
        maxAttempts: delivery.maxAttempts ?? 5,
        references: canonicalReferences(delivery.references),
      })),
  };
  return sha256(request);
};

export const reminderFingerprint = (input: ScheduleReminderInput): string => {
  const request: Json = {
    version: 1,
    idempotencyKey: input.idempotencyKey,
    scope: input.scope,
    handlerKey: input.handlerKey,
    handlerVersion: input.handlerVersion,
    payload: input.payload,
    scheduledFor: input.scheduledFor.toISOString(),
    expiresAt: input.expiresAt?.toISOString() ?? null,
    maxAttempts: input.maxAttempts ?? 5,
  };
  return sha256(request);
};
