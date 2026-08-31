import {
  SESv2Client,
  SendEmailCommand,
  type Body,
  type Destination,
  type Message,
} from "@aws-sdk/client-sesv2";
import { Config, Context, Effect, Layer, Redacted, Schema } from "effect";

import type { Json } from "effect/Schema";

import {
  type NotificationChannel,
  type NotificationMessage,
} from "../index.js";
import { NotificationSendError } from "../../schema.js";

import { SesEmailNotification } from "./schema.js";

declare module "../index.js" {
  interface NotificationChannels {
    readonly email: SesEmailNotification;
  }
}

interface SesAccessKey {
  readonly id: Redacted.Redacted<string>;
  readonly secret: Redacted.Redacted<string>;
}

interface SesIdentity {
  readonly region: string;
  readonly from: string | undefined;
}

interface SesNotificationConfigService {
  readonly identity: SesIdentity;
  readonly accessKey: SesAccessKey;
}

export class SesNotificationConfig extends Context.Service<
  SesNotificationConfig,
  SesNotificationConfigService
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
  NotificationChannel<"email", SesEmailNotification>
>()("SesNotificationChannel", {
  make: Effect.gen(function* () {
    const { accessKey, identity } = yield* SesNotificationConfig;
    const client = new SESv2Client({
      region: identity.region,
      credentials: {
        accessKeyId: Redacted.value(accessKey.id),
        secretAccessKey: Redacted.value(accessKey.secret),
      },
    });

    const send = Effect.fn("SesNotificationChannel.send")(function* (
      payload: Json,
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
              ReplyToAddresses: email.replyTo?.length
                ? Array.from(email.replyTo)
                : undefined,
            }),
          ),
        catch: (error) =>
          notificationSendError("Failed to send SES email", error),
      });
    });

    return { key: "email", send } satisfies NotificationChannel<
      "email",
      SesEmailNotification
    >;
  }),
}) {
  static readonly layer = Layer.effect(this, this.make).pipe(
    Layer.provide(SesNotificationConfig.layer),
  );
}

const notificationSendError = (
  message: string,
  error?: NotificationSendError["error"],
): NotificationSendError =>
  new NotificationSendError({
    channel: "email",
    message,
    error,
  });

const decodeEmail = (payload: Json) =>
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

  const body: Body = {};
  if (text) body.Text = { Data: text, Charset: "UTF-8" };
  if (html) body.Html = { Data: html, Charset: "UTF-8" };

  return Effect.succeed(body);
};

const recipients = (to: SesEmailNotification["to"]) =>
  Array.isArray(to) ? Array.from(to) : [to];

const buildDestination = (email: SesEmailNotification) => {
  const destination: Destination = { ToAddresses: recipients(email.to) };
  if (email.cc?.length) destination.CcAddresses = Array.from(email.cc);
  if (email.bcc?.length) destination.BccAddresses = Array.from(email.bcc);
  return destination;
};
