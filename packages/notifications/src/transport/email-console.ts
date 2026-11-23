import { Console, Effect } from "effect";

import {
  NotificationTransportPermanent,
  type NotificationTransport,
} from "../transport.js";
import { decodeEmailPayloadV1, decodeEmailRecipient } from "./email.js";

/** Prints email contents to the server console without sending mail. */
export const ConsoleEmailTransport: NotificationTransport = {
  channel: "email",
  send: Effect.fn("ConsoleEmailTransport.send")(function* (input) {
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

    // Keep message contents out of Effect's telemetry loggers.
    yield* Console.log("[Console email]", {
      to: recipient.address,
      ...email,
      attachments: input.attachments?.map(({ filename }) => filename) ?? [],
    });
    return { provider: "email-console", providerMessageId: null };
  }),
};
