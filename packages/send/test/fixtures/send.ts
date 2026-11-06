import { PgClient } from "@effect/sql-pg";
import { NodeServices } from "@effect/platform-node";
import { Effect, Layer, Redacted } from "effect";
import { SqlClient } from "effect/sql";
import { NotificationService } from "@krak-stack/notifications";
import {
  NotificationRuntime,
  ReminderHandlerRegistry,
} from "@krak-stack/notifications/runtime";
import { makeFakeTransport } from "@krak-stack/notifications/testing";
import { KrakSend } from "../../src/index.js";
import { sendRuntimeLayer } from "../../src/policy.js";
import { SendUnsubscribe } from "../../src/unsubscribe.js";
import { SendFeedback } from "../../src/feedback.js";
import { SendCampaigns } from "../../src/campaign.js";
import { makeCampaignSafetyLayer } from "../../src/campaign.safety.js";

export const unsubscribeOptions = {
  secret: Redacted.make(
    "test-contact-unsubscribe-secret-at-least-32-characters",
  ),
  audience: "send-test-installation",
  endpoint: "https://app.example.com/send/unsubscribe",
  tokenTtlMillis: 60_000,
};

export const withSend = <A, E>(
  run: (fixture: {
    send: KrakSend["Service"];
    notifications: NotificationService["Service"];
    runtime: NotificationRuntime["Service"];
    unsubscribe: SendUnsubscribe["Service"];
    feedback: SendFeedback["Service"];
    campaigns: SendCampaigns["Service"];
    setSenderVerified: (verified: boolean) => void;
    transport: ReturnType<typeof makeFakeTransport>;
    sql: SqlClient.SqlClient;
  }) => Effect.Effect<A, E>,
) =>
  Effect.gen(function* () {
    const url = process.env.TEST_DATABASE_URL;
    if (!url)
      return yield* Effect.die(new Error("TEST_DATABASE_URL is required"));
    const schema = `send_${crypto.randomUUID().replaceAll("-", "")}`;
    const admin = PgClient.layer({ url: Redacted.make(url) });
    const scopedUrl = new URL(url);
    scopedUrl.searchParams.set("options", `-csearch_path=${schema}`);
    const postgres = PgClient.layer({
      url: Redacted.make(scopedUrl.toString()),
    });
    const transport = makeFakeTransport({ channel: "email" });
    const domain = KrakSend.layer.pipe(
      Layer.provideMerge(NotificationService.layer),
    );
    let senderVerified = true;
    const safety = makeCampaignSafetyLayer(
      {
        environment: "test",
        sendingEnabled: true,
        allowedRecipients: [
          "person@example.com",
          "one@example.com",
          "two@example.com",
          "other@example.com",
          "browser-en@example.com",
          "browser-fr@example.com",
        ],
      },
      () => Effect.succeed(senderVerified),
    );
    const products = SendCampaigns.layer.pipe(
      Layer.provideMerge(
        SendUnsubscribe.makeLayer(unsubscribeOptions).pipe(
          Layer.provideMerge(domain),
        ),
      ),
    );
    const layer = Layer.mergeAll(sendRuntimeLayer, SendFeedback.layer).pipe(
      Layer.provideMerge(products),
      Layer.provide(safety),
      Layer.provide(transport.layer),
      Layer.provide(ReminderHandlerRegistry.emptyLayer),
      Layer.provideMerge(postgres),
      Layer.provide(NodeServices.layer),
    );
    const create = SqlClient.SqlClient.use(
      (sql) => sql`CREATE SCHEMA ${sql(schema)}`,
    ).pipe(Effect.provide(admin));
    const drop = SqlClient.SqlClient.use(
      (sql) => sql`DROP SCHEMA ${sql(schema)} CASCADE`,
    ).pipe(Effect.provide(admin), Effect.orDie);
    return yield* Effect.acquireUseRelease(
      create,
      () =>
        Effect.gen(function* () {
          return yield* run({
            send: yield* KrakSend,
            notifications: yield* NotificationService,
            runtime: yield* NotificationRuntime,
            unsubscribe: yield* SendUnsubscribe,
            feedback: yield* SendFeedback,
            campaigns: yield* SendCampaigns,
            setSenderVerified: (verified) => {
              senderVerified = verified;
            },
            transport,
            sql: yield* SqlClient.SqlClient,
          });
        }).pipe(Effect.provide(layer)),
      () => drop,
    );
  });
