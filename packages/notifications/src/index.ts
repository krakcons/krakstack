import { Context, DateTime, Effect, Layer, Option, Schema } from "effect";
import { SqlClient } from "effect/unstable/sql";

import { allocateDeliveryJob, allocateReminderJob } from "./internal/jobs.js";
import {
  canonicalRecipientAddress,
  canonicalJsonString,
  deliveryIdempotencyKey,
  publicationFingerprint,
  reminderFingerprint,
} from "./internal/idempotency.js";
import { selectPreference } from "./internal/policy.js";
import {
  NotificationQueueService,
  notificationQueueLayer,
} from "./internal/queue.js";
import {
  attemptColumns,
  decodeInput,
  decodeRows,
  deliveryColumns,
  exactScope,
  inboxColumns,
  preferenceColumns,
  referenceColumns,
  reminderColumns,
  storageError,
  suppressionColumns,
  wildcardScope,
} from "./internal/sql.js";
import { runNotificationMigrations } from "./migrations.js";
import {
  CancelReminderInput,
  BulkInboxMutationInput,
  DeliveryMutationInput,
  EmailPayloadV1,
  InboxMutationInput,
  InboxNotification,
  ListDeliveriesInput,
  ListInboxInput,
  ListPreferencesInput,
  ListRemindersInput,
  ListSuppressionsInput,
  NotificationDelivery,
  NotificationDeliveryAttempt,
  NotificationDeliveryReference,
  NotificationIdempotencyConflictError,
  NotificationNotFoundError,
  NotificationPreference,
  NotificationReminder,
  NotificationSuppression,
  NotificationTransitionError,
  NotificationValidationError,
  PublishInput,
  ResetSuppressionInput,
  ResetPreferenceInput,
  RescheduleReminderInput,
  ReminderMutationInput,
  ResolvePreferenceInput,
  ScheduleReminderInput,
  SetSuppressionInput,
  SetPreferenceInput,
  UnreadCountInput,
  type CancelReminderInput as CancelReminderInputType,
  type BulkInboxMutationInput as BulkInboxMutationInputType,
  type DeliveryMutationInput as DeliveryMutationInputType,
  type DeliveryPage,
  type InboxMutationInput as InboxMutationInputType,
  type InboxNotification as InboxNotificationType,
  type InboxPage,
  type ListDeliveriesInput as ListDeliveriesInputType,
  type ListInboxInput as ListInboxInputType,
  type ListPreferencesInput as ListPreferencesInputType,
  type ListRemindersInput as ListRemindersInputType,
  type ListSuppressionsInput as ListSuppressionsInputType,
  type NotificationDelivery as NotificationDeliveryType,
  type NotificationDeliveryDetail,
  type NotificationPreference as NotificationPreferenceType,
  type NotificationReminder as NotificationReminderType,
  type NotificationScope,
  type NotificationServiceError,
  type NotificationSuppression as NotificationSuppressionType,
  type PublishInput as PublishInputType,
  type PublishResult,
  type ResetPreferenceInput as ResetPreferenceInputType,
  type ResetSuppressionInput as ResetSuppressionInputType,
  type RescheduleReminderInput as RescheduleReminderInputType,
  type ReminderMutationInput as ReminderMutationInputType,
  type ReminderPage,
  type ResolvePreferenceInput as ResolvePreferenceInputType,
  type ResolvedNotificationPreference,
  type ScheduleReminderInput as ScheduleReminderInputType,
  type SetPreferenceInput as SetPreferenceInputType,
  type SetSuppressionInput as SetSuppressionInputType,
  type UnreadCountInput as UnreadCountInputType,
} from "./schema.js";

const PUBLICATION_REFERENCE_NAMESPACE = "krakstack.publication";

const NotificationPublicationRecord = Schema.Struct({
  idempotencyKey: Schema.NonEmptyString,
  requestFingerprint: Schema.String.pipe(
    Schema.check(Schema.isPattern(/^[a-f0-9]{64}$/)),
  ),
  notificationId: Schema.NullOr(
    Schema.String.pipe(Schema.check(Schema.isUUID())),
  ),
}).annotate({ identifier: "NotificationPublicationRecord" });

const ReminderFingerprintRecord = Schema.Struct({
  requestFingerprint: Schema.NullOr(
    Schema.String.pipe(Schema.check(Schema.isPattern(/^[a-f0-9]{64}$/))),
  ),
}).annotate({ identifier: "NotificationReminderFingerprintRecord" });

const UnreadCountRecord = Schema.Struct({
  count: Schema.Int.pipe(Schema.check(Schema.isGreaterThanOrEqualTo(0))),
}).annotate({ identifier: "NotificationUnreadCountRecord" });

const scopesEqual = (left: NotificationScope, right: NotificationScope) =>
  left.recipientUserId === right.recipientUserId &&
  left.organizationId === right.organizationId &&
  left.workspaceId === right.workspaceId;

const volunteerLegacyDeliveryIdempotencyKey = (input: {
  readonly publicationKey: string;
  readonly eventKey: string;
  readonly channel: string;
  readonly template: string | null;
  readonly recipientAddress: string;
  readonly index: number;
}) =>
  [
    input.publicationKey,
    "delivery",
    input.channel,
    input.template ?? input.eventKey,
    input.recipientAddress.trim().toLowerCase(),
    input.index,
  ].join(":");

const decodeEmailPayloadV1 = Schema.decodeUnknownOption(EmailPayloadV1);

const replayPayload = (
  channel: string,
  payloadVersion: number,
  payload: typeof Schema.Json.Type,
): typeof Schema.Json.Type => {
  if (channel !== "email" || payloadVersion !== 1) return payload;
  const decoded = decodeEmailPayloadV1(payload);
  return Option.isSome(decoded) ? decoded.value : payload;
};

export interface NotificationServiceContract {
  readonly publish: (
    input: PublishInputType,
  ) => Effect.Effect<PublishResult, NotificationServiceError>;
  readonly listInbox: (
    input: ListInboxInputType,
  ) => Effect.Effect<InboxPage, NotificationServiceError>;
  readonly unreadCount: (
    input: UnreadCountInputType,
  ) => Effect.Effect<number, NotificationServiceError>;
  readonly markRead: (
    input: InboxMutationInputType,
  ) => Effect.Effect<InboxNotificationType, NotificationServiceError>;
  readonly markUnread: (
    input: InboxMutationInputType,
  ) => Effect.Effect<InboxNotificationType, NotificationServiceError>;
  readonly archive: (
    input: InboxMutationInputType,
  ) => Effect.Effect<InboxNotificationType, NotificationServiceError>;
  readonly restore: (
    input: InboxMutationInputType,
  ) => Effect.Effect<InboxNotificationType, NotificationServiceError>;
  readonly removeInbox: (
    input: InboxMutationInputType,
  ) => Effect.Effect<InboxNotificationType, NotificationServiceError>;
  readonly markReadBulk: (
    input: BulkInboxMutationInputType,
  ) => Effect.Effect<
    ReadonlyArray<InboxNotificationType>,
    NotificationServiceError
  >;
  readonly archiveBulk: (
    input: BulkInboxMutationInputType,
  ) => Effect.Effect<
    ReadonlyArray<InboxNotificationType>,
    NotificationServiceError
  >;
  readonly listPreferences: (
    input: ListPreferencesInputType,
  ) => Effect.Effect<
    ReadonlyArray<NotificationPreferenceType>,
    NotificationServiceError
  >;
  readonly setPreference: (
    input: SetPreferenceInputType,
  ) => Effect.Effect<NotificationPreferenceType, NotificationServiceError>;
  readonly resetPreference: (
    input: ResetPreferenceInputType,
  ) => Effect.Effect<boolean, NotificationServiceError>;
  readonly resolvePreference: (
    input: ResolvePreferenceInputType,
  ) => Effect.Effect<ResolvedNotificationPreference, NotificationServiceError>;
  readonly listSuppressions: (
    input: ListSuppressionsInputType,
  ) => Effect.Effect<
    ReadonlyArray<NotificationSuppressionType>,
    NotificationServiceError
  >;
  readonly setSuppression: (
    input: SetSuppressionInputType,
  ) => Effect.Effect<NotificationSuppressionType, NotificationServiceError>;
  readonly resetSuppression: (
    input: ResetSuppressionInputType,
  ) => Effect.Effect<boolean, NotificationServiceError>;
  readonly listDeliveries: (
    input: ListDeliveriesInputType,
  ) => Effect.Effect<DeliveryPage, NotificationServiceError>;
  readonly getDelivery: (
    input: DeliveryMutationInputType,
  ) => Effect.Effect<NotificationDeliveryDetail, NotificationServiceError>;
  readonly cancelDelivery: (
    input: DeliveryMutationInputType,
  ) => Effect.Effect<NotificationDeliveryType, NotificationServiceError>;
  readonly retryDelivery: (
    input: DeliveryMutationInputType,
  ) => Effect.Effect<NotificationDeliveryType, NotificationServiceError>;
  readonly scheduleReminder: (
    input: ScheduleReminderInputType,
  ) => Effect.Effect<NotificationReminderType, NotificationServiceError>;
  readonly getReminder: (
    input: ReminderMutationInputType,
  ) => Effect.Effect<NotificationReminderType, NotificationServiceError>;
  readonly listReminders: (
    input: ListRemindersInputType,
  ) => Effect.Effect<ReminderPage, NotificationServiceError>;
  readonly rescheduleReminder: (
    input: RescheduleReminderInputType,
  ) => Effect.Effect<NotificationReminderType, NotificationServiceError>;
  readonly cancelReminder: (
    input: CancelReminderInputType,
  ) => Effect.Effect<NotificationReminderType, NotificationServiceError>;
}

const makeNotificationService = Effect.gen(function* () {
  const sql = (yield* SqlClient.SqlClient).withoutTransforms();
  const queues = yield* NotificationQueueService;

  const requireInbox = Effect.fn("NotificationService.requireInbox")(
    function* (input: {
      readonly operation: string;
      readonly id: string;
      readonly rows: ReadonlyArray<unknown>;
    }) {
      const decoded = yield* decodeRows(
        "inbox notification",
        InboxNotification,
        input.rows,
      );
      const notification = decoded.at(0);
      if (notification === undefined) {
        return yield* new NotificationNotFoundError({
          entity: "inbox",
          id: input.id,
        });
      }
      return notification;
    },
  );

  const requireDelivery = Effect.fn("NotificationService.requireDelivery")(
    function* (input: {
      readonly id: string;
      readonly rows: ReadonlyArray<unknown>;
    }) {
      const decoded = yield* decodeRows(
        "notification delivery",
        NotificationDelivery,
        input.rows,
      );
      const delivery = decoded.at(0);
      if (delivery === undefined) {
        return yield* new NotificationNotFoundError({
          entity: "delivery",
          id: input.id,
        });
      }
      return delivery;
    },
  );

  const requireReminder = Effect.fn("NotificationService.requireReminder")(
    function* (input: {
      readonly id: string;
      readonly rows: ReadonlyArray<unknown>;
    }) {
      const decoded = yield* decodeRows(
        "notification reminder",
        NotificationReminder,
        input.rows,
      );
      const reminder = decoded.at(0);
      if (reminder === undefined) {
        return yield* new NotificationNotFoundError({
          entity: "reminder",
          id: input.id,
        });
      }
      return reminder;
    },
  );

  const findPreference = Effect.fn("NotificationService.findPreference")(
    function* (input: ResolvePreferenceInputType) {
      const rows = yield* sql`
        SELECT ${preferenceColumns(sql)}
        FROM notification_settings s
        WHERE s.recipient_user_id = ${input.scope.recipientUserId}
          AND s.channel = ${input.channel}
          AND (s.organization_id IS NULL OR s.organization_id IS NOT DISTINCT FROM ${input.scope.organizationId})
          AND (s.workspace_id IS NULL OR s.workspace_id IS NOT DISTINCT FROM ${input.scope.workspaceId})
          AND (s.event_key IS NULL OR s.event_key = ${input.eventKey})
        ORDER BY s.updated_at DESC, s.id ASC
      `;
      const preferences = yield* decodeRows(
        "notification preferences",
        NotificationPreference,
        rows,
      );
      return selectPreference(preferences, input);
    },
  );

  const publish = Effect.fn("NotificationService.publish")(
    function* (rawInput: PublishInputType) {
      const input = yield* decodeInput("publish", PublishInput, rawInput);
      const now = yield* DateTime.nowAsDate;
      const inbox = input.inbox ?? null;
      const requestFingerprint = publicationFingerprint(input);
      const expectedDeliveryKeys = input.deliveries.map(({ key }) =>
        deliveryIdempotencyKey(input.idempotencyKey, key),
      );
      const expectedLegacyDeliveryKeys = input.deliveries.map((intent, index) =>
        volunteerLegacyDeliveryIdempotencyKey({
          publicationKey: input.idempotencyKey,
          eventKey: input.eventKey,
          channel: intent.channel,
          template: intent.template,
          recipientAddress: intent.recipientAddress,
          index,
        }),
      );

      return yield* sql.withTransaction(
        Effect.gen(function* () {
          yield* sql`
            SELECT pg_advisory_xact_lock(
              hashtextextended(${`notification:publish:${input.idempotencyKey}`}, 0)
            )
          `;
          const publicationRows = yield* sql`
            SELECT
              idempotency_key AS "idempotencyKey",
              request_fingerprint AS "requestFingerprint",
              notification_id AS "notificationId"
            FROM notification_publications
            WHERE idempotency_key = ${input.idempotencyKey}
            LIMIT 1
            FOR UPDATE
          `;
          const publications = yield* decodeRows(
            "notification publication",
            NotificationPublicationRecord,
            publicationRows,
          );
          const publication = publications.at(0);
          if (publication !== undefined) {
            if (publication.requestFingerprint !== requestFingerprint) {
              return yield* new NotificationIdempotencyConflictError({
                idempotencyKey: input.idempotencyKey,
                message: "Idempotency key reused with a changed publication",
              });
            }

            const deliveryRows = yield* sql`
              SELECT ${deliveryColumns(sql, "d")}
              FROM notification_deliveries d
              WHERE EXISTS (
                SELECT 1
                FROM notification_delivery_references ref
                WHERE ref.delivery_id = d.id
                  AND ref.namespace = ${PUBLICATION_REFERENCE_NAMESPACE}
                  AND ref.value = ${input.idempotencyKey}
              )
              ORDER BY d.created_at ASC, d.id ASC
            `;
            const replayDeliveries = yield* decodeRows(
              "notification publication deliveries",
              NotificationDelivery,
              deliveryRows,
            );
            if (replayDeliveries.length !== input.deliveries.length) {
              return yield* storageError(
                "publish.incompletePublicationReplay",
                undefined,
              );
            }
            const deliveriesByKey = new Map(
              replayDeliveries.map((delivery) => [
                delivery.idempotencyKey,
                delivery,
              ]),
            );
            const deliveryIds: Array<string> = [];
            for (const intent of input.deliveries) {
              const delivery = deliveriesByKey.get(
                deliveryIdempotencyKey(input.idempotencyKey, intent.key),
              );
              if (delivery === undefined) {
                return yield* storageError(
                  "publish.missingPublicationDelivery",
                  undefined,
                );
              }
              deliveryIds.push(delivery.id);
            }
            return {
              notificationId: publication.notificationId,
              deliveryIds,
              idempotentReplay: true,
            };
          }

          const existingInboxRows = yield* sql`
            SELECT ${inboxColumns(sql)}
            FROM notifications n
            WHERE n.idempotency_key = ${input.idempotencyKey}
            LIMIT 1
            FOR UPDATE
          `;
          const existingInbox = yield* decodeRows(
            "inbox notification",
            InboxNotification,
            existingInboxRows,
          );
          const replayInbox = existingInbox.at(0);
          const compatibleDeliveryKeys = [
            ...expectedDeliveryKeys,
            ...expectedLegacyDeliveryKeys,
          ];
          const expectedKeyClause =
            compatibleDeliveryKeys.length === 0
              ? sql`FALSE`
              : sql`d.idempotency_key IN ${sql.in(compatibleDeliveryKeys)}`;
          const inboxDeliveryClause =
            replayInbox === undefined
              ? sql`FALSE`
              : sql`d.notification_id = ${replayInbox.id}`;
          const existingDeliveryRows = yield* sql`
            SELECT ${deliveryColumns(sql, "d")}
            FROM notification_deliveries d
            WHERE EXISTS (
              SELECT 1
              FROM notification_delivery_references ref
              WHERE ref.delivery_id = d.id
                AND ref.namespace = ${PUBLICATION_REFERENCE_NAMESPACE}
                AND ref.value = ${input.idempotencyKey}
            )
              OR ${inboxDeliveryClause}
              OR ${expectedKeyClause}
            ORDER BY d.created_at ASC, d.id ASC
            FOR UPDATE
          `;
          const replayDeliveries = yield* decodeRows(
            "notification deliveries",
            NotificationDelivery,
            existingDeliveryRows,
          );

          if (replayInbox !== undefined || replayDeliveries.length > 0) {
            const requestedInbox = inbox !== null;
            if ((replayInbox !== undefined) !== requestedInbox) {
              return yield* new NotificationIdempotencyConflictError({
                idempotencyKey: input.idempotencyKey,
                message: "Idempotency key reused with a different inbox shape",
              });
            }
            if (
              replayInbox !== undefined &&
              (!scopesEqual(replayInbox.scope, input.scope) ||
                replayInbox.eventKey !== input.eventKey ||
                replayInbox.eventVersion !== input.eventVersion ||
                replayInbox.locale !== inbox?.locale ||
                replayInbox.title !== inbox?.title ||
                replayInbox.description !== inbox?.description ||
                replayInbox.href !== inbox?.href ||
                canonicalJsonString(replayInbox.metadata) !==
                  canonicalJsonString(inbox?.metadata ?? null))
            ) {
              return yield* new NotificationIdempotencyConflictError({
                idempotencyKey: input.idempotencyKey,
                message: "Idempotency key reused for a different inbox scope",
              });
            }
            if (replayDeliveries.length !== input.deliveries.length) {
              return yield* new NotificationIdempotencyConflictError({
                idempotencyKey: input.idempotencyKey,
                message: "Idempotency key reused with different delivery keys",
              });
            }

            const deliveryIds: Array<string> = [];
            const persistedIntents: Array<
              PublishInputType["deliveries"][number]
            > = [];
            const unmatchedReplayDeliveries = [...replayDeliveries];
            for (const [index, intent] of input.deliveries.entries()) {
              const idempotencyKey = deliveryIdempotencyKey(
                input.idempotencyKey,
                intent.key,
              );
              const volunteerLegacyIdempotencyKey =
                volunteerLegacyDeliveryIdempotencyKey({
                  publicationKey: input.idempotencyKey,
                  eventKey: input.eventKey,
                  channel: intent.channel,
                  template: intent.template,
                  recipientAddress: intent.recipientAddress,
                  index,
                });
              const matchesIntent = (candidate: NotificationDeliveryType) =>
                scopesEqual(candidate.scope, input.scope) &&
                candidate.eventKey === input.eventKey &&
                candidate.eventVersion === input.eventVersion &&
                candidate.channel === intent.channel &&
                candidate.purpose === intent.purpose &&
                candidate.template === intent.template &&
                canonicalRecipientAddress(
                  candidate.channel,
                  candidate.recipientAddress,
                ) ===
                  canonicalRecipientAddress(
                    intent.channel,
                    intent.recipientAddress,
                  ) &&
                candidate.recipientName === intent.recipientName &&
                candidate.payloadVersion === intent.payloadVersion &&
                canonicalJsonString(
                  replayPayload(
                    candidate.channel,
                    candidate.payloadVersion,
                    candidate.payload,
                  ),
                ) ===
                  canonicalJsonString(
                    replayPayload(
                      intent.channel,
                      intent.payloadVersion,
                      intent.payload,
                    ),
                  ) &&
                (intent.scheduledFor === undefined ||
                  candidate.scheduledFor.getTime() ===
                    intent.scheduledFor.getTime()) &&
                candidate.expiresAt?.getTime() ===
                  intent.expiresAt?.getTime() &&
                candidate.maxAttempts === (intent.maxAttempts ?? 5) &&
                candidate.notificationId === (replayInbox?.id ?? null);
              const exactIndex = unmatchedReplayDeliveries.findIndex(
                (candidate) =>
                  candidate.idempotencyKey === idempotencyKey ||
                  candidate.idempotencyKey === volunteerLegacyIdempotencyKey,
              );
              const deliveryIndex = exactIndex;
              const delivery =
                deliveryIndex < 0
                  ? undefined
                  : unmatchedReplayDeliveries.at(deliveryIndex);
              if (delivery === undefined || !matchesIntent(delivery)) {
                return yield* new NotificationIdempotencyConflictError({
                  idempotencyKey: input.idempotencyKey,
                  message: "Idempotency key reused for a different delivery",
                });
              }
              unmatchedReplayDeliveries.splice(deliveryIndex, 1);
              const referenceRows = yield* sql`
                SELECT ${referenceColumns(sql)}
                FROM notification_delivery_references
                WHERE delivery_id = ${delivery.id}
                ORDER BY namespace ASC, value ASC
              `;
              const references = yield* decodeRows(
                "notification delivery references",
                NotificationDeliveryReference,
                referenceRows,
              );
              if (
                references.some(
                  ({ namespace, value }) =>
                    namespace === PUBLICATION_REFERENCE_NAMESPACE &&
                    value !== input.idempotencyKey,
                )
              ) {
                return yield* new NotificationIdempotencyConflictError({
                  idempotencyKey: input.idempotencyKey,
                  message: "Delivery belongs to a different publication key",
                });
              }
              persistedIntents.push({
                key: intent.key,
                channel: delivery.channel,
                purpose: delivery.purpose,
                template: delivery.template,
                recipientAddress: delivery.recipientAddress,
                recipientName: delivery.recipientName,
                payloadVersion: delivery.payloadVersion,
                payload: replayPayload(
                  delivery.channel,
                  delivery.payloadVersion,
                  delivery.payload,
                ),
                scheduledFor:
                  intent.scheduledFor === undefined
                    ? undefined
                    : delivery.scheduledFor,
                expiresAt: delivery.expiresAt,
                maxAttempts: delivery.maxAttempts,
                references: references
                  .filter(
                    ({ namespace }) =>
                      namespace !== PUBLICATION_REFERENCE_NAMESPACE,
                  )
                  .map(({ namespace, value }) => ({ namespace, value })),
              });
              deliveryIds.push(delivery.id);
            }

            const persistedReplay: PublishInputType = {
              idempotencyKey: input.idempotencyKey,
              scope: input.scope,
              eventKey: input.eventKey,
              eventVersion: input.eventVersion,
              inbox:
                replayInbox === undefined
                  ? null
                  : {
                      locale: replayInbox.locale,
                      title: replayInbox.title,
                      description: replayInbox.description,
                      href: replayInbox.href,
                      metadata: replayInbox.metadata,
                    },
              deliveries: persistedIntents,
            };
            if (
              publicationFingerprint(persistedReplay) !== requestFingerprint
            ) {
              return yield* new NotificationIdempotencyConflictError({
                idempotencyKey: input.idempotencyKey,
                message: "Legacy idempotency key reused with changed content",
              });
            }

            return {
              notificationId: replayInbox?.id ?? null,
              deliveryIds,
              idempotentReplay: true,
            };
          }

          const notificationId =
            inbox === null ? null : globalThis.crypto.randomUUID();
          if (inbox !== null) {
            const recipientUserId = input.scope.recipientUserId;
            if (recipientUserId === null) {
              return yield* new NotificationValidationError({
                operation: "publish",
                message: "Inbox publication requires a recipient user id",
              });
            }
            yield* sql`
              INSERT INTO notifications (
                id,
                idempotency_key,
                recipient_user_id,
                organization_id,
                workspace_id,
                event_key,
                event_version,
                locale,
                title,
                description,
                href,
                metadata,
                created_at
              ) VALUES (
                ${notificationId},
                ${input.idempotencyKey},
                ${recipientUserId},
                ${input.scope.organizationId},
                ${input.scope.workspaceId},
                ${input.eventKey},
                ${input.eventVersion},
                ${inbox.locale},
                ${inbox.title},
                ${inbox.description},
                ${inbox.href},
                ${inbox.metadata},
                ${now}
              )
            `;
          }

          const deliveryIds: Array<string> = [];
          for (const intent of input.deliveries) {
            const deliveryId = globalThis.crypto.randomUUID();
            const idempotencyKey = deliveryIdempotencyKey(
              input.idempotencyKey,
              intent.key,
            );
            const scheduledFor = intent.scheduledFor ?? now;
            const expiresAt = intent.expiresAt ?? null;
            const maxAttempts = intent.maxAttempts ?? 5;
            const recipientUserId = input.scope.recipientUserId;
            const recipientAddress = canonicalRecipientAddress(
              intent.channel,
              intent.recipientAddress,
            );

            const preference =
              intent.purpose === "notification" && recipientUserId !== null
                ? yield* findPreference({
                    scope: {
                      recipientUserId,
                      organizationId: input.scope.organizationId,
                      workspaceId: input.scope.workspaceId,
                    },
                    eventKey: input.eventKey,
                    channel: intent.channel,
                  })
                : undefined;
            const endpointSuppressions = yield* sql`
              SELECT x.id
              FROM notification_suppressions x
              WHERE ${wildcardScope(sql, "x", input.scope)}
                AND x.channel = ${intent.channel}
                AND (x.purpose IS NULL OR x.purpose = ${intent.purpose})
                AND x.recipient_address = ${recipientAddress}
                AND (x.expires_at IS NULL OR x.expires_at > ${now})
              LIMIT 1
            `;
            const suppressed =
              preference?.enabled === false || endpointSuppressions.length > 0;
            const expired =
              expiresAt !== null && expiresAt.getTime() <= now.getTime();
            const status = suppressed
              ? "suppressed"
              : expired
                ? "cancelled"
                : "queued";
            const errorMessage = suppressed
              ? preference?.enabled === false
                ? "preference_disabled"
                : "endpoint_suppressed"
              : expired
                ? "expired_before_enqueue"
                : null;

            yield* sql`
              INSERT INTO notification_deliveries (
                id,
                notification_id,
                idempotency_key,
                recipient_user_id,
                organization_id,
                workspace_id,
                event_key,
                event_version,
                channel,
                purpose,
                template,
                recipient_address,
                recipient_name,
                payload_version,
                payload,
                status,
                attempts,
                max_attempts,
                error_message,
                scheduled_for,
                expires_at,
                suppressed_at,
                cancelled_at,
                created_at,
                updated_at
              ) VALUES (
                ${deliveryId},
                ${notificationId},
                ${idempotencyKey},
                ${input.scope.recipientUserId},
                ${input.scope.organizationId},
                ${input.scope.workspaceId},
                ${input.eventKey},
                ${input.eventVersion},
                ${intent.channel},
                ${intent.purpose},
                ${intent.template},
                ${recipientAddress},
                ${intent.recipientName},
                ${intent.payloadVersion},
                ${intent.payload},
                ${status},
                0,
                ${maxAttempts},
                ${errorMessage},
                ${scheduledFor},
                ${expiresAt},
                ${suppressed ? now : null},
                ${expired && !suppressed ? now : null},
                ${now},
                ${now}
              )
            `;

            const references = [
              {
                namespace: PUBLICATION_REFERENCE_NAMESPACE,
                value: input.idempotencyKey,
              },
              ...(intent.references ?? []),
            ];
            for (const reference of references) {
              yield* sql`
                INSERT INTO notification_delivery_references (
                  delivery_id,
                  namespace,
                  value,
                  created_at
                ) VALUES (
                  ${deliveryId},
                  ${reference.namespace},
                  ${reference.value},
                  ${now}
                )
                ON CONFLICT (delivery_id, namespace, value) DO NOTHING
              `;
            }

            if (
              !suppressed &&
              !expired &&
              scheduledFor.getTime() <= now.getTime()
            ) {
              yield* allocateDeliveryJob({
                sql,
                queues,
                deliveryId,
                attempts: 0,
                jobGeneration: 0,
                now,
              });
            }
            deliveryIds.push(deliveryId);
          }

          yield* sql`
            INSERT INTO notification_publications (
              idempotency_key,
              recipient_user_id,
              organization_id,
              workspace_id,
              event_key,
              event_version,
              request_fingerprint,
              notification_id,
              created_at,
              updated_at
            ) VALUES (
              ${input.idempotencyKey},
              ${input.scope.recipientUserId},
              ${input.scope.organizationId},
              ${input.scope.workspaceId},
              ${input.eventKey},
              ${input.eventVersion},
              ${requestFingerprint},
              ${notificationId},
              ${now},
              ${now}
            )
          `;

          return {
            notificationId,
            deliveryIds,
            idempotentReplay: false,
          };
        }),
      );
    },
    Effect.catchTag("SqlError", (cause) =>
      Effect.fail(storageError("publish", cause)),
    ),
  );

  const listInbox = Effect.fn("NotificationService.listInbox")(
    function* (rawInput: ListInboxInputType) {
      const input = yield* decodeInput("listInbox", ListInboxInput, rawInput);
      const clauses = [exactScope(sql, "n", input.scope)];
      if (!input.includeArchived) {
        clauses.push(sql`n.archived_at IS NULL`);
      }
      if (input.unreadOnly) {
        clauses.push(sql`n.read_at IS NULL`);
      }
      if (input.pagination.cursor !== null) {
        clauses.push(sql`
          (n.created_at, n.id) < (
            ${input.pagination.cursor.createdAt},
            ${input.pagination.cursor.id}
          )
        `);
      }

      const rows = yield* sql`
        SELECT ${inboxColumns(sql)}
        FROM notifications n
        WHERE ${sql.and(clauses)}
        ORDER BY n.created_at DESC, n.id DESC
        LIMIT ${input.pagination.limit + 1}
      `;
      const decoded = yield* decodeRows(
        "inbox notifications",
        InboxNotification,
        rows,
      );
      const hasMore = decoded.length > input.pagination.limit;
      const items = hasMore
        ? decoded.slice(0, input.pagination.limit)
        : decoded;
      const last = items.at(-1);

      return {
        items,
        nextCursor:
          hasMore && last !== undefined
            ? { createdAt: last.createdAt, id: last.id }
            : null,
      };
    },
    Effect.catchTag("SqlError", (cause) =>
      Effect.fail(storageError("listInbox", cause)),
    ),
  );

  const unreadCount = Effect.fn("NotificationService.unreadCount")(
    function* (rawInput: UnreadCountInputType) {
      const input = yield* decodeInput(
        "unreadCount",
        UnreadCountInput,
        rawInput,
      );
      const rows = yield* sql`
        SELECT COUNT(*)::integer AS count
        FROM notifications n
        WHERE ${exactScope(sql, "n", input.scope)}
          AND n.read_at IS NULL
          AND n.archived_at IS NULL
      `;
      const counts = yield* decodeRows(
        "notification unread count",
        UnreadCountRecord,
        rows,
      );
      return counts.at(0)?.count ?? 0;
    },
    Effect.catchTag("SqlError", (cause) =>
      Effect.fail(storageError("unreadCount", cause)),
    ),
  );

  const mutateInbox = Effect.fn("NotificationService.mutateInbox")(
    function* (input: {
      readonly operation:
        | "markRead"
        | "markUnread"
        | "archive"
        | "restore"
        | "removeInbox";
      readonly value: InboxMutationInputType;
    }) {
      const value = yield* decodeInput(
        input.operation,
        InboxMutationInput,
        input.value,
      );
      const now = yield* DateTime.nowAsDate;
      const rows =
        input.operation === "removeInbox"
          ? yield* sql`
              DELETE FROM notifications n
              WHERE n.id = ${value.notificationId}
                AND ${exactScope(sql, "n", value.scope)}
              RETURNING ${inboxColumns(sql)}
            `
          : input.operation === "markRead"
            ? yield* sql`
                UPDATE notifications n
                SET read_at = COALESCE(n.read_at, ${now})
                WHERE n.id = ${value.notificationId}
                  AND ${exactScope(sql, "n", value.scope)}
                RETURNING ${inboxColumns(sql)}
              `
            : input.operation === "markUnread"
              ? yield* sql`
                  UPDATE notifications n
                  SET read_at = NULL
                  WHERE n.id = ${value.notificationId}
                    AND ${exactScope(sql, "n", value.scope)}
                  RETURNING ${inboxColumns(sql)}
                `
              : input.operation === "archive"
                ? yield* sql`
                    UPDATE notifications n
                    SET archived_at = COALESCE(n.archived_at, ${now})
                    WHERE n.id = ${value.notificationId}
                      AND ${exactScope(sql, "n", value.scope)}
                    RETURNING ${inboxColumns(sql)}
                  `
                : yield* sql`
                    UPDATE notifications n
                    SET archived_at = NULL
                    WHERE n.id = ${value.notificationId}
                      AND ${exactScope(sql, "n", value.scope)}
                    RETURNING ${inboxColumns(sql)}
                  `;

      return yield* requireInbox({
        operation: input.operation,
        id: value.notificationId,
        rows,
      });
    },
    Effect.catchTag("SqlError", (cause) =>
      Effect.fail(storageError("mutateInbox", cause)),
    ),
  );

  const markRead = (input: InboxMutationInputType) =>
    mutateInbox({ operation: "markRead", value: input });
  const markUnread = (input: InboxMutationInputType) =>
    mutateInbox({ operation: "markUnread", value: input });
  const archive = (input: InboxMutationInputType) =>
    mutateInbox({ operation: "archive", value: input });
  const restore = (input: InboxMutationInputType) =>
    mutateInbox({ operation: "restore", value: input });
  const removeInbox = (input: InboxMutationInputType) =>
    mutateInbox({ operation: "removeInbox", value: input });

  const mutateInboxBulk = Effect.fn("NotificationService.mutateInboxBulk")(
    function* (input: {
      readonly operation: "markReadBulk" | "archiveBulk";
      readonly value: BulkInboxMutationInputType;
    }) {
      const value = yield* decodeInput(
        input.operation,
        BulkInboxMutationInput,
        input.value,
      );
      const now = yield* DateTime.nowAsDate;
      const rows =
        input.operation === "markReadBulk"
          ? yield* sql`
              UPDATE notifications n
              SET read_at = COALESCE(n.read_at, ${now})
              WHERE n.id IN ${sql.in(value.notificationIds)}
                AND ${exactScope(sql, "n", value.scope)}
              RETURNING ${inboxColumns(sql)}
            `
          : yield* sql`
              UPDATE notifications n
              SET archived_at = COALESCE(n.archived_at, ${now})
              WHERE n.id IN ${sql.in(value.notificationIds)}
                AND ${exactScope(sql, "n", value.scope)}
              RETURNING ${inboxColumns(sql)}
            `;
      const notifications = yield* decodeRows(
        "bulk inbox notifications",
        InboxNotification,
        rows,
      );
      const byId = new Map(
        notifications.map((notification) => [notification.id, notification]),
      );
      return value.notificationIds.flatMap((id) => {
        const notification = byId.get(id);
        return notification === undefined ? [] : [notification];
      });
    },
    Effect.catchTag("SqlError", (cause) =>
      Effect.fail(storageError("mutateInboxBulk", cause)),
    ),
  );

  const markReadBulk = (input: BulkInboxMutationInputType) =>
    mutateInboxBulk({ operation: "markReadBulk", value: input });
  const archiveBulk = (input: BulkInboxMutationInputType) =>
    mutateInboxBulk({ operation: "archiveBulk", value: input });

  const listPreferences = Effect.fn("NotificationService.listPreferences")(
    function* (rawInput: ListPreferencesInputType) {
      const input = yield* decodeInput(
        "listPreferences",
        ListPreferencesInput,
        rawInput,
      );
      const rows = yield* sql`
        SELECT ${preferenceColumns(sql)}
        FROM notification_settings s
        WHERE ${exactScope(sql, "s", input.scope)}
        ORDER BY s.channel ASC, s.event_key ASC NULLS FIRST, s.id ASC
      `;
      return yield* decodeRows(
        "notification preferences",
        NotificationPreference,
        rows,
      );
    },
    Effect.catchTag("SqlError", (cause) =>
      Effect.fail(storageError("listPreferences", cause)),
    ),
  );

  const setPreference = Effect.fn("NotificationService.setPreference")(
    function* (rawInput: SetPreferenceInputType) {
      const input = yield* decodeInput(
        "setPreference",
        SetPreferenceInput,
        rawInput,
      );
      const now = yield* DateTime.nowAsDate;
      const id = globalThis.crypto.randomUUID();
      const rows = yield* sql`
        INSERT INTO notification_settings (
          id,
          recipient_user_id,
          organization_id,
          workspace_id,
          event_key,
          channel,
          enabled,
          created_at,
          updated_at
        ) VALUES (
          ${id},
          ${input.scope.recipientUserId},
          ${input.scope.organizationId},
          ${input.scope.workspaceId},
          ${input.eventKey},
          ${input.channel},
          ${input.enabled},
          ${now},
          ${now}
        )
        ON CONFLICT (
          recipient_user_id,
          (COALESCE(organization_id, '')),
          (COALESCE(workspace_id, '')),
          (COALESCE(event_key, '')),
          channel
        ) DO UPDATE SET
          enabled = EXCLUDED.enabled,
          updated_at = EXCLUDED.updated_at
        RETURNING ${preferenceColumns(sql)}
      `;
      const decoded = yield* decodeRows(
        "notification preference",
        NotificationPreference,
        rows,
      );
      const preference = decoded.at(0);
      if (preference === undefined) {
        return yield* storageError("setPreference.emptyResult", undefined);
      }
      return preference;
    },
    Effect.catchTag("SqlError", (cause) =>
      Effect.fail(storageError("setPreference", cause)),
    ),
  );

  const resetPreference = Effect.fn("NotificationService.resetPreference")(
    function* (rawInput: ResetPreferenceInputType) {
      const input = yield* decodeInput(
        "resetPreference",
        ResetPreferenceInput,
        rawInput,
      );
      const rows = yield* sql`
        DELETE FROM notification_settings s
        WHERE ${exactScope(sql, "s", input.scope)}
          AND s.event_key IS NOT DISTINCT FROM ${input.eventKey}
          AND s.channel = ${input.channel}
        RETURNING s.id
      `;
      return rows.length > 0;
    },
    Effect.catchTag("SqlError", (cause) =>
      Effect.fail(storageError("resetPreference", cause)),
    ),
  );

  const resolvePreference = Effect.fn("NotificationService.resolvePreference")(
    function* (rawInput: ResolvePreferenceInputType) {
      const input = yield* decodeInput(
        "resolvePreference",
        ResolvePreferenceInput,
        rawInput,
      );
      const preference = yield* findPreference(input);
      const resolved: ResolvedNotificationPreference =
        preference === undefined
          ? {
              enabled: true,
              source: "default",
              preference: null,
            }
          : {
              enabled: preference.enabled,
              source: "preference",
              preference,
            };
      return resolved;
    },
    Effect.catchTag("SqlError", (cause) =>
      Effect.fail(storageError("resolvePreference", cause)),
    ),
  );

  const listSuppressions = Effect.fn("NotificationService.listSuppressions")(
    function* (rawInput: ListSuppressionsInputType) {
      const input = yield* decodeInput(
        "listSuppressions",
        ListSuppressionsInput,
        rawInput,
      );
      const now = yield* DateTime.nowAsDate;
      const clauses = [exactScope(sql, "x", input.scope)];
      if (input.channel !== null) {
        clauses.push(sql`x.channel = ${input.channel}`);
      }
      if (input.purposes !== undefined && input.purposes.length > 0) {
        const purposes = input.purposes.filter((purpose) => purpose !== null);
        const includesAllPurposes = input.purposes.includes(null);
        clauses.push(
          includesAllPurposes && purposes.length > 0
            ? sql`(x.purpose IS NULL OR x.purpose IN ${sql.in(purposes)})`
            : includesAllPurposes
              ? sql`x.purpose IS NULL`
              : sql`x.purpose IN ${sql.in(purposes)}`,
        );
      }
      if (!input.includeExpired) {
        clauses.push(sql`(x.expires_at IS NULL OR x.expires_at > ${now})`);
      }
      const rows = yield* sql`
        SELECT ${suppressionColumns(sql)}
        FROM notification_suppressions x
        WHERE ${sql.and(clauses)}
        ORDER BY x.channel ASC, x.recipient_address ASC, x.id ASC
      `;
      return yield* decodeRows(
        "notification suppressions",
        NotificationSuppression,
        rows,
      );
    },
    Effect.catchTag("SqlError", (cause) =>
      Effect.fail(storageError("listSuppressions", cause)),
    ),
  );

  const setSuppression = Effect.fn("NotificationService.setSuppression")(
    function* (rawInput: SetSuppressionInputType) {
      const input = yield* decodeInput(
        "setSuppression",
        SetSuppressionInput,
        rawInput,
      );
      const now = yield* DateTime.nowAsDate;
      const id = globalThis.crypto.randomUUID();
      const recipientAddress = canonicalRecipientAddress(
        input.channel,
        input.recipientAddress,
      );
      const rows = yield* sql`
        INSERT INTO notification_suppressions (
          id,
          recipient_user_id,
          organization_id,
          workspace_id,
          channel,
          purpose,
          recipient_address,
          reason,
          expires_at,
          created_at
        ) VALUES (
          ${id},
          ${input.scope.recipientUserId},
          ${input.scope.organizationId},
          ${input.scope.workspaceId},
          ${input.channel},
          ${input.purpose},
          ${recipientAddress},
          ${input.reason},
          ${input.expiresAt},
          ${now}
        )
        ON CONFLICT (
          (COALESCE(recipient_user_id, '')),
          (COALESCE(organization_id, '')),
          (COALESCE(workspace_id, '')),
          channel,
          (COALESCE(purpose, '')),
          recipient_address
        ) DO UPDATE SET
          reason = EXCLUDED.reason,
          expires_at = EXCLUDED.expires_at
        RETURNING ${suppressionColumns(sql)}
      `;
      const decoded = yield* decodeRows(
        "notification suppression",
        NotificationSuppression,
        rows,
      );
      const suppression = decoded.at(0);
      if (suppression === undefined) {
        return yield* storageError("setSuppression.emptyResult", undefined);
      }
      return suppression;
    },
    Effect.catchTag("SqlError", (cause) =>
      Effect.fail(storageError("setSuppression", cause)),
    ),
  );

  const resetSuppression = Effect.fn("NotificationService.resetSuppression")(
    function* (rawInput: ResetSuppressionInputType) {
      const input = yield* decodeInput(
        "resetSuppression",
        ResetSuppressionInput,
        rawInput,
      );
      const recipientAddress = canonicalRecipientAddress(
        input.channel,
        input.recipientAddress,
      );
      const rows = yield* sql`
        DELETE FROM notification_suppressions x
        WHERE ${exactScope(sql, "x", input.scope)}
          AND x.channel = ${input.channel}
          AND x.purpose IS NOT DISTINCT FROM ${input.purpose}
          AND x.recipient_address = ${recipientAddress}
        RETURNING x.id
      `;
      return rows.length > 0;
    },
    Effect.catchTag("SqlError", (cause) =>
      Effect.fail(storageError("resetSuppression", cause)),
    ),
  );

  const listDeliveries = Effect.fn("NotificationService.listDeliveries")(
    function* (rawInput: ListDeliveriesInputType) {
      const input = yield* decodeInput(
        "listDeliveries",
        ListDeliveriesInput,
        rawInput,
      );
      const clauses = [exactScope(sql, "d", input.scope)];
      if (input.channel !== null) {
        clauses.push(sql`d.channel = ${input.channel}`);
      }
      if (input.statuses.length > 0) {
        clauses.push(sql`d.status IN ${sql.in(input.statuses)}`);
      }
      if (input.pagination.cursor !== null) {
        clauses.push(sql`
          (d.created_at, d.id) < (
            ${input.pagination.cursor.createdAt},
            ${input.pagination.cursor.id}
          )
        `);
      }

      const rows = yield* sql`
        SELECT ${deliveryColumns(sql)}
        FROM notification_deliveries d
        WHERE ${sql.and(clauses)}
        ORDER BY d.created_at DESC, d.id DESC
        LIMIT ${input.pagination.limit + 1}
      `;
      const decoded = yield* decodeRows(
        "notification deliveries",
        NotificationDelivery,
        rows,
      );
      const hasMore = decoded.length > input.pagination.limit;
      const items = hasMore
        ? decoded.slice(0, input.pagination.limit)
        : decoded;
      const last = items.at(-1);
      return {
        items,
        nextCursor:
          hasMore && last !== undefined
            ? { createdAt: last.createdAt, id: last.id }
            : null,
      };
    },
    Effect.catchTag("SqlError", (cause) =>
      Effect.fail(storageError("listDeliveries", cause)),
    ),
  );

  const getDelivery = Effect.fn("NotificationService.getDelivery")(
    function* (rawInput: DeliveryMutationInputType) {
      const input = yield* decodeInput(
        "getDelivery",
        DeliveryMutationInput,
        rawInput,
      );
      const deliveryRows = yield* sql`
        SELECT ${deliveryColumns(sql)}
        FROM notification_deliveries d
        WHERE d.id = ${input.deliveryId}
          AND ${exactScope(sql, "d", input.scope)}
        LIMIT 1
      `;
      const delivery = yield* requireDelivery({
        id: input.deliveryId,
        rows: deliveryRows,
      });
      const attemptRows = yield* sql`
        SELECT ${attemptColumns(sql)}
        FROM notification_delivery_attempts
        WHERE delivery_id = ${delivery.id}
        ORDER BY generation ASC
      `;
      const attempts = yield* decodeRows(
        "notification delivery attempts",
        NotificationDeliveryAttempt,
        attemptRows,
      );
      const referenceRows = yield* sql`
        SELECT ${referenceColumns(sql)}
        FROM notification_delivery_references
        WHERE delivery_id = ${delivery.id}
        ORDER BY namespace ASC, value ASC
      `;
      const references = yield* decodeRows(
        "notification delivery references",
        NotificationDeliveryReference,
        referenceRows,
      );
      return { delivery, attempts, references };
    },
    Effect.catchTag("SqlError", (cause) =>
      Effect.fail(storageError("getDelivery", cause)),
    ),
  );

  const cancelDelivery = Effect.fn("NotificationService.cancelDelivery")(
    function* (rawInput: DeliveryMutationInputType) {
      const input = yield* decodeInput(
        "cancelDelivery",
        DeliveryMutationInput,
        rawInput,
      );
      const now = yield* DateTime.nowAsDate;
      return yield* sql.withTransaction(
        Effect.gen(function* () {
          const currentRows = yield* sql`
            SELECT ${deliveryColumns(sql)}
            FROM notification_deliveries d
            WHERE d.id = ${input.deliveryId}
              AND ${exactScope(sql, "d", input.scope)}
            LIMIT 1
            FOR UPDATE
          `;
          const current = yield* requireDelivery({
            id: input.deliveryId,
            rows: currentRows,
          });
          if (current.status === "cancelled") return current;
          if (
            current.status === "sent" ||
            current.status === "failed" ||
            current.status === "suppressed" ||
            current.status === "processing"
          ) {
            return yield* new NotificationTransitionError({
              entity: "delivery",
              id: current.id,
              status: current.status,
              operation: "cancelDelivery",
            });
          }

          const releasedAttempts =
            current.currentJobId === null
              ? current.attempts
              : Math.max(0, current.attempts - 1);
          if (current.currentJobId !== null) {
            yield* sql`
              UPDATE notification_delivery_attempts
              SET
                outcome = 'skipped',
                error_message = 'cancelled',
                completed_at = ${now}
              WHERE delivery_id = ${current.id}
                AND job_id = ${current.currentJobId}
                AND outcome IS NULL
            `;
          }

          const rows = yield* sql`
            UPDATE notification_deliveries
            SET
              status = 'cancelled',
              attempts = ${releasedAttempts},
              current_job_id = NULL,
              queued_at = NULL,
              processing_at = NULL,
              claimed_by = NULL,
              lease_expires_at = NULL,
              cancelled_at = ${now},
              updated_at = ${now}
            WHERE id = ${current.id}
            RETURNING ${deliveryColumns(sql)}
          `;
          return yield* requireDelivery({ id: current.id, rows });
        }),
      );
    },
    Effect.catchTag("SqlError", (cause) =>
      Effect.fail(storageError("cancelDelivery", cause)),
    ),
  );

  const retryDelivery = Effect.fn("NotificationService.retryDelivery")(
    function* (rawInput: DeliveryMutationInputType) {
      const input = yield* decodeInput(
        "retryDelivery",
        DeliveryMutationInput,
        rawInput,
      );
      const now = yield* DateTime.nowAsDate;
      return yield* sql.withTransaction(
        Effect.gen(function* () {
          const currentRows = yield* sql`
            SELECT ${deliveryColumns(sql)}
            FROM notification_deliveries d
            WHERE d.id = ${input.deliveryId}
              AND ${exactScope(sql, "d", input.scope)}
            LIMIT 1
            FOR UPDATE
          `;
          const current = yield* requireDelivery({
            id: input.deliveryId,
            rows: currentRows,
          });
          if (current.status !== "failed" && current.status !== "cancelled") {
            return yield* new NotificationTransitionError({
              entity: "delivery",
              id: current.id,
              status: current.status,
              operation: "retryDelivery",
            });
          }
          if (current.attempts >= current.maxAttempts) {
            return yield* new NotificationTransitionError({
              entity: "delivery",
              id: current.id,
              status: current.status,
              operation: "retryDelivery",
            });
          }
          yield* sql`
            UPDATE notification_deliveries
            SET
              status = 'retrying',
              current_job_id = NULL,
              queued_at = NULL,
              processing_at = NULL,
              provider = NULL,
              provider_message_id = NULL,
              error_message = NULL,
              scheduled_for = ${now},
              failed_at = NULL,
              cancelled_at = NULL,
              claimed_by = NULL,
              lease_expires_at = NULL,
              updated_at = ${now}
            WHERE id = ${current.id}
          `;
          yield* allocateDeliveryJob({
            sql,
            queues,
            deliveryId: current.id,
            attempts: current.attempts,
            jobGeneration: current.jobGeneration,
            now,
          });
          const rows = yield* sql`
            SELECT ${deliveryColumns(sql)}
            FROM notification_deliveries
            WHERE id = ${current.id}
          `;
          return yield* requireDelivery({ id: current.id, rows });
        }),
      );
    },
    Effect.catchTag("SqlError", (cause) =>
      Effect.fail(storageError("retryDelivery", cause)),
    ),
  );

  const scheduleReminder = Effect.fn("NotificationService.scheduleReminder")(
    function* (rawInput: ScheduleReminderInputType) {
      const input = yield* decodeInput(
        "scheduleReminder",
        ScheduleReminderInput,
        rawInput,
      );
      const now = yield* DateTime.nowAsDate;
      const requestFingerprint = reminderFingerprint(input);
      return yield* sql.withTransaction(
        Effect.gen(function* () {
          yield* sql`
            SELECT pg_advisory_xact_lock(
              hashtextextended(${`notification:reminder:${input.idempotencyKey}`}, 0)
            )
          `;
          const existingRows = yield* sql`
            SELECT
              ${reminderColumns(sql, "r")},
              r.request_fingerprint AS "requestFingerprint"
            FROM notification_reminders r
            WHERE r.idempotency_key = ${input.idempotencyKey}
            LIMIT 1
            FOR UPDATE
          `;
          const existing = yield* decodeRows(
            "notification reminder",
            NotificationReminder,
            existingRows,
          );
          const replay = existing.at(0);
          if (replay !== undefined) {
            const fingerprintRows = yield* decodeRows(
              "notification reminder fingerprint",
              ReminderFingerprintRecord,
              existingRows,
            );
            const persistedFingerprint = fingerprintRows.at(0);
            if (persistedFingerprint === undefined) {
              return yield* storageError(
                "scheduleReminder.missingFingerprint",
                undefined,
              );
            }
            const expectedFingerprint =
              persistedFingerprint.requestFingerprint ??
              reminderFingerprint({
                idempotencyKey: replay.idempotencyKey,
                scope: replay.scope,
                handlerKey: replay.handlerKey,
                handlerVersion: replay.handlerVersion,
                payload: replay.payload,
                scheduledFor: replay.scheduledFor,
                expiresAt: replay.expiresAt,
                maxAttempts: replay.maxAttempts,
              });
            if (expectedFingerprint !== requestFingerprint) {
              return yield* new NotificationIdempotencyConflictError({
                idempotencyKey: input.idempotencyKey,
                message: "Idempotency key reused with a changed reminder",
              });
            }
            return replay;
          }

          const reminderId = globalThis.crypto.randomUUID();
          const expired =
            input.expiresAt !== null &&
            input.expiresAt.getTime() <= now.getTime();
          yield* sql`
            INSERT INTO notification_reminders (
              id,
              idempotency_key,
              recipient_user_id,
              organization_id,
              workspace_id,
              handler_key,
              handler_version,
              payload,
              request_fingerprint,
              status,
              scheduled_for,
              attempts,
              max_attempts,
              expires_at,
              last_error,
              cancelled_at,
              created_at,
              updated_at
            ) VALUES (
              ${reminderId},
              ${input.idempotencyKey},
              ${input.scope.recipientUserId},
              ${input.scope.organizationId},
              ${input.scope.workspaceId},
              ${input.handlerKey},
              ${input.handlerVersion},
              ${input.payload},
              ${requestFingerprint},
              ${expired ? "cancelled" : "scheduled"},
              ${input.scheduledFor},
              0,
              ${input.maxAttempts ?? 5},
              ${input.expiresAt},
              ${expired ? "expired_before_enqueue" : null},
              ${expired ? now : null},
              ${now},
              ${now}
            )
          `;
          if (!expired && input.scheduledFor.getTime() <= now.getTime()) {
            yield* allocateReminderJob({
              sql,
              queues,
              reminderId,
              attempts: 0,
              jobGeneration: 0,
              now,
            });
          }
          const rows = yield* sql`
            SELECT ${reminderColumns(sql)}
            FROM notification_reminders
            WHERE id = ${reminderId}
          `;
          return yield* requireReminder({ id: reminderId, rows });
        }),
      );
    },
    Effect.catchTag("SqlError", (cause) =>
      Effect.fail(storageError("scheduleReminder", cause)),
    ),
  );

  const getReminder = Effect.fn("NotificationService.getReminder")(
    function* (rawInput: ReminderMutationInputType) {
      const input = yield* decodeInput(
        "getReminder",
        ReminderMutationInput,
        rawInput,
      );
      const rows = yield* sql`
        SELECT ${reminderColumns(sql, "r")}
        FROM notification_reminders r
        WHERE r.id = ${input.reminderId}
          AND ${exactScope(sql, "r", input.scope)}
        LIMIT 1
      `;
      return yield* requireReminder({ id: input.reminderId, rows });
    },
    Effect.catchTag("SqlError", (cause) =>
      Effect.fail(storageError("getReminder", cause)),
    ),
  );

  const listReminders = Effect.fn("NotificationService.listReminders")(
    function* (rawInput: ListRemindersInputType) {
      const input = yield* decodeInput(
        "listReminders",
        ListRemindersInput,
        rawInput,
      );
      const clauses = [exactScope(sql, "r", input.scope)];
      if (input.statuses.length > 0) {
        clauses.push(sql`r.status IN ${sql.in(input.statuses)}`);
      }
      if (input.pagination.cursor !== null) {
        clauses.push(sql`
          (r.created_at, r.id) < (
            ${input.pagination.cursor.createdAt},
            ${input.pagination.cursor.id}
          )
        `);
      }
      const rows = yield* sql`
        SELECT ${reminderColumns(sql, "r")}
        FROM notification_reminders r
        WHERE ${sql.and(clauses)}
        ORDER BY r.created_at DESC, r.id DESC
        LIMIT ${input.pagination.limit + 1}
      `;
      const decoded = yield* decodeRows(
        "notification reminders",
        NotificationReminder,
        rows,
      );
      const hasMore = decoded.length > input.pagination.limit;
      const items = hasMore
        ? decoded.slice(0, input.pagination.limit)
        : decoded;
      const last = items.at(-1);
      return {
        items,
        nextCursor:
          hasMore && last !== undefined
            ? { createdAt: last.createdAt, id: last.id }
            : null,
      };
    },
    Effect.catchTag("SqlError", (cause) =>
      Effect.fail(storageError("listReminders", cause)),
    ),
  );

  const rescheduleReminder = Effect.fn(
    "NotificationService.rescheduleReminder",
  )(
    function* (rawInput: RescheduleReminderInputType) {
      const input = yield* decodeInput(
        "rescheduleReminder",
        RescheduleReminderInput,
        rawInput,
      );
      const now = yield* DateTime.nowAsDate;
      return yield* sql.withTransaction(
        Effect.gen(function* () {
          const currentRows = yield* sql`
            SELECT ${reminderColumns(sql)}
            FROM notification_reminders r
            WHERE r.id = ${input.reminderId}
              AND ${exactScope(sql, "r", input.scope)}
            LIMIT 1
            FOR UPDATE
          `;
          const current = yield* requireReminder({
            id: input.reminderId,
            rows: currentRows,
          });
          const releasedAttempts =
            current.status === "queued" && current.currentJobId !== null
              ? Math.max(0, current.attempts - 1)
              : current.attempts;
          if (
            current.status === "completed" ||
            current.status === "processing" ||
            releasedAttempts >= current.maxAttempts
          ) {
            return yield* new NotificationTransitionError({
              entity: "reminder",
              id: current.id,
              status: current.status,
              operation: "rescheduleReminder",
            });
          }
          const expired =
            input.expiresAt !== null &&
            input.expiresAt.getTime() <= now.getTime();
          yield* sql`
            UPDATE notification_reminders
            SET
              status = ${expired ? "cancelled" : "scheduled"},
              scheduled_for = ${input.scheduledFor},
              attempts = ${releasedAttempts},
              current_job_id = NULL,
              queued_at = NULL,
              expires_at = ${input.expiresAt},
              last_error = ${expired ? "expired_before_enqueue" : null},
              completed_at = NULL,
              failed_at = NULL,
              cancelled_at = ${expired ? now : null},
              updated_at = ${now}
            WHERE id = ${current.id}
          `;
          if (!expired && input.scheduledFor.getTime() <= now.getTime()) {
            yield* allocateReminderJob({
              sql,
              queues,
              reminderId: current.id,
              attempts: releasedAttempts,
              jobGeneration: current.jobGeneration,
              now,
            });
          }
          const rows = yield* sql`
            SELECT ${reminderColumns(sql)}
            FROM notification_reminders
            WHERE id = ${current.id}
          `;
          return yield* requireReminder({ id: current.id, rows });
        }),
      );
    },
    Effect.catchTag("SqlError", (cause) =>
      Effect.fail(storageError("rescheduleReminder", cause)),
    ),
  );

  const cancelReminder = Effect.fn("NotificationService.cancelReminder")(
    function* (rawInput: CancelReminderInputType) {
      const input = yield* decodeInput(
        "cancelReminder",
        CancelReminderInput,
        rawInput,
      );
      const now = yield* DateTime.nowAsDate;
      return yield* sql.withTransaction(
        Effect.gen(function* () {
          const currentRows = yield* sql`
            SELECT ${reminderColumns(sql)}
            FROM notification_reminders r
            WHERE r.id = ${input.reminderId}
              AND ${exactScope(sql, "r", input.scope)}
            LIMIT 1
            FOR UPDATE
          `;
          const current = yield* requireReminder({
            id: input.reminderId,
            rows: currentRows,
          });
          if (current.status === "cancelled") return current;
          if (
            current.status === "completed" ||
            current.status === "failed" ||
            current.status === "processing"
          ) {
            return yield* new NotificationTransitionError({
              entity: "reminder",
              id: current.id,
              status: current.status,
              operation: "cancelReminder",
            });
          }
          const releasedAttempts =
            current.status === "queued" && current.currentJobId !== null
              ? Math.max(0, current.attempts - 1)
              : current.attempts;
          const rows = yield* sql`
            UPDATE notification_reminders
            SET
              status = 'cancelled',
              attempts = ${releasedAttempts},
              current_job_id = NULL,
              queued_at = NULL,
              cancelled_at = ${now},
              updated_at = ${now}
            WHERE id = ${current.id}
            RETURNING ${reminderColumns(sql)}
          `;
          return yield* requireReminder({ id: current.id, rows });
        }),
      );
    },
    Effect.catchTag("SqlError", (cause) =>
      Effect.fail(storageError("cancelReminder", cause)),
    ),
  );

  return {
    publish,
    listInbox,
    unreadCount,
    markRead,
    markUnread,
    archive,
    restore,
    removeInbox,
    markReadBulk,
    archiveBulk,
    listPreferences,
    setPreference,
    resetPreference,
    resolvePreference,
    listSuppressions,
    setSuppression,
    resetSuppression,
    listDeliveries,
    getDelivery,
    cancelDelivery,
    retryDelivery,
    scheduleReminder,
    getReminder,
    listReminders,
    rescheduleReminder,
    cancelReminder,
  } satisfies NotificationServiceContract;
});

export class NotificationService extends Context.Service<
  NotificationService,
  NotificationServiceContract
>()("@krak-stack/notifications/NotificationService") {
  static readonly layerWithoutMigrations = Layer.effect(
    this,
    makeNotificationService,
  ).pipe(Layer.provide(notificationQueueLayer));

  static readonly layer = Layer.effect(
    this,
    Effect.gen(function* () {
      yield* runNotificationMigrations;
      return yield* makeNotificationService;
    }),
  ).pipe(Layer.provide(notificationQueueLayer));
}

export * from "./schema.js";
