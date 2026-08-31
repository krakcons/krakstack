import { PgClient } from "@effect/sql-pg";
import { describe, expect, it } from "@effect/vitest";
import { DateTime, Effect, Layer, Redacted } from "effect";
import * as TestClock from "effect/testing/TestClock";
import { SqlClient } from "effect/unstable/sql";

import { NotificationService } from "../src/index.js";
import { runNotificationMigrations } from "../src/migrations.js";
import { NotificationRuntime } from "../src/runtime.js";
import type {
  NotificationDeliveryPurpose,
  NotificationDeliveryStatus,
  NotificationReminderStatus,
  PublishInput,
  RecipientNotificationScope,
} from "../src/schema.js";
import { makeFakeReminderHandler, makeFakeTransport } from "../src/testing.js";
import { NotificationTransportUnavailable } from "../src/transport.js";

let unavailableFailures = 0;
let providerCompletedAt: Date | null = null;
let handlerCompletedAt: Date | null = null;
const readProviderCompletedAt = (): Date | null => providerCompletedAt;
const readHandlerCompletedAt = (): Date | null => handlerCompletedAt;

const fakeTransport = makeFakeTransport({
  channel: "email",
  send: (input) =>
    Effect.gen(function* () {
      if (
        input.eventKey === "integration.unavailable" &&
        unavailableFailures++ === 0
      ) {
        return yield* new NotificationTransportUnavailable({
          channel: "email",
          message: "Provider unavailable for integration test",
        });
      }
      if (input.eventKey === "integration.completion-time") {
        yield* TestClock.adjust(25);
        providerCompletedAt = yield* DateTime.nowAsDate;
      }
      return { provider: "fake", providerMessageId: input.dispatchId };
    }),
});

const fakeReminderHandler = makeFakeReminderHandler({
  key: "integration.reminder",
  version: 1,
  handle: () =>
    Effect.gen(function* () {
      yield* TestClock.adjust(25);
      handlerCompletedAt = yield* DateTime.nowAsDate;
    }),
});

const postgresLayerFor = (url: string) =>
  PgClient.layer({ url: Redacted.make(url) });

const databaseUrlForSchema = (url: string, schemaName: string) => {
  const scopedUrl = new URL(url);
  scopedUrl.searchParams.set("options", `-csearch_path=${schemaName}`);
  return scopedUrl.toString();
};

const createTestSchema = (url: string, schemaName: string) =>
  Effect.gen(function* () {
    const sql = (yield* SqlClient.SqlClient).withoutTransforms();
    yield* sql`CREATE SCHEMA ${sql(schemaName)}`;
  }).pipe(Effect.provide(postgresLayerFor(url)));

const dropTestSchema = (url: string, schemaName: string) =>
  Effect.gen(function* () {
    const sql = (yield* SqlClient.SqlClient).withoutTransforms();
    yield* sql`DROP SCHEMA IF EXISTS ${sql(schemaName)} CASCADE`;
  }).pipe(Effect.provide(postgresLayerFor(url)));

const notificationLayerFor = (url: string) => {
  const postgresLayer = postgresLayerFor(url);
  const notificationServicesLayer = NotificationService.layer.pipe(
    Layer.provide(postgresLayer),
  );
  const notificationRuntimeLayer = NotificationRuntime.makeLayer({
    dueBatchSize: 100,
    queueMaxAttempts: 3,
    retryPolicy: { baseDelayMillis: 1, maxDelayMillis: 10 },
  }).pipe(
    Layer.provide(fakeTransport.layer),
    Layer.provide(fakeReminderHandler.layer),
    Layer.provide(postgresLayer),
  );

  return Layer.mergeAll(
    notificationServicesLayer,
    notificationRuntimeLayer,
    postgresLayer,
  );
};

const hasTestDatabase = process.env.TEST_DATABASE_URL !== undefined;

describe.skipIf(!hasTestDatabase)("notification PostgreSQL integration", () => {
  it.effect(
    "migrates and atomically persists ledger attempts with queue offers",
    () => {
      const testDatabaseUrl = process.env.TEST_DATABASE_URL;
      if (testDatabaseUrl === undefined) {
        return Effect.die(new Error("TEST_DATABASE_URL is required"));
      }

      const testId = globalThis.crypto.randomUUID();
      const schemaName = `notification_main_${testId.replaceAll("-", "")}`;
      const notificationLayer = notificationLayerFor(
        databaseUrlForSchema(testDatabaseUrl, schemaName),
      );
      const prefix = `notification-package-test:${testId}`;
      const scope: RecipientNotificationScope = {
        recipientUserId: `user-${testId}`,
        organizationId: `organization-${testId}`,
        workspaceId: `workspace-${testId}`,
      };

      const makePublishInput = (input: {
        readonly key: string;
        readonly purpose: NotificationDeliveryPurpose;
        readonly scheduledFor?: Date;
        readonly address?: string;
        readonly channel?: string;
        readonly eventKey?: string;
        readonly maxAttempts?: number;
      }): PublishInput => ({
        idempotencyKey: `${prefix}:${input.key}`,
        scope,
        eventKey: input.eventKey ?? "integration.test",
        eventVersion: 1,
        inbox: {
          locale: "en",
          title: `Rendered ${input.key}`,
          description: null,
          href: null,
          metadata: { testId },
        },
        deliveries: [
          {
            key: "primary",
            channel: input.channel ?? "email",
            purpose: input.purpose,
            template: null,
            recipientAddress:
              input.address ?? `${testId}@notifications.invalid`,
            recipientName: null,
            payloadVersion: 1,
            payload: {
              subject: `Rendered ${input.key}`,
              text: "Rendered body",
            },
            scheduledFor: input.scheduledFor,
            maxAttempts: input.maxAttempts,
            references: [
              { namespace: "application", value: `application-${testId}` },
              { namespace: "opportunity", value: `opportunity-${testId}` },
              { namespace: "organization", value: `organization-${testId}` },
            ],
          },
        ],
      });

      const cleanup = Effect.gen(function* () {
        const sql = (yield* SqlClient.SqlClient).withoutTransforms();
        yield* sql`DROP TABLE IF EXISTS email_preferences`;
        yield* sql`DROP TABLE IF EXISTS notification_delivery_correlations`;
        yield* sql`
          DELETE FROM krakstack_notification_jobs
          WHERE (
            element::jsonb ->> 'deliveryId' IN (
              SELECT ref.delivery_id::text
              FROM notification_delivery_references ref
              WHERE ref.namespace = 'krakstack.publication'
                AND ref.value LIKE ${`${prefix}%`}
            )
          ) OR (
            element::jsonb ->> 'reminderId' IN (
              SELECT id::text
              FROM notification_reminders
              WHERE idempotency_key LIKE ${`${prefix}%`}
            )
          )
        `;
        yield* sql`
          DELETE FROM notification_publications
          WHERE idempotency_key LIKE ${`${prefix}%`}
        `;
        yield* sql`
          DELETE FROM notification_deliveries d
          WHERE EXISTS (
            SELECT 1
            FROM notification_delivery_references ref
            WHERE ref.delivery_id = d.id
              AND ref.namespace = 'krakstack.publication'
              AND ref.value LIKE ${`${prefix}%`}
          )
            OR d.idempotency_key LIKE ${`${prefix}%`}
        `;
        yield* sql`
          DELETE FROM notifications
          WHERE idempotency_key LIKE ${`${prefix}%`}
        `;
        yield* sql`
          DELETE FROM notification_reminders
          WHERE idempotency_key LIKE ${`${prefix}%`}
        `;
        yield* sql`
          DELETE FROM notification_settings
          WHERE recipient_user_id = ${scope.recipientUserId}
        `;
        yield* sql`
          DELETE FROM notification_suppressions
          WHERE recipient_user_id = ${scope.recipientUserId}
            OR recipient_address LIKE ${`${testId}%`}
        `;
      });

      const program = Effect.gen(function* () {
        const sql = (yield* SqlClient.SqlClient).withoutTransforms();
        const service = yield* NotificationService;
        const runtime = yield* NotificationRuntime;
        const processUntilDeliveryStatus = Effect.fn(
          "notificationIntegration.processUntilDeliveryStatus",
        )(function* (deliveryId: string, status: NotificationDeliveryStatus) {
          for (let iteration = 0; iteration < 100; iteration += 1) {
            const detail = yield* service.getDelivery({ scope, deliveryId });
            if (detail.delivery.status === status) return detail;
            yield* runtime.runDeliveryWorkerOnce;
          }
          return yield* Effect.fail(
            new Error(`Delivery ${deliveryId} did not reach ${status}`),
          );
        });

        yield* service.setPreference({
          scope,
          eventKey: null,
          channel: "email",
          enabled: false,
        });

        const preferenceSuppressed = yield* service.publish(
          makePublishInput({ key: "preference", purpose: "notification" }),
        );
        const processUntilReminderStatus = Effect.fn(
          "notificationIntegration.processUntilReminderStatus",
        )(function* (reminderId: string, status: NotificationReminderStatus) {
          for (let iteration = 0; iteration < 100; iteration += 1) {
            const reminder = yield* service.getReminder({ scope, reminderId });
            if (reminder.status === status) return reminder;
            yield* runtime.runReminderWorkerOnce;
          }
          return yield* Effect.fail(
            new Error(`Reminder ${reminderId} did not reach ${status}`),
          );
        });
        const preferenceDetail = yield* service.getDelivery({
          scope,
          deliveryId: preferenceSuppressed.deliveryIds[0],
        });
        expect(preferenceDetail.delivery.status).toBe("suppressed");
        expect(preferenceDetail.attempts).toHaveLength(0);
        yield* service.resetPreference({
          scope,
          eventKey: null,
          channel: "email",
        });

        const transactionalInput = makePublishInput({
          key: "transactional",
          purpose: "transactional",
        });
        const transactional = yield* service.publish(transactionalInput);
        const transactionalDetail = yield* service.getDelivery({
          scope,
          deliveryId: transactional.deliveryIds[0],
        });
        expect(transactionalDetail.delivery.status).toBe("queued");
        expect(transactionalDetail.delivery.attempts).toBe(1);
        expect(transactionalDetail.attempts).toHaveLength(1);
        expect(transactionalDetail.attempts[0]?.outcome).toBeNull();
        expect(
          transactionalDetail.references.map(({ namespace, value }) => ({
            namespace,
            value,
          })),
        ).toEqual(
          expect.arrayContaining([
            { namespace: "application", value: `application-${testId}` },
            { namespace: "opportunity", value: `opportunity-${testId}` },
            { namespace: "organization", value: `organization-${testId}` },
            {
              namespace: "krakstack.publication",
              value: `${prefix}:transactional`,
            },
          ]),
        );

        const jobId = transactionalDetail.delivery.currentJobId;
        if (jobId === null) {
          return yield* Effect.die(
            new Error("Immediate delivery did not persist a queue job id"),
          );
        }
        const queueRows = yield* sql`
          SELECT id
          FROM krakstack_notification_jobs
          WHERE id = ${jobId}
            AND queue_name = 'krakstack.notifications.delivery'
        `;
        expect(queueRows).toHaveLength(1);

        const replay = yield* service.publish(transactionalInput);
        expect(replay.idempotentReplay).toBe(true);
        expect(replay.notificationId).toBe(transactional.notificationId);
        expect(replay.deliveryIds).toEqual(transactional.deliveryIds);

        const futureInput = makePublishInput({
          key: "future",
          purpose: "transactional",
          address: `  ${testId}-Legacy@Notifications.Invalid  `,
          scheduledFor: new Date(Date.now() + 3_600_000),
        });
        const future = yield* service.publish(futureInput);
        const futureDetail = yield* service.getDelivery({
          scope,
          deliveryId: future.deliveryIds[0],
        });
        expect(futureDetail.delivery.status).toBe("queued");
        expect(futureDetail.delivery.currentJobId).toBeNull();
        expect(futureDetail.attempts).toHaveLength(0);
        yield* sql`
          DELETE FROM notification_publications
          WHERE idempotency_key = ${futureInput.idempotencyKey}
        `;
        yield* sql`
          DELETE FROM notification_delivery_references
          WHERE delivery_id = ${future.deliveryIds[0]}
            AND namespace = 'krakstack.publication'
        `;
        yield* sql`
          UPDATE notification_deliveries
          SET
            idempotency_key = ${`${futureInput.idempotencyKey}:delivery:email:${futureInput.eventKey}:${futureInput.deliveries[0]?.recipientAddress.trim().toLowerCase()}:0`},
            recipient_address = ${futureInput.deliveries[0]?.recipientAddress.trim().toLowerCase()},
            payload = ${{
              subject: "Rendered future",
              text: "Rendered body",
              to: futureInput.deliveries[0]?.recipientAddress
                .trim()
                .toLowerCase(),
            }}
          WHERE id = ${future.deliveryIds[0]}
        `;
        const legacyReplay = yield* service.publish(futureInput);
        expect(legacyReplay).toMatchObject({
          deliveryIds: future.deliveryIds,
          idempotentReplay: true,
          notificationId: future.notificationId,
        });

        const collisionScheduledFor = new Date(Date.now() + 3_600_000);
        const collisionBaseKey = `${prefix}:legacy-prefix`;
        const nestedCollisionInput: PublishInput = {
          idempotencyKey: `${collisionBaseKey}:nested`,
          scope,
          eventKey: "integration.legacy-prefix",
          eventVersion: 1,
          deliveries: [
            {
              key: "primary",
              channel: "email",
              purpose: "transactional",
              template: null,
              recipientAddress: `${testId}-prefix@notifications.invalid`,
              recipientName: null,
              payloadVersion: 1,
              payload: { subject: "Prefix", text: "Body" },
              scheduledFor: collisionScheduledFor,
            },
          ],
        };
        const nestedCollision = yield* service.publish(nestedCollisionInput);
        yield* sql`
          DELETE FROM notification_publications
          WHERE idempotency_key = ${nestedCollisionInput.idempotencyKey}
        `;
        yield* sql`
          DELETE FROM notification_delivery_references
          WHERE delivery_id = ${nestedCollision.deliveryIds[0]}
            AND namespace = 'krakstack.publication'
        `;
        yield* sql`
          UPDATE notification_deliveries
          SET idempotency_key = ${`${nestedCollisionInput.idempotencyKey}:delivery:email:${nestedCollisionInput.eventKey}:${nestedCollisionInput.deliveries[0]?.recipientAddress}:0`}
          WHERE id = ${nestedCollision.deliveryIds[0]}
        `;
        const prefixCollision = yield* service.publish({
          ...nestedCollisionInput,
          idempotencyKey: collisionBaseKey,
        });
        expect(prefixCollision.idempotentReplay).toBe(false);
        expect(prefixCollision.deliveryIds[0]).not.toBe(
          nestedCollision.deliveryIds[0],
        );

        const externalScope = {
          recipientUserId: null,
          organizationId: scope.organizationId,
          workspaceId: scope.workspaceId,
        };
        const deliveryOnlyInput: PublishInput = {
          idempotencyKey: `${prefix}:delivery-only`,
          scope: externalScope,
          eventKey: "integration.external",
          eventVersion: 1,
          deliveries: [
            {
              key: "primary",
              channel: "email",
              purpose: "transactional",
              template: null,
              recipientAddress: `${testId}-external@notifications.invalid`,
              recipientName: null,
              payloadVersion: 1,
              payload: { subject: "External", text: "Body" },
              scheduledFor: new Date(Date.now() + 3_600_000),
              references: [
                { namespace: "application", value: `external-${testId}` },
              ],
            },
          ],
        };
        const deliveryOnly = yield* service.publish(deliveryOnlyInput);
        expect(deliveryOnly.notificationId).toBeNull();
        const deliveryOnlyReplay = yield* service.publish(deliveryOnlyInput);
        expect(deliveryOnlyReplay.idempotentReplay).toBe(true);
        expect(deliveryOnlyReplay.deliveryIds).toEqual(
          deliveryOnly.deliveryIds,
        );
        const incompatibleReplay = yield* service
          .publish({
            ...deliveryOnlyInput,
            deliveries: deliveryOnlyInput.deliveries.map((delivery) => ({
              ...delivery,
              key: "different",
            })),
          })
          .pipe(Effect.exit);
        expect(incompatibleReplay._tag).toBe("Failure");
        const deliveryOnlyDetail = yield* service.getDelivery({
          scope: externalScope,
          deliveryId: deliveryOnly.deliveryIds[0],
        });
        expect(
          deliveryOnlyDetail.references.some(
            ({ namespace, value }) =>
              namespace === "application" && value === `external-${testId}`,
          ),
        ).toBe(true);

        const suppressedAddress = `${testId}-blocked@notifications.invalid`;
        const suppression = yield* service.setSuppression({
          scope,
          channel: "email",
          purpose: null,
          recipientAddress: `  ${testId.toUpperCase()}-BLOCKED@NOTIFICATIONS.INVALID  `,
          reason: "integration_test",
          expiresAt: null,
        });
        expect(suppression.recipientAddress).toBe(suppressedAddress);
        const suppressions = yield* service.listSuppressions({
          scope,
          channel: "email",
          includeExpired: false,
        });
        expect(
          suppressions.some(
            ({ recipientAddress }) => recipientAddress === suppressedAddress,
          ),
        ).toBe(true);
        const endpointSuppressed = yield* service.publish(
          makePublishInput({
            key: "endpoint",
            purpose: "transactional",
            address: ` ${testId}-BLOCKED@Notifications.Invalid `,
          }),
        );
        const endpointDetail = yield* service.getDelivery({
          scope,
          deliveryId: endpointSuppressed.deliveryIds[0],
        });
        expect(endpointDetail.delivery.status).toBe("suppressed");
        expect(endpointDetail.delivery.recipientAddress).toBe(
          suppressedAddress,
        );
        expect(endpointDetail.attempts).toHaveLength(0);
        expect(
          yield* service.resetSuppression({
            scope,
            channel: "email",
            purpose: null,
            recipientAddress: ` ${testId.toUpperCase()}-BLOCKED@NOTIFICATIONS.INVALID `,
          }),
        ).toBe(true);

        const changedReplay = yield* service
          .publish({
            ...transactionalInput,
            deliveries: transactionalInput.deliveries.map((delivery) => ({
              ...delivery,
              payload: { subject: "Changed", text: "Rendered body" },
            })),
          })
          .pipe(Effect.exit);
        expect(changedReplay._tag).toBe("Failure");

        const wildcardAddress = `${testId}-wildcard@notifications.invalid`;
        const wildcardScope = {
          recipientUserId: null,
          organizationId: null,
          workspaceId: null,
        };
        yield* service.setSuppression({
          scope: wildcardScope,
          channel: "email",
          purpose: "notification",
          recipientAddress: wildcardAddress,
          reason: "integration_wildcard",
          expiresAt: null,
        });
        const wildcardTransactional = yield* service.publish(
          makePublishInput({
            key: "wildcard-transactional",
            purpose: "transactional",
            address: wildcardAddress,
          }),
        );
        const wildcardNotification = yield* service.publish(
          makePublishInput({
            key: "wildcard-notification",
            purpose: "notification",
            address: wildcardAddress,
          }),
        );
        expect(
          (yield* service.getDelivery({
            scope,
            deliveryId: wildcardTransactional.deliveryIds[0],
          })).delivery.status,
        ).toBe("queued");
        expect(
          (yield* service.getDelivery({
            scope,
            deliveryId: wildcardNotification.deliveryIds[0],
          })).delivery.status,
        ).toBe("suppressed");
        yield* service.resetSuppression({
          scope: wildcardScope,
          channel: "email",
          purpose: "notification",
          recipientAddress: wildcardAddress,
        });

        const currentNotificationId = transactional.notificationId;
        if (currentNotificationId === null) {
          return yield* Effect.die(
            new Error("Transactional publication did not create an inbox row"),
          );
        }
        const foreignScope: RecipientNotificationScope = {
          recipientUserId: `other-${testId}`,
          organizationId: scope.organizationId,
          workspaceId: scope.workspaceId,
        };
        const foreignPublication = yield* service.publish({
          idempotencyKey: `${prefix}:foreign-inbox`,
          scope: foreignScope,
          eventKey: "integration.foreign",
          eventVersion: 1,
          inbox: {
            locale: "en",
            title: "Foreign inbox",
            description: null,
            href: null,
            metadata: {},
          },
          deliveries: [],
        });
        const foreignNotificationId = foreignPublication.notificationId;
        if (foreignNotificationId === null) {
          return yield* Effect.die(
            new Error("Foreign publication did not create an inbox row"),
          );
        }
        const unreadBefore = yield* service.unreadCount({ scope });
        const marked = yield* service.markReadBulk({
          scope,
          notificationIds: [currentNotificationId, foreignNotificationId],
        });
        expect(marked.map(({ id }) => id)).toEqual([currentNotificationId]);
        expect(yield* service.unreadCount({ scope })).toBe(unreadBefore - 1);
        const archived = yield* service.archiveBulk({
          scope,
          notificationIds: [currentNotificationId, foreignNotificationId],
        });
        expect(archived).toHaveLength(1);
        expect(archived[0]?.archivedAt).not.toBeNull();

        const reminderInput = {
          idempotencyKey: `${prefix}:reminder`,
          scope,
          handlerKey: "integration.reminder",
          handlerVersion: 1,
          payload: { testId },
          scheduledFor: new Date(Date.now() + 3_600_000),
          expiresAt: null,
          maxAttempts: 2,
        };
        const reminder = yield* service.scheduleReminder(reminderInput);
        expect((yield* service.scheduleReminder(reminderInput)).id).toBe(
          reminder.id,
        );
        expect(
          yield* service
            .scheduleReminder({
              ...reminderInput,
              payload: { testId, changed: true },
            })
            .pipe(Effect.exit),
        ).toMatchObject({ _tag: "Failure" });
        expect(
          (yield* service.getReminder({
            scope,
            reminderId: reminder.id,
          })).id,
        ).toBe(reminder.id);
        const reminderPage = yield* service.listReminders({
          scope,
          pagination: { limit: 10, cursor: null },
          statuses: [],
        });
        expect(reminderPage.items.some(({ id }) => id === reminder.id)).toBe(
          true,
        );

        const queuedReminder = yield* service.scheduleReminder({
          idempotencyKey: `${prefix}:queued-reminder`,
          scope,
          handlerKey: "integration.reminder",
          handlerVersion: 1,
          payload: { testId, queued: true },
          scheduledFor: new Date(0),
          expiresAt: null,
          maxAttempts: 1,
        });
        expect(queuedReminder).toMatchObject({ status: "queued", attempts: 1 });
        const deferredReminder = yield* service.rescheduleReminder({
          scope,
          reminderId: queuedReminder.id,
          scheduledFor: new Date(Date.now() + 3_600_000),
          expiresAt: null,
        });
        expect(deferredReminder).toMatchObject({
          status: "scheduled",
          attempts: 0,
          currentJobId: null,
        });
        const requeuedReminder = yield* service.rescheduleReminder({
          scope,
          reminderId: queuedReminder.id,
          scheduledFor: new Date(0),
          expiresAt: null,
        });
        expect(requeuedReminder).toMatchObject({
          status: "queued",
          attempts: 1,
        });
        const cancelledReminder = yield* service.cancelReminder({
          scope,
          reminderId: queuedReminder.id,
        });
        expect(cancelledReminder).toMatchObject({
          status: "cancelled",
          attempts: 0,
          currentJobId: null,
        });

        const cancelBeforeDispatch = yield* service.publish(
          makePublishInput({
            key: "cancel-before-dispatch",
            purpose: "transactional",
            maxAttempts: 1,
          }),
        );
        const cancelledDelivery = yield* service.cancelDelivery({
          scope,
          deliveryId: cancelBeforeDispatch.deliveryIds[0],
        });
        expect(cancelledDelivery).toMatchObject({
          status: "cancelled",
          attempts: 0,
          currentJobId: null,
        });
        const cancelledDeliveryDetail = yield* service.getDelivery({
          scope,
          deliveryId: cancelBeforeDispatch.deliveryIds[0],
        });
        expect(cancelledDeliveryDetail.attempts[0]?.outcome).toMatchObject({
          _tag: "Skipped",
          reason: "cancelled",
        });
        expect(
          (yield* service.retryDelivery({
            scope,
            deliveryId: cancelBeforeDispatch.deliveryIds[0],
          })).attempts,
        ).toBe(1);

        yield* sql`
          UPDATE notification_deliveries
          SET status = 'processing'
          WHERE id = ${future.deliveryIds[0]}
        `;
        expect(
          yield* service
            .cancelDelivery({ scope, deliveryId: future.deliveryIds[0] })
            .pipe(Effect.exit),
        ).toMatchObject({ _tag: "Failure" });
        yield* sql`
          UPDATE notification_deliveries
          SET status = 'queued'
          WHERE id = ${future.deliveryIds[0]}
        `;

        yield* sql`
          UPDATE notification_reminders
          SET status = 'processing'
          WHERE id = ${reminder.id}
        `;
        expect(
          yield* service
            .cancelReminder({ scope, reminderId: reminder.id })
            .pipe(Effect.exit),
        ).toMatchObject({ _tag: "Failure" });
        expect(
          yield* service
            .rescheduleReminder({
              scope,
              reminderId: reminder.id,
              scheduledFor: new Date(Date.now() + 7_200_000),
              expiresAt: null,
            })
            .pipe(Effect.exit),
        ).toMatchObject({ _tag: "Failure" });
        yield* sql`
          UPDATE notification_reminders
          SET status = 'scheduled'
          WHERE id = ${reminder.id}
        `;

        const ordinaryJobId = transactionalDetail.delivery.currentJobId;
        yield* runtime.enqueueDue({ limit: 100 });
        expect(
          (yield* service.getDelivery({
            scope,
            deliveryId: transactional.deliveryIds[0],
          })).delivery.currentJobId,
        ).toBe(ordinaryJobId);

        const freshLock = yield* service.publish(
          makePublishInput({
            key: "fresh-effect-lock",
            purpose: "transactional",
          }),
        );
        const freshLockDetail = yield* service.getDelivery({
          scope,
          deliveryId: freshLock.deliveryIds[0],
        });
        const freshLockJobId = freshLockDetail.delivery.currentJobId;
        if (freshLockJobId === null) {
          return yield* Effect.die(new Error("Fresh-lock job was not queued"));
        }
        yield* sql`
          UPDATE krakstack_notification_jobs
          SET
            completed = TRUE,
            acquired_at = now(),
            acquired_by = ${globalThis.crypto.randomUUID()}
          WHERE id = ${freshLockJobId}
            AND queue_name = 'krakstack.notifications.delivery'
        `;
        yield* runtime.enqueueDue({ limit: 100 });
        expect(
          (yield* service.getDelivery({
            scope,
            deliveryId: freshLock.deliveryIds[0],
          })).delivery.currentJobId,
        ).toBe(freshLockJobId);
        yield* sql`
          UPDATE krakstack_notification_jobs
          SET completed = FALSE, acquired_at = NULL, acquired_by = NULL
          WHERE id = ${freshLockJobId}
            AND queue_name = 'krakstack.notifications.delivery'
        `;

        const missingRetry = yield* service.publish(
          makePublishInput({
            key: "missing-retry",
            purpose: "transactional",
            maxAttempts: 2,
          }),
        );
        const missingRetryBefore = yield* service.getDelivery({
          scope,
          deliveryId: missingRetry.deliveryIds[0],
        });
        yield* sql`
          DELETE FROM krakstack_notification_jobs
          WHERE id = ${missingRetryBefore.delivery.currentJobId}
            AND queue_name = 'krakstack.notifications.delivery'
        `;
        yield* runtime.enqueueDue({ limit: 100 });
        const missingRetryAfter = yield* service.getDelivery({
          scope,
          deliveryId: missingRetry.deliveryIds[0],
        });
        expect(missingRetryAfter.delivery.jobGeneration).toBe(2);
        expect(missingRetryAfter.delivery.attempts).toBe(2);
        expect(missingRetryAfter.delivery.maxAttempts).toBe(2);

        const exhaustedQueue = yield* service.publish(
          makePublishInput({
            key: "exhausted-queue",
            purpose: "transactional",
            maxAttempts: 2,
          }),
        );
        const exhaustedQueueBefore = yield* service.getDelivery({
          scope,
          deliveryId: exhaustedQueue.deliveryIds[0],
        });
        yield* sql`
          UPDATE krakstack_notification_jobs
          SET attempts = 3, acquired_at = NULL, acquired_by = NULL
          WHERE id = ${exhaustedQueueBefore.delivery.currentJobId}
            AND queue_name = 'krakstack.notifications.delivery'
        `;
        yield* runtime.enqueueDue({ limit: 100 });
        const exhaustedQueueAfter = yield* service.getDelivery({
          scope,
          deliveryId: exhaustedQueue.deliveryIds[0],
        });
        expect(exhaustedQueueAfter.delivery.jobGeneration).toBe(2);
        expect(exhaustedQueueAfter.delivery.attempts).toBe(2);
        expect(exhaustedQueueAfter.delivery.maxAttempts).toBe(2);

        const missingFailed = yield* service.publish(
          makePublishInput({
            key: "missing-failed",
            purpose: "transactional",
            maxAttempts: 1,
          }),
        );
        const missingFailedBefore = yield* service.getDelivery({
          scope,
          deliveryId: missingFailed.deliveryIds[0],
        });
        yield* sql`
          DELETE FROM krakstack_notification_jobs
          WHERE id = ${missingFailedBefore.delivery.currentJobId}
            AND queue_name = 'krakstack.notifications.delivery'
        `;
        yield* runtime.enqueueDue({ limit: 100 });
        const missingFailedAfter = yield* service.getDelivery({
          scope,
          deliveryId: missingFailed.deliveryIds[0],
        });
        expect(missingFailedAfter.delivery.status).toBe("failed");
        expect(missingFailedAfter.delivery.maxAttempts).toBe(1);

        fakeTransport.clear();
        const latePreference = yield* service.publish(
          makePublishInput({
            key: "late-preference",
            purpose: "notification",
          }),
        );
        yield* service.setPreference({
          scope,
          eventKey: null,
          channel: "email",
          enabled: false,
        });

        yield* Effect.gen(function* () {
          const latePreferenceDetail = yield* processUntilDeliveryStatus(
            latePreference.deliveryIds[0],
            "suppressed",
          );
          expect(latePreferenceDetail.delivery.errorMessage).toBe(
            "preference_disabled",
          );
          expect(
            fakeTransport.sent.some(
              ({ deliveryId }) => deliveryId === latePreference.deliveryIds[0],
            ),
          ).toBe(false);

          yield* service.resetPreference({
            scope,
            eventKey: null,
            channel: "email",
          });
          unavailableFailures = 0;
          const unavailable = yield* service.publish(
            makePublishInput({
              key: "unavailable",
              purpose: "transactional",
              eventKey: "integration.unavailable",
              maxAttempts: 2,
            }),
          );
          yield* processUntilDeliveryStatus(
            unavailable.deliveryIds[0],
            "retrying",
          );
          yield* sql`
              UPDATE notification_deliveries
              SET scheduled_for = ${new Date(0)}
              WHERE id = ${unavailable.deliveryIds[0]}
            `;
          yield* runtime.enqueueDue({ limit: 100 });
          const unavailableSent = yield* processUntilDeliveryStatus(
            unavailable.deliveryIds[0],
            "sent",
          );
          expect(unavailableSent.delivery.attempts).toBe(2);
          expect(unavailableSent.delivery.maxAttempts).toBe(2);
          expect(
            unavailableSent.attempts.map(({ attempt }) => attempt),
          ).toEqual([1, 2]);
          expect(
            unavailableSent.attempts.map(({ generation }) => generation),
          ).toEqual([1, 2]);

          const unavailableExhausted = yield* service.publish(
            makePublishInput({
              key: "unavailable-exhausted",
              purpose: "transactional",
              eventKey: "integration.unavailable-exhausted",
              channel: "missing",
              maxAttempts: 1,
            }),
          );
          const unavailableFailed = yield* processUntilDeliveryStatus(
            unavailableExhausted.deliveryIds[0],
            "failed",
          );
          expect(unavailableFailed.delivery.attempts).toBe(1);
          expect(unavailableFailed.attempts).toHaveLength(1);
          expect(unavailableFailed.attempts[0]?.outcome?._tag).toBe(
            "Unavailable",
          );

          providerCompletedAt = null;
          const completionTime = yield* service.publish(
            makePublishInput({
              key: "completion-time",
              purpose: "transactional",
              eventKey: "integration.completion-time",
            }),
          );
          const completed = yield* processUntilDeliveryStatus(
            completionTime.deliveryIds[0],
            "sent",
          );
          const capturedProviderCompletion = readProviderCompletedAt();
          if (capturedProviderCompletion === null) {
            return yield* Effect.die(
              new Error("Provider completion timestamp was not captured"),
            );
          }
          expect(completed.delivery.sentAt?.getTime()).toBeGreaterThanOrEqual(
            capturedProviderCompletion.getTime(),
          );
        });

        handlerCompletedAt = null;
        const completedReminder = yield* service.scheduleReminder({
          idempotencyKey: `${prefix}:completed-reminder`,
          scope,
          handlerKey: "integration.reminder",
          handlerVersion: 1,
          payload: { testId, completion: true },
          scheduledFor: new Date(0),
          expiresAt: null,
          maxAttempts: 1,
        });
        const completedReminderState = yield* processUntilReminderStatus(
          completedReminder.id,
          "completed",
        );
        const capturedHandlerCompletion = readHandlerCompletedAt();
        if (capturedHandlerCompletion === null) {
          return yield* Effect.die(
            new Error("Handler completion timestamp was not captured"),
          );
        }
        expect(completedReminderState.status).toBe("completed");
        expect(
          completedReminderState.completedAt?.getTime(),
        ).toBeGreaterThanOrEqual(capturedHandlerCompletion.getTime());

        const legacyRetryId = future.deliveryIds[0];
        const legacyFailedId = missingFailed.deliveryIds[0];
        const legacyEmail = `${testId}-legacy@notifications.invalid`;
        const legacyApplicationId = globalThis.crypto.randomUUID();
        yield* sql`
          UPDATE notification_deliveries
          SET
            status = 'processing',
            attempts = 1,
            max_attempts = 2,
            current_job_id = NULL,
            processing_at = ${new Date(0)},
            claimed_by = 'legacy-worker',
            lease_expires_at = ${new Date(60_000)}
          WHERE id = ${legacyRetryId}
        `;
        yield* sql`
          UPDATE notification_deliveries
          SET
            status = 'processing',
            attempts = 1,
            max_attempts = 1,
            current_job_id = NULL,
            processing_at = ${new Date(0)},
            claimed_by = 'legacy-worker',
            lease_expires_at = ${new Date(60_000)}
          WHERE id = ${legacyFailedId}
        `;
        yield* sql`
          CREATE TABLE IF NOT EXISTS email_preferences (
            recipient_email TEXT PRIMARY KEY,
            notification_email_enabled BOOLEAN NOT NULL DEFAULT TRUE,
            created_at TIMESTAMP NOT NULL DEFAULT now(),
            updated_at TIMESTAMP NOT NULL DEFAULT now()
          )
        `;
        yield* sql`TRUNCATE TABLE email_preferences`;
        yield* sql`
          INSERT INTO email_preferences (
            recipient_email,
            notification_email_enabled,
            created_at
          ) VALUES (
            ${legacyEmail},
            FALSE,
            ${new Date(0)}
          )
        `;
        yield* sql`
          CREATE TABLE IF NOT EXISTS notification_delivery_correlations (
            notification_delivery_id UUID PRIMARY KEY,
            application_id UUID NULL,
            opportunity_id UUID NULL,
            organization_id UUID NULL
          )
        `;
        yield* sql`TRUNCATE TABLE notification_delivery_correlations`;
        yield* sql`
          INSERT INTO notification_delivery_correlations (
            notification_delivery_id,
            application_id
          ) VALUES (
            ${legacyRetryId},
            ${legacyApplicationId}
          )
        `;
        yield* sql`
          DELETE FROM krakstack_notification_migrations
          WHERE migration_id = 7
        `;
        yield* runNotificationMigrations;

        expect(
          (yield* service.getDelivery({
            scope,
            deliveryId: legacyRetryId,
          })).delivery,
        ).toMatchObject({
          status: "retrying",
          attempts: 1,
          maxAttempts: 2,
          claimedBy: null,
          leaseExpiresAt: null,
        });
        expect(
          (yield* service.getDelivery({
            scope,
            deliveryId: legacyFailedId,
          })).delivery,
        ).toMatchObject({
          status: "failed",
          attempts: 1,
          maxAttempts: 1,
          claimedBy: null,
          leaseExpiresAt: null,
        });
        const migratedSuppressions = yield* service.listSuppressions({
          scope: {
            recipientUserId: null,
            organizationId: null,
            workspaceId: null,
          },
          channel: "email",
          purposes: ["notification"],
          includeExpired: false,
        });
        expect(
          migratedSuppressions.some(
            ({ purpose, recipientAddress }) =>
              purpose === "notification" && recipientAddress === legacyEmail,
          ),
        ).toBe(true);
        expect(
          (yield* service.getDelivery({
            scope,
            deliveryId: legacyRetryId,
          })).references,
        ).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              namespace: "application",
              value: legacyApplicationId,
            }),
          ]),
        );
        yield* sql`DROP TABLE email_preferences`;
        yield* sql`DROP TABLE notification_delivery_correlations`;
      });

      const isolatedProgram = program.pipe(
        Effect.ensuring(cleanup.pipe(Effect.orDie)),
        Effect.provide(notificationLayer),
      );
      return createTestSchema(testDatabaseUrl, schemaName).pipe(
        Effect.andThen(isolatedProgram),
        Effect.ensuring(
          dropTestSchema(testDatabaseUrl, schemaName).pipe(Effect.orDie),
        ),
      );
    },
  );
});

describe.skipIf(!hasTestDatabase)("legacy notification table adoption", () => {
  it.effect(
    "preserves and extends VolunteerConnector notification tables",
    () => {
      const testDatabaseUrl = process.env.TEST_DATABASE_URL;
      if (testDatabaseUrl === undefined) {
        return Effect.die(new Error("TEST_DATABASE_URL is required"));
      }

      const testId = globalThis.crypto.randomUUID();
      const schemaName = `notification_legacy_${testId.replaceAll("-", "")}`;
      const deliveryId = globalThis.crypto.randomUUID();
      const applicationId = globalThis.crypto.randomUUID();
      const legacyEmail = `${testId}-legacy@notifications.invalid`;
      const scopedPostgresLayer = postgresLayerFor(
        databaseUrlForSchema(testDatabaseUrl, schemaName),
      );

      const program = Effect.gen(function* () {
        const sql = (yield* SqlClient.SqlClient).withoutTransforms();
        yield* sql`
        CREATE TABLE notifications (
          id UUID PRIMARY KEY,
          idempotency_key TEXT NOT NULL,
          recipient_user_id TEXT NOT NULL,
          organization_id TEXT NULL,
          workspace_id TEXT NULL,
          event_key TEXT NOT NULL,
          event_version INTEGER NOT NULL DEFAULT 1,
          locale TEXT NOT NULL,
          title TEXT NOT NULL,
          description TEXT NULL,
          href TEXT NULL,
          metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          read_at TIMESTAMPTZ NULL,
          archived_at TIMESTAMPTZ NULL
        )
      `;
        yield* sql`
        CREATE TABLE notification_settings (
          id UUID PRIMARY KEY,
          recipient_user_id TEXT NOT NULL,
          organization_id TEXT NULL,
          workspace_id TEXT NULL,
          event_key TEXT NULL,
          channel TEXT NOT NULL,
          enabled BOOLEAN NOT NULL DEFAULT TRUE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `;
        yield* sql`
        CREATE TABLE notification_deliveries (
          id UUID PRIMARY KEY,
          notification_id UUID NULL REFERENCES notifications(id) ON DELETE SET NULL,
          idempotency_key TEXT NOT NULL,
          recipient_user_id TEXT NULL,
          organization_id TEXT NULL,
          workspace_id TEXT NULL,
          event_key TEXT NOT NULL,
          event_version INTEGER NOT NULL DEFAULT 1,
          channel TEXT NOT NULL,
          purpose TEXT NOT NULL,
          template TEXT NULL,
          recipient_address TEXT NOT NULL,
          recipient_name TEXT NULL,
          payload_version INTEGER NOT NULL DEFAULT 1,
          payload JSONB NOT NULL,
          status TEXT NOT NULL DEFAULT 'queued',
          attempts INTEGER NOT NULL DEFAULT 0,
          max_attempts INTEGER NOT NULL DEFAULT 5,
          provider TEXT NULL,
          provider_message_id TEXT NULL,
          error_message TEXT NULL,
          scheduled_for TIMESTAMPTZ NOT NULL DEFAULT now(),
          processing_at TIMESTAMPTZ NULL,
          last_attempt_at TIMESTAMPTZ NULL,
          lease_expires_at TIMESTAMPTZ NULL,
          claimed_by TEXT NULL,
          sent_at TIMESTAMPTZ NULL,
          failed_at TIMESTAMPTZ NULL,
          suppressed_at TIMESTAMPTZ NULL,
          cancelled_at TIMESTAMPTZ NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `;
        yield* sql`
        CREATE TABLE email_preferences (
          recipient_email TEXT PRIMARY KEY,
          notification_email_enabled BOOLEAN NOT NULL DEFAULT TRUE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `;
        yield* sql`
        CREATE TABLE notification_delivery_correlations (
          notification_delivery_id UUID PRIMARY KEY,
          application_id UUID NULL,
          opportunity_id UUID NULL,
          organization_id UUID NULL
        )
      `;
        yield* sql`
        INSERT INTO notification_deliveries (
          id,
          idempotency_key,
          event_key,
          channel,
          purpose,
          recipient_address,
          payload,
          status,
          attempts,
          max_attempts,
          processing_at,
          lease_expires_at,
          claimed_by
        ) VALUES (
          ${deliveryId},
          ${`legacy:${testId}`},
          'application_approved',
          'email',
          'notification',
          ${`  ${legacyEmail.toUpperCase()}  `},
          ${{
            to: legacyEmail,
            subject: "Legacy notification",
            text: "Legacy body",
          }},
          'processing',
          1,
          2,
          ${new Date(0)},
          ${new Date(60_000)},
          'legacy-worker'
        )
      `;
        yield* sql`
        INSERT INTO email_preferences (
          recipient_email,
          notification_email_enabled
        ) VALUES (
          ${`  ${legacyEmail.toUpperCase()}  `},
          FALSE
        )
      `;
        yield* sql`
        INSERT INTO notification_delivery_correlations (
          notification_delivery_id,
          application_id
        ) VALUES (
          ${deliveryId},
          ${applicationId}
        )
      `;

        yield* runNotificationMigrations;

        const deliveries = yield* sql`
        SELECT
          status,
          attempts,
          max_attempts AS "maxAttempts",
          current_job_id AS "currentJobId",
          claimed_by AS "claimedBy",
          lease_expires_at AS "leaseExpiresAt",
          recipient_address AS "recipientAddress"
        FROM notification_deliveries
        WHERE id = ${deliveryId}
      `;
        expect(deliveries).toEqual([
          expect.objectContaining({
            status: "retrying",
            attempts: 1,
            maxAttempts: 2,
            currentJobId: null,
            claimedBy: null,
            leaseExpiresAt: null,
            recipientAddress: legacyEmail,
          }),
        ]);
        expect(
          yield* sql`
          SELECT recipient_address AS "recipientAddress"
          FROM notification_suppressions
          WHERE channel = 'email'
            AND purpose = 'notification'
        `,
        ).toEqual([{ recipientAddress: legacyEmail }]);
        expect(
          yield* sql`
          SELECT namespace, value
          FROM notification_delivery_references
          WHERE delivery_id = ${deliveryId}
        `,
        ).toEqual([{ namespace: "application", value: applicationId }]);
      });

      const isolatedProgram = program.pipe(Effect.provide(scopedPostgresLayer));
      return createTestSchema(testDatabaseUrl, schemaName).pipe(
        Effect.andThen(isolatedProgram),
        Effect.ensuring(
          dropTestSchema(testDatabaseUrl, schemaName).pipe(Effect.orDie),
        ),
      );
    },
  );
});
