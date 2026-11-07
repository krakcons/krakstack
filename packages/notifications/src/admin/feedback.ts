// Notification provider feedback reconciliation.
import { Context, Effect, Layer, Option, Schedule, Schema } from "effect";
import { SqlClient, SqlSchema, SqlError } from "effect/sql";
import { NotificationService } from "@krak-stack/notifications";
import { KrakSend } from "./index.js";
import {
  ContactParams,
  FeedbackReceipt,
  RecordFeedback,
  ReconcileFeedback,
  ReconcileFeedbackResult,
  StoredFeedback,
  SendConflict,
  SendStorageError,
  SendValidationError,
} from "./schema.js";

const storageError = (cause: unknown) =>
  new SendStorageError({
    message: "KrakSend feedback persistence failed",
    cause,
  });
const mapStorageError = <A, E, R>(
  effect: Effect.Effect<A, E | SqlError.SqlError | Schema.SchemaError, R>,
) =>
  Effect.catchTag(effect, ["SqlError", "SchemaError"], (cause) =>
    Effect.fail(storageError(cause)),
  );

export class SendFeedback extends Context.Service<SendFeedback>()(
  "@krak-stack/send/SendFeedback",
  {
    make: Effect.gen(function* () {
      // Acquiring KrakSend ensures its versioned migrations have completed.
      yield* KrakSend;
      const notifications = yield* NotificationService;
      const sql = (yield* SqlClient.SqlClient).withoutTransforms();
      const columns =
        sql.literal(`provider, event_id AS "eventId", provider_message_id AS "providerMessageId",
      recipient_address AS "recipientAddress", kind, occurred_at AS "occurredAt",
      delivery_id AS "deliveryId", applied_at AS "appliedAt"`);

      const apply = Effect.fn("SendFeedback.apply")(function* (
        event: typeof StoredFeedback.Type,
      ) {
        if (event.appliedAt !== null) return event.deliveryId;
        // Match accepted attempts, not only the latest delivery snapshot: retries
        // can have more than one provider message ID. Never match by address alone.
        const candidates = yield* SqlSchema.findAll({
          Request: RecordFeedback,
          Result: ContactParams,
          execute: (input) => sql`
          SELECT DISTINCT d.id FROM notification_deliveries d
          JOIN kraksend_email_requests r ON r.delivery_id = d.id
          JOIN notification_delivery_attempts a ON a.delivery_id = d.id
          WHERE d.channel = 'email' AND lower(btrim(d.recipient_address)) = ${input.recipientAddress}
            AND a.outcome = 'sent' AND a.provider = ${input.provider}
            AND a.provider_message_id = ${input.providerMessageId}
          LIMIT 2
        `,
        })(event);
        const delivery = candidates.at(0);
        if (delivery === undefined || candidates.length !== 1) {
          yield* sql`UPDATE kraksend_feedback_events SET checked_at = clock_timestamp()
          WHERE provider = ${event.provider} AND event_id = ${event.eventId} AND recipient_address = ${event.recipientAddress}`;
          return null;
        }
        if (event.kind === "hard_bounce" || event.kind === "complaint") {
          yield* notifications
            .setSuppression({
              scope: {
                recipientUserId: null,
                organizationId: null,
                workspaceId: null,
              },
              channel: "email",
              purpose: null,
              recipientAddress: event.recipientAddress,
              reason:
                event.kind === "complaint"
                  ? "provider_complaint"
                  : "provider_hard_bounce",
              expiresAt: null,
            })
            .pipe(Effect.mapError(storageError));
        }
        yield* sql`UPDATE kraksend_feedback_events SET delivery_id = ${delivery.id}, applied_at = now(), checked_at = clock_timestamp()
        WHERE provider = ${event.provider} AND event_id = ${event.eventId} AND recipient_address = ${event.recipientAddress}`;
        return delivery.id;
      });

      const record = Effect.fn("SendFeedback.record")(function* (
        raw: RecordFeedback,
      ) {
        const decoded = yield* Schema.decodeEffect(RecordFeedback)(raw).pipe(
          Effect.mapError(
            () =>
              new SendValidationError({ message: "Invalid provider feedback" }),
          ),
        );
        const input = {
          ...decoded,
          recipientAddress: decoded.recipientAddress.toLowerCase(),
        };
        return yield* sql.withTransaction(
          Effect.gen(function* () {
            const inserted = yield* SqlSchema.findOneOption({
              Request: RecordFeedback,
              Result: StoredFeedback,
              execute: (event) => sql`INSERT INTO kraksend_feedback_events
            (provider, event_id, provider_message_id, recipient_address, kind, occurred_at)
            VALUES (${event.provider}, ${event.eventId}, ${event.providerMessageId}, ${event.recipientAddress}, ${event.kind}, ${event.occurredAt})
            ON CONFLICT (provider, event_id, recipient_address) DO NOTHING RETURNING ${columns}`,
            })(input);
            const stored = yield* SqlSchema.findOne({
              Request: RecordFeedback,
              Result: StoredFeedback,
              execute: (
                event,
              ) => sql`SELECT ${columns} FROM kraksend_feedback_events
            WHERE provider = ${event.provider} AND event_id = ${event.eventId} AND recipient_address = ${event.recipientAddress} FOR UPDATE`,
            })(input).pipe(
              Effect.catchTag("NoSuchElementError", () =>
                Effect.fail(
                  new SendStorageError({
                    message: "Stored feedback disappeared during ingestion",
                  }),
                ),
              ),
            );
            if (
              stored.providerMessageId !== input.providerMessageId ||
              stored.kind !== input.kind ||
              stored.occurredAt.getTime() !== input.occurredAt.getTime()
            ) {
              return yield* new SendConflict({
                message: "Feedback event ID was reused with different input",
              });
            }
            const deliveryId = yield* apply(stored);
            return {
              status: deliveryId === null ? "pending" : "applied",
              deliveryId,
              idempotentReplay: Option.isNone(inserted),
            } satisfies typeof FeedbackReceipt.Type;
          }),
        );
      }, mapStorageError);

      const reconcile = Effect.fn("SendFeedback.reconcile")(function* (
        raw: typeof ReconcileFeedback.Type,
      ) {
        const input = yield* Schema.decodeEffect(ReconcileFeedback)(raw).pipe(
          Effect.mapError(
            () =>
              new SendValidationError({
                message: "Invalid feedback reconciliation limit",
              }),
          ),
        );
        return yield* sql.withTransaction(
          Effect.gen(function* () {
            const events = yield* SqlSchema.findAll({
              Request: ReconcileFeedback,
              Result: StoredFeedback,
              execute: (
                request,
              ) => sql`SELECT ${columns} FROM kraksend_feedback_events WHERE applied_at IS NULL
            ORDER BY checked_at NULLS FIRST, received_at, provider, event_id, recipient_address
            LIMIT ${request.limit ?? 25} FOR UPDATE SKIP LOCKED`,
            })(input);
            let applied = 0;
            for (const event of events)
              if ((yield* apply(event)) !== null) applied++;
            return {
              checked: events.length,
              applied,
              pending: events.length - applied,
            } satisfies typeof ReconcileFeedbackResult.Type;
          }),
        );
      }, mapStorageError);
      return { record, reconcile };
    }),
  },
) {
  static readonly layer = Layer.effect(this, this.make);
}

// Pending rows are the durable backlog. A scoped host worker retries failed or
// early callbacks without retaining raw provider payloads or logging recipients.
export const feedbackReconciliationLayer = Layer.effectDiscard(
  Effect.gen(function* () {
    const feedback = yield* SendFeedback;
    yield* Effect.forkScoped(
      feedback.reconcile({}).pipe(
        Effect.catch(() =>
          Effect.logWarning(
            "KrakSend feedback reconciliation failed; pending events will be retried",
          ),
        ),
        Effect.repeat(Schedule.spaced("30 seconds")),
      ),
    );
  }),
);
