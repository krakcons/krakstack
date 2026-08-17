import { Effect } from "effect";
import { describe, expect, expectTypeOf, it } from "vitest";

import { NotificationChannelRegistry } from "./channels";
import {
  NotificationService,
  type NotificationServiceContract,
  type NotificationPersistenceStoreContract,
} from "./index";
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

        const result = yield* notifications.send({
          email: {
            to: "user@example.com",
            subject: "Deploy succeeded",
            text: "All checks passed.",
          },
        });

        expect(result).toBeUndefined();
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

  it("persists structured send envelopes before dispatching channels", async () => {
    const persisted: Array<unknown> = [];
    const sent: Array<unknown> = [];
    const store: NotificationPersistenceStoreContract = {
      persist: (input) =>
        Effect.sync(() => {
          persisted.push(input);
          return {
            deliveryIds: ["delivery-1"],
            notificationId: "notification-1",
          };
        }),
    };
    const layer = NotificationService.makePersistentLayer({
      channels: [
        {
          key: "email",
          send: (payload) => Effect.sync(() => sent.push(payload)),
        },
      ],
      store,
    });

    await Effect.runPromise(
      Effect.gen(function* () {
        const notifications = yield* NotificationService;

        const result = yield* notifications.send({
          persist: {
            idempotencyKey: "event:user-1",
            eventKey: "user.created",
            recipientUserId: "user-1",
            inbox: { title: "Welcome" },
            deliveries: [
              {
                channel: "email",
                purpose: "transactional",
                recipientAddress: "user@example.com",
                payload: {
                  to: "user@example.com",
                  subject: "Welcome",
                  text: "Thanks for joining.",
                },
              },
            ],
          },
          message: {
            email: {
              to: "user@example.com",
              subject: "Welcome",
              text: "Thanks for joining.",
            },
          },
        });

        expect(result).toEqual({
          deliveryIds: ["delivery-1"],
          notificationId: "notification-1",
        });
        expect(persisted).toHaveLength(1);
        expect(sent).toEqual([
          {
            to: "user@example.com",
            subject: "Welcome",
            text: "Thanks for joining.",
          },
        ]);
      }).pipe(Effect.provide(layer)),
    );
  });

  it("persists structured send envelopes without requiring a channel message", async () => {
    const persisted: Array<unknown> = [];
    const store: NotificationPersistenceStoreContract = {
      persist: (input) =>
        Effect.sync(() => {
          persisted.push(input);
          return { deliveryIds: [], notificationId: "notification-1" };
        }),
    };
    const layer = NotificationService.makePersistentLayer({
      channels: [],
      store,
    });

    await Effect.runPromise(
      Effect.gen(function* () {
        const notifications = yield* NotificationService;

        const result = yield* notifications.send({
          persist: {
            idempotencyKey: "event:user-1",
            eventKey: "user.created",
            recipientUserId: "user-1",
            inbox: { title: "Welcome" },
          },
        });

        expect(result?.notificationId).toBe("notification-1");
        expect(persisted).toHaveLength(1);
      }).pipe(Effect.provide(layer)),
    );
  });

  it("creates registries from multiple channel instances", () => {
    const email = { key: "email", send: () => Effect.void };
    const push = { key: "push", send: () => Effect.void };

    expect(NotificationChannelRegistry.make(email, push)).toEqual({
      channels: [email, push],
    });
  });

  it("types installed notification channel payloads", () => {
    type SendInput = Parameters<NotificationServiceContract["send"]>[0];

    const message = {
      email: {
        to: "user@example.com",
        subject: "Deploy succeeded",
        text: "All checks passed.",
      },
    } satisfies SendInput;

    expectTypeOf(message.email).toMatchTypeOf<SesEmailNotification>();
  });
});
