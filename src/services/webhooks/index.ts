import { PgClient } from "@effect/sql-pg";
import {
  Cause,
  Context,
  DateTime,
  Duration,
  Effect,
  Layer,
  Option,
  Schedule,
  Schema,
} from "effect";
import { HttpClient, HttpClientRequest } from "effect/http";
import { Activity, DurableClock, Workflow } from "effect/workflow";
import { SqlClient, SqlSchema } from "effect/sql";
import { Mac, SecureRandom } from "effect/crypto";
import { Hex } from "effect/encoding";
import { webhookMigrationsLayer } from "./migrations";
import { isPublicWebhookUrlString } from "./url";
import { layer as webhookHttpClientLayer } from "./http-client";
import {
  PublishWebhook,
  Webhook,
  WebhookDelivery,
  WebhookError,
  WebhookPayload,
  WebhookRequest,
  WebhookScope,
  WebhookStatisticsRequest,
  WebhookDeliveryCounts,
  WebhookDeliveryBucket,
  ListWebhookDeliveries,
  WebhookDeliverySortId,
  webhookColumns,
  deliveryColumns,
} from "./schema";
export * from "./schema";

const maxDeliveryAttempts = 8;
const retrySchedule = Schedule.min([
  Schedule.exponential("5 seconds", 4),
  Schedule.spaced("10 hours"),
]);

const processDelivery = Effect.fn("Webhooks.processDelivery")(function* (
  input: typeof WebhookRequest.Type,
) {
  const sql = (yield* SqlClient.SqlClient).withoutTransforms();
  const client = yield* HttpClient.HttpClient;
  const row = yield* SqlSchema.findOneOption({
    Request: WebhookRequest,
    Result: WebhookDelivery,
    execute: ({
      id,
      organizationId,
    }) => sql`SELECT ${sql.literal(deliveryColumns)} FROM webhook_deliveries d JOIN webhooks w ON w.id = d.webhook_id
      WHERE d.id = ${id} AND w.organization_id = ${organizationId}`,
  })(input);
  if (Option.isNone(row) || row.value.status !== "pending") return null;
  const delivery = row.value;
  const now = yield* DateTime.now;
  const remaining = delivery.retryAt.getTime() - DateTime.toEpochMillis(now);
  if (remaining > 0) return remaining;
  const found = yield* SqlSchema.findOneOption({
    Request: WebhookRequest,
    Result: Webhook,
    execute: ({ organizationId, id }) =>
      sql`SELECT ${sql.literal(webhookColumns)} FROM webhooks WHERE organization_id = ${organizationId} AND id = ${id}`,
  })({ organizationId: input.organizationId, id: delivery.webhookId });
  if (Option.isNone(found)) return null;
  const endpoint = found.value;
  if (!endpoint.enabled || delivery.retries >= maxDeliveryAttempts) {
    const error = !endpoint.enabled
      ? "Webhook endpoint is disabled"
      : (delivery.error ?? "Delivery attempt limit reached");
    yield* sql`UPDATE webhook_deliveries SET status = 'failed', error = ${error}, completed_at = now(), updated_at = now() WHERE id = ${input.id}`;
    return null;
  }
  const body = yield* Schema.encodeEffect(Schema.fromJsonString(Schema.Json))({
    event: delivery.event,
    data: delivery.data,
  });
  const timestamp = DateTime.formatIso(now);
  const mac = yield* Mac.Mac.pipe(
    Effect.provide(
      Mac.layerWebCrypto.pipe(Layer.provide(SecureRandom.layerWebCrypto)),
    ),
  );
  const key = yield* Mac.key(
    Mac.hmacSha256,
    new TextEncoder().encode(endpoint.secret),
  );
  const signature = Hex.encode(
    yield* mac.sign(key, new TextEncoder().encode(`${timestamp}.${body}`)),
  );
  const error = isPublicWebhookUrlString(endpoint.url)
    ? yield* client
        .execute(
          HttpClientRequest.post(endpoint.url).pipe(
            HttpClientRequest.setHeaders({
              ...endpoint.headers,
              "Content-Type": "application/json",
              "webhook-id": delivery.id,
              "webhook-timestamp": timestamp,
              "webhook-signature": signature,
            }),
            HttpClientRequest.bodyText(body, "application/json"),
          ),
        )
        .pipe(
          Effect.map((response) =>
            response.status >= 200 && response.status < 300
              ? null
              : `HTTP ${response.status}`,
          ),
          Effect.timeout("30 seconds"),
          Effect.catch((error) =>
            Effect.succeed(
              error._tag === "TimeoutError"
                ? "Request timed out after 30 seconds"
                : error.reason._tag === "TransportError" &&
                    error.reason.description ===
                      "Webhook destination is not public"
                  ? "Webhook destination is not public"
                  : error.reason._tag === "InvalidUrlError"
                    ? "Invalid webhook URL"
                    : "Webhook network request failed",
            ),
          ),
          Effect.scoped,
        )
    : "Webhook destination is not public";
  if (error === null) {
    yield* sql`UPDATE webhook_deliveries SET status = 'success', error = NULL, completed_at = now(), updated_at = now() WHERE id = ${input.id}`;
    return null;
  }
  if (delivery.retries + 1 >= maxDeliveryAttempts) {
    yield* sql`UPDATE webhook_deliveries SET status = 'failed', error = ${error}, retries = retries + 1, completed_at = now(), updated_at = now() WHERE id = ${input.id}`;
    return null;
  }
  // Replay the schedule to the persisted attempt, without sleeping. The workflow
  // owns the durable wait, so restarting never resets the backoff or budget.
  const step = yield* Schedule.toStep(retrySchedule);
  let duration = Duration.zero;
  for (let attempt = 0; attempt <= delivery.retries; attempt++) {
    const [, delay] = yield* step(DateTime.toEpochMillis(now), undefined).pipe(
      Effect.orDie,
    );
    duration = delay;
  }
  const delay = Duration.toMillis(duration);
  yield* sql`UPDATE webhook_deliveries SET retries = retries + 1, error = ${error}, retry_at = now() + ${delay} * interval '1 millisecond', updated_at = now() WHERE id = ${input.id}`;
  return delay;
});

export const DeliverWebhookV1 = Workflow.make("KrakstackDeliverWebhookV1", {
  payload: { organizationId: Schema.String, id: Schema.String },
  success: Schema.Void,
  error: WebhookError,
  idempotencyKey: ({ organizationId, id }) => `${organizationId}:${id}`,
});

const workflowLayer = DeliverWebhookV1.toLayer((input) =>
  Effect.gen(function* () {
    for (let step = 0; ; step++) {
      const wait = yield* Activity.make({
        name: `DeliverWebhookAttemptV1-${step}`,
        success: Schema.NullOr(Schema.Number),
        error: WebhookError,
        execute: processDelivery(input).pipe(
          Effect.mapError(
            () =>
              new WebhookError({
                message: "Webhook delivery persistence failed",
              }),
          ),
          Effect.tapError(() =>
            Effect.logError("Webhook delivery persistence failed"),
          ),
          Effect.retry(Schedule.spaced("5 seconds")),
        ),
      });
      if (wait === null) return;
      yield* DurableClock.sleep({
        name: `WebhookRetryV1-${step}`,
        duration: wait,
        inMemoryThreshold: 0,
      });
    }
  }),
);

const dispatchPending = Effect.gen(function* () {
  const sql = (yield* SqlClient.SqlClient).withoutTransforms();
  const pending = yield* SqlSchema.findAll({
    Request: Schema.Void,
    Result: Schema.Struct({
      id: Schema.String,
      organizationId: Schema.String,
    }).annotate({ identifier: "PendingWebhookDelivery" }),
    execute:
      () => sql`SELECT d.id, w.organization_id AS "organizationId" FROM webhook_deliveries d JOIN webhooks w ON w.id = d.webhook_id
      WHERE d.status = 'pending' AND d.retry_at <= now() ORDER BY d.retry_at LIMIT 100`,
  })();
  yield* Effect.forEach(
    pending,
    (input) => DeliverWebhookV1.execute(input, { discard: true }),
    { concurrency: 4, discard: true },
  );
});

// Committed pending deliveries are the outbox. The engine owns execution; this
// bridge also recovers a crash between committing a delivery and submitting it.
const dispatchLayer = Layer.effectDiscard(
  Effect.repeat(
    dispatchPending.pipe(
      Effect.catchCause((cause) =>
        Cause.hasInterruptsOnly(cause)
          ? Effect.interrupt
          : Effect.logError("Webhook dispatch failed"),
      ),
    ),
    Schedule.spaced("5 seconds"),
  ).pipe(Effect.forkScoped),
).pipe(Layer.provide(workflowLayer));

export class Webhooks extends Context.Service<Webhooks>()(
  "krakstack/webhooks/Webhooks",
  {
    make: Effect.gen(function* () {
      const sql = (yield* SqlClient.SqlClient).withoutTransforms();
      const pg = yield* PgClient.PgClient;
      const random = yield* SecureRandom.SecureRandom.pipe(
        Effect.provide(SecureRandom.layerWebCrypto),
      );
      const list = SqlSchema.findAll({
        Request: WebhookScope,
        Result: Webhook,
        execute: ({ organizationId }) =>
          sql`SELECT ${sql.literal(webhookColumns)} FROM webhooks WHERE organization_id = ${organizationId} ORDER BY created_at, id`,
      });
      const find = SqlSchema.findOneOption({
        Request: WebhookRequest,
        Result: Webhook,
        execute: ({ organizationId, id }) =>
          sql`SELECT ${sql.literal(webhookColumns)} FROM webhooks WHERE organization_id = ${organizationId} AND id = ${id}`,
      });
      const deliveries = SqlSchema.findAll({
        Request: WebhookRequest,
        Result: WebhookDelivery,
        execute: ({ organizationId, id }) =>
          sql`SELECT ${sql.literal(deliveryColumns)} FROM webhook_deliveries d JOIN webhooks w ON w.id = d.webhook_id WHERE w.organization_id = ${organizationId} AND w.id = ${id} ORDER BY d.created_at DESC LIMIT 100`,
      });
      const get = Effect.fn("Webhooks.get")(function* (
        input: typeof WebhookRequest.Type,
      ) {
        const found = yield* find(input);
        if (Option.isNone(found)) return undefined;
        return { ...found.value, deliveries: yield* deliveries(input) };
      });
      const status = sql`CASE WHEN d.status = 'pending' AND d.retries > 0 THEN 'failed' ELSE d.status END`;
      const listDeliveries = Effect.fn("Webhooks.listDeliveries")(function* (
        input: typeof ListWebhookDeliveries.Encoded,
      ) {
        const request = yield* Schema.decodeUnknownEffect(
          ListWebhookDeliveries,
        )(input);
        if (Option.isNone(yield* find(request))) return undefined;
        const columns = {
          id: sql`d.id`,
          event: sql`d.event`,
          status,
          createdAt: sql`d.created_at`,
          completedAt: sql`d.completed_at`,
        };
        const predicates = yield* Effect.forEach(
          request.filters ?? [],
          (filter) =>
            Effect.gen(function* () {
              const id = yield* Schema.decodeUnknownEffect(
                WebhookDeliverySortId,
              )(filter.id);
              const column = columns[id];
              if (filter.kind === "values")
                return sql`AND ${sql.or(filter.values.map((value) => sql`${column} = ${value}`))}`;
              if (filter.kind === "date")
                return sql`${filter.from ? sql`AND ${column} >= ${filter.from}::timestamp` : sql``}
            ${filter.to ? sql`AND ${column} < ${filter.to}::timestamp + interval '1 day'` : sql``}`;
              if (filter.kind === "text") {
                const value = filter.value.toLowerCase();
                if (filter.operator === "equals")
                  return sql`AND LOWER(${column}) = ${value}`;
                const escaped = value.replace(/[\\%_]/g, "\\$&");
                const pattern =
                  filter.operator === "startsWith"
                    ? `${escaped}%`
                    : filter.operator === "endsWith"
                      ? `%${escaped}`
                      : `%${escaped}%`;
                return sql`AND LOWER(${column}) LIKE ${pattern} ESCAPE ${"\\"}`;
              }
              return sql``;
            }),
        );
        const search = request.globalFilter
          ?.trim()
          .toLowerCase()
          .replace(/[\\%_]/g, "\\$&");
        const predicate = sql`w.id = ${request.id} AND w.organization_id = ${request.organizationId}
          ${sql.join(" ", false)(predicates)}
          ${search ? sql`AND LOWER(d.id || ' ' || d.event || ' ' || ${status} || ' ' || COALESCE(d.error, '') || ' ' || d.data::text) LIKE ${`%${search}%`} ESCAPE ${"\\"}` : sql``}`;
        const sorts = yield* Effect.forEach(request.sort ?? [], (part) =>
          Effect.gen(function* () {
            const id = yield* Schema.decodeUnknownEffect(WebhookDeliverySortId)(
              part.id,
            );
            return sql`${columns[id]} ${sql.literal(part.direction === "desc" ? "DESC" : "ASC")} NULLS LAST`;
          }),
        );
        const count = yield* SqlSchema.findOne({
          Request: Schema.Void,
          Result: Schema.Struct({ total: Schema.Int }).annotate({
            identifier: "WebhookDeliveryCount",
          }),
          execute: () =>
            sql`SELECT count(*)::int AS total FROM webhook_deliveries d JOIN webhooks w ON w.id = d.webhook_id WHERE ${predicate}`,
        })();
        const data = yield* SqlSchema.findAll({
          Request: Schema.Void,
          Result: WebhookDelivery,
          execute:
            () => sql`SELECT ${sql.literal(deliveryColumns)} FROM webhook_deliveries d JOIN webhooks w ON w.id = d.webhook_id
            WHERE ${predicate} ORDER BY ${sql.join(", ", false)(sorts.length ? [...sorts, sql`d.id DESC`] : [sql`d.created_at DESC`, sql`d.id DESC`])}
            LIMIT ${request.pageSize} OFFSET ${request.page * request.pageSize}`,
        })();
        return {
          data,
          meta: {
            page: request.page,
            pageSize: request.pageSize,
            total: count.total,
            pageCount: Math.ceil(count.total / request.pageSize),
          },
        };
      });
      const statistics = Effect.fn("Webhooks.statistics")(function* (
        input: typeof WebhookStatisticsRequest.Type,
      ) {
        const request = yield* Schema.decodeUnknownEffect(
          WebhookStatisticsRequest,
        )(input);
        if (Option.isNone(yield* find(request))) return undefined;
        const totals = yield* SqlSchema.findOne({
          Request: WebhookRequest,
          Result: WebhookDeliveryCounts,
          execute: ({
            organizationId,
            id,
          }) => sql`SELECT count(*)::float8 AS total,
            count(*) FILTER (WHERE d.status = 'success')::float8 AS success,
            count(*) FILTER (WHERE ${status} = 'failed')::float8 AS failed
            FROM webhook_deliveries d JOIN webhooks w ON w.id = d.webhook_id
            WHERE w.id = ${id} AND w.organization_id = ${organizationId}`,
        })(request);
        const windows = {
          hour: { start: "day", step: "1 hour" },
          day: { start: "month", step: "1 day" },
        };
        const window = windows[request.interval];
        const buckets = yield* SqlSchema.findAll({
          Request: WebhookStatisticsRequest,
          Result: WebhookDeliveryBucket,
          execute: ({ organizationId, id, interval }) => sql`WITH bounds AS (
            SELECT date_trunc(${window.start}, now() AT TIME ZONE 'UTC') AS start,
              date_trunc(${interval}, now() AT TIME ZONE 'UTC') AS finish, ${window.step}::interval AS step
          ), buckets AS (
            SELECT generate_series(start, finish, step) AS bucket, step FROM bounds
          ), scoped AS (
            SELECT d.id, d.event, ${status} AS status, d.created_at FROM webhook_deliveries d JOIN webhooks w ON w.id = d.webhook_id
            WHERE w.id = ${id} AND w.organization_id = ${organizationId}
              AND d.created_at >= (SELECT min(bucket) FROM buckets)
          ), counts AS (SELECT b.bucket, d.event, count(d.id)::float8 AS total,
            count(d.id) FILTER (WHERE d.status = 'success')::float8 AS success,
            count(d.id) FILTER (WHERE d.status = 'failed')::float8 AS failed
            FROM buckets b LEFT JOIN scoped d ON d.created_at >= b.bucket AND d.created_at < b.bucket + b.step
            GROUP BY b.bucket, d.event)
            SELECT bucket, sum(total)::float8 AS total, sum(success)::float8 AS success, sum(failed)::float8 AS failed,
              COALESCE(jsonb_agg(jsonb_build_object('event', event, 'total', total) ORDER BY event)
                FILTER (WHERE event IS NOT NULL), '[]'::jsonb) AS events
            FROM counts GROUP BY bucket ORDER BY bucket`,
        })(request);
        return { ...totals, buckets };
      });
      const create = Effect.fn("Webhooks.create")(function* (input: {
        organizationId: string;
        payload: WebhookPayload;
      }) {
        const { organizationId } =
          yield* Schema.decodeUnknownEffect(WebhookScope)(input);
        const payload = yield* Schema.decodeUnknownEffect(WebhookPayload)(
          input.payload,
        );
        const id = yield* random.uuidV7();
        const secret = Hex.encode(yield* random.randomBytes(32));
        yield* sql`INSERT INTO webhooks (id, organization_id, name, url, description, enabled, events, headers, secret)
        VALUES (${id}, ${organizationId}, ${payload.name ?? payload.url}, ${payload.url}, ${payload.description}, ${payload.enabled},
        ${payload.events === null ? null : pg.json(payload.events)}, ${payload.customHeaders === null ? null : pg.json(payload.customHeaders)}, ${secret})`;
        return { id };
      });
      const update = Effect.fn("Webhooks.update")(function* (
        input: typeof WebhookRequest.Type & { payload: WebhookPayload },
      ) {
        const { organizationId, id } =
          yield* Schema.decodeUnknownEffect(WebhookRequest)(input);
        const payload = yield* Schema.decodeUnknownEffect(WebhookPayload)(
          input.payload,
        );
        return yield* SqlSchema.findOneOption({
          Request: Schema.Void,
          Result: Webhook,
          execute:
            () => sql`UPDATE webhooks SET name = COALESCE(${payload.name ?? null}, name), url = ${payload.url}, description = ${payload.description}, enabled = ${payload.enabled},
          events = ${payload.events === null ? null : pg.json(payload.events)}, headers = ${payload.customHeaders === null ? null : pg.json(payload.customHeaders)}, updated_at = now()
          WHERE organization_id = ${organizationId} AND id = ${id} RETURNING ${sql.literal(webhookColumns)}`,
        })().pipe(Effect.map(Option.getOrNull));
      });
      const remove = Effect.fn("Webhooks.delete")(function* (
        input: typeof WebhookRequest.Type,
      ) {
        const { organizationId, id } =
          yield* Schema.decodeUnknownEffect(WebhookRequest)(input);
        const rows =
          yield* sql`DELETE FROM webhooks WHERE organization_id = ${organizationId} AND id = ${id} RETURNING id`;
        return rows.length ? { success: true } : null;
      });
      const publish = Effect.fn("Webhooks.publish")(function* (
        input: typeof PublishWebhook.Type,
      ) {
        const { organizationId, eventId, event, data } =
          yield* Schema.decodeUnknownEffect(PublishWebhook)(input);
        // Lock the publication row so concurrent replays cannot fan out twice.
        const inserted =
          yield* sql`INSERT INTO webhook_publications (organization_id, event_id, event, data)
        VALUES (${organizationId}, ${eventId}, ${event}, ${pg.json(data)}) ON CONFLICT DO NOTHING RETURNING event_id`;
        if (!inserted.length) {
          const match =
            yield* sql`SELECT event_id FROM webhook_publications WHERE organization_id = ${organizationId}
          AND event_id = ${eventId} AND event = ${event} AND data = ${pg.json(data)}::jsonb`;
          if (!match.length)
            return yield* new WebhookError({
              message: "Webhook event id was reused with different content",
            });
          return;
        }
        const endpoints = yield* list({ organizationId });
        for (const endpoint of endpoints) {
          if (
            !endpoint.enabled ||
            (endpoint.events !== null && !endpoint.events.includes(event))
          )
            continue;
          const id = yield* random.uuidV7();
          yield* sql`INSERT INTO webhook_deliveries (id, webhook_id, event_id, event, data, status, retry_at)
          VALUES (${id}, ${endpoint.id}, ${eventId}, ${event}, ${pg.json(data)}, 'pending', now())`;
        }
      }, sql.withTransaction);
      const cleanup = Effect.fn("Webhooks.cleanup")(function* () {
        // Retain publication tombstones: deleting them would permit an old event to fan out again.
        yield* sql`DELETE FROM webhook_deliveries WHERE completed_at <= now() - interval '7 days'`;
      });
      return {
        list,
        get,
        listDeliveries,
        statistics,
        create,
        update,
        delete: remove,
        publish,
        cleanup,
      };
    }),
  },
) {
  static readonly layerWithoutMigrations = Layer.effect(this, this.make).pipe(
    Layer.provide(dispatchLayer),
  );
  static readonly layer = this.layerWithoutMigrations.pipe(
    Layer.provide(webhookHttpClientLayer),
    Layer.provide(webhookMigrationsLayer),
  );
}
