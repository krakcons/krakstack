import {
  Config,
  Context,
  Effect,
  Layer,
  Option,
  Redacted,
  Schema,
} from "effect";
import nodemailer from "nodemailer";

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
  EmailAddress,
  decodeEmailPayloadV1,
  decodeEmailRecipient,
} from "./email.js";

const SmtpPort = Schema.Int.pipe(
  Schema.check(Schema.isGreaterThan(0), Schema.isLessThanOrEqualTo(65_535)),
).annotate({ identifier: "NotificationSmtpPort" });

const SmtpProviderErrorDetailsSchema = Schema.Struct({
  name: Schema.optional(Schema.String),
  code: Schema.optional(Schema.String),
  responseCode: Schema.optional(Schema.Int),
}).annotate({ identifier: "SmtpProviderErrorDetails" });

export type SmtpProviderErrorDetails =
  typeof SmtpProviderErrorDetailsSchema.Type;
export type SmtpTransportErrorKind = "retryable" | "unavailable" | "permanent";

const authCodes = new Set(["EAUTH", "ECONFIG"]);
const authResponseCodes = new Set([530, 534, 535, 538]);
const permanentCodes = new Set(["EENVELOPE", "EMESSAGE"]);
const networkCodes = new Set([
  "ECONNECTION",
  "ECONNRESET",
  "ECONNREFUSED",
  "ETIMEDOUT",
  "ESOCKET",
  "EDNS",
  "EAI_AGAIN",
  "EPIPE",
  "ENETUNREACH",
]);

const decodeSmtpProviderErrorDetails = Schema.decodeUnknownOption(
  SmtpProviderErrorDetailsSchema,
);

export const classifySmtpTransportError = (
  details: SmtpProviderErrorDetails,
): SmtpTransportErrorKind => {
  const responseCode = details.responseCode;
  if (
    (details.code !== undefined && authCodes.has(details.code)) ||
    (responseCode !== undefined && authResponseCodes.has(responseCode))
  ) {
    return "unavailable";
  }
  if (
    (responseCode !== undefined && responseCode >= 400 && responseCode < 500) ||
    (details.code !== undefined && networkCodes.has(details.code))
  ) {
    return "retryable";
  }
  if (
    (details.code !== undefined && permanentCodes.has(details.code)) ||
    (responseCode !== undefined && responseCode >= 500)
  ) {
    return "permanent";
  }
  return "retryable";
};

const unavailable = (message: string) =>
  new NotificationTransportUnavailable({ channel: "email", message });

const classifyFailure = (cause: unknown): NotificationTransportFailure => {
  const details: SmtpProviderErrorDetails = decodeSmtpProviderErrorDetails(
    cause,
  ).pipe(Option.getOrElse(() => ({})));
  const kind = classifySmtpTransportError(details);
  if (kind === "unavailable") {
    return new NotificationTransportUnavailable({
      channel: "email",
      message: "SMTP email transport is unavailable",
      cause,
    });
  }
  if (kind === "permanent") {
    return new NotificationTransportPermanent({
      channel: "email",
      message: "SMTP rejected the email request",
      cause,
    });
  }
  return new NotificationTransportRetryable({
    channel: "email",
    message: "SMTP email delivery failed transiently",
    cause,
  });
};

const makeSmtpEmailTransport = Effect.gen(function* () {
  const environment = yield* Effect.gen(function* () {
    const host = yield* Config.nonEmptyString("SMTP_HOST");
    const port = yield* Config.schema(SmtpPort, "SMTP_PORT");
    const user = yield* Config.redacted("SMTP_USER");
    const password = yield* Config.redacted("SMTP_PASSWORD");
    const sender = yield* Config.schema(EmailAddress, "EMAIL_SENDER_ADDRESS");
    return { host, port, user, password, sender };
  }).pipe(
    Effect.mapError(() =>
      unavailable("SMTP email transport configuration is unavailable"),
    ),
  );

  const user = yield* Schema.decodeUnknownEffect(Schema.NonEmptyString)(
    Redacted.value(environment.user),
  ).pipe(Effect.mapError(() => unavailable("SMTP user is unavailable")));
  const password = yield* Schema.decodeUnknownEffect(Schema.NonEmptyString)(
    Redacted.value(environment.password),
  ).pipe(Effect.mapError(() => unavailable("SMTP password is unavailable")));

  const transporter = yield* Effect.acquireRelease(
    Effect.sync(() =>
      nodemailer.createTransport(
        {
          host: environment.host,
          port: environment.port,
          secure: environment.port === 465,
          requireTLS: environment.port !== 465,
          auth: { user, pass: password },
          tls: { rejectUnauthorized: true },
          dnsTimeout: 20_000,
          connectionTimeout: 20_000,
          greetingTimeout: 20_000,
          socketTimeout: 20_000,
          disableFileAccess: true,
          disableUrlAccess: true,
        },
        {
          disableFileAccess: true,
          disableUrlAccess: true,
        },
      ),
    ),
    (transporter) => Effect.sync(() => transporter.close()),
  );

  yield* Effect.tryPromise({
    try: () => transporter.verify(),
    catch: classifyFailure,
  });

  const send = Effect.fn("SmtpEmailTransport.send")(
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
      const from = email.from ?? environment.sender;
      const result = yield* Effect.tryPromise({
        try: () =>
          transporter.sendMail({
            from,
            to: {
              address: recipient.address,
              name: recipient.name ?? undefined,
            },
            replyTo: email.replyTo,
            subject: email.subject,
            text: email.text,
            html: email.html,
            disableFileAccess: true,
            disableUrlAccess: true,
          }),
        catch: classifyFailure,
      });
      const providerMessageId = Option.getOrNull(
        Schema.decodeUnknownOption(Schema.NonEmptyString)(result.messageId),
      );
      return { provider: "smtp", providerMessageId };
    },
  );

  return { channel: "email", send } satisfies NotificationTransport;
});

export class SmtpEmailTransport extends Context.Service<
  SmtpEmailTransport,
  NotificationTransport
>()("@krak-stack/notifications/transport/SmtpEmailTransport") {
  static readonly layer = Layer.effect(this, makeSmtpEmailTransport);
}

export const smtpEmailTransportRegistryLayer = Layer.unwrap(
  SmtpEmailTransport.use((transport) =>
    Effect.succeed(NotificationTransportRegistry.layer([transport])),
  ),
).pipe(Layer.provide(SmtpEmailTransport.layer));
