import { Context, Effect, Schema } from "effect";

import { NotificationDate, type NotificationDelivery } from "./schema.js";

export const DISPATCH_POLICY_REFERENCE_NAMESPACE = "krakstack.dispatch-policy";

export const DispatchDecision = Schema.Union([
  Schema.TaggedStruct("Allow", {}),
  Schema.TaggedStruct("Suppress", { reason: Schema.NonEmptyString }),
  Schema.TaggedStruct("Defer", {
    reason: Schema.NonEmptyString,
    until: NotificationDate,
  }),
]).annotate({ identifier: "NotificationDispatchDecision" });
export type DispatchDecision = typeof DispatchDecision.Type;

export class DispatchPolicyError extends Schema.TaggedError<
  DispatchPolicyError,
  { readonly brand: unique symbol }
>()("DispatchPolicyError", {
  message: Schema.NonEmptyString,
  cause: Schema.optional(Schema.Defect()),
}) {}

export interface DispatchPolicy {
  readonly key?: string;
  readonly check: (
    delivery: NotificationDelivery,
  ) => Effect.Effect<DispatchDecision, DispatchPolicyError>;
}

// Existing consumers retain the built-in suppression/preference checks. An
// explicitly provided policy is additional and must never fail open.
export const NotificationDispatchPolicy = Context.Reference<DispatchPolicy>(
  "@krak-stack/notifications/NotificationDispatchPolicy",
  { defaultValue: () => ({ check: () => Effect.succeed({ _tag: "Allow" }) }) },
);
