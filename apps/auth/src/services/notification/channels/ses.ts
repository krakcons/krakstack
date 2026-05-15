import {
  SESv2Client,
  SendEmailCommand,
  type Body,
  type Destination,
  type Message,
} from "@aws-sdk/client-sesv2";
import { Config, Context, Effect, Layer, Redacted } from "effect";

import { NotificationService } from "../index";
import { NotificationChannelService } from "../channel";
import type { NotificationEmailMessage } from "../schema";
import { NotificationSendError } from "../schema";

interface SesAccessKey {
  readonly id: Redacted.Redacted<string>;
  readonly secret: Redacted.Redacted<string>;
}

interface SesIdentity {
  readonly region: string;
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

    return {
      identity: { region },
      accessKey: { id, secret },
    };
  }),
}) {
  static readonly layer = Layer.effect(this, this.make);
}

const notificationSendError = (message: string, error?: unknown) =>
  new NotificationSendError({
    message,
    ...(error === undefined ? {} : { error }),
  });

const requireBody = (message: NotificationEmailMessage) => {
  const { html, text } = message.content;

  if (!html && !text) {
    return Effect.fail(
      notificationSendError("Notification email requires text or html content"),
    );
  }

  const body = {
    ...(text ? { Text: { Data: text, Charset: "UTF-8" } } : {}),
    ...(html ? { Html: { Data: html, Charset: "UTF-8" } } : {}),
  } satisfies Body;

  return Effect.succeed(body);
};

const buildDestination = (message: NotificationEmailMessage) =>
  ({
    ToAddresses: Array.from(message.to),
    ...(message.cc?.length ? { CcAddresses: Array.from(message.cc) } : {}),
    ...(message.bcc?.length ? { BccAddresses: Array.from(message.bcc) } : {}),
  }) satisfies Destination;

export const sesNotificationChannelLayer = Layer.effect(
  NotificationChannelService,
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
      notification: NotificationEmailMessage,
    ) {
      const body = yield* requireBody(notification);
      const emailMessage = {
        Subject: { Data: notification.content.subject, Charset: "UTF-8" },
        Body: body,
      } satisfies Message;

      yield* Effect.tryPromise({
        try: () =>
          client.send(
            new SendEmailCommand({
              FromEmailAddress: notification.from,
              Destination: buildDestination(notification),
              Content: { Simple: emailMessage },
              ...(notification.replyTo?.length
                ? { ReplyToAddresses: Array.from(notification.replyTo) }
                : {}),
            }),
          ),
        catch: (error) => notificationSendError("Failed to send email", error),
      });
    });

    return { send };
  }),
).pipe(Layer.provide(SesNotificationConfig.layer));

export const sesNotificationServiceLayer = NotificationService.layer.pipe(
  Layer.provide(sesNotificationChannelLayer),
);
