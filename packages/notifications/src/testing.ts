import { Effect } from "effect";

import {
  ReminderHandlerRegistry,
  type ReminderHandler,
  type ReminderHandlerFailure,
  type ReminderHandlerInput,
} from "./runtime.js";
import {
  NotificationTransportRegistry,
  type NotificationTransport,
  type NotificationTransportFailure,
  type NotificationTransportInput,
  type NotificationTransportResult,
} from "./transport.js";

export interface FakeTransportOptions {
  readonly channel: string;
  readonly send?: (
    input: NotificationTransportInput,
  ) => Effect.Effect<NotificationTransportResult, NotificationTransportFailure>;
}

export const makeFakeTransport = (options: FakeTransportOptions) => {
  const sent: Array<NotificationTransportInput> = [];
  const transport: NotificationTransport = {
    channel: options.channel,
    send: (input) =>
      Effect.sync(() => {
        sent.push(input);
      }).pipe(
        Effect.andThen(
          options.send?.(input) ??
            Effect.succeed({
              provider: "fake",
              providerMessageId: input.dispatchId,
            }),
        ),
      ),
  };

  return {
    transport,
    layer: NotificationTransportRegistry.layer([transport]),
    sent,
    clear: () => {
      sent.length = 0;
    },
  };
};

export interface FakeReminderHandlerOptions {
  readonly key: string;
  readonly version: number;
  readonly handle?: (
    input: ReminderHandlerInput,
  ) => Effect.Effect<void, ReminderHandlerFailure>;
}

export const makeFakeReminderHandler = (
  options: FakeReminderHandlerOptions,
) => {
  const handled: Array<ReminderHandlerInput> = [];
  const handler: ReminderHandler = {
    key: options.key,
    version: options.version,
    handle: (input) =>
      Effect.sync(() => {
        handled.push(input);
      }).pipe(Effect.andThen(options.handle?.(input) ?? Effect.void)),
  };

  return {
    handler,
    layer: ReminderHandlerRegistry.layer([handler]),
    handled,
    clear: () => {
      handled.length = 0;
    },
  };
};
