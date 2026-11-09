import { describe, expect, it } from "@effect/vitest";
import { Effect, FileSystem, Layer, Path } from "effect";
import { HttpServer } from "effect/http";
import { HttpApiError, HttpApiTest } from "effect/http-api";

import { CurrentSendAdmin, SendAdmin, SendAdminApi } from "../src/api.js";
import { sendAdminHandlers } from "../src/api.builder.js";
import { KrakSend } from "../src/index.js";
import { SendStorageError } from "../src/schema.js";

const fixture = () => {
  let calls = 0;
  let actor: string | undefined;
  const unused = () => Effect.die(new Error("Unexpected operation"));
  const contactId = "019a0000-0000-7000-8000-000000000001";
  const send = Layer.succeed(KrakSend, {
    contactsTable: unused,
    consentTable: unused,
    createContact: unused,
    getContact: unused,
    resolveEmailRecipient: unused,
    updateContact: unused,
    queueEmail: unused,
    checkDelivery: unused,
    withdrawEmailConsent: unused,
    listEmailConsentEvents: unused,
    listContacts: () =>
      Effect.sync(() => {
        calls++;
        return { items: [], nextCursor: null };
      }),
    recordEmailConsent: (input) =>
      Effect.sync(() => {
        calls++;
        actor = input.actor;
        return { ...input, occurredAt: new Date(0) };
      }),
  });
  const routes = sendAdminHandlers.pipe(Layer.provide(send));
  return { routes, contactId, calls: () => calls, actor: () => actor };
};

describe("KrakSend administrative protection", () => {
  it.effect(
    "rejects the entire group before invoking persistence when the host denies access",
    () => {
      const test = fixture();
      return Effect.gen(function* () {
        const client = yield* HttpApiTest.groups(SendAdminApi, ["send"]);
        expect(
          (yield* client.send
            .contactsTable({ query: { table: { page: 0, pageSize: 20 } } })
            .pipe(Effect.flip))._tag,
        ).toBe("Forbidden");
        expect(
          (yield* client.send
            .consentTable({
              params: { id: test.contactId },
              query: { table: { page: 0, pageSize: 20 } },
            })
            .pipe(Effect.flip))._tag,
        ).toBe("Forbidden");
        expect(
          (yield* client.send.listContacts({ query: {} }).pipe(Effect.flip))
            ._tag,
        ).toBe("Forbidden");
        expect(
          (yield* client.send
            .createContact({ payload: { email: "person@example.com" } })
            .pipe(Effect.flip))._tag,
        ).toBe("Forbidden");
        expect(
          (yield* client.send
            .recordEmailConsent({
              params: { id: test.contactId },
              payload: {
                requestId: "grant",
                status: "subscribed",
                noticeVersion: "v1",
              },
            })
            .pipe(Effect.flip))._tag,
        ).toBe("Forbidden");
        expect(test.calls()).toBe(0);
      }).pipe(
        Effect.provide(
          Layer.mergeAll(test.routes, HttpServer.layerServices).pipe(
            Layer.provideMerge(
              Layer.mergeAll(FileSystem.layerNoop({}), Path.layer),
            ),
          ),
        ),
        Effect.provideService(SendAdmin, () =>
          Effect.fail(new HttpApiError.Forbidden({})),
        ),
      );
    },
  );

  it.effect(
    "attributes consent to the host's trusted actor without requiring KrakAuth",
    () => {
      const test = fixture();
      return Effect.gen(function* () {
        const client = yield* HttpApiTest.groups(SendAdminApi, ["send"]);
        expect(
          (yield* client.send.listContacts({ query: {} })).items,
        ).toHaveLength(0);
        const event = yield* client.send.recordEmailConsent({
          params: { id: test.contactId },
          payload: {
            requestId: "grant",
            status: "subscribed",
            noticeVersion: "v1",
          },
        });
        expect(event.source).toBe("admin");
        expect(event.actor).toBe("host:admin-1");
        expect(test.actor()).toBe("host:admin-1");
      }).pipe(
        Effect.provide(
          Layer.mergeAll(test.routes, HttpServer.layerServices).pipe(
            Layer.provideMerge(
              Layer.mergeAll(FileSystem.layerNoop({}), Path.layer),
            ),
          ),
        ),
        Effect.provideService(SendAdmin, (httpEffect) =>
          httpEffect.pipe(
            Effect.provideService(CurrentSendAdmin, {
              reference: "host:admin-1",
            }),
          ),
        ),
      );
    },
  );

  it.effect(
    "does not expose storage failures or credentials through the administrative API",
    () => {
      const unused = () => Effect.die(new Error("Unexpected operation"));
      const failing = Layer.succeed(KrakSend, {
        contactsTable: unused,
        consentTable: unused,
        createContact: unused,
        getContact: unused,
        resolveEmailRecipient: unused,
        updateContact: unused,
        queueEmail: unused,
        checkDelivery: unused,
        withdrawEmailConsent: unused,
        listEmailConsentEvents: unused,
        recordEmailConsent: unused,
        listContacts: () =>
          Effect.fail(
            new SendStorageError({
              message: "secret database detail",
              cause: new Error("password=private"),
            }),
          ),
      });
      return Effect.gen(function* () {
        const client = yield* HttpApiTest.groups(SendAdminApi, ["send"]);
        const error = yield* client.send
          .listContacts({ query: {} })
          .pipe(Effect.flip);
        expect(error._tag).toBe("InternalServerError");
        expect(JSON.stringify(error)).not.toContain("private");
        expect(JSON.stringify(error)).not.toContain("secret database");
      }).pipe(
        Effect.provide(
          Layer.mergeAll(
            sendAdminHandlers.pipe(Layer.provide(failing)),
            HttpServer.layerServices,
          ).pipe(
            Layer.provideMerge(
              Layer.mergeAll(FileSystem.layerNoop({}), Path.layer),
            ),
          ),
        ),
        Effect.provideService(SendAdmin, (httpEffect) =>
          httpEffect.pipe(
            Effect.provideService(CurrentSendAdmin, {
              reference: "host:admin",
            }),
          ),
        ),
      );
    },
  );
});
