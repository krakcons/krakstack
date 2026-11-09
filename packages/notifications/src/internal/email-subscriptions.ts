import { SqlClient, SqlSchema } from "effect/sql";
import { Effect, Schema } from "effect";

import {
  EmailSubscription,
  EmailSubscriptionInput,
  NotificationDataError,
} from "../schema.js";
import { decodeInput, storageError } from "./sql.js";

const queryError = (operation: string, cause: { readonly _tag: string }) =>
  cause._tag === "SchemaError"
    ? new NotificationDataError({
        entity: "email subscription",
        message: "Could not decode persisted email subscription",
        cause,
      })
    : storageError(operation, cause);

export const makeEmailSubscriptions = (sql: SqlClient.SqlClient) => {
  const get = SqlSchema.findOne({
    Request: EmailSubscriptionInput,
    Result: EmailSubscription,
    execute: ({ recipientUserId }) => sql`
      SELECT
        ${recipientUserId}::text AS "recipientUserId",
        (SELECT unsubscribed_at FROM notification_email_unsubscribes
         WHERE recipient_user_id = ${recipientUserId}) AS "unsubscribedAt"
    `,
  });
  const unsubscribe = SqlSchema.findOne({
    Request: EmailSubscriptionInput,
    Result: EmailSubscription,
    execute: ({ recipientUserId }) => sql`
      INSERT INTO notification_email_unsubscribes (recipient_user_id)
      VALUES (${recipientUserId})
      ON CONFLICT (recipient_user_id) DO UPDATE
        SET recipient_user_id = EXCLUDED.recipient_user_id
      RETURNING recipient_user_id AS "recipientUserId", unsubscribed_at AS "unsubscribedAt"
    `,
  });
  const isUnsubscribed = SqlSchema.findOne({
    Request: EmailSubscriptionInput,
    Result: Schema.Struct({ unsubscribed: Schema.Boolean }).annotate({
      identifier: "NotificationEmailUnsubscribeCheck",
    }),
    execute: ({ recipientUserId }) => sql`
      SELECT EXISTS (
        SELECT 1 FROM notification_email_unsubscribes
        WHERE recipient_user_id = ${recipientUserId}
      ) AS unsubscribed
    `,
  });

  return {
    get: Effect.fn("NotificationService.getEmailSubscription")(function* (
      rawInput: EmailSubscriptionInput,
    ) {
      const input = yield* decodeInput(
        "getEmailSubscription",
        EmailSubscriptionInput,
        rawInput,
      );
      return yield* get(input).pipe(
        Effect.mapError((cause) => queryError("getEmailSubscription", cause)),
      );
    }),
    unsubscribe: Effect.fn("NotificationService.unsubscribeEmail")(function* (
      rawInput: EmailSubscriptionInput,
    ) {
      const input = yield* decodeInput(
        "unsubscribeEmail",
        EmailSubscriptionInput,
        rawInput,
      );
      return yield* unsubscribe(input).pipe(
        Effect.mapError((cause) => queryError("unsubscribeEmail", cause)),
      );
    }),
    isUnsubscribed: (input: EmailSubscriptionInput) =>
      isUnsubscribed(input).pipe(
        Effect.map(({ unsubscribed }) => unsubscribed),
        Effect.mapError((cause) => queryError("isEmailUnsubscribed", cause)),
      ),
  };
};
