import { describe, expect, it } from "@effect/vitest";
import { PgClient } from "@effect/sql-pg";
import {
  Config,
  Deferred,
  Effect,
  Layer,
  Option,
  Schedule,
  Schema,
} from "effect";
import { FetchHttpClient, HttpClient, HttpClientResponse } from "effect/http";
import { Dns, NetAddress } from "effect/net";
import { vi } from "vitest";
import { SqlClient } from "effect/sql";
import { TestClock } from "effect/testing";
import { Mac, SecureRandom } from "effect/crypto";
import { Hex } from "effect/encoding";
import { WorkflowEngine } from "effect/workflow";
import { DeliverWebhookV1, Webhooks } from "./index";
import { migrateWebhooks, webhookMigrationsLayer } from "./migrations";
import { WebhookDeliveriesQuery, WebhookPayload } from "./schema";
import { WebhookAllowLoopback } from "./url";

const database = PgClient.layerConfig({
  url: Config.Redacted("TEST_DATABASE_URL"),
});
const isolatedDatabase = Layer.unwrap(
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;
    const name = `webhooks_test_${crypto.randomUUID().replaceAll("-", "")}`;
    yield* Effect.acquireRelease(sql`CREATE SCHEMA ${sql(name)}`, () =>
      sql`DROP SCHEMA ${sql(name)} CASCADE`.pipe(Effect.orDie),
    );
    return PgClient.layerConfig({
      url: Config.Redacted("TEST_DATABASE_URL"),
      startupParameters: Config.succeed({ search_path: name, TimeZone: "UTC" }),
    });
  }),
).pipe(Layer.provide(database));

const fakeClient = HttpClient.make((request) =>
  Effect.succeed(
    HttpClientResponse.fromWeb(request, new Response(null, { status: 204 })),
  ),
);
const engine = WorkflowEngine.layerMemory;
const testWebhooksLayer = Webhooks.layerWithoutMigrations.pipe(
  Layer.provide(webhookMigrationsLayer),
);
const makeLayer = (client = fakeClient) =>
  testWebhooksLayer.pipe(
    Layer.provide(Layer.succeed(HttpClient.HttpClient, client)),
    Layer.provideMerge(engine),
    Layer.provideMerge(isolatedDatabase),
  );
const payload = {
  url: "https://example.com/webhook",
  description: null,
  enabled: true,
  events: ["invoice.paid"],
  customHeaders: { x_custom_header: "preserved" },
};
const awaitDelivery = Effect.fnUntraced(function* (input: {
  organizationId: string;
  id: string;
}) {
  const id = yield* DeliverWebhookV1.executionId(input);
  const result = yield* DeliverWebhookV1.poll(id).pipe(
    Effect.repeat({
      until: (result) =>
        Option.isSome(result) && result.value._tag === "Complete",
      schedule: Schedule.spaced("10 millis"),
      times: 500,
    }),
  );
  expect(Option.isSome(result) && result.value._tag).toBe("Complete");
});

describe("Webhook validation", () => {
  it("decodes HTTP pagination/filter queries and rejects unsupported columns", () => {
    const decode = Schema.decodeUnknownSync(
      Schema.toCodecStringTree(WebhookDeliveriesQuery),
    );
    expect(
      decode({
        page: "1",
        pageSize: "20",
        sort: "-createdAt",
        filters: JSON.stringify([
          { id: "status", kind: "values", values: ["failed"] },
        ]),
      }),
    ).toMatchObject({
      page: 1,
      pageSize: 20,
      sort: [{ id: "createdAt", direction: "desc" }],
      filters: [{ id: "status", kind: "values", values: ["failed"] }],
    });
    expect(() => decode({ sort: "unknown" })).toThrow();
    expect(() =>
      decode({
        filters: JSON.stringify([
          { id: "status", kind: "values", values: ["invalid"] },
        ]),
      }),
    ).toThrow();
  });
  it("trims names and rejects blank or oversized names", () => {
    const decode = Schema.decodeUnknownSync(WebhookPayload);
    expect(decode({ ...payload, name: "  Billing integration  " }).name).toBe(
      "Billing integration",
    );
    for (const name of ["", "   ", "x".repeat(201)]) {
      expect(() => decode({ ...payload, name })).toThrow();
    }
  });
  it("rejects private destinations and protocol header overrides", () => {
    const decode = Schema.decodeUnknownOption(WebhookPayload);
    for (const url of [
      "http://127.0.0.1",
      "http://[::1]",
      "http://169.254.169.254",
      "https://user:password@example.com",
      "file:///etc/passwd",
    ])
      expect(decode({ ...payload, url })._tag).toBe("None");
    expect(
      decode({ ...payload, customHeaders: { "Webhook-Signature": "override" } })
        ._tag,
    ).toBe("None");
  });
});

describe.skipIf(!process.env.TEST_DATABASE_URL)("Webhooks persistence", () => {
  it.effect(
    "creates and durably delivers loopback endpoints only with the composition-root override",
    () =>
      TestClock.withLive(
        Effect.gen(function* () {
          const requests: string[] = [];
          const client = HttpClient.make((request) =>
            Effect.sync(() => {
              requests.push(request.url);
              return HttpClientResponse.fromWeb(
                request,
                new Response(null, { status: 204 }),
              );
            }),
          );
          yield* Effect.gen(function* () {
            const service = yield* Webhooks;
            const organizationId = crypto.randomUUID();
            const url = "http://localhost:3000/api/webhooks/auth";
            const endpoint = yield* service.create({
              organizationId,
              payload: { ...payload, url },
            });
            yield* service.update({
              organizationId,
              id: endpoint.id,
              payload: { ...payload, url },
            });
            yield* service.publish({
              organizationId,
              eventId: crypto.randomUUID(),
              event: "invoice.paid",
              data: {},
            });
            const delivery = (yield* service.get({
              organizationId,
              id: endpoint.id,
            }))?.deliveries[0];
            if (!delivery)
              return yield* Effect.die("Expected loopback delivery");
            yield* awaitDelivery({ organizationId, id: delivery.id });
            expect(requests).toEqual([url]);
            expect(
              (yield* service.get({ organizationId, id: endpoint.id }))
                ?.deliveries[0]?.status,
            ).toBe("success");
          }).pipe(
            Effect.provide(
              makeLayer(client).pipe(
                Layer.provide(Layer.succeed(WebhookAllowLoopback, true)),
              ),
            ),
          );
        }),
      ),
    { timeout: 15_000 },
  );
  it.effect(
    "paginates all history and filters failed attempts before pagination with tenant isolation",
    () =>
      Effect.gen(function* () {
        const service = yield* Webhooks;
        const sql = yield* SqlClient.SqlClient;
        const organizationId = crypto.randomUUID();
        const endpoint = yield* service.create({
          organizationId,
          payload: { ...payload, enabled: false },
        });
        yield* sql`INSERT INTO webhook_deliveries (id, webhook_id, event, status, retries, retry_at, created_at)
        SELECT 'history-' || n, ${endpoint.id}, 'invoice.paid',
          CASE WHEN n <= 25 THEN 'failed' WHEN n = 26 THEN 'pending' ELSE 'success' END,
          CASE WHEN n = 26 THEN 1 ELSE 0 END, now() + interval '1 day', now() - n * interval '1 minute'
        FROM generate_series(1, 150) n`;
        yield* sql`INSERT INTO webhook_deliveries (id, webhook_id, event, status, created_at)
        VALUES ('old-error', ${endpoint.id}, 'invoice.cancelled', 'failed', now() - interval '40 days')`;
        const request = {
          organizationId,
          id: endpoint.id,
          page: 0,
          pageSize: 20,
        };
        const all = yield* service.listDeliveries(request);
        expect(all?.meta.total).toBe(151);
        expect(all?.data).toHaveLength(20);
        const failed = {
          ...request,
          filters: [
            {
              id: "status",
              kind: "values" as const,
              values: ["failed"] as const,
            },
          ],
        };
        const first = yield* service.listDeliveries(failed);
        const second = yield* service.listDeliveries({ ...failed, page: 1 });
        expect(first?.meta).toMatchObject({ total: 27, pageCount: 2 });
        expect(second?.data).toHaveLength(7);
        expect(second?.data.map(({ id }) => id)).toContain("old-error");
        expect(second?.data.map(({ id }) => id)).toContain("history-26");
        expect(
          new Set(
            [...(first?.data ?? []), ...(second?.data ?? [])].map(
              ({ id }) => id,
            ),
          ).size,
        ).toBe(27);
        const search = yield* service.listDeliveries({
          ...request,
          globalFilter: "old-error",
        });
        expect(search?.data.map(({ id }) => id)).toEqual(["old-error"]);
        const sorted = yield* service.listDeliveries({
          ...request,
          sort: [{ id: "createdAt", direction: "asc" }],
        });
        expect(sorted?.data[0]?.id).toBe("old-error");
        const date = yield* service.listDeliveries({
          ...request,
          filters: [
            {
              id: "createdAt",
              kind: "date",
              to: new Date(Date.now() - 35 * 86_400_000)
                .toISOString()
                .slice(0, 10),
            },
          ],
        });
        expect(date?.data.map(({ id }) => id)).toEqual(["old-error"]);
        expect(
          yield* service.listDeliveries({
            ...request,
            organizationId: "other-tenant",
          }),
        ).toBeUndefined();
      }).pipe(Effect.provide(makeLayer())),
  );
  it.effect(
    "counts all stored deliveries beyond the log limit and fills UTC chart buckets without crossing tenants",
    () =>
      Effect.gen(function* () {
        const service = yield* Webhooks;
        const sql = yield* SqlClient.SqlClient;
        const organizationId = crypto.randomUUID();
        const endpoint = yield* service.create({
          organizationId,
          payload: { ...payload, enabled: false },
        });
        const other = yield* service.create({
          organizationId: "other-tenant",
          payload: { ...payload, enabled: false },
        });
        const emptyStats = yield* service.statistics({
          organizationId,
          id: endpoint.id,
          interval: "hour",
        });
        expect(emptyStats).toMatchObject({ total: 0, success: 0, failed: 0 });
        expect(
          emptyStats?.buckets.every(
            ({ total, success, failed }) =>
              total === 0 && success === 0 && failed === 0,
          ),
        ).toBe(true);
        yield* sql`INSERT INTO webhook_deliveries (id, webhook_id, event, status, retry_at, created_at)
        SELECT 'stats-' || n, ${endpoint.id}, CASE WHEN n <= 80 THEN 'invoice.paid' ELSE 'invoice.cancelled' END,
          CASE WHEN n <= 90 THEN 'success' WHEN n <= 130 THEN 'failed' ELSE 'pending' END, now() + interval '1 day',
          date_trunc('hour', now() AT TIME ZONE 'UTC') - CASE WHEN n <= 140 THEN interval '0 hours' ELSE interval '40 days' END
        FROM generate_series(1, 150) n`;
        yield* sql`UPDATE webhook_deliveries SET retries = 1 WHERE webhook_id = ${endpoint.id} AND id IN ('stats-131', 'stats-132', 'stats-133', 'stats-134', 'stats-135')`;
        yield* sql`INSERT INTO webhook_deliveries (id, webhook_id, event, status) VALUES ('foreign-delivery', ${other.id}, 'invoice.paid', 'failed')`;
        expect(
          (yield* service.get({ organizationId, id: endpoint.id }))?.deliveries,
        ).toHaveLength(100);
        for (const interval of ["hour", "day"] as const) {
          const stats = yield* service.statistics({
            organizationId,
            id: endpoint.id,
            interval,
          });
          expect(stats).toMatchObject({ total: 150, success: 90, failed: 45 });
          const finish = stats?.buckets.at(-1);
          if (!finish)
            return yield* Effect.die("Expected a current-period bucket");
          expect(stats?.buckets).toHaveLength(
            interval === "hour"
              ? finish.bucket.getUTCHours() + 1
              : finish.bucket.getUTCDate(),
          );
          expect(
            stats?.buckets.reduce((sum, bucket) => sum + bucket.total, 0),
          ).toBe(140);
          expect(stats?.buckets.at(-1)).toMatchObject({
            total: 140,
            success: 90,
            failed: 45,
            events: [
              { event: "invoice.cancelled", total: 60 },
              { event: "invoice.paid", total: 80 },
            ],
          });
          if ((stats?.buckets.length ?? 0) > 1)
            expect(stats?.buckets[0]).toMatchObject({
              total: 0,
              success: 0,
              failed: 0,
            });
          expect(
            stats?.buckets.every(
              ({ bucket }) =>
                bucket.getUTCMinutes() === 0 &&
                (interval === "hour" || bucket.getUTCHours() === 0),
            ),
          ).toBe(true);
          expect(stats?.buckets[0]?.bucket.getUTCHours()).toBe(0);
          if (interval === "day")
            expect(stats?.buckets[0]?.bucket.getUTCDate()).toBe(1);
        }
        expect(
          yield* service.statistics({
            organizationId: "other-tenant",
            id: endpoint.id,
            interval: "day",
          }),
        ).toBeUndefined();
        const empty = yield* service.statistics({
          organizationId,
          id: "missing",
          interval: "day",
        });
        expect(empty).toBeUndefined();
      }).pipe(Effect.provide(makeLayer()), TestClock.withLive),
  );
  it.effect(
    "stores and renames webhooks while preserving names for older clients",
    () =>
      Effect.gen(function* () {
        const service = yield* Webhooks;
        const organizationId = crypto.randomUUID();
        const endpoint = yield* service.create({
          organizationId,
          payload: { ...payload, name: "  Billing  " },
        });
        expect(
          (yield* service.get({ organizationId, id: endpoint.id }))?.name,
        ).toBe("Billing");
        expect((yield* service.list({ organizationId }))[0]?.name).toBe(
          "Billing",
        );
        const renamed = yield* service.update({
          organizationId,
          id: endpoint.id,
          payload: { ...payload, name: "Finance" },
        });
        expect(renamed?.name).toBe("Finance");
        const updated = yield* service.update({
          organizationId,
          id: endpoint.id,
          payload: { ...payload, enabled: false },
        });
        expect(updated?.name).toBe("Finance");
        const legacy = yield* service.create({ organizationId, payload });
        expect(
          (yield* service.get({ organizationId, id: legacy.id }))?.name,
        ).toBe(payload.url);
      }).pipe(Effect.provide(makeLayer()), TestClock.withLive),
  );

  it.effect(
    "adopts existing unnamed endpoints without changing their IDs or secrets",
    () =>
      Effect.gen(function* () {
        const sql = yield* SqlClient.SqlClient;
        yield* sql`CREATE TABLE webhooks (
        id text PRIMARY KEY, organization_id text NOT NULL, url text NOT NULL,
        description text, headers jsonb, events jsonb, secret text NOT NULL,
        enabled boolean NOT NULL DEFAULT true,
        created_at timestamp NOT NULL DEFAULT now(), updated_at timestamp NOT NULL DEFAULT now()
      )`;
        yield* sql`INSERT INTO webhooks (id, organization_id, url, secret) VALUES ('legacy', 'organization', 'https://example.com/legacy', 'existing-secret')`;
        yield* migrateWebhooks;
        const service = yield* Webhooks.make;
        expect(
          yield* service.get({ organizationId: "organization", id: "legacy" }),
        ).toMatchObject({
          id: "legacy",
          name: "https://example.com/legacy",
          secret: "existing-secret",
          deliveries: [],
        });
      }).pipe(Effect.provide(isolatedDatabase)),
  );
  it.effect(
    "filters endpoints, isolates tenants, and deduplicates concurrent publication",
    () =>
      Effect.gen(function* () {
        const service = yield* Webhooks;
        const sql = yield* SqlClient.SqlClient;
        const organizationId = crypto.randomUUID();
        const endpoint = yield* service.create({ organizationId, payload });
        const disabled = yield* service.create({
          organizationId,
          payload: { ...payload, enabled: false },
        });
        const event = {
          organizationId,
          eventId: crypto.randomUUID(),
          event: "invoice.paid",
          data: { snake_key: { nested_key: "preserved" } },
        };
        yield* Effect.all([service.publish(event), service.publish(event)], {
          concurrency: 2,
        });
        const found = yield* service.get({ organizationId, id: endpoint.id });
        expect(found?.headers).toEqual(payload.customHeaders);
        expect(found?.createdAt).toBeInstanceOf(Date);
        expect(found?.deliveries).toHaveLength(1);
        expect(found?.deliveries[0]?.data).toEqual(event.data);
        expect(
          (yield* service.get({ organizationId, id: disabled.id }))?.deliveries,
        ).toHaveLength(0);
        yield* service.publish({
          ...event,
          eventId: crypto.randomUUID(),
          event: "invoice.cancelled",
        });
        expect(
          (yield* service.get({ organizationId, id: endpoint.id }))?.deliveries,
        ).toHaveLength(1);
        expect(
          yield* service.get({
            organizationId: "another-tenant",
            id: endpoint.id,
          }),
        ).toBeUndefined();
        expect(
          yield* service.update({
            organizationId: "another-tenant",
            id: endpoint.id,
            payload,
          }),
        ).toBeNull();
        expect(
          yield* service.delete({
            organizationId: "another-tenant",
            id: endpoint.id,
          }),
        ).toBeNull();
        expect(
          yield* service.publish({ ...event, data: {} }).pipe(Effect.flip),
        ).toMatchObject({ _tag: "WebhookError" });
        yield* service.delete({ organizationId, id: endpoint.id });
        expect(
          (yield* sql`SELECT id FROM webhook_deliveries WHERE webhook_id = ${endpoint.id}`)
            .length,
        ).toBe(0);
      }).pipe(Effect.provide(makeLayer()), TestClock.withLive),
  );

  it.effect("rolls back deliveries with the caller's transaction", () =>
    Effect.gen(function* () {
      const service = yield* Webhooks;
      const sql = yield* SqlClient.SqlClient;
      const organizationId = crypto.randomUUID();
      const endpoint = yield* service.create({ organizationId, payload });
      yield* sql
        .withTransaction(
          service
            .publish({
              organizationId,
              eventId: crypto.randomUUID(),
              event: "invoice.paid",
              data: {},
            })
            .pipe(Effect.andThen(Effect.fail("rollback"))),
        )
        .pipe(Effect.ignore);
      expect(
        (yield* service.get({ organizationId, id: endpoint.id }))?.deliveries,
      ).toHaveLength(0);
      expect(
        (yield* sql`SELECT event_id FROM webhook_publications`).length,
      ).toBe(0);
    }).pipe(Effect.provide(makeLayer()), TestClock.withLive),
  );

  it.effect(
    "registers and dispatches automatically, signs requests, and does not execute a delivery twice",
    () =>
      Effect.gen(function* () {
        const observed = yield* Deferred.make<void>();
        const requests: Array<
          Parameters<Parameters<typeof HttpClient.make>[0]>[0]
        > = [];
        const client = HttpClient.make((request) =>
          Effect.gen(function* () {
            requests.push(request);
            yield* Deferred.succeed(observed, undefined);
            return HttpClientResponse.fromWeb(
              request,
              new Response(null, { status: 204 }),
            );
          }),
        );
        yield* Effect.gen(function* () {
          const service = yield* Webhooks;
          const organizationId = crypto.randomUUID();
          const endpoint = yield* service.create({ organizationId, payload });
          yield* service.publish({
            organizationId,
            eventId: crypto.randomUUID(),
            event: "invoice.paid",
            data: { id: "invoice" },
          });
          const delivery = (yield* service.get({
            organizationId,
            id: endpoint.id,
          }))?.deliveries[0];
          if (!delivery) return yield* Effect.die("Expected delivery");
          yield* Deferred.await(observed);
          yield* awaitDelivery({ organizationId, id: delivery.id });
          yield* DeliverWebhookV1.execute({ organizationId, id: delivery.id });
          expect(requests).toHaveLength(1);
          const request = requests[0];
          expect(request?.headers["webhook-id"]).toBe(delivery.id);
          expect(request?.headers["webhook-signature"]).toMatch(
            /^[a-f0-9]{64}$/,
          );
          if (request?.body._tag !== "Uint8Array")
            return yield* Effect.die("Expected encoded body");
          const mac = yield* Mac.Mac.pipe(
            Effect.provide(
              Mac.layerWebCrypto.pipe(
                Layer.provide(SecureRandom.layerWebCrypto),
              ),
            ),
          );
          const key = yield* Mac.key(
            Mac.hmacSha256,
            new TextEncoder().encode((yield* service.list({ organizationId }))[0]!.secret),
          );
          const signature = yield* Effect.fromResult(
            Hex.decode(request.headers["webhook-signature"]!),
          );
          const body = new TextDecoder().decode(request.body.body);
          expect(
            yield* mac.verify(
              key,
              signature,
              new TextEncoder().encode(
                `${delivery.id}.${request.headers["webhook-timestamp"]}.${body}`,
              ),
            ),
          ).toBe(true);
          expect(
            yield* mac.verify(
              key,
              signature,
              new TextEncoder().encode(
                `tampered.${request.headers["webhook-timestamp"]}.${body}`,
              ),
            ),
          ).toBe(false);
          expect(new TextDecoder().decode(request.body.body)).toBe(
            '{"event":"invoice.paid","data":{"id":"invoice"}}',
          );
          expect(
            (yield* service.get({ organizationId, id: endpoint.id }))
              ?.deliveries[0]?.status,
          ).toBe("success");
        }).pipe(Effect.provide(makeLayer(client)));
      }).pipe(TestClock.withLive),
  );

  it.effect(
    "retries a failed request through the registered durable workflow",
    () =>
      Effect.gen(function* () {
        const sql = yield* SqlClient.SqlClient;
        yield* migrateWebhooks;
        const organizationId = crypto.randomUUID();
        const endpointId = crypto.randomUUID();
        const deliveryId = crypto.randomUUID();
        yield* sql`INSERT INTO webhooks (id, organization_id, url, enabled, secret) VALUES (${endpointId}, ${organizationId}, 'https://example.com/webhook', true, 'secret')`;
        yield* sql`INSERT INTO webhook_deliveries (id, webhook_id, event, status, retry_at) VALUES (${deliveryId}, ${endpointId}, 'invoice.paid', 'pending', now())`;
        let calls = 0;
        const ids: Array<string | undefined> = [];
        const client = HttpClient.make((request) =>
          Effect.sync(() => {
            calls++;
            ids.push(request.headers["webhook-id"]);
            return HttpClientResponse.fromWeb(
              request,
              new Response(null, { status: calls === 1 ? 500 : 204 }),
            );
          }),
        );
        yield* Effect.gen(function* () {
          const service = yield* Webhooks;
          yield* awaitDelivery({ organizationId, id: deliveryId });
          expect(calls).toBe(2);
          expect(ids).toEqual([deliveryId, deliveryId]);
          expect(
            (yield* service.get({ organizationId, id: endpointId }))
              ?.deliveries[0],
          ).toMatchObject({ status: "success", retries: 1, error: null });
        }).pipe(
          Effect.provide(testWebhooksLayer),
          Effect.provideService(HttpClient.HttpClient, client),
          Effect.provide(engine),
        );
      }).pipe(Effect.provide(isolatedDatabase), TestClock.withLive),
  );

  it.effect(
    "provides the protected HTTP client through Webhooks.layer without consumer client wiring",
    () =>
      Effect.gen(function* () {
        const sql = yield* SqlClient.SqlClient;
        yield* migrateWebhooks;
        const organizationId = crypto.randomUUID();
        const endpointId = crypto.randomUUID();
        const deliveryId = crypto.randomUUID();
        yield* sql`INSERT INTO webhooks (id, organization_id, url, enabled, secret) VALUES (${endpointId}, ${organizationId}, 'https://receiver.example/hook', true, 'secret')`;
        yield* sql`INSERT INTO webhook_deliveries (id, webhook_id, event, status, retry_at) VALUES (${deliveryId}, ${endpointId}, 'invoice.paid', 'pending', now())`;
        const fetch = vi
          .fn<typeof globalThis.fetch>()
          .mockResolvedValue(new Response(null, { status: 204 }));
        yield* Effect.gen(function* () {
          const service = yield* Webhooks;
          yield* awaitDelivery({ organizationId, id: deliveryId });
          expect(
            (yield* service.get({ organizationId, id: endpointId }))
              ?.deliveries[0]?.status,
          ).toBe("success");
          expect(fetch).toHaveBeenCalledOnce();
          expect(fetch).toHaveBeenCalledWith(
            expect.any(URL),
            expect.objectContaining({ redirect: "error" }),
          );
        }).pipe(
          Effect.provide(Webhooks.layer),
          Effect.provideService(FetchHttpClient.Fetch, fetch),
          Effect.provideService(
            Dns.Dns,
            Dns.make({
              lookup: () =>
                Effect.succeed([NetAddress.ipFromStringUnsafe("8.8.8.8")]),
            }),
          ),
          Effect.provide(engine),
        );
      }).pipe(Effect.provide(isolatedDatabase), TestClock.withLive),
  );

  it.effect(
    "recovers committed deliveries created before startup and exhausts the HTTP attempt budget",
    () =>
      Effect.gen(function* () {
        const sql = yield* SqlClient.SqlClient;
        yield* migrateWebhooks;
        const organizationId = crypto.randomUUID();
        const endpointId = crypto.randomUUID();
        const deliveryId = crypto.randomUUID();
        yield* sql`INSERT INTO webhooks (id, organization_id, url, enabled, secret) VALUES (${endpointId}, ${organizationId}, 'https://example.com/webhook', true, 'secret')`;
        yield* sql`INSERT INTO webhook_deliveries (id, webhook_id, event, status, retry_at, retries) VALUES (${deliveryId}, ${endpointId}, 'invoice.paid', 'pending', now(), 7)`;
        let calls = 0;
        const client = HttpClient.make((request) =>
          Effect.sync(() => {
            calls++;
            return HttpClientResponse.fromWeb(
              request,
              new Response(null, { status: 500 }),
            );
          }),
        );
        yield* Effect.gen(function* () {
          const service = yield* Webhooks;
          yield* awaitDelivery({ organizationId, id: deliveryId });
          expect(calls).toBe(1);
          expect(
            (yield* service.get({ organizationId, id: endpointId }))
              ?.deliveries[0],
          ).toMatchObject({ status: "failed", retries: 8, error: "HTTP 500" });
        }).pipe(
          Effect.provide(testWebhooksLayer),
          Effect.provideService(HttpClient.HttpClient, client),
          Effect.provide(engine),
        );
      }).pipe(Effect.provide(isolatedDatabase), TestClock.withLive),
  );
});
