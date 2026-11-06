import { Context, Effect, Layer, Option, Schema } from "effect";
import { SecureRandom } from "effect/crypto";
import { SqlClient, SqlSchema, SqlError } from "effect/sql";
import { PgClient } from "@effect/sql-pg";
import { NotificationService } from "@krak-stack/notifications";
import { KrakSend } from "./index.js";
import {
  ContactParams,
  SendId,
  SendConflict,
  SendNotFound,
  SendStorageError,
  SendValidationError,
} from "./schema.js";
import * as S from "./operations.schema.js";

const validate = <T extends Schema.Top>(schema: T, input: T["Encoded"]) =>
  Schema.decodeEffect(schema)(input).pipe(
    Effect.mapError(
      () => new SendValidationError({ message: "Invalid operations input" }),
    ),
  );
const storage = <A, E, R>(
  effect: Effect.Effect<A, E | SqlError.SqlError | Schema.SchemaError, R>,
) =>
  effect.pipe(
    Effect.catchTag(["SqlError", "SchemaError"], (cause) =>
      Effect.fail(
        new SendStorageError({
          message: "Sending operations persistence failed",
          cause,
        }),
      ),
    ),
  );
const page = <T>(
  rows: ReadonlyArray<T>,
  limit: number,
  cursor: (row: T) => string,
) => ({
  items: rows.slice(0, limit),
  nextCursor: rows.length > limit ? cursor(rows[limit - 1]) : null,
});

export class SendOperations extends Context.Service<SendOperations>()(
  "@krak-stack/send/SendOperations",
  {
    make: Effect.gen(function* () {
      yield* KrakSend;
      const notifications = yield* NotificationService;
      const sql = (yield* SqlClient.SqlClient).withoutTransforms();
      const pg = yield* PgClient.PgClient;
      const random = yield* SecureRandom.SecureRandom.pipe(
        Effect.provide(SecureRandom.layerWebCrypto),
      );
      const scope = sql`d.channel = 'email' AND d.recipient_user_id IS NULL AND d.organization_id IS NULL AND d.workspace_id IS NULL`;
      const suppressionScope = sql`s.channel = 'email' AND s.recipient_user_id IS NULL AND s.organization_id IS NULL AND s.workspace_id IS NULL`;
      const window = (q: typeof S.OperationWindow.Type, column: string) =>
        sql.and([
          q.since ? sql`${sql.literal(column)} >= ${q.since}` : sql`TRUE`,
          q.until ? sql`${sql.literal(column)} < ${q.until}` : sql`TRUE`,
        ]);
      const checkWindow = (q: typeof S.OperationWindow.Type) =>
        q.since && q.until && q.since >= q.until
          ? Effect.fail(
              new SendValidationError({
                message: "The end of the window must follow its start",
              }),
            )
          : Effect.void;
      // strpos treats %, _ and backslashes literally rather than as SQL wildcards.
      const search = (q: typeof S.OperationQuery.Type, column: string) =>
        q.search
          ? sql`strpos(lower(${sql.literal(column)}), ${q.search.toLowerCase()}) > 0`
          : sql`TRUE`;
      const flag = (kind: string) =>
        sql`EXISTS (SELECT 1 FROM kraksend_feedback_events f WHERE f.delivery_id = d.id AND f.applied_at IS NOT NULL AND f.kind = ${kind})`;
      const columns = sql`d.id, r.contact_id AS "contactId", d.recipient_address AS email, c.name,
      cr.campaign_id AS "campaignId", campaign.name AS "campaignName", r.request->>'purpose' AS purpose,
      d.event_key AS "eventKey", d.payload->>'subject' AS subject, d.status, d.attempts, d.max_attempts AS "maxAttempts",
      d.provider, d.provider_message_id AS "providerMessageId", d.error_message AS "errorMessage",
      d.created_at AS "createdAt", d.updated_at AS "updatedAt", d.scheduled_for AS "scheduledFor", d.sent_at AS "sentAt",
      ${flag("delivered")} AS confirmed, ${flag("hard_bounce")} AS "hardBounced", ${flag("soft_bounce")} AS "softBounced", ${flag("complaint")} AS complained`;
      const joins = sql`FROM kraksend_email_requests r JOIN notification_deliveries d ON d.id = r.delivery_id
      JOIN kraksend_contacts c ON c.id = r.contact_id
      LEFT JOIN kraksend_campaign_recipients cr ON cr.delivery_id = d.id
      LEFT JOIN kraksend_campaigns campaign ON campaign.id = cr.campaign_id`;
      const activity = Effect.fn("SendOperations.activity")(function* (
        raw: typeof S.ActivityQuery.Type,
      ) {
        const q = yield* validate(S.ActivityQuery, raw);
        yield* checkWindow(q);
        if (q.before) yield* validate(SendId, q.before);
        const limit = q.limit ?? 25;
        const rows = yield* SqlSchema.findAll({
          Request: S.ActivityQuery,
          Result: S.DeliveryActivity,
          execute: () => sql`SELECT ${columns} ${joins} WHERE ${scope}
        AND ${window(q, "d.created_at")} AND ${search(q, "d.recipient_address || ' ' || c.name || ' ' || COALESCE(d.payload->>'subject','') || ' ' || d.id::text || ' ' || COALESCE(d.error_message,'')")}
        AND ${q.before ? sql`d.id < ${q.before}` : sql`TRUE`}
        AND ${q.status ? sql`d.status = ${q.status}` : sql`TRUE`}
        AND ${q.campaignId ? sql`cr.campaign_id = ${q.campaignId}` : sql`TRUE`}
        AND ${q.contactId ? sql`r.contact_id = ${q.contactId}` : sql`TRUE`}
        ORDER BY d.id DESC LIMIT ${limit + 1}`,
        })(q);
        return page(rows, limit, (r) => r.id);
      }, storage);
      const inspect = Effect.fn("SendOperations.inspect")(function* (
        raw: typeof ContactParams.Type,
      ) {
        const input = yield* validate(ContactParams, raw);
        const found = yield* SqlSchema.findOneOption({
          Request: ContactParams,
          Result: S.DeliveryActivity,
          execute: ({ id }) =>
            sql`SELECT ${columns} ${joins} WHERE ${scope} AND d.id = ${id}`,
        })(input);
        if (Option.isNone(found))
          return yield* new SendNotFound({ id: input.id });
        const detail = yield* notifications
          .getDelivery({
            scope: {
              recipientUserId: null,
              organizationId: null,
              workspaceId: null,
            },
            deliveryId: input.id,
          })
          .pipe(
            Effect.mapError(
              (cause) =>
                new SendStorageError({
                  message: "Delivery inspection failed",
                  cause,
                }),
            ),
          );
        // Never return rendered bodies, signed unsubscribe capabilities, arbitrary
        // references, credentials or worker leases from the operations boundary.
        return { delivery: found.value, attempts: detail.attempts };
      }, storage);
      const overview = Effect.fn("SendOperations.overview")(function* (
        raw: typeof S.OperationWindow.Type,
      ) {
        const q = yield* validate(S.OperationWindow, raw);
        yield* checkWindow(q);
        return yield* SqlSchema.findOne({
          Request: S.OperationWindow,
          Result: S.SendingOverview,
          execute: () => sql`SELECT count(*)::int AS total,
        count(*) FILTER (WHERE d.status = 'queued')::int AS queued, count(*) FILTER (WHERE d.status = 'processing')::int AS processing,
        count(*) FILTER (WHERE d.status = 'retrying')::int AS retrying, count(*) FILTER (WHERE d.sent_at IS NOT NULL)::int AS accepted,
        count(*) FILTER (WHERE d.status = 'failed')::int AS failed, count(*) FILTER (WHERE d.status = 'suppressed')::int AS suppressed,
        count(*) FILTER (WHERE d.status = 'cancelled')::int AS cancelled,
        count(*) FILTER (WHERE ${flag("delivered")})::int AS confirmed, count(*) FILTER (WHERE ${flag("hard_bounce")})::int AS "hardBounced",
        count(*) FILTER (WHERE ${flag("soft_bounce")})::int AS "softBounced", count(*) FILTER (WHERE ${flag("complaint")})::int AS complained,
        (SELECT count(*)::int FROM kraksend_feedback_events f WHERE f.applied_at IS NULL AND ${window(q, "f.received_at")}) AS "pendingFeedback",
        (SELECT count(*)::int FROM notification_suppressions s WHERE ${suppressionScope} AND (s.expires_at IS NULL OR s.expires_at > now())) AS "activeSuppressions"
        FROM kraksend_email_requests r JOIN notification_deliveries d ON d.id = r.delivery_id WHERE ${scope} AND ${window(q, "d.created_at")}`,
        })(q).pipe(
          Effect.catchTag("NoSuchElementError", () =>
            Effect.fail(
              new SendStorageError({ message: "Missing overview aggregate" }),
            ),
          ),
        );
      }, storage);
      const feedback = Effect.fn("SendOperations.feedback")(function* (
        raw: typeof S.FeedbackQuery.Type,
      ) {
        const q = yield* validate(S.FeedbackQuery, raw);
        yield* checkWindow(q);
        if (q.before) yield* validate(S.SequenceCursor, q.before);
        const limit = q.limit ?? 25;
        const rows = yield* SqlSchema.findAll({
          Request: S.FeedbackQuery,
          Result: S.FeedbackRecord,
          execute: () => sql`SELECT f.id::text AS id, f.provider,
        f.event_id AS "eventId", f.provider_message_id AS "providerMessageId", f.recipient_address AS "recipientAddress", f.kind,
        f.occurred_at AS "occurredAt", f.received_at AS "receivedAt", f.checked_at AS "checkedAt", f.applied_at AS "appliedAt",
        f.delivery_id AS "deliveryId", r.contact_id AS "contactId", cr.campaign_id AS "campaignId"
        FROM kraksend_feedback_events f LEFT JOIN kraksend_email_requests r ON r.delivery_id = f.delivery_id
        LEFT JOIN kraksend_campaign_recipients cr ON cr.delivery_id = f.delivery_id
        WHERE ${window(q, "f.received_at")} AND ${search(q, "f.recipient_address || ' ' || f.provider || ' ' || f.event_id || ' ' || f.provider_message_id")}
          AND ${q.before ? sql`f.id < ${q.before}::bigint` : sql`TRUE`}
          AND ${q.kind === "bounces" ? sql`f.kind IN ('hard_bounce','soft_bounce')` : q.kind ? sql`f.kind = ${q.kind}` : sql`TRUE`}
          AND ${q.correlation === "pending" ? sql`f.applied_at IS NULL` : q.correlation === "applied" ? sql`f.applied_at IS NOT NULL` : sql`TRUE`}
          AND ${q.deliveryId ? sql`f.delivery_id = ${q.deliveryId}` : sql`TRUE`} ORDER BY f.id DESC LIMIT ${limit + 1}`,
        })(q);
        return page(rows, limit, (r) => r.id);
      }, storage);
      const suppressionColumns = sql`s.id, s.xmin::text AS version, s.recipient_address AS email, s.purpose, s.reason,
      s.expires_at AS "expiresAt", s.created_at AS "createdAt", (s.expires_at IS NULL OR s.expires_at > now()) AS active`;
      const suppressions = Effect.fn("SendOperations.suppressions")(function* (
        raw: typeof S.SuppressionQuery.Type,
      ) {
        const q = yield* validate(S.SuppressionQuery, raw);
        yield* checkWindow(q);
        if (q.before) yield* validate(SendId, q.before);
        const limit = q.limit ?? 25;
        const rows = yield* SqlSchema.findAll({
          Request: S.SuppressionQuery,
          Result: S.SuppressionRecord,
          execute:
            () => sql`SELECT ${suppressionColumns} FROM notification_suppressions s WHERE ${suppressionScope}
        AND ${window(q, "s.created_at")} AND ${search(q, "s.recipient_address || ' ' || COALESCE(s.reason,'')")}
        AND ${q.before ? sql`s.id < ${q.before}` : sql`TRUE`}
        AND ${(q.state ?? "active") === "active" ? sql`(s.expires_at IS NULL OR s.expires_at > now())` : q.state === "expired" ? sql`s.expires_at <= now()` : sql`TRUE`}
        ORDER BY s.id DESC LIMIT ${limit + 1}`,
        })(q);
        return page(rows, limit, (r) => r.id);
      }, storage);
      const audit = Effect.fn("SendOperations.audit")(function* (
        raw: typeof S.OperationQuery.Type,
      ) {
        const q = yield* validate(S.OperationQuery, raw);
        yield* checkWindow(q);
        if (q.before) yield* validate(S.SequenceCursor, q.before);
        const limit = q.limit ?? 25;
        const rows = yield* SqlSchema.findAll({
          Request: S.OperationQuery,
          Result: Schema.Struct({
            ...S.SuppressionAudit.fields,
            sequence: S.SequenceCursor,
          }).annotate({ identifier: "SendSuppressionAuditRow" }),
          execute:
            () => sql`SELECT sequence::text, request_id AS "requestId", suppression_id AS "suppressionId", email, action, reason, previous_reason AS "previousReason", actor, occurred_at AS "occurredAt"
        FROM kraksend_suppression_audit WHERE ${window(q, "occurred_at")} AND ${search(q, "email || ' ' || reason || ' ' || actor")}
        AND ${q.before ? sql`sequence < ${q.before}::bigint` : sql`TRUE`} ORDER BY sequence DESC LIMIT ${limit + 1}`,
        })(q);
        return page(rows, limit, (r) => r.sequence);
      }, storage);
      const recipients = Effect.fn("SendOperations.recipients")(function* (
        raw: typeof S.RecipientQuery.Type,
      ) {
        const q = yield* validate(S.RecipientQuery, raw);
        if (q.before) yield* validate(SendId, q.before);
        const limit = q.limit ?? 25;
        const rows = yield* SqlSchema.findAll({
          Request: S.RecipientQuery,
          Result: S.CampaignRecipient,
          execute:
            () => sql`SELECT c.id, e.address AS email, c.name, r.status, r.reason, r.delivery_id AS "deliveryId"
        FROM kraksend_campaign_recipients r JOIN kraksend_contacts c ON c.id=r.contact_id JOIN kraksend_email_endpoints e ON e.contact_id=c.id
        WHERE r.campaign_id=${q.campaignId} AND ${search(q, "e.address || ' ' || c.name")}
        AND ${q.before ? sql`c.id < ${q.before}` : sql`TRUE`} AND ${q.status ? sql`r.status=${q.status}` : sql`TRUE`} ORDER BY c.id DESC LIMIT ${limit + 1}`,
        })(q);
        return page(rows, limit, (r) => r.id);
      }, storage);
      const replay = (
        requestId: string,
        request:
          | typeof S.AddSuppressionRequest.Type
          | typeof S.RemoveSuppressionRequest.Type,
      ) =>
        SqlSchema.findOneOption({
          Request: Schema.Void,
          Result: S.StoredSuppressionChange,
          execute: () =>
            sql`SELECT suppression_id AS "suppressionId", request = ${pg.json(request)} AS matches FROM kraksend_suppression_audit WHERE request_id=${requestId}`,
        })(undefined);
      const change = <
        T extends
          typeof S.AddSuppressionRequest | typeof S.RemoveSuppressionRequest,
      >(
        schema: T,
        raw: T["Type"],
        run: (
          input: T["Type"],
        ) => Effect.Effect<
          { suppressionId: string },
          SendConflict | SendNotFound | SqlError.SqlError | Schema.SchemaError
        >,
      ) =>
        Effect.gen(function* () {
          const input = yield* validate(schema, raw);
          return yield* sql.withTransaction(
            Effect.gen(function* () {
              yield* sql`SELECT pg_advisory_xact_lock(hashtextextended(${input.payload.requestId}, 0))`;
              const previous = yield* replay(input.payload.requestId, input);
              if (Option.isSome(previous)) {
                if (!previous.value.matches)
                  return yield* new SendConflict({
                    message:
                      "Suppression request ID was reused with different input",
                  });
                return { suppressionId: previous.value.suppressionId };
              }
              return yield* run(input);
            }),
          );
        }).pipe(storage);
      const addSuppression = Effect.fn("SendOperations.addSuppression")(
        (raw: typeof S.AddSuppressionRequest.Type) =>
          change(S.AddSuppressionRequest, raw, (input) =>
            Effect.gen(function* () {
              const email = input.payload.email.toLowerCase();
              const id = yield* random.uuidV7();
              const inserted =
                yield* sql`INSERT INTO notification_suppressions(id,recipient_user_id,organization_id,workspace_id,channel,purpose,recipient_address,reason,expires_at,created_at)
        VALUES(${id},NULL,NULL,NULL,'email',NULL,${email},${input.payload.reason},NULL,now()) ON CONFLICT DO NOTHING RETURNING id`;
              if (!inserted.length)
                return yield* new SendConflict({
                  message:
                    "An all-purpose suppression already exists for this endpoint",
                });
              yield* sql`INSERT INTO kraksend_suppression_audit(request_id,request,suppression_id,email,action,reason,actor) VALUES(${input.payload.requestId},${pg.json(input)},${id},${email},'add',${input.payload.reason},${input.actor})`;
              return { suppressionId: id };
            }),
          ),
      );
      const removeSuppression = Effect.fn("SendOperations.removeSuppression")(
        (raw: typeof S.RemoveSuppressionRequest.Type) =>
          change(S.RemoveSuppressionRequest, raw, (input) =>
            Effect.gen(function* () {
              const found = yield* SqlSchema.findOneOption({
                Request: ContactParams,
                Result: S.SuppressionRecord,
                execute: ({ id }) =>
                  sql`SELECT ${suppressionColumns} FROM notification_suppressions s WHERE ${suppressionScope} AND s.id=${id} FOR UPDATE`,
              })(input);
              if (Option.isNone(found))
                return yield* new SendNotFound({ id: input.id });
              if (found.value.version !== input.payload.version)
                return yield* new SendConflict({
                  message:
                    "Suppression changed; refresh and review it before removing",
                });
              yield* sql`DELETE FROM notification_suppressions s WHERE ${suppressionScope} AND s.id=${input.id}`;
              yield* sql`INSERT INTO kraksend_suppression_audit(request_id,request,suppression_id,email,action,reason,previous_reason,actor) VALUES(${input.payload.requestId},${pg.json(input)},${input.id},${found.value.email},'remove',${input.payload.reason},${found.value.reason},${input.actor})`;
              return { suppressionId: input.id };
            }),
          ),
      );
      return {
        activity,
        inspect,
        overview,
        feedback,
        suppressions,
        audit,
        recipients,
        addSuppression,
        removeSuppression,
      };
    }),
  },
) {
  static readonly layer = Layer.effect(this, this.make);
}
