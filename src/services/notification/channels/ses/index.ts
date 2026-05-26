import {
  SESv2Client,
  SendEmailCommand,
  type Body,
  type Destination,
  type Message,
} from "@aws-sdk/client-sesv2";
import { Config, Context, Effect, Layer, Redacted, Schema } from "effect";

import {
  NotificationChannelRegistry,
  type NotificationChannelShape,
} from "../../channel";
import { NotificationService } from "../../index";
import { NotificationMessage, NotificationSendError } from "../../schema";

import { SesEmailNotification } from "./schema";

interface SesAccessKey {
  readonly id: Redacted.Redacted<string>;
  readonly secret: Redacted.Redacted<string>;
}

interface SesIdentity {
  readonly region: string;
  readonly from: string | undefined;
}

interface SesNotificationConfigShape {
  readonly identity: SesIdentity;
  readonly accessKey: SesAccessKey;
}

export class SesNotificationConfig extends Context.Service<
  SesNotificationConfig,
  SesNotificationConfigShape
>()("SesNotificationConfig", {
  make: Effect.gen(function* () {
    const region = yield* Config.string("SES_REGION");
    const id = yield* Config.redacted("SES_ACCESS_KEY_ID");
    const secret = yield* Config.redacted("SES_SECRET_ACCESS_KEY");
    const from = yield* Config.string("NOTIFICATION_EMAIL_FROM").pipe(
      Config.orElse(() => Config.succeed("")),
    );

    return {
      identity: { region, from: from || undefined },
      accessKey: { id, secret },
    };
  }),
}) {
  static readonly layer = Layer.effect(this, this.make);
}

export class SesNotificationChannel extends Context.Service<
  SesNotificationChannel,
  NotificationChannelShape
>()("SesNotificationChannel") {}

const notificationSendError = (
  message: string,
  error?: unknown,
): NotificationSendError =>
  new NotificationSendError({
    channel: "email",
    message,
    ...(error === undefined ? {} : { error }),
  });

const decodeEmail = (payload: unknown) =>
  Schema.decodeUnknownEffect(SesEmailNotification)(payload).pipe(
    Effect.mapError((error) =>
      notificationSendError("Invalid SES email notification payload", error),
    ),
  );

const requireBody = (email: SesEmailNotification) => {
  const { html, text } = email;

  if (!html && !text) {
    return Effect.fail(
      notificationSendError("SES email notification requires text or html"),
    );
  }

  const body = {
    ...(text ? { Text: { Data: text, Charset: "UTF-8" } } : {}),
    ...(html ? { Html: { Data: html, Charset: "UTF-8" } } : {}),
  } satisfies Body;

  return Effect.succeed(body);
};

const recipients = (to: SesEmailNotification["to"]) =>
  Array.isArray(to) ? Array.from(to) : [to];

const buildDestination = (email: SesEmailNotification) =>
  ({
    ToAddresses: recipients(email.to),
    ...(email.cc?.length ? { CcAddresses: Array.from(email.cc) } : {}),
    ...(email.bcc?.length ? { BccAddresses: Array.from(email.bcc) } : {}),
  }) satisfies Destination;

export const sesNotificationChannelLayer = Layer.effect(
  SesNotificationChannel,
  Effect.gen(function* () {
    const { accessKey, identity } = yield* SesNotificationConfig;
    const client = new SESv2Client({
      region: identity.region,
      credentials: {
        accessKeyId: Redacted.value(accessKey.id),
        secretAccessKey: Redacted.value(accessKey.secret),
      },
    });

    const send = Effect.fn("SesNotificationChannel.send")(function* (
      payload: unknown,
      _message: NotificationMessage,
    ) {
      const email = yield* decodeEmail(payload);
      const from = email.from ?? identity.from;

      if (!from) {
        return yield* notificationSendError(
          "SES email notification requires from or NOTIFICATION_EMAIL_FROM",
        );
      }

      const body = yield* requireBody(email);
      const emailMessage = {
        Subject: { Data: email.subject, Charset: "UTF-8" },
        Body: body,
      } satisfies Message;

      yield* Effect.tryPromise({
        try: () =>
          client.send(
            new SendEmailCommand({
              FromEmailAddress: from,
              Destination: buildDestination(email),
              Content: { Simple: emailMessage },
              ...(email.replyTo?.length
                ? { ReplyToAddresses: Array.from(email.replyTo) }
                : {}),
            }),
          ),
        catch: (error) =>
          notificationSendError("Failed to send SES email", error),
      });
    });

    return { key: "email", send } satisfies NotificationChannelShape;
  }),
).pipe(Layer.provide(SesNotificationConfig.layer));

export const sesNotificationChannelRegistryLayer = Layer.effect(
  NotificationChannelRegistry,
  Effect.gen(function* () {
    const channel = yield* SesNotificationChannel;
    return { channels: [channel] };
  }),
).pipe(Layer.provide(sesNotificationChannelLayer));

export const sesNotificationServiceLayer = NotificationService.layer.pipe(
  Layer.provide(sesNotificationChannelRegistryLayer),
);
