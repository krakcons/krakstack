// Notifications administration. Persisted legacy identifiers remain unchanged.
import { Context, DateTime, Effect, Layer, Option, Schema } from "effect";
import { SecureRandom } from "effect/crypto";
import { SqlClient, SqlSchema, SqlError } from "effect/sql";
import { PgClient } from "@effect/sql-pg";
import { NotificationService } from "@krak-stack/notifications";
import type { NotificationDelivery } from "@krak-stack/notifications/schema";
import type { DispatchDecision } from "@krak-stack/notifications/policy";
import { PublicationRecipient } from "../schema.js";

import { runSendMigrations } from "./migrations.js";
import { queryTable } from "./table.js";
import { TableState } from "./table.schema.js";
import { SendCampaignSafety } from "./campaign.safety.js";
import {
  Contact,
  ContactParams,
  ContactListQuery,
  CreateContact,
  UpdateContactRequest,
  RecordEmailConsent,
  EmailConsentEvent,
  ConsentEventListRequest,
  QueueEmail,
  QueuedEmail,
  StoredEmailRequest,
  CampaignDeliveryPolicy,
  SendConflict,
  SendNotFound,
  SendConsentRequired,
  SendStorageError,
  SendValidationError,
} from "./schema.js";

const validate = <S extends Schema.Top>(schema: S, input: S["Encoded"]) =>
  Schema.decodeEffect(schema)(input).pipe(
    Effect.mapError(
      () =>
        new SendValidationError({
          message: "Invalid notification administration input",
        }),
    ),
  );
const storageError = (cause: unknown) =>
  new SendStorageError({
    message: "Notification administration persistence failed",
    cause,
  });
const mapPersistenceError = <A, E, R>(
  effect: Effect.Effect<A, E | SqlError.SqlError | Schema.SchemaError, R>,
) =>
  Effect.catchTag(effect, ["SqlError", "SchemaError"], (cause) =>
    Effect.fail(storageError(cause)),
  );

export const SEND_PUBLICATION_PREFIX = "kraksend:email:";

export class NotificationContacts extends Context.Service<NotificationContacts>()(
  "@krak-stack/send/KrakSend",
  {
    make: Effect.gen(function* () {
      const notifications = yield* NotificationService;
      const sql = (yield* SqlClient.SqlClient).withoutTransforms();
      const pg = yield* PgClient.PgClient;
      const campaignSafety = yield* SendCampaignSafety;
      const random = yield* SecureRandom.SecureRandom.pipe(
        Effect.provide(SecureRandom.layerWebCrypto),
      );
      yield* runSendMigrations;

      const contactColumns =
        sql.literal(`c.id, c.name, c.locale, e.address AS email,
      COALESCE(s.status, 'unknown') AS "emailConsent",
      c.created_at AS "createdAt", c.updated_at AS "updatedAt"`);
      const consentColumns =
        sql.literal(`request_id AS "requestId", contact_id AS "contactId",
      status, source, actor, notice_version AS "noticeVersion", occurred_at AS "occurredAt"`);

      const findContact = SqlSchema.findOneOption({
        Request: ContactParams,
        Result: Contact,
        execute: ({ id }) => sql`
        SELECT ${contactColumns} FROM kraksend_contacts c
        JOIN kraksend_email_endpoints e ON e.contact_id = c.id
        LEFT JOIN kraksend_email_consents s ON s.contact_id = c.id
        WHERE c.id = ${id}
      `,
      });
      const requireContact = Effect.fn("KrakSend.requireContact")(function* (
        input: typeof ContactParams.Type,
      ) {
        const contact = yield* findContact(input);
        if (Option.isNone(contact))
          return yield* new SendNotFound({ id: input.id });
        return contact.value;
      });
      const getContact = Effect.fn("KrakSend.getContact")(function* (
        input: typeof ContactParams.Type,
      ) {
        return yield* requireContact(yield* validate(ContactParams, input));
      }, mapPersistenceError);

      // Resolution returns a snapshot, not permission to publish or evidence of consent.
      const resolveEmailRecipient = Effect.fn(
        "NotificationContacts.resolveEmailRecipient",
      )(function* (raw: typeof ContactParams.Type) {
        const input = yield* validate(ContactParams, raw);
        const recipient = yield* SqlSchema.findOneOption({
          Request: ContactParams,
          Result: PublicationRecipient,
          execute: ({ id }) => sql`SELECT e.address, NULLIF(c.name, '') AS name,
            jsonb_build_object('id', c.id, 'endpointId', e.id) AS contact
            FROM kraksend_contacts c JOIN kraksend_email_endpoints e ON e.contact_id = c.id WHERE c.id = ${id}`,
        })(input);
        if (Option.isNone(recipient))
          return yield* new SendNotFound({ id: input.id });
        return recipient.value;
      }, mapPersistenceError);

      const createContact = Effect.fn("KrakSend.createContact")(function* (
        raw: CreateContact,
      ) {
        const input = yield* validate(CreateContact, raw);
        return yield* sql.withTransaction(
          Effect.gen(function* () {
            const id = yield* random.uuidV7();
            const endpointId = yield* random.uuidV7();
            yield* sql`INSERT INTO kraksend_contacts (id, name, locale)
          VALUES (${id}, ${input.name ?? ""}, ${input.locale ?? "en"})`;
            const endpoint = yield* SqlSchema.findOneOption({
              Request: Schema.Void,
              Result: ContactParams,
              execute: () => sql`
            INSERT INTO kraksend_email_endpoints (id, contact_id, address)
            VALUES (${endpointId}, ${id}, ${input.email.toLowerCase()})
            ON CONFLICT (address) DO NOTHING RETURNING id
          `,
            })(undefined);
            if (Option.isNone(endpoint))
              return yield* new SendConflict({
                message: "Email address already belongs to a contact",
              });
            return yield* requireContact({ id });
          }),
        );
      }, mapPersistenceError);

      const updateContact = Effect.fn("KrakSend.updateContact")(function* (
        raw: typeof UpdateContactRequest.Type,
      ) {
        const input = yield* validate(UpdateContactRequest, raw);
        return yield* sql.withTransaction(
          Effect.gen(function* () {
            yield* requireContact({ id: input.id });
            yield* sql`UPDATE kraksend_contacts SET name = ${input.payload.name},
          locale = ${input.payload.locale}, updated_at = now() WHERE id = ${input.id}`;
            return yield* requireContact({ id: input.id });
          }),
        );
      }, mapPersistenceError);

      const listContacts = Effect.fn("KrakSend.listContacts")(function* (
        raw: typeof ContactListQuery.Type,
      ) {
        const input = yield* validate(ContactListQuery, raw);
        const limit = input.limit ?? 25;
        const rows = yield* SqlSchema.findAll({
          Request: Schema.Void,
          Result: Contact,
          execute: () => sql`
          SELECT ${contactColumns} FROM kraksend_contacts c
          JOIN kraksend_email_endpoints e ON e.contact_id = c.id
          LEFT JOIN kraksend_email_consents s ON s.contact_id = c.id
          WHERE ${input.after === undefined ? sql`TRUE` : sql`c.id > ${input.after}`}
          ORDER BY c.id LIMIT ${limit + 1}
        `,
        })(undefined);
        const items = rows.slice(0, limit);
        return {
          items,
          nextCursor: rows.length > limit ? (items.at(-1)?.id ?? null) : null,
        };
      }, mapPersistenceError);

      const contactsTable = Effect.fn("NotificationContacts.table")(
        (state: typeof TableState.Type) =>
          queryTable({
            sql,
            state,
            row: Contact,
            key: "id",
            columns: {
              id: "text",
              email: "text",
              name: "text",
              locale: "text",
              emailConsent: "text",
              createdAt: "date",
              updatedAt: "date",
            },
            source: sql`SELECT ${contactColumns} FROM kraksend_contacts c JOIN kraksend_email_endpoints e ON e.contact_id = c.id LEFT JOIN kraksend_email_consents s ON s.contact_id = c.id`,
          }),
        mapPersistenceError,
      );
      const consentTable = Effect.fn("NotificationContacts.consentTable")(
        function* (input: {
          contactId: string;
          table: typeof TableState.Type;
        }) {
          yield* requireContact({
            id: yield* validate(ContactParams.fields.id, input.contactId),
          });
          return yield* queryTable({
            sql,
            state: input.table,
            row: EmailConsentEvent,
            key: "requestId",
            columns: {
              requestId: "text",
              status: "text",
              source: "text",
              actor: "text",
              noticeVersion: "text",
              occurredAt: "date",
            },
            source: sql`SELECT ${consentColumns} FROM kraksend_email_consent_events WHERE contact_id = ${input.contactId}`,
          });
        },
        mapPersistenceError,
      );

      const recordEmailConsent = Effect.fn("KrakSend.recordEmailConsent")(
        function* (raw: RecordEmailConsent) {
          const input = yield* validate(RecordEmailConsent, raw);
          return yield* sql.withTransaction(
            Effect.gen(function* () {
              yield* sql`SELECT id FROM kraksend_contacts WHERE id = ${input.contactId} FOR UPDATE`;
              yield* requireContact({ id: input.contactId });
              const inserted = yield* SqlSchema.findOneOption({
                Request: RecordEmailConsent,
                Result: EmailConsentEvent,
                execute: (request) => sql`
            INSERT INTO kraksend_email_consent_events
              (request_id, contact_id, status, source, actor, notice_version)
            VALUES (${request.requestId}, ${request.contactId}, ${request.status},
              ${request.source}, ${request.actor}, ${request.noticeVersion})
            ON CONFLICT (request_id) DO NOTHING RETURNING ${consentColumns}
          `,
              })(input);
              if (Option.isNone(inserted)) {
                const replay = yield* SqlSchema.findOneOption({
                  Request: RecordEmailConsent,
                  Result: EmailConsentEvent,
                  execute: (request) => sql`
              SELECT ${consentColumns} FROM kraksend_email_consent_events
              WHERE request_id = ${request.requestId} AND contact_id = ${request.contactId}
                AND status = ${request.status} AND source = ${request.source}
                AND actor = ${request.actor} AND notice_version = ${request.noticeVersion}
            `,
                })(input);
                if (Option.isNone(replay))
                  return yield* new SendConflict({
                    message:
                      "Consent request ID was reused with different input",
                  });
                return replay.value;
              }
              yield* sql`
          INSERT INTO kraksend_email_consents (contact_id, status, event_id)
          VALUES (${input.contactId}, ${input.status}, ${input.requestId})
          ON CONFLICT (contact_id) DO UPDATE SET status = EXCLUDED.status, event_id = EXCLUDED.event_id
        `;
              return inserted.value;
            }),
          );
        },
        mapPersistenceError,
      );

      const listEmailConsentEvents = Effect.fn(
        "KrakSend.listEmailConsentEvents",
      )(function* (raw: typeof ConsentEventListRequest.Type) {
        const input = yield* validate(ConsentEventListRequest, raw);
        yield* requireContact({ id: input.contactId });
        const limit = input.query.limit ?? 25;
        const rows = yield* SqlSchema.findAll({
          Request: Schema.Void,
          Result: EmailConsentEvent,
          execute: () => sql`
          SELECT ${consentColumns} FROM kraksend_email_consent_events
          WHERE contact_id = ${input.contactId}
            ${
              input.query.before === undefined
                ? sql``
                : sql`AND (occurred_at, request_id) < (
              SELECT occurred_at, request_id FROM kraksend_email_consent_events
              WHERE request_id = ${input.query.before} AND contact_id = ${input.contactId}
            )`
            }
          ORDER BY occurred_at DESC, request_id DESC LIMIT ${limit + 1}
        `,
        })(undefined);
        const items = rows.slice(0, limit);
        return {
          items,
          nextCursor:
            rows.length > limit ? (items.at(-1)?.requestId ?? null) : null,
        };
      }, mapPersistenceError);

      // Repeated withdrawal is a no-op until a later grant. A still-valid old
      // link must withdraw again after re-subscription, not replay an old event.
      const withdrawEmailConsent = Effect.fn("KrakSend.withdrawEmailConsent")(
        function* (raw: typeof ContactParams.Type) {
          const input = yield* validate(ContactParams, raw);
          yield* sql.withTransaction(
            Effect.gen(function* () {
              yield* sql`SELECT id FROM kraksend_contacts WHERE id = ${input.id} FOR UPDATE`;
              const contact = yield* requireContact(input);
              if (contact.emailConsent === "unsubscribed") return;
              yield* recordEmailConsent({
                contactId: input.id,
                requestId: yield* random.uuidV7(),
                status: "unsubscribed",
                source: "public-unsubscribe",
                actor: `contact:${input.id}`,
                noticeVersion: "public-unsubscribe-v1",
              });
            }),
          );
        },
        mapPersistenceError,
      );

      /** @deprecated Use NotificationService.publish with recipient and policy. Retained for legacy requests. */
      const queueEmail = Effect.fn("KrakSend.queueEmail")(function* (
        raw: QueueEmail,
      ) {
        const input = yield* validate(QueueEmail, raw);
        const request = yield* Schema.encodeEffect(
          Schema.toCodecJson(QueueEmail),
        )(input);
        return yield* sql.withTransaction(
          Effect.gen(function* () {
            const contact = yield* requireContact({ id: input.contactId });
            yield* sql`INSERT INTO kraksend_email_requests (request_id, contact_id, request)
          VALUES (${input.requestId}, ${input.contactId}, ${pg.json(request)})
          ON CONFLICT (request_id) DO NOTHING`;
            const stored = yield* SqlSchema.findOne({
              Request: Schema.Void,
              Result: StoredEmailRequest,
              execute:
                () => sql`SELECT request, delivery_id AS "deliveryId", request = ${pg.json(request)} AS matches
            FROM kraksend_email_requests WHERE request_id = ${input.requestId} FOR UPDATE`,
            })(undefined);
            if (!stored.matches)
              return yield* new SendConflict({
                message: "Email request ID was reused with different input",
              });
            if (stored.deliveryId !== null)
              return { deliveryId: stored.deliveryId, idempotentReplay: true };
            if (
              input.purpose !== "transactional" &&
              contact.emailConsent !== "subscribed"
            ) {
              return yield* new SendConsentRequired({ contactId: contact.id });
            }
            const publication = yield* notifications.publish({
              idempotencyKey: `${SEND_PUBLICATION_PREFIX}${input.requestId}`,
              scope: {
                recipientUserId: null,
                organizationId: null,
                workspaceId: null,
              },
              eventKey: input.eventKey,
              eventVersion: 1,
              deliveries: [
                {
                  key: "email",
                  channel: "email",
                  dispatchPolicy: "kraksend.v1",
                  purpose:
                    input.purpose === "transactional"
                      ? "transactional"
                      : "notification",
                  template: null,
                  recipientAddress: contact.email,
                  recipientName: contact.name || null,
                  payloadVersion: 1,
                  payload: input.email,
                  scheduledFor: input.scheduledFor,
                  expiresAt: input.expiresAt,
                  references: [
                    { namespace: "kraksend.contact", value: contact.id },
                  ],
                },
              ],
            });
            const deliveryId = publication.deliveryIds.at(0);
            if (deliveryId === undefined)
              return yield* new SendStorageError({
                message: "Email publication returned no delivery",
              });
            yield* sql`UPDATE kraksend_email_requests SET delivery_id = ${deliveryId} WHERE request_id = ${input.requestId}`;
            return {
              deliveryId,
              idempotentReplay: false,
            } satisfies typeof QueuedEmail.Type;
          }),
        );
      }, mapPersistenceError);

      const checkDelivery = Effect.fn("KrakSend.checkDelivery")(function* (
        delivery: NotificationDelivery,
      ): Effect.fn.Return<DispatchDecision, SendStorageError> {
        const consent = yield* SqlSchema.findOneOption({
          Request: ContactParams,
          Result: CampaignDeliveryPolicy,
          execute: ({ id }) => sql`
          SELECT r.request->>'purpose' AS purpose, COALESCE(s.status, 'unknown') AS status,
            c.status AS "campaignStatus", c.from_address AS "campaignFrom"
          FROM kraksend_email_requests r
          LEFT JOIN kraksend_email_consents s ON s.contact_id = r.contact_id
          LEFT JOIN kraksend_campaign_recipients cr ON cr.delivery_id = r.delivery_id
          LEFT JOIN kraksend_campaigns c ON c.id = cr.campaign_id
          WHERE r.delivery_id = ${id}
        `,
        })({ id: delivery.id }).pipe(Effect.mapError(storageError));
        if (Option.isNone(consent)) {
          const detail = yield* notifications
            .getDelivery({ scope: delivery.scope, deliveryId: delivery.id })
            .pipe(Effect.mapError(storageError));
          if (
            !detail.references.some(
              (reference) => reference.namespace === "kraksend.contact",
            )
          )
            return { _tag: "Allow" };
          return yield* new SendStorageError({
            message: "KrakSend delivery has no contact policy record",
          });
        }
        if (consent.value.campaignStatus === "cancelled")
          return { _tag: "Suppress", reason: "campaign_cancelled" };
        if (consent.value.campaignStatus === "paused") {
          const now = yield* DateTime.nowAsDate;
          return {
            _tag: "Defer",
            reason: "campaign_paused",
            until: new Date(now.getTime() + 30_000),
          };
        }
        if (consent.value.campaignFrom !== null) {
          yield* campaignSafety
            .checkSender(consent.value.campaignFrom)
            .pipe(Effect.mapError(storageError));
          yield* campaignSafety
            .checkRecipient(delivery.recipientAddress)
            .pipe(Effect.mapError(storageError));
        }
        return consent.value.purpose === "transactional" ||
          consent.value.status === "subscribed"
          ? { _tag: "Allow" }
          : { _tag: "Suppress", reason: "kraksend_email_consent_required" };
      });

      return {
        createContact,
        getContact,
        resolveEmailRecipient,
        updateContact,
        listContacts,
        contactsTable,
        consentTable,
        recordEmailConsent,
        withdrawEmailConsent,
        listEmailConsentEvents,
        queueEmail,
        checkDelivery,
      };
    }),
  },
) {
  static readonly layer = Layer.effect(this, this.make);
}

/** @deprecated Use NotificationContacts. Kept for source compatibility. */
export { NotificationContacts as KrakSend };
