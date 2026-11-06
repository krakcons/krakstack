import { describe, expect, it } from "@effect/vitest";
import { Effect, FileSystem, Layer, Path } from "effect";
import { HttpServer } from "effect/http";
import { HttpApiError, HttpApiTest } from "effect/http-api";
import { CurrentSendAdmin, SendAdmin } from "../src/api.js";
import { SendCampaignApi } from "../src/campaign.api.js";
import { sendCampaignHandlers } from "../src/campaign.api.builder.js";
import { SendCampaigns } from "../src/campaign.js";
import { SendStorageError, type CreateCampaign } from "../src/schema.js";

const id = "019a0000-0000-7000-8000-000000000001";
const payload: typeof CreateCampaign.Type = {
  requestId: "create",
  name: "News",
  from: "sender@example.com",
  audience: { _tag: "AllSubscribed" },
  content: {
    en: { subject: "News", text: "Body", unsubscribeText: "Unsubscribe" },
    fr: { subject: "Nouvelles", text: "Texte", unsubscribeText: "Désabonner" },
  },
};
const fixture = (fail = false) => {
  let calls = 0;
  let actor: string | undefined;
  const unused = () =>
    Effect.sync(() => {
      calls++;
      throw new Error("Unexpected operation");
    });
  const routes = sendCampaignHandlers.pipe(
    Layer.provide(
      Layer.succeed(SendCampaigns, {
        get: unused,
        schedule: unused,
        transition: unused,
        processBatch: unused,
        due: unused,
        report: unused,
        create: (input) =>
          Effect.sync(() => {
            calls++;
            actor = input.actor;
            return {
              ...input.payload,
              id,
              status: "draft",
              scheduledFor: null,
              snapshotAt: null,
              batchNumber: 0,
              createdAt: new Date(0),
            };
          }),
        list: () =>
          fail
            ? Effect.fail(
                new SendStorageError({
                  message: "secret database detail",
                  cause: "password=private",
                }),
              )
            : Effect.sync(() => {
                calls++;
                return { items: [], nextCursor: null };
              }),
      }),
    ),
  );
  const layer = Layer.mergeAll(routes, HttpServer.layerServices).pipe(
    Layer.provideMerge(Layer.mergeAll(FileSystem.layerNoop({}), Path.layer)),
  );
  return { layer, calls: () => calls, actor: () => actor };
};
const allow: typeof SendAdmin.Service = (effect) =>
  effect.pipe(
    Effect.provideService(CurrentSendAdmin, { reference: "host:admin" }),
  );

describe("campaign administrative boundary", () => {
  it.effect("denies every endpoint before accessing campaigns", () => {
    const f = fixture();
    return Effect.gen(function* () {
      const { sendCampaigns: c } = yield* HttpApiTest.groups(SendCampaignApi, [
        "sendCampaigns",
      ]);
      const requests = [
        Effect.asVoid(c.list({ query: {} })),
        Effect.asVoid(c.get({ params: { id } })),
        Effect.asVoid(c.report({ params: { id } })),
        Effect.asVoid(c.create({ payload })),
        Effect.asVoid(
          c.schedule({
            params: { id },
            payload: { scheduledFor: new Date(0) },
          }),
        ),
        Effect.asVoid(
          c.transition({ params: { id }, payload: { action: "cancel" } }),
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
  });
  it.effect("attributes creation to the host actor", () => {
    const f = fixture();
    return Effect.gen(function* () {
      const c = yield* HttpApiTest.groups(SendCampaignApi, ["sendCampaigns"]);
      expect((yield* c.sendCampaigns.create({ payload })).status).toBe("draft");
      expect(f.actor()).toBe("host:admin");
    }).pipe(Effect.provide(f.layer), Effect.provideService(SendAdmin, allow));
  });
  it.effect("redacts persistence failures", () => {
    const f = fixture(true);
    return Effect.gen(function* () {
      const c = yield* HttpApiTest.groups(SendCampaignApi, ["sendCampaigns"]);
      const error = yield* c.sendCampaigns
        .list({ query: {} })
        .pipe(Effect.flip);
      expect(error._tag).toBe("InternalServerError");
      expect(JSON.stringify(error)).not.toMatch(/private|secret/);
    }).pipe(Effect.provide(f.layer), Effect.provideService(SendAdmin, allow));
  });
});
