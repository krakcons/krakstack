import { describe, expectTypeOf, it } from "@effect/vitest";
import type { Effect } from "effect";

import type { NotificationServiceContract } from "../src/index.js";
import type {
  NotificationRuntimeContract,
  ReminderHandler,
} from "../src/runtime.js";
import type { NotificationTransport } from "../src/transport.js";

type Requirements<T> =
  T extends Effect.Effect<unknown, unknown, infer R> ? R : "not-an-effect";

describe("built service interfaces", () => {
  it("leave no Effect environment on consumer methods", () => {
    expectTypeOf<
      Requirements<ReturnType<NotificationServiceContract["publish"]>>
    >().toEqualTypeOf<never>();
    expectTypeOf<
      Requirements<ReturnType<NotificationServiceContract["setSuppression"]>>
    >().toEqualTypeOf<never>();
    expectTypeOf<
      Requirements<ReturnType<NotificationTransport["send"]>>
    >().toEqualTypeOf<never>();
    expectTypeOf<
      Requirements<ReturnType<ReminderHandler["handle"]>>
    >().toEqualTypeOf<never>();
    expectTypeOf<
      Requirements<NotificationRuntimeContract["runDeliveryWorker"]>
    >().toEqualTypeOf<never>();
    expectTypeOf<
      Requirements<NotificationRuntimeContract["runScheduler"]>
    >().toEqualTypeOf<never>();
  });
});
