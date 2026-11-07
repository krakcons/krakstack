import { Effect, Layer, Option, Schema } from "effect";
import { SqlClient, SqlSchema } from "effect/sql";
import {
  NotificationContactRecipientPolicy,
  type PublicationPolicyInput,
} from "../publication-policy.js";
import { runNotificationMigrations } from "../migrations.js";
import { DispatchPolicyError } from "../policy.js";
import { runSendMigrations } from "./migrations.js";

const Endpoint = Schema.Struct({
  address: Schema.String,
  status: Schema.Literals(["unknown", "subscribed", "unsubscribed"]),
}).annotate({ identifier: "NotificationContactRecipientEndpoint" });

// Independent of NotificationContacts/NotificationService: safe to provide to both publisher and worker.
export const contactRecipientPolicyLayer = Layer.effect(
  NotificationContactRecipientPolicy,
  Effect.gen(function* () {
    yield* runNotificationMigrations;
    yield* runSendMigrations;
    const sql = (yield* SqlClient.SqlClient).withoutTransforms();
    return {
      check: Effect.fn("NotificationContactRecipientPolicy.check")(
        function* (input: PublicationPolicyInput) {
          const contact = input.publication.recipient.contact;
          if (!contact) return { _tag: "Allow" } as const;
          const endpoint = yield* SqlSchema.findOneOption({
            Request: Schema.Void,
            Result: Endpoint,
            execute:
              () => sql`SELECT e.address, COALESCE(s.status, 'unknown') AS status FROM kraksend_email_endpoints e
          LEFT JOIN kraksend_email_consents s ON s.contact_id = e.contact_id
          WHERE e.id = ${contact.endpointId} AND e.contact_id = ${contact.id}`,
          })(undefined);
          if (
            Option.isNone(endpoint) ||
            endpoint.value.address !== input.publication.recipient.address
          )
            return {
              _tag: "Suppress",
              reason: "contact_endpoint_mismatch",
            } as const;
          return input.publication.policy.kind !== "transactional" &&
            endpoint.value.status === "unsubscribed"
            ? ({ _tag: "Suppress", reason: "contact_unsubscribed" } as const)
            : ({ _tag: "Allow" } as const);
        },
        Effect.catchTag(["SqlError", "SchemaError"], (cause) =>
          Effect.fail(
            new DispatchPolicyError({
              message: "Contact recipient check failed",
              cause,
            }),
          ),
        ),
      ),
    };
  }),
);
