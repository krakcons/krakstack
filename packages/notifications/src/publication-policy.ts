import { Context, Effect, Layer, Option, Schema } from "effect";
import { SqlClient } from "effect/sql";
import { PgClient } from "@effect/sql-pg";
import { makeEmailConsentStore } from "./consent.js";
import { DispatchDecision, DispatchPolicyError } from "./policy.js";
import type {
  PublicationDeliveryMetadata,
  NotificationScope,
} from "./schema.js";

export type PublicationPolicyInput = {
  readonly scope: NotificationScope;
  readonly eventKey: string;
  readonly channel: string;
  readonly publication: PublicationDeliveryMetadata;
};

export interface PublicationPolicyExtension {
  readonly key: string;
  readonly version: number;
  readonly check: (
    input: PublicationPolicyInput & {
      readonly subject: { readonly namespace: string; readonly value: string };
    },
  ) => Effect.Effect<DispatchDecision, DispatchPolicyError>;
}

// Optional only for address-only publications. Contact requirements never fail open.
export const NotificationContactRecipientPolicy = Context.Reference<{
  readonly check: (
    input: PublicationPolicyInput,
  ) => Effect.Effect<DispatchDecision, DispatchPolicyError>;
}>("@krak-stack/notifications/ContactRecipientPolicy", {
  defaultValue: () => ({
    check: () =>
      Effect.fail(
        new DispatchPolicyError({
          message: "Contact recipient policy is not installed",
        }),
      ),
  }),
});

export const NotificationPublicationPolicies = Context.Reference<
  ReadonlyArray<PublicationPolicyExtension>
>("@krak-stack/notifications/PublicationPolicies", { defaultValue: () => [] });

export const publicationPoliciesLayer = (
  policies: ReadonlyArray<PublicationPolicyExtension>,
) =>
  Layer.effect(
    NotificationPublicationPolicies,
    Effect.gen(function* () {
      const ids = new Set<string>();
      for (const policy of policies) {
        yield* Schema.decodeEffect(
          Schema.Struct({
            key: Schema.NonEmptyString,
            version: Schema.Int.check(Schema.isGreaterThan(0)),
          }),
        )(policy).pipe(
          Effect.mapError(
            () =>
              new DispatchPolicyError({
                message: "Invalid publication policy identity",
              }),
          ),
        );
        const id = `${policy.key}@${policy.version}`;
        if (ids.has(id))
          return yield* new DispatchPolicyError({
            message: "Duplicate publication policy identity",
          });
        ids.add(id);
      }
      return policies;
    }),
  );

export const makePublicationPolicy = (
  sql: SqlClient.SqlClient,
  pg: PgClient.PgClient,
) =>
  Effect.gen(function* () {
    const consent = makeEmailConsentStore(sql, pg);
    const contacts = yield* NotificationContactRecipientPolicy;
    const policies = yield* NotificationPublicationPolicies;
    return Effect.fn("NotificationPublicationPolicy.check")(function* (
      input: PublicationPolicyInput,
    ) {
      if (input.publication.recipient.contact) {
        const decision = yield* contacts
          .check(input)
          .pipe(Effect.flatMap(Schema.decodeEffect(DispatchDecision)));
        if (decision._tag !== "Allow") return decision;
      }
      const { policy } = input.publication;
      const requirement =
        policy.kind === "transactional" ? undefined : policy.consent;
      if (requirement?.kind === "stored") {
        const state = yield* consent.status({
          subject: requirement.subject,
          recipientAddress: input.publication.recipient.address,
          scope: input.scope,
          purpose: policy.kind === "marketing" ? "marketing" : "notification",
        });
        if (Option.isNone(state) || state.value.status !== "granted")
          return {
            _tag: "Suppress",
            reason: "consent_required",
          } satisfies DispatchDecision;
      }
      const requirements = [
        ...input.publication.checks,
        ...(requirement?.kind === "extension" ? [requirement] : []),
      ];
      for (const required of requirements) {
        const extension = policies.find(
          (candidate) =>
            candidate.key === required.key &&
            candidate.version === required.version,
        );
        if (!extension)
          return yield* new DispatchPolicyError({
            message: "Required publication policy is not installed",
          });
        const decision = yield* extension
          .check({ ...input, subject: required.subject })
          .pipe(Effect.flatMap(Schema.decodeEffect(DispatchDecision)));
        if (decision._tag !== "Allow") return decision;
      }
      return { _tag: "Allow" } satisfies DispatchDecision;
    });
  });
