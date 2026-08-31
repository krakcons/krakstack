import {
  SESv2Client,
  SendEmailCommand,
  type Body,
  type Destination,
  type Message,
} from "@aws-sdk/client-sesv2";
import {
  Config,
  Context,
  Effect,
  Layer,
  Option,
  Redacted,
  Schema,
} from "effect";

import {
  NotificationTransportPermanent,
  NotificationTransportRegistry,
  NotificationTransportRetryable,
  NotificationTransportUnavailable,
  type NotificationTransport,
  type NotificationTransportFailure,
  type NotificationTransportResult,
} from "../transport.js";
import {
  decodeEmailAddress,
  decodeEmailPayloadV1,
  decodeEmailRecipient,
  formatEmailRecipient,
  type EmailPayloadV1,
} from "./email.js";

const SesProviderErrorDetailsSchema = Schema.Struct({
  name: Schema.optional(Schema.String),
  code: Schema.optional(Schema.String),
  $metadata: Schema.optional(
    Schema.Struct({
      httpStatusCode: Schema.optional(Schema.Int),
    }),
  ),
}).annotate({ identifier: "SesProviderErrorDetails" });

export type SesProviderErrorDetails = typeof SesProviderErrorDetailsSchema.Type;
export type SesTransportErrorKind = "retryable" | "unavailable" | "permanent";

const retryableNames = new Set([
  "TooManyRequestsException",
  "ThrottlingException",
  "Throttling",
  "LimitExceededException",
  "RequestTimeout",
  "RequestTimeoutException",
  "TimeoutError",
  "NetworkingError",
  "ECONNRESET",
  "ECONNREFUSED",
  "ETIMEDOUT",
  "EAI_AGAIN",
  "ENETUNREACH",
]);

const unavailableNames = new Set([
  "CredentialsProviderError",
  "InvalidClientTokenId",
  "UnrecognizedClientException",
  "SignatureDoesNotMatch",
  "AccessDeniedException",
  "UnauthorizedException",
  "ExpiredTokenException",
  "AccountSuspendedException",
  "SendingPausedException",
  "MailFromDomainNotVerifiedException",
]);

const decodeSesProviderErrorDetails = Schema.decodeUnknownOption(
  SesProviderErrorDetailsSchema,
);

export const classifySesTransportError = (
  details: SesProviderErrorDetails,
): SesTransportErrorKind => {
  const name = details.name ?? details.code;
  const status = details.$metadata?.httpStatusCode;

  if (
    (name !== undefined && unavailableNames.has(name)) ||
    status === 401 ||
    status === 403
  ) {
    return "unavailable";
  }
  if (
    (name !== undefined && retryableNames.has(name)) ||
    status === 408 ||
    status === 429 ||
    (status !== undefined && status >= 500)
  ) {
    return "retryable";
  }
  if (status !== undefined && status >= 400 && status < 500) {
    return "permanent";
  }
  return "retryable";
};

const unavailable = (message: string) =>
  new NotificationTransportUnavailable({ channel: "email", message });

const classifyFailure = (cause: unknown): NotificationTransportFailure => {
  const details: SesProviderErrorDetails = decodeSesProviderErrorDetails(
    cause,
  ).pipe(Option.getOrElse(() => ({})));
  const kind = classifySesTransportError(details);
  if (kind === "unavailable") {
    return new NotificationTransportUnavailable({
      channel: "email",
      message: "SES email transport is unavailable",
      cause,
    });
  }
  if (kind === "permanent") {
    return new NotificationTransportPermanent({
      channel: "email",
      message: "SES rejected the email request",
      cause,
    });
  }
  return new NotificationTransportRetryable({
    channel: "email",
    message: "SES email delivery failed transiently",
    cause,
  });
};

const message = (email: EmailPayloadV1): Message => {
  const body: Body = {};
  if (email.text !== undefined) {
    body.Text = { Data: email.text, Charset: "UTF-8" };
  }
  if (email.html !== undefined) {
    body.Html = { Data: email.html, Charset: "UTF-8" };
  }
  return {
    Subject: { Data: email.subject, Charset: "UTF-8" },
    Body: body,
  };
};

const makeSesEmailTransport = Effect.gen(function* () {
  const environment = yield* Effect.gen(function* () {
    const region = yield* Config.nonEmptyString("SES_REGION");
    const accessKeyId = yield* Config.redacted("SES_ACCESS_KEY_ID");
    const secretAccessKey = yield* Config.redacted("SES_SECRET_ACCESS_KEY");
    const defaultFromValue = yield* Config.string(
      "NOTIFICATION_EMAIL_FROM",
    ).pipe(Config.orElse(() => Config.succeed("")));
    return { region, accessKeyId, secretAccessKey, defaultFromValue };
  }).pipe(
    Effect.mapError(() =>
      unavailable("SES email transport configuration is unavailable"),
    ),
  );

  const accessKeyId = yield* Schema.decodeUnknownEffect(Schema.NonEmptyString)(
    Redacted.value(environment.accessKeyId),
  ).pipe(Effect.mapError(() => unavailable("SES access key is unavailable")));
  const secretAccessKey = yield* Schema.decodeUnknownEffect(
    Schema.NonEmptyString,
  )(Redacted.value(environment.secretAccessKey)).pipe(
    Effect.mapError(() => unavailable("SES secret key is unavailable")),
  );
  const defaultFrom =
    environment.defaultFromValue.length === 0
      ? undefined
      : yield* decodeEmailAddress(environment.defaultFromValue).pipe(
          Effect.mapError(() =>
            unavailable("SES default sender address is invalid"),
          ),
        );

  const client = yield* Effect.acquireRelease(
    Effect.sync(
      () =>
        new SESv2Client({
          region: environment.region,
          credentials: { accessKeyId, secretAccessKey },
        }),
    ),
    (client) => Effect.sync(() => client.destroy()),
  );

  const send = Effect.fn("SesEmailTransport.send")(
    function* (
      input,
    ): Effect.fn.Return<
      NotificationTransportResult,
      NotificationTransportFailure
    > {
      if (input.payloadVersion !== 1) {
        return yield* new NotificationTransportPermanent({
          channel: "email",
          message: `Unsupported email payload version: ${input.payloadVersion}`,
        });
      }
      const email = yield* decodeEmailPayloadV1(input.payload).pipe(
        Effect.mapError(
          (cause) =>
            new NotificationTransportPermanent({
              channel: "email",
              message: "Malformed email payload",
              cause,
            }),
        ),
      );
      const recipient = yield* decodeEmailRecipient({
        address: input.recipientAddress,
        name: input.recipientName,
      }).pipe(
        Effect.mapError(
          (cause) =>
            new NotificationTransportPermanent({
              channel: "email",
              message: "Invalid email recipient",
              cause,
            }),
        ),
      );
      const from = email.from ?? defaultFrom;
      if (from === undefined) {
        return yield* unavailable(
          "SES email requires payload.from or NOTIFICATION_EMAIL_FROM",
        );
      }

      const result = yield* Effect.tryPromise({
        try: () =>
          client.send(
            new SendEmailCommand({
              FromEmailAddress: from,
              Destination: {
                ToAddresses: [formatEmailRecipient(recipient)],
              } satisfies Destination,
              Content: { Simple: message(email) },
              ReplyToAddresses:
                email.replyTo === undefined ? undefined : [email.replyTo],
            }),
          ),
        catch: classifyFailure,
      });

      return {
        provider: "ses",
        providerMessageId:
          result.MessageId === undefined || result.MessageId.length === 0
            ? null
            : result.MessageId,
      };
    },
  );

  return { channel: "email", send } satisfies NotificationTransport;
});

export class SesEmailTransport extends Context.Service<
  SesEmailTransport,
  NotificationTransport
>()("@krak-stack/notifications/transport/SesEmailTransport") {
  static readonly layer = Layer.effect(this, makeSesEmailTransport);
}

export const sesEmailTransportRegistryLayer = Layer.unwrap(
  SesEmailTransport.use((transport) =>
    Effect.succeed(NotificationTransportRegistry.layer([transport])),
  ),
).pipe(Layer.provide(SesEmailTransport.layer));
