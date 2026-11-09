import { describe, expect, it } from "@effect/vitest";
import { Effect, FileSystem, Layer, Path } from "effect";
import { HttpServer } from "effect/http";
import { HttpApiError, HttpApiTest } from "effect/http-api";
import {
  DeliveryAdminApi,
  DeliveryAdmin,
  CurrentDeliveryAdmin,
} from "../../notifications/src/admin/delivery.api.js";
import { deliveryAdminHandlers } from "../../notifications/src/admin/delivery.api.builder.js";
import { NotificationDeliveryAdmin } from "../../notifications/src/admin/deliveries.js";
import { SendStorageError } from "../../notifications/src/admin/schema.js";
import { SendAdmin, CurrentSendAdmin } from "../src/api.js";

const id = "019a0000-0000-7000-8000-000000000001";
const access = {
  contactManaged: false,
  engineScopes: [
    {
      _tag: "Exact" as const,
      scope: {
        recipientUserId: "account",
        organizationId: "org",
        workspaceId: null,
      },
    },
  ],
  referenceNamespaces: ["order"],
};
const fixture = () => {
  const calls: unknown[] = [];
  const domain = Layer.succeed(NotificationDeliveryAdmin, {
    activityTable: (input) =>
      Effect.sync(() => {
        calls.push(input);
        return { total: 0, items: [] };
      }),
    overview: (input) =>
      Effect.sync(() => {
        calls.push(input);
      }).pipe(
        Effect.andThen(
          Effect.fail(
            new SendStorageError({
              message: "private failure",
              cause: "password=secret",
            }),
          ),
        ),
      ),
    inspect: (input) =>
      Effect.sync(() => {
        calls.push(input);
      }).pipe(
        Effect.andThen(
          Effect.fail(new SendStorageError({ message: "private failure" })),
        ),
      ),
  });
  const layer = Layer.mergeAll(
    deliveryAdminHandlers.pipe(Layer.provide(domain)),
    HttpServer.layerServices,
  ).pipe(
    Layer.provideMerge(Layer.mergeAll(FileSystem.layerNoop({}), Path.layer)),
  );
  return { layer, calls };
};
const allow: typeof DeliveryAdmin.Service = (effect) =>
  effect.pipe(
    Effect.provideService(CurrentDeliveryAdmin, {
      reference: "host:staff",
      access,
    }),
  );
describe("staff delivery administrative interface", () => {
  it.effect(
    "rejects every read before invoking storage, even when marketing administration is granted",
    () => {
      const f = fixture();
      return Effect.gen(function* () {
        const { notificationDeliveries: c } = yield* HttpApiTest.groups(
          DeliveryAdminApi,
          ["notificationDeliveries"],
        );
        for (const effect of [
          Effect.asVoid(c.overview({ query: {} })),
          Effect.asVoid(
            c.activityTable({ query: { table: { page: 0, pageSize: 20 } } }),
          ),
          Effect.asVoid(c.inspect({ params: { id }, query: {} })),
        ])
          expect((yield* effect.pipe(Effect.flip))._tag).toBe("Forbidden");
        expect(f.calls).toEqual([]);
      }).pipe(
        Effect.provide(f.layer),
        Effect.provideService(DeliveryAdmin, () =>
          Effect.fail(new HttpApiError.Forbidden({})),
        ),
        Effect.provideService(SendAdmin, (effect) =>
          effect.pipe(
            Effect.provideService(CurrentSendAdmin, {
              reference: "marketing:admin",
            }),
          ),
        ),
      );
    },
  );
  it.effect(
    "passes only trusted grants and decoded narrowing selectors to the read module",
    () => {
      const f = fixture();
      return Effect.gen(function* () {
        const { notificationDeliveries: c } = yield* HttpApiTest.groups(
          DeliveryAdminApi,
          ["notificationDeliveries"],
        );
        const scope = access.engineScopes[0].scope;
        expect(
          yield* c.activityTable({
            query: {
              source: "engine",
              scope,
              table: { page: 0, pageSize: 20 },
            },
          }),
        ).toEqual({ items: [], total: 0 });
        expect(f.calls).toEqual([
          {
            access,
            query: {
              source: "engine",
              scope,
              table: { page: 0, pageSize: 20 },
            },
          },
        ]);
      }).pipe(
        Effect.provide(f.layer),
        Effect.provideService(DeliveryAdmin, allow),
      );
    },
  );
  it.effect("redacts persistence failures", () => {
    const f = fixture();
    return Effect.gen(function* () {
      const { notificationDeliveries: c } = yield* HttpApiTest.groups(
        DeliveryAdminApi,
        ["notificationDeliveries"],
      );
      const error = yield* c.overview({ query: {} }).pipe(Effect.flip);
      expect(error._tag).toBe("InternalServerError");
      expect(JSON.stringify(error)).not.toMatch(/private|secret/);
    }).pipe(
      Effect.provide(f.layer),
      Effect.provideService(DeliveryAdmin, allow),
    );
  });
});
