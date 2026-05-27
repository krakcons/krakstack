import { Effect } from "effect";
import { describe, expect, expectTypeOf, it } from "vitest";

import { NotificationChannelRegistry } from "./channels";
import { NotificationService, type NotificationServiceShape } from "./index";
import { type SesEmailNotification } from "./channels/ses/schema";

describe("NotificationService", () => {
  it("sends each message payload to every matching channel", async () => {
    const sent: Array<{ channel: string; payload: unknown }> = [];
    const layer = NotificationService.makeLayer([
      {
        key: "email",
        send: (payload) =>
          Effect.sync(() => sent.push({ channel: "email-a", payload })),
      },
      {
        key: "email",
        send: (payload) =>
          Effect.sync(() => sent.push({ channel: "email-b", payload })),
      },
    ]);

    await Effect.runPromise(
      Effect.gen(function* () {
        const notifications = yield* NotificationService;

        yield* notifications.send({
          email: {
            to: "user@example.com",
            subject: "Deploy succeeded",
            text: "All checks passed.",
          },
        });

        expect(sent).toEqual([
          {
            channel: "email-a",
            payload: {
              to: "user@example.com",
              subject: "Deploy succeeded",
              text: "All checks passed.",
            },
          },
          {
            channel: "email-b",
            payload: {
              to: "user@example.com",
              subject: "Deploy succeeded",
              text: "All checks passed.",
            },
          },
        ]);
      }).pipe(Effect.provide(layer)),
    );
  });

  it("fails when a message key has no matching channel", async () => {
    await Effect.runPromise(
      Effect.gen(function* () {
        const result = yield* Effect.gen(function* () {
          const notifications = yield* NotificationService;
          yield* notifications.send({
            email: {
              to: "user@example.com",
              subject: "Deploy succeeded",
              text: "All checks passed.",
            },
          });
        }).pipe(Effect.provide(NotificationService.makeLayer([])), Effect.exit);

        expect(result._tag).toBe("Failure");
      }),
    );
  });

  it("creates registry shapes from multiple channel instances", () => {
    const email = { key: "email", send: () => Effect.void };
    const push = { key: "push", send: () => Effect.void };

    expect(NotificationChannelRegistry.make(email, push)).toEqual({
      channels: [email, push],
    });
  });

  it("types installed notification channel payloads", () => {
    type Message = Parameters<NotificationServiceShape["send"]>[0];

    expectTypeOf<Message>().toEqualTypeOf<{
      readonly email?: SesEmailNotification;
    }>();
  });
});
