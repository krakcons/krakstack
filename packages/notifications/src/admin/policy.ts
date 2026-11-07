// Keep named dispatch policies stable for queued publications.
import { Effect, Layer } from "effect";
import {
  DispatchPolicyError,
  NotificationDispatchPolicy,
} from "@krak-stack/notifications/policy";
import { NotificationRuntime } from "@krak-stack/notifications/runtime";

import { KrakSend } from "./index.js";

export const sendDispatchPolicyLayer = Layer.effect(
  NotificationDispatchPolicy,
  Effect.gen(function* () {
    const send = yield* KrakSend;
    return {
      key: "kraksend.v1",
      check: (delivery: Parameters<typeof send.checkDelivery>[0]) =>
        send.checkDelivery(delivery).pipe(
          Effect.mapError(
            (cause) =>
              new DispatchPolicyError({
                message: "KrakSend consent check failed",
                cause,
              }),
          ),
        ),
    };
  }),
);

export const sendRuntimeLayer = NotificationRuntime.layer.pipe(
  Layer.provide(sendDispatchPolicyLayer),
);
