import { describe, expect, it } from "@effect/vitest";
import { Effect, FileSystem, Layer, Path } from "effect";
import { HttpServer } from "effect/http";
import { HttpApiError, HttpApiTest } from "effect/http-api";
import { SendAdmin, CurrentSendAdmin } from "../src/api.js";
import { SendOperationsApi } from "../src/operations.api.js";
import { sendOperationsHandlers } from "../src/operations.api.builder.js";
import { SendOperations } from "../src/operations.js";
import { SendStorageError } from "../src/schema.js";
const id = "019a0000-0000-7000-8000-000000000001";
const fixture = (fail = false) => {
  let calls = 0;
  let actor: string | undefined;
  const unused = () =>
    Effect.sync(() => {
      calls++;
      throw new Error("Unexpected invocation");
    });
  const domain = Layer.succeed(SendOperations, {
    activityTable: unused,
    feedbackTable: unused,
    suppressionsTable: unused,
    auditTable: unused,
    recipientsTable: unused,
    overview: unused,
    activity: unused,
    inspect: unused,
    feedback: unused,
    suppressions: unused,
    audit: unused,
    recipients: unused,
    addSuppression: (input) =>
      Effect.sync(() => {
        calls++;
        actor = input.actor;
        return { suppressionId: id };
      }),
    removeSuppression: (input) =>
      fail
        ? Effect.fail(
            new SendStorageError({
              message: "private database failure",
              cause: "password=secret",
            }),
          )
        : Effect.sync(() => {
            calls++;
            actor = input.actor;
            return { suppressionId: input.id };
          }),
  });
  const layer = Layer.mergeAll(
    sendOperationsHandlers.pipe(Layer.provide(domain)),
    HttpServer.layerServices,
  ).pipe(
    Layer.provideMerge(Layer.mergeAll(FileSystem.layerNoop({}), Path.layer)),
  );
  return { layer, calls: () => calls, actor: () => actor };
};
const allow: typeof SendAdmin.Service = (effect) =>
  effect.pipe(
    Effect.provideService(CurrentSendAdmin, { reference: "host:trusted" }),
  );
describe("sending operations administrative boundary", () => {
  it.effect(
    "rejects every endpoint before reading or changing installation data",
    () => {
      const f = fixture();
      return Effect.gen(function* () {
        const { sendOperations: c } = yield* HttpApiTest.groups(
          SendOperationsApi,
          ["sendOperations"],
        );
        const requests = [
          Effect.asVoid(
            c.activityTable({ query: { table: { page: 0, pageSize: 20 } } }),
          ),
          Effect.asVoid(
            c.feedbackTable({ query: { table: { page: 0, pageSize: 20 } } }),
          ),
          Effect.asVoid(
            c.suppressionsTable({
              query: { table: { page: 0, pageSize: 20 } },
            }),
          ),
          Effect.asVoid(
            c.auditTable({ query: { table: { page: 0, pageSize: 20 } } }),
          ),
          Effect.asVoid(
            c.recipientsTable({
              query: { campaignId: id, table: { page: 0, pageSize: 20 } },
            }),
          ),
          Effect.asVoid(c.overview({ query: {} })),
          Effect.asVoid(c.activity({ query: {} })),
          Effect.asVoid(c.inspect({ params: { id } })),
          Effect.asVoid(c.feedback({ query: {} })),
          Effect.asVoid(c.suppressions({ query: {} })),
          Effect.asVoid(c.audit({ query: {} })),
          Effect.asVoid(c.recipients({ query: { campaignId: id } })),
          Effect.asVoid(
            c.addSuppression({
              payload: {
                requestId: "add",
                email: "person@example.com",
                reason: "Review",
              },
            }),
          ),
          Effect.asVoid(
            c.removeSuppression({
              params: { id },
              payload: {
                requestId: "remove",
                version: "1",
                reason: "Reviewed",
              },
            }),
          ),
        ];
        for (const request of requests)
          expect((yield* request.pipe(Effect.flip))._tag).toBe("Forbidden");
        expect(f.calls()).toBe(0);
      }).pipe(
        Effect.provide(f.layer),
        Effect.provideService(SendAdmin, () =>
          Effect.fail(new HttpApiError.Forbidden({})),
        ),
      );
    },
  );
  it.effect("uses only the host actor for suppression mutations", () => {
    const f = fixture();
    return Effect.gen(function* () {
      const { sendOperations: c } = yield* HttpApiTest.groups(
        SendOperationsApi,
        ["sendOperations"],
      );
      yield* c.addSuppression({
        payload: {
          requestId: "add",
          email: "person@example.com",
          reason: "Review",
        },
      });
      expect(f.actor()).toBe("host:trusted");
      yield* c.removeSuppression({
        params: { id },
        payload: { requestId: "remove", version: "1", reason: "Reviewed" },
      });
      expect(f.actor()).toBe("host:trusted");
    }).pipe(Effect.provide(f.layer), Effect.provideService(SendAdmin, allow));
  });
  it.effect("redacts storage errors instead of leaking credentials", () => {
    const f = fixture(true);
    return Effect.gen(function* () {
      const { sendOperations: c } = yield* HttpApiTest.groups(
        SendOperationsApi,
        ["sendOperations"],
      );
      const error = yield* c
        .removeSuppression({
          params: { id },
          payload: { requestId: "remove", version: "1", reason: "Reviewed" },
        })
        .pipe(Effect.flip);
      expect(error._tag).toBe("InternalServerError");
      expect(JSON.stringify(error)).not.toMatch(/secret|private/);
    }).pipe(Effect.provide(f.layer), Effect.provideService(SendAdmin, allow));
  });
});
