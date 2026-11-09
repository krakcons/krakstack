// Notification campaign orchestration and persistence.
import { Context, DateTime, Effect, Layer, Option, Schema } from "effect";
import { SecureRandom } from "effect/crypto";
import { SqlClient, SqlSchema, SqlError } from "effect/sql";
import { PgClient } from "@effect/sql-pg";
import { KrakSend } from "./index.js";
import { SendUnsubscribe } from "./unsubscribe.js";
import { SendCampaignSafety } from "./campaign.safety.js";
import { queryTable } from "./table.js";
import { TableState } from "./table.schema.js";
import {
  Campaign,
  CampaignStored,
  CampaignBatch,
  CampaignWork,
  CampaignBatchResult,
  CampaignReport,
  CampaignTransition,
  ContactParams,
  ContactListQuery,
  CreateCampaignRequest,
  ScheduleCampaign,
  SendConflict,
  SendNotFound,
  SendStorageError,
  SendValidationError,
} from "./schema.js";

const validate = <S extends Schema.Top>(schema: S, input: S["Encoded"]) =>
  Schema.decodeEffect(schema)(input).pipe(
    Effect.mapError(
      () => new SendValidationError({ message: "Invalid campaign input" }),
    ),
  );
const persistence = <A, E, R>(
  effect: Effect.Effect<A, E | SqlError.SqlError | Schema.SchemaError, R>,
) =>
  Effect.catchTag(effect, ["SqlError", "SchemaError"], (cause) =>
    Effect.fail(
      new SendStorageError({ message: "Campaign persistence failed", cause }),
    ),
  );

export class SendCampaigns extends Context.Service<SendCampaigns>()(
  "@krak-stack/send/SendCampaigns",
  {
    make: Effect.gen(function* () {
      const send = yield* KrakSend;
      const unsubscribe = yield* SendUnsubscribe;
      const safety = yield* SendCampaignSafety;
      const sql = (yield* SqlClient.SqlClient).withoutTransforms();
      const pg = yield* PgClient.PgClient;
      const random = yield* SecureRandom.SecureRandom.pipe(
        Effect.provide(SecureRandom.layerWebCrypto),
      );
      const columns =
        sql.literal(`id, name, from_address AS "from", audience, content, status,
      scheduled_for AS "scheduledFor", snapshot_at AS "snapshotAt", batch_number AS "batchNumber", created_at AS "createdAt"`);
      const find = SqlSchema.findOneOption({
        Request: ContactParams,
        Result: Campaign,
        execute: ({ id }) =>
          sql`SELECT ${columns} FROM kraksend_campaigns WHERE id = ${id}`,
      });
      const requireCampaign = Effect.fnUntraced(function* (
        input: typeof ContactParams.Type,
      ) {
        const value = yield* find(input);
        if (Option.isNone(value))
          return yield* new SendNotFound({ id: input.id });
        return value.value;
      });
      const get = Effect.fn("SendCampaigns.get")(function* (
        raw: typeof ContactParams.Type,
      ) {
        return yield* requireCampaign(yield* validate(ContactParams, raw));
      }, persistence);
      const list = Effect.fn("SendCampaigns.list")(function* (
        raw: typeof ContactListQuery.Type,
      ) {
        const query = yield* validate(ContactListQuery, raw);
        const limit = query.limit ?? 25;
        const rows = yield* SqlSchema.findAll({
          Request: Schema.Void,
          Result: Campaign,
          execute: () => sql`SELECT ${columns} FROM kraksend_campaigns
        WHERE ${query.after === undefined ? sql`TRUE` : sql`id > ${query.after}`} ORDER BY id LIMIT ${limit + 1}`,
        })(undefined);
        const items = rows.slice(0, limit);
        return {
          items,
          nextCursor: rows.length > limit ? (items.at(-1)?.id ?? null) : null,
        };
      }, persistence);
      const create = Effect.fn("SendCampaigns.create")(function* (
        raw: typeof CreateCampaignRequest.Type,
      ) {
        const input = yield* validate(CreateCampaignRequest, raw);
        const payload = {
          ...input.payload,
          from: input.payload.from.toLowerCase(),
        };
        const request = { payload, actor: input.actor };
        return yield* sql.withTransaction(
          Effect.gen(function* () {
            const id = yield* random.uuidV7();
            yield* sql`INSERT INTO kraksend_campaigns(id, request_id, actor, request, name, from_address, audience, content)
          VALUES (${id}, ${payload.requestId}, ${input.actor}, ${pg.json(request)}, ${payload.name}, ${payload.from}, ${pg.json(payload.audience)}, ${pg.json(payload.content)}) ON CONFLICT (request_id) DO NOTHING`;
            const stored = yield* SqlSchema.findOneOption({
              Request: Schema.Void,
              Result: CampaignStored,
              execute: () =>
                sql`SELECT ${columns}, request = ${pg.json(request)} AS matches FROM kraksend_campaigns WHERE request_id = ${payload.requestId}`,
            })(undefined);
            if (Option.isNone(stored))
              return yield* new SendStorageError({
                message: "Campaign insertion returned no record",
              });
            if (!stored.value.matches)
              return yield* new SendConflict({
                message: "Campaign request ID was reused with different input",
              });
            return yield* requireCampaign({ id: stored.value.id });
          }),
        );
      }, persistence);
      const table = Effect.fn("NotificationCampaigns.table")(
        (state: typeof TableState.Type) =>
          queryTable({
            sql,
            state,
            row: Campaign,
            key: "id",
            columns: {
              id: "text",
              name: "text",
              from: "text",
              status: "text",
              scheduledFor: "date",
              createdAt: "date",
            },
            source: sql`SELECT ${columns} FROM kraksend_campaigns`,
          }),
        persistence,
      );
      const schedule = Effect.fn("SendCampaigns.schedule")(function* (
        raw: typeof ScheduleCampaign.Type,
      ) {
        const input = yield* validate(ScheduleCampaign, raw);
        return yield* sql.withTransaction(
          Effect.gen(function* () {
            yield* sql`SELECT id FROM kraksend_campaigns WHERE id = ${input.id} FOR UPDATE`;
            const campaign = yield* requireCampaign(input);
            if (campaign.status !== "draft") {
              if (
                campaign.scheduledFor?.getTime() ===
                  input.scheduledFor.getTime() &&
                campaign.status !== "cancelled"
              )
                return campaign;
              return yield* new SendConflict({
                message: "Only draft campaigns can be scheduled",
              });
            }
            yield* safety.checkSender(campaign.from);
            const ids =
              campaign.audience._tag === "Contacts"
                ? campaign.audience.ids
                : undefined;
            yield* sql`INSERT INTO kraksend_campaign_recipients(campaign_id, contact_id)
          SELECT ${campaign.id}, c.id FROM kraksend_contacts c JOIN kraksend_email_consents s ON s.contact_id = c.id
          WHERE s.status = 'subscribed' AND ${ids === undefined ? sql`TRUE` : sql`c.id IN ${sql.in(ids)}`}`;
            yield* sql`UPDATE kraksend_campaigns SET status = 'scheduled', scheduled_for = ${input.scheduledFor}, snapshot_at = now() WHERE id = ${campaign.id}`;
            return yield* requireCampaign(input);
          }),
        );
      }, persistence);
      const transition = Effect.fn("SendCampaigns.transition")(function* (
        raw: typeof CampaignTransition.Type,
      ) {
        const input = yield* validate(CampaignTransition, raw);
        return yield* sql.withTransaction(
          Effect.gen(function* () {
            yield* sql`SELECT id FROM kraksend_campaigns WHERE id = ${input.id} FOR UPDATE`;
            const campaign = yield* requireCampaign(input);
            const status =
              input.action === "cancel"
                ? "cancelled"
                : input.action === "pause"
                  ? "paused"
                  : "scheduled";
            if (campaign.status === status) return campaign;
            if (
              campaign.status === "cancelled" ||
              (input.action === "resume" && campaign.status !== "paused") ||
              (input.action === "pause" && campaign.status === "draft")
            )
              return yield* new SendConflict({
                message: "Invalid campaign transition",
              });
            if (input.action === "resume")
              yield* safety.checkSender(campaign.from);
            yield* sql`UPDATE kraksend_campaigns SET status = ${status} WHERE id = ${campaign.id}`;
            if (status === "cancelled")
              yield* sql`UPDATE kraksend_campaign_recipients SET status = 'skipped', reason = 'campaign_cancelled' WHERE campaign_id = ${campaign.id} AND status = 'pending'`;
            return yield* requireCampaign(input);
          }),
        );
      }, persistence);
      const processBatch = Effect.fn("SendCampaigns.processBatch")(function* (
        raw: typeof CampaignBatch.Type,
      ) {
        const input = yield* validate(CampaignBatch, raw);
        return yield* sql.withTransaction(
          Effect.gen(function* () {
            yield* sql`SELECT id FROM kraksend_campaigns WHERE id = ${input.id} FOR UPDATE`;
            const campaign = yield* requireCampaign(input);
            const now = yield* DateTime.nowAsDate;
            if (campaign.batchNumber !== input.batchNumber)
              return {
                queued: 0,
                skipped: 0,
                hasMore: false,
              } satisfies typeof CampaignBatchResult.Type;
            // Consume every attempted generation, including a pause race, so a
            // completed workflow ID cannot prevent a later resume from progressing.
            yield* sql`UPDATE kraksend_campaigns SET batch_number = batch_number + 1 WHERE id = ${campaign.id}`;
            if (
              !["scheduled", "running"].includes(campaign.status) ||
              campaign.scheduledFor === null ||
              campaign.scheduledFor.getTime() > now.getTime()
            )
              return {
                queued: 0,
                skipped: 0,
                hasMore: false,
              } satisfies typeof CampaignBatchResult.Type;
            yield* safety.checkSender(campaign.from);
            yield* sql`UPDATE kraksend_campaigns SET status = 'running' WHERE id = ${campaign.id}`;
            const recipients = yield* SqlSchema.findAll({
              Request: Schema.Void,
              Result: ContactParams,
              execute: () =>
                sql`SELECT contact_id AS id FROM kraksend_campaign_recipients WHERE campaign_id = ${campaign.id} AND status = 'pending' ORDER BY contact_id LIMIT ${input.limit ?? 25}`,
            })(undefined);
            let queued = 0;
            let skipped = 0;
            for (const recipient of recipients) {
              const contact = yield* send.getContact(recipient);
              const allowed = yield* safety
                .checkRecipient(contact.email)
                .pipe(Effect.result);
              if (
                contact.emailConsent !== "subscribed" ||
                allowed._tag === "Failure"
              ) {
                yield* sql`UPDATE kraksend_campaign_recipients SET status = 'skipped', reason = ${contact.emailConsent !== "subscribed" ? "consent_required" : "environment_blocked"} WHERE campaign_id = ${campaign.id} AND contact_id = ${contact.id}`;
                skipped++;
                continue;
              }
              const link = yield* unsubscribe.createLink({ id: contact.id });
              const copy = campaign.content[contact.locale];
              const delivery = yield* send.queueEmail({
                requestId: `campaign:${campaign.id}:${contact.id}`,
                contactId: contact.id,
                purpose: "marketing",
                eventKey: "kraksend.campaign.v1",
                email: {
                  from: campaign.from,
                  subject: copy.subject,
                  text: `${copy.text}\n\n${copy.unsubscribeText}: ${link}`,
                  unsubscribeUrl: link,
                },
              });
              yield* sql`UPDATE kraksend_campaign_recipients SET status = 'queued', delivery_id = ${delivery.deliveryId} WHERE campaign_id = ${campaign.id} AND contact_id = ${contact.id}`;
              queued++;
            }
            const pending = yield* SqlSchema.findAll({
              Request: Schema.Void,
              Result: ContactParams,
              execute: () =>
                sql`SELECT contact_id AS id FROM kraksend_campaign_recipients WHERE campaign_id = ${campaign.id} AND status = 'pending' LIMIT 1`,
            })(undefined);
            const hasMore = pending.length > 0;
            if (!hasMore)
              yield* sql`UPDATE kraksend_campaigns SET status = 'completed' WHERE id = ${campaign.id}`;
            return {
              queued,
              skipped,
              hasMore,
            } satisfies typeof CampaignBatchResult.Type;
          }),
        );
      }, persistence);
      const due = SqlSchema.findAll({
        Request: Schema.Void,
        Result: CampaignWork,
        execute: () =>
          sql`SELECT id, batch_number AS "batchNumber" FROM kraksend_campaigns WHERE status IN ('scheduled','running') AND scheduled_for <= now() ORDER BY scheduled_for, id LIMIT 25`,
      });
      const report = Effect.fn("SendCampaigns.report")(function* (
        raw: typeof ContactParams.Type,
      ) {
        const input = yield* validate(ContactParams, raw);
        yield* requireCampaign(input);
        return yield* SqlSchema.findOne({
          Request: ContactParams,
          Result: CampaignReport,
          execute: ({ id }) => sql`SELECT count(*)::int AS audience,
          count(*) FILTER (WHERE r.status = 'pending')::int AS pending,
          count(*) FILTER (WHERE r.status = 'queued')::int AS published,
          count(*) FILTER (WHERE r.status = 'skipped')::int AS skipped,
          count(*) FILTER (WHERE d.sent_at IS NOT NULL)::int AS accepted,
          count(*) FILTER (WHERE d.status = 'failed')::int AS failed,
          count(*) FILTER (WHERE d.status = 'suppressed')::int AS suppressed,
          count(*) FILTER (WHERE EXISTS(SELECT 1 FROM kraksend_feedback_events f WHERE f.delivery_id = r.delivery_id AND f.applied_at IS NOT NULL AND f.kind = 'delivered'))::int AS confirmed,
          count(*) FILTER (WHERE EXISTS(SELECT 1 FROM kraksend_feedback_events f WHERE f.delivery_id = r.delivery_id AND f.applied_at IS NOT NULL AND f.kind = 'hard_bounce'))::int AS "hardBounced",
          count(*) FILTER (WHERE EXISTS(SELECT 1 FROM kraksend_feedback_events f WHERE f.delivery_id = r.delivery_id AND f.applied_at IS NOT NULL AND f.kind = 'complaint'))::int AS complained
          FROM kraksend_campaign_recipients r LEFT JOIN notification_deliveries d ON d.id = r.delivery_id WHERE r.campaign_id = ${id}`,
        })(input).pipe(
          Effect.catchTag("NoSuchElementError", () =>
            Effect.fail(
              new SendStorageError({
                message: "Campaign report returned no aggregate",
              }),
            ),
          ),
        );
      }, persistence);
      return {
        create,
        get,
        list,
        table,
        schedule,
        transition,
        processBatch,
        due,
        report,
      };
    }),
  },
) {
  static readonly layer = Layer.effect(this, this.make);
}
