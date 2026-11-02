import {
  Context,
  DateTime,
  Effect,
  Layer,
  Option,
  Redacted,
  Schema,
} from "effect";
import { Digest, Mac, SecureRandom } from "effect/crypto";
import { Hex } from "effect/encoding";
import { SqlClient, SqlSchema } from "effect/sql";
import { webhookReceiverMigrationsLayer } from "./migrations";

export class WebhookVerificationError extends Schema.TaggedError<
  WebhookVerificationError,
  { readonly brand: unique symbol }
>()("WebhookVerificationError", {
  reason: Schema.Literals(["headers", "timestamp", "signature", "payload"]),
}) {}

const ProtocolHeaders = Schema.Struct({
  "webhook-id": Schema.NonEmptyString,
  "webhook-timestamp": Schema.String,
  "webhook-signature": Schema.String.check(
    Schema.isPattern(/^[a-fA-F0-9]{64}$/),
  ),
}).annotate({ identifier: "WebhookProtocolHeaders" });

export class WebhookReceiptConflict extends Schema.TaggedError<
  WebhookReceiptConflict,
  { readonly brand: unique symbol }
>()("WebhookReceiptConflict", {}) {}

const ReceiptRequest = Schema.Struct({
  receiver: Schema.NonEmptyString,
  eventId: Schema.NonEmptyString,
  bodyHash: Schema.NonEmptyString,
}).annotate({ identifier: "WebhookReceiptRequest" });
const Receipt = Schema.Struct({ bodyHash: Schema.String }).annotate({
  identifier: "WebhookReceipt",
});

export class WebhooksReceiver extends Context.Service<WebhooksReceiver>()(
  "krakstack/webhooks/WebhooksReceiver",
  {
    make: Effect.gen(function* () {
      const sql = (yield* SqlClient.SqlClient).withoutTransforms();
      const mac = yield* Mac.Mac.pipe(
        Effect.provide(
          Mac.layerWebCrypto.pipe(Layer.provide(SecureRandom.layerWebCrypto)),
        ),
      );
      const digest = yield* Digest.Digest.pipe(
        Effect.provide(Digest.layerWebCrypto),
      );
      const receive = Effect.fn("WebhooksReceiver.receive")(function* <
        S extends Schema.Top,
        E,
        R,
      >(input: {
        readonly receiver: string;
        readonly secret: Redacted.Redacted<string>;
        readonly headers: Readonly<Record<string, string | undefined>>;
        readonly body: string;
        readonly schema: S;
        readonly handle: (payload: S["Type"]) => Effect.Effect<void, E, R>;
      }) {
        const headers = yield* Schema.decodeUnknownEffect(ProtocolHeaders)(
          input.headers,
        ).pipe(
          Effect.mapError(
            () => new WebhookVerificationError({ reason: "headers" }),
          ),
        );
        const timestamp = headers["webhook-timestamp"];
        const date = DateTime.make(timestamp);
        const now = yield* DateTime.now;
        if (
          Option.isNone(date) ||
          Math.abs(
            DateTime.toEpochMillis(now) - DateTime.toEpochMillis(date.value),
          ) > 300_000
        ) {
          return yield* new WebhookVerificationError({ reason: "timestamp" });
        }
        const signature = yield* Effect.fromResult(
          Hex.decode(headers["webhook-signature"]),
        ).pipe(
          Effect.mapError(
            () => new WebhookVerificationError({ reason: "signature" }),
          ),
        );
        const key = yield* Mac.key(
          Mac.hmacSha256,
          new TextEncoder().encode(Redacted.value(input.secret)),
        );
        const valid = yield* mac.verify(
          key,
          signature,
          new TextEncoder().encode(
            `${headers["webhook-id"]}.${timestamp}.${input.body}`,
          ),
        );
        if (!valid)
          return yield* new WebhookVerificationError({ reason: "signature" });
        const payload = yield* Schema.decodeEffect(
          Schema.fromJsonString(input.schema),
        )(input.body).pipe(
          Effect.mapError(
            () => new WebhookVerificationError({ reason: "payload" }),
          ),
        );
        const request = yield* Schema.decodeEffect(ReceiptRequest)({
          receiver: input.receiver,
          eventId: headers["webhook-id"],
          bodyHash: yield* digest.digestHex(
            Digest.sha256,
            new TextEncoder().encode(input.body),
          ),
        });
        return yield* sql.withTransaction(
          Effect.gen(function* () {
            // A unique insert serializes concurrent deliveries. Failure rolls back the
            // receipt along with the handler's database changes, allowing a retry.
            const inserted =
              yield* sql`INSERT INTO webhook_receipts (receiver, event_id, body_hash)
        VALUES (${request.receiver}, ${request.eventId}, ${request.bodyHash})
        ON CONFLICT DO NOTHING RETURNING event_id`;
            if (!inserted.length) {
              const receipt = yield* SqlSchema.findOne({
                Request: ReceiptRequest,
                Result: Receipt,
                execute: ({
                  receiver,
                  eventId,
                }) => sql`SELECT body_hash AS "bodyHash" FROM webhook_receipts
            WHERE receiver = ${receiver} AND event_id = ${eventId}`,
              })(request);
              if (receipt.bodyHash !== request.bodyHash)
                return yield* new WebhookReceiptConflict({});
              return { duplicate: true };
            }
            yield* input.handle(payload);
            return { duplicate: false };
          }),
        );
      });
      return {
        receive,
        cleanup: () =>
          sql`DELETE FROM webhook_receipts WHERE completed_at <= now() - interval '30 days'`.pipe(
            Effect.asVoid,
          ),
      };
    }),
  },
) {
  static readonly layer = Layer.effect(this, this.make).pipe(
    Layer.provide(webhookReceiverMigrationsLayer),
  );
}
