import { Effect, Schema } from "effect";
import {
  NotificationTransportPermanent,
  type NotificationTransport,
} from "../transport.js";

export const PushPayloadV1 = Schema.Struct({
  provider: Schema.Literals(["apns", "fcm"]),
  title: Schema.NonEmptyString,
  body: Schema.String,
  data: Schema.Record(Schema.String, Schema.String),
  androidChannelId: Schema.optional(Schema.NonEmptyString),
}).annotate({ identifier: "PushPayloadV1" });
export type PushPayloadV1 = typeof PushPayloadV1.Type;

export const decodePushInput = (
  input: Parameters<NotificationTransport["send"]>[0],
) =>
  Effect.gen(function* () {
    if (input.channel !== "push" || input.payloadVersion !== 1) {
      return yield* new NotificationTransportPermanent({
        channel: "push",
        message: "Unsupported push channel or payload version",
      });
    }
    return yield* Schema.decodeUnknownEffect(PushPayloadV1)(input.payload).pipe(
      Effect.mapError(
        () =>
          new NotificationTransportPermanent({
            channel: "push",
            message: "Malformed push payload",
          }),
      ),
    );
  });

/** One logical push channel, independent of the device's provider. */
export const makePushTransport = (providers: {
  readonly apns: NotificationTransport;
  readonly fcm: NotificationTransport;
}): NotificationTransport => ({
  channel: "push",
  send: Effect.fn("PushTransport.send")(function* (input) {
    const payload = yield* decodePushInput(input);
    return yield* providers[payload.provider].send(input);
  }),
});
