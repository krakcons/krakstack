import { describe, expect, it } from "@effect/vitest";
import { Config, DateTime, Effect, Layer, Redacted, Schema } from "effect";
import { PgClient } from "@effect/sql-pg";
import { SqlClient } from "effect/sql";
import { Mac, SecureRandom } from "effect/crypto";
import { Hex } from "effect/encoding";
import { WebhooksReceiver } from "./receiver";

const secret = Redacted.make("test-webhook-secret");
const body = '{"event":"example.created","data":{"id":"example"}}';
const signed = (text = body, offset = 0) =>
  Effect.gen(function* () {
    const now = yield* DateTime.now;
    const timestamp = new Date(
      DateTime.toEpochMillis(now) + offset,
    ).toISOString();
    const mac = yield* Mac.Mac;
    const key = yield* Mac.key(
      Mac.hmacSha256,
      new TextEncoder().encode(Redacted.value(secret)),
    );
    const signature = Hex.encode(
      yield* mac.sign(key, new TextEncoder().encode(`${timestamp}.${text}`)),
    );
    return { "webhook-timestamp": timestamp, "webhook-signature": signature };
  }).pipe(
    Effect.provide(
      Mac.layerWebCrypto.pipe(Layer.provide(SecureRandom.layerWebCrypto)),
    ),
  );

const database = PgClient.layerConfig({
  url: Config.Redacted("TEST_DATABASE_URL"),
});
const isolatedDatabase = Layer.unwrap(
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;
    const name = `receiver_test_${crypto.randomUUID().replaceAll("-", "")}`;
    yield* Effect.acquireRelease(sql`CREATE SCHEMA ${sql(name)}`, () =>
      sql`DROP SCHEMA ${sql(name)} CASCADE`.pipe(Effect.orDie),
    );
    return PgClient.layerConfig({
      url: Config.Redacted("TEST_DATABASE_URL"),
      startupParameters: Config.succeed({ search_path: name }),
    });
  }),
).pipe(Layer.provide(database));
const receiverLayer = WebhooksReceiver.layer.pipe(
  Layer.provideMerge(isolatedDatabase),
);

describe.skipIf(!process.env.TEST_DATABASE_URL)(
  "Webhook receipt transactions",
  () => {
    it.effect(
      "rejects forged, stale, future, and invalid payloads before invoking cleanup",
      () =>
        Effect.gen(function* () {
          const receiver = yield* WebhooksReceiver;
          const sql = yield* SqlClient.SqlClient;
          const headers = yield* signed();
          let calls = 0;
          const input = {
            receiver: "test-endpoint",
            secret,
            body,
            headers,
            schema: Schema.Struct({
              event: Schema.Literal("example.created"),
              data: Schema.Struct({ id: Schema.String }),
            }),
            eventId: () => "test-event",
            handle: () =>
              Effect.sync(() => {
                calls++;
              }),
          };
          for (const invalid of [
            {},
            { ...headers, "webhook-signature": "not-hex" },
            { ...headers, "webhook-timestamp": "invalid" },
            yield* signed(body, -301_000),
            yield* signed(body, 301_000),
          ]) {
            const error = yield* receiver
              .receive({ ...input, headers: invalid })
              .pipe(Effect.flip);
            expect(error._tag).toBe("WebhookVerificationError");
          }
          yield* receiver
            .receive({ ...input, body: `${body} ` })
            .pipe(Effect.flip);
          const invalidBody = '{"event":"unsupported","data":{}}';
          yield* receiver
            .receive({
              ...input,
              body: invalidBody,
              headers: yield* signed(invalidBody),
            })
            .pipe(Effect.flip);
          expect(calls).toBe(0);
          expect(yield* sql`SELECT * FROM webhook_receipts`).toHaveLength(0);
          yield* receiver.receive(input);
          expect(calls).toBe(1);
        }).pipe(Effect.provide(receiverLayer)),
    );
    it.effect(
      "migrates only receipts and deduplicates concurrent retries by signed event ID",
      () =>
        Effect.gen(function* () {
          const sql = yield* SqlClient.SqlClient;
          const receiver = yield* WebhooksReceiver;
          const tables =
            yield* sql`SELECT tablename FROM pg_tables WHERE schemaname = current_schema()`;
          expect(tables.map((row) => row.tablename).sort()).toEqual([
            "krakstack_webhook_receiver_migrations",
            "webhook_receipts",
          ]);
          yield* sql`CREATE TABLE processed (id text PRIMARY KEY)`;
          const headers = yield* signed();
          const input = {
            receiver: "test-endpoint",
            secret,
            body,
            headers,
            schema: Schema.Struct({
              event: Schema.String,
              data: Schema.Struct({ id: Schema.String }),
            }),
            eventId: ({ data }: { data: { id: string } }) => data.id,
            handle: ({ data }: { data: { id: string } }) =>
              sql`INSERT INTO processed VALUES (${data.id})`.pipe(
                Effect.asVoid,
              ),
          };
          const results = yield* Effect.all(
            [receiver.receive(input), receiver.receive(input)],
            { concurrency: 2 },
          );
          expect(results.filter((result) => result.duplicate)).toHaveLength(1);
          expect(yield* sql`SELECT * FROM processed`).toHaveLength(1);
          const changed = body.replace("example.created", "example.updated");
          const error = yield* receiver
            .receive({
              ...input,
              body: changed,
              headers: yield* signed(changed),
            })
            .pipe(Effect.flip);
          expect(error._tag).toBe("WebhookReceiptConflict");
        }).pipe(Effect.provide(receiverLayer)),
    );

    it.effect(
      "rolls back cleanup and receipt on failure, then permits retry",
      () =>
        Effect.gen(function* () {
          const sql = yield* SqlClient.SqlClient;
          const receiver = yield* WebhooksReceiver;
          yield* sql`CREATE TABLE private_data (id text PRIMARY KEY)`;
          yield* sql`INSERT INTO private_data VALUES ('user')`;
          const input = {
            receiver: "test-endpoint",
            secret,
            body,
            headers: yield* signed(),
            schema: Schema.Json,
            eventId: () => "deletion-1",
          };
          yield* receiver
            .receive({
              ...input,
              handle: () =>
                Effect.gen(function* () {
                  yield* sql`DELETE FROM private_data`;
                  return yield* Effect.fail("cleanup failed");
                }),
            })
            .pipe(Effect.flip);
          expect(yield* sql`SELECT * FROM private_data`).toHaveLength(1);
          expect(yield* sql`SELECT * FROM webhook_receipts`).toHaveLength(0);
          yield* receiver.receive({
            ...input,
            handle: () => sql`DELETE FROM private_data`.pipe(Effect.asVoid),
          });
          expect(yield* sql`SELECT * FROM private_data`).toHaveLength(0);
        }).pipe(Effect.provide(receiverLayer)),
    );
  },
);
