import { Context, Effect, Layer, Option, Schema } from "effect";
import { SqlClient, SqlSchema, SqlError } from "effect/sql";
import { NotificationService } from "@krak-stack/notifications";
import { NotificationScope } from "@krak-stack/notifications/schema";
import { NotificationContacts } from "./index.js";
import {
  ContactParams,
  SendNotFound,
  SendStorageError,
  SendValidationError,
} from "./schema.js";
import * as S from "./delivery.schema.js";
import { queryTable } from "./table.js";
import { OperationWindow } from "./operations.schema.js";

const validate = <T extends Schema.Top>(schema: T, value: T["Type"]) =>
  Schema.decodeUnknownEffect(schema)(value).pipe(
    Effect.mapError(
      () =>
        new SendValidationError({
          message: "Invalid delivery administration input",
        }),
    ),
  );
const storage = <A, E, R>(
  effect: Effect.Effect<A, E | SqlError.SqlError | Schema.SchemaError, R>,
) =>
  effect.pipe(
    Effect.catchTag(["SqlError", "SchemaError"], (cause) =>
      Effect.fail(
        new SendStorageError({
          message: "Delivery administration persistence failed",
          cause,
        }),
      ),
    ),
  );

// A read-only projection. No publishing, queueing, consent or suppression mutations.
export class NotificationDeliveryAdmin extends Context.Service<NotificationDeliveryAdmin>()(
  "@krak-stack/notifications/NotificationDeliveryAdmin",
  {
    make: Effect.gen(function* () {
      // Ensures both existing engine and administration migrations have completed.
      yield* NotificationContacts;
      const notifications = yield* NotificationService;
      const sql = (yield* SqlClient.SqlClient).withoutTransforms();
      const exact = (scope: NotificationScope) => sql`
      d.recipient_user_id IS NOT DISTINCT FROM ${scope.recipientUserId}
      AND d.organization_id IS NOT DISTINCT FROM ${scope.organizationId}
      AND d.workspace_id IS NOT DISTINCT FROM ${scope.workspaceId}`;
      const managed = sql`EXISTS (SELECT 1 FROM kraksend_email_requests r WHERE r.delivery_id = d.id)`;
      const visible = (
        access: typeof S.DeliveryAdminAccess.Type,
        selection: typeof S.DeliverySelection.Type,
      ) => {
        const scopes = (
          grants: ReadonlyArray<typeof S.DeliveryScopeGrant.Type>,
        ) =>
          sql.or(
            grants.map((grant) => {
              switch (grant._tag) {
                case "Exact":
                  return exact(grant.scope);
                case "Organization":
                  return sql`d.organization_id = ${grant.organizationId}`;
                case "Installation":
                  return sql`TRUE`;
              }
            }),
          );
        const engine = scopes(access.engineScopes);
        const canonical = access.deliveryScopes?.length
          ? scopes(access.deliveryScopes)
          : sql`FALSE`;
        const source =
          selection.source === "contacts"
            ? managed
            : selection.source === "engine"
              ? sql`NOT ${managed}`
              : sql`TRUE`;
        return sql`d.channel = 'email'
        AND (${access.contactManaged && selection.source !== "engine" ? sql`${managed} AND ${exact({ recipientUserId: null, organizationId: null, workspaceId: null })}` : sql`FALSE`}
          OR ${selection.source !== "contacts" && access.engineScopes.length ? sql`NOT ${managed} AND (${engine})` : sql`FALSE`}
          OR (${canonical} AND ${source}))
        AND ${selection.scope ? exact(selection.scope) : sql`TRUE`}`;
      };
      // These joins are unique by delivery_id. Attempts, feedback and references
      // never join into this rowset, so every delivery occurs exactly once.
      const joins = sql`FROM notification_deliveries d
      LEFT JOIN kraksend_email_requests r ON r.delivery_id = d.id
      LEFT JOIN kraksend_campaign_recipients cr ON cr.delivery_id = d.id
      LEFT JOIN kraksend_campaigns c ON c.id = cr.campaign_id`;
      const columns = sql`d.id, CASE WHEN r.delivery_id IS NULL THEN 'engine' ELSE 'contacts' END AS source,
      d.recipient_user_id AS "recipientUserId", d.organization_id AS "organizationId", d.workspace_id AS "workspaceId",
       COALESCE(r.contact_id::text, d.publication_metadata #>> '{recipient,contact,id}') AS "contactId", cr.campaign_id AS "campaignId", c.name AS "campaignName",
      d.recipient_address AS "recipientAddress", d.recipient_name AS "recipientName", d.event_key AS "eventKey",
      d.purpose, d.template, d.status, d.attempts, d.max_attempts AS "maxAttempts", d.provider,
      d.provider_message_id AS "providerMessageId", d.error_message AS "errorMessage",
      d.created_at AS "createdAt", d.updated_at AS "updatedAt", d.scheduled_for AS "scheduledFor", d.sent_at AS "sentAt"`;
      const select = Effect.fn(function* (
        access: typeof S.DeliveryAdminAccess.Type,
        selection: typeof S.DeliverySelection.Type,
      ) {
        const trusted = yield* validate(S.DeliveryAdminAccess, access);
        // Selection.Type contains decoded scope, unlike its URL representation.
        const selected = yield* validate(S.DeliverySelectionInput, selection);
        return visible(trusted, selected);
      });
      const activityTable = Effect.fn(
        "NotificationDeliveryAdmin.activityTable",
      )(function* (input: {
        access: typeof S.DeliveryAdminAccess.Type;
        query: typeof S.DeliveryTableQuery.Type;
      }) {
        const predicate = yield* select(input.access, input.query);
        return yield* queryTable({
          sql,
          state: input.query.table,
          row: S.AdminDelivery,
          key: "id",
          columns: {
            id: "text",
            source: "text",
            recipientUserId: "text",
            organizationId: "text",
            workspaceId: "text",
            contactId: "text",
            campaignId: "text",
            campaignName: "text",
            recipientAddress: "text",
            recipientName: "text",
            eventKey: "text",
            purpose: "text",
            template: "text",
            status: "text",
            attempts: "number",
            maxAttempts: "number",
            provider: "text",
            providerMessageId: "text",
            errorMessage: "text",
            createdAt: "date",
            updatedAt: "date",
            scheduledFor: "date",
            sentAt: "date",
          },
          source: sql`SELECT ${columns} ${joins} WHERE ${predicate}`,
        });
      }, storage);
      const flag = (kind: string) =>
        sql`EXISTS (SELECT 1 FROM kraksend_feedback_events f WHERE f.delivery_id = d.id AND f.applied_at IS NOT NULL AND f.kind = ${kind})`;
      const overview = Effect.fn("NotificationDeliveryAdmin.overview")(
        function* (input: {
          access: typeof S.DeliveryAdminAccess.Type;
          query: typeof S.DeliveryOverviewQuery.Type;
        }) {
          const predicate = yield* select(input.access, input.query);
          const window = yield* validate(OperationWindow, input.query);
          if (window.since && window.until && window.since >= window.until)
            return yield* new SendValidationError({
              message: "The end of the window must follow its start",
            });
          return yield* SqlSchema.findOne({
            Request: Schema.Void,
            Result: S.DeliveryOverview,
            execute: () => sql`SELECT count(*)::int AS total,
          count(*) FILTER (WHERE d.status = 'queued')::int AS queued,
          count(*) FILTER (WHERE d.status = 'processing')::int AS processing,
          count(*) FILTER (WHERE d.status = 'retrying')::int AS retrying,
          count(*) FILTER (WHERE d.sent_at IS NOT NULL)::int AS accepted,
          count(*) FILTER (WHERE d.status = 'failed')::int AS failed,
          count(*) FILTER (WHERE d.status = 'suppressed')::int AS suppressed,
          count(*) FILTER (WHERE d.status = 'cancelled')::int AS cancelled,
          count(*) FILTER (WHERE ${managed} OR d.feedback_expected)::int AS "feedbackCovered",
          count(*) FILTER (WHERE NOT ${managed} AND NOT d.feedback_expected)::int AS "feedbackUnavailable",
          count(*) FILTER (WHERE ${flag("delivered")})::int AS confirmed,
          count(*) FILTER (WHERE ${flag("hard_bounce")})::int AS "hardBounced",
          count(*) FILTER (WHERE ${flag("soft_bounce")})::int AS "softBounced",
          count(*) FILTER (WHERE ${flag("complaint")})::int AS complained
          FROM notification_deliveries d WHERE ${predicate}
          AND ${window.since ? sql`d.created_at >= ${window.since}` : sql`TRUE`}
          AND ${window.until ? sql`d.created_at < ${window.until}` : sql`TRUE`}`,
          })(undefined).pipe(
            Effect.catchTag("NoSuchElementError", () =>
              Effect.fail(
                new SendStorageError({ message: "Missing delivery overview" }),
              ),
            ),
          );
        },
        storage,
      );
      const inspect = Effect.fn("NotificationDeliveryAdmin.inspect")(
        function* (input: {
          access: typeof S.DeliveryAdminAccess.Type;
          id: string;
          selection?: typeof S.DeliverySelection.Type;
        }) {
          const { id } = yield* validate(ContactParams, input);
          const predicate = yield* select(input.access, input.selection ?? {});
          const found = yield* SqlSchema.findOneOption({
            Request: ContactParams,
            Result: S.AdminDelivery,
            execute: () =>
              sql`SELECT ${columns} ${joins} WHERE ${predicate} AND d.id = ${id}`,
          })({ id });
          if (Option.isNone(found)) return yield* new SendNotFound({ id });
          const delivery = found.value;
          const detail = yield* notifications
            .getDelivery({
              deliveryId: id,
              scope: {
                recipientUserId: delivery.recipientUserId,
                organizationId: delivery.organizationId,
                workspaceId: delivery.workspaceId,
              },
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
          return {
            delivery,
            attempts: detail.attempts,
            references: detail.references.filter((ref) =>
              input.access.referenceNamespaces.includes(ref.namespace),
            ),
          };
        },
        storage,
      );
      return { activityTable, overview, inspect };
    }),
  },
) {
  static readonly layer = Layer.effect(this, this.make);
}
