import { Context, Effect, Layer, Option, Schema } from "effect";
import { PgClient } from "@effect/sql-pg";
import { SqlClient, SqlSchema } from "effect/sql";
import {
  ConsentSubject,
  EmailAddress,
  NotificationScope,
  NotificationValidationError,
  NotificationIdempotencyConflictError,
} from "./schema.js";
import {
  canonicalJsonString,
  canonicalRecipientAddress,
} from "./internal/idempotency.js";
import { storageError } from "./internal/sql.js";
import { runNotificationMigrations } from "./migrations.js";

export const EmailConsentInput = Schema.Struct({
  subject: ConsentSubject,
  recipientAddress: EmailAddress,
  scope: NotificationScope,
  purpose: Schema.Literals(["notification", "marketing"]),
}).annotate({ identifier: "NotificationEmailConsentInput" });

export const RecordEmailConsent = Schema.Struct({
  ...EmailConsentInput.fields,
  requestId: Schema.NonEmptyString,
  status: Schema.Literals(["granted", "withdrawn"]),
  actor: Schema.NonEmptyString,
  source: Schema.NonEmptyString,
  noticeVersion: Schema.NonEmptyString,
}).annotate({ identifier: "NotificationRecordEmailConsent" });

const ConsentState = Schema.Struct({
  status: RecordEmailConsent.fields.status,
}).annotate({ identifier: "NotificationEmailConsentState" });
const StoredRequest = Schema.Struct({ matches: Schema.Boolean }).annotate({
  identifier: "NotificationStoredConsentRequest",
});

export const makeEmailConsentStore = (
  sql: SqlClient.SqlClient,
  pg: PgClient.PgClient,
) => {
  const status = SqlSchema.findOneOption({
    Request: EmailConsentInput,
    Result: ConsentState,
    execute: (input) => sql`SELECT status FROM notification_email_consent_events
      WHERE subject_namespace = ${input.subject.namespace} AND subject_value = ${input.subject.value}
      AND recipient_address = ${canonicalRecipientAddress("email", input.recipientAddress)}
      AND scope = ${pg.json(input.scope)} AND purpose = ${input.purpose}
      ORDER BY sequence DESC LIMIT 1`,
  });
  const record = Effect.fn("NotificationEmailConsent.record")(function* (
    raw: typeof RecordEmailConsent.Type,
  ) {
    const decoded = yield* Schema.decodeEffect(RecordEmailConsent)(raw).pipe(
      Effect.mapError(
        () =>
          new NotificationValidationError({
            operation: "consent.record",
            message: "Invalid consent evidence",
          }),
      ),
    );
    const input = {
      ...decoded,
      recipientAddress: canonicalRecipientAddress(
        "email",
        decoded.recipientAddress,
      ),
    };
    return yield* sql.withTransaction(
      Effect.gen(function* () {
        const { subject, recipientAddress, scope, purpose } = input;
        yield* sql`SELECT pg_advisory_xact_lock(hashtextextended(${canonicalJsonString({ subject, recipientAddress, scope, purpose })}, 0))`;
        yield* sql`INSERT INTO notification_email_consent_events
        (request_id, subject_namespace, subject_value, recipient_address, scope, purpose, status, actor, source, notice_version, request)
        VALUES (${input.requestId}, ${subject.namespace}, ${subject.value}, ${recipientAddress}, ${pg.json(scope)},
          ${purpose}, ${input.status}, ${input.actor}, ${input.source}, ${input.noticeVersion}, ${pg.json(input)})
        ON CONFLICT (request_id) DO NOTHING`;
        const stored = yield* SqlSchema.findOne({
          Request: Schema.Void,
          Result: StoredRequest,
          execute: () =>
            sql`SELECT request = ${pg.json(input)} AS matches FROM notification_email_consent_events WHERE request_id = ${input.requestId}`,
        })(undefined);
        if (!stored.matches)
          return yield* new NotificationIdempotencyConflictError({
            idempotencyKey: input.requestId,
            message: "Consent request ID reused with changed evidence",
          });
      }),
    );
  });
  return { status, record };
};

// Trusted server-side evidence recording. Publication permission never grants this operation.
export class NotificationEmailConsent extends Context.Service<NotificationEmailConsent>()(
  "@krak-stack/notifications/EmailConsent",
  {
    make: Effect.gen(function* () {
      yield* runNotificationMigrations;
      const sql = (yield* SqlClient.SqlClient).withoutTransforms();
      const store = makeEmailConsentStore(sql, yield* PgClient.PgClient);
      return {
        record: (input: typeof RecordEmailConsent.Type) =>
          store
            .record(input)
            .pipe(
              Effect.catchTag(
                ["SqlError", "SchemaError", "NoSuchElementError"],
                (cause) => Effect.fail(storageError("consent.record", cause)),
              ),
            ),
        get: (input: typeof EmailConsentInput.Type) =>
          store.status(input).pipe(
            Effect.map((state) =>
              Option.isSome(state) ? state.value.status : ("unknown" as const),
            ),
            Effect.catchTag(["SqlError", "SchemaError"], (cause) =>
              Effect.fail(storageError("consent.get", cause)),
            ),
          ),
      };
    }),
  },
) {
  static readonly layer = Layer.effect(this, this.make);
}
