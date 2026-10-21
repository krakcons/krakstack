import { describe, expect, it } from "@effect/vitest";
import { BrowserCrypto } from "@effect/platform-browser";
import {
  ConfigProvider,
  DateTime,
  Effect,
  Layer,
  Redacted,
  Schema,
} from "effect";
import { HttpServerRequest } from "effect/http";

import { Events, dailyVisitorId, type EventsOptions } from "./index";
import { EventLogRecord, ListEvents, OtlpLogs } from "./schema";
import { Otlp } from "../opentelemetry";
import { OtlpEvents } from "../opentelemetry/events";
import { OtlpResource } from "effect/observability";
import {
  ANALYTICS_CONSENT_COOKIE,
  ANALYTICS_NOTICE_VERSION,
} from "../opentelemetry/consent";

const telemetry = Layer.mergeAll(
  Layer.succeed(Otlp, { resource: OtlpResource.fromConfig() }),
  OtlpEvents.disabledLayer,
  BrowserCrypto.layer,
);
const eventsLayer = (options: EventsOptions) =>
  Events.layerWith(options).pipe(Layer.provideMerge(telemetry));

const secret = Redacted.make("test-secret-at-least-thirty-two-characters");
const id = "123e4567-e89b-42d3-a456-426614174000";
const ua =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";
const attr = (key: string, value: string) => ({
  key,
  value: { stringValue: value },
});
const event = (now: number) => ({
  eventName: "browser.page_view",
  timeUnixNano: (BigInt(now) * 1_000_000n).toString(),
  traceId: "a".repeat(32),
  spanId: "b".repeat(16),
  attributes: [
    attr("app.event.schema.version", "1"),
    attr("analytics.page_view.id", id),
    attr("log.record.uid", id),
    attr("url.path", "/docs"),
    attr("app.button", "start"),
    attr("session.id", "spoofed"),
    attr("geo.country.iso_code", "spoofed"),
  ],
});
const envelope = (records: ReadonlyArray<unknown>) => ({
  resourceLogs: [
    {
      resource: { attributes: [attr("service.name", "site-web")] },
      schemaUrl: "https://example.com/schema",
      scopeLogs: [
        {
          scope: { name: "krakstack.application.events", version: "1" },
          logRecords: records,
        },
        {
          scope: { name: "ordinary.logs" },
          logRecords: [{ body: { stringValue: "untouched" } }],
        },
      ],
    },
  ],
});
const encode = (value: OtlpLogs) =>
  new TextEncoder().encode(JSON.stringify(value));

const setup = (
  withCloudflare = true,
  identity?: EventsOptions["identity"],
  requireConsent = false,
) => {
  const layer = Events.baseLayerWith({
    serviceName: "service-a",
    origin: "https://example.com",
    secret,
    geolocation: withCloudflare ? "cloudflare" : undefined,
    identity,
    requireConsent,
  }).pipe(Layer.provideMerge(telemetry));
  const request = (headers: Record<string, string> = {}) =>
    HttpServerRequest.fromWeb(
      new Request("https://example.com/api/otel/v1/logs", {
        method: "POST",
        headers: {
          origin: "https://example.com",
          "user-agent": ua,
          "cf-connecting-ip": "203.0.113.42",
          "cf-ipcountry": "FR",
          ...headers,
        },
      }),
    );
  return { layer, request };
};

describe("OTLP analytics enrichment", () => {
  it("requires an explicit supported category when listing events", () => {
    const decode = Schema.decodeUnknownOption(ListEvents);
    expect(decode({ organizationId: "org-a" })._tag).toBe("None");
    expect(decode({ organizationId: "org-a", category: "all" })._tag).toBe(
      "None",
    );
    for (const category of ["audit", "analytics"]) {
      expect(decode({ organizationId: "org-a", category })._tag).toBe("Some");
    }
    for (const eventName of ["", "a".repeat(129)]) {
      expect(
        decode({ organizationId: "org-a", category: "audit", eventName })._tag,
      ).toBe("None");
    }
    expect(
      decode({
        organizationId: "org-a",
        category: "audit",
        eventName: "document.created",
      })._tag,
    ).toBe("Some");
  });

  it.effect("keeps standard user snapshots for audit events only", () =>
    Effect.gen(function* () {
      let exported = 0;
      const snapshots = {
        "user.full_name": "Ada Lovelace",
        "user.name": "ada",
        "user.email": "ada@example.test",
      };
      const events = yield* Events.make({
        serviceName: "audit-snapshots",
        origin: "https://example.com",
        secret,
      }).pipe(
        Effect.provideService(OtlpEvents, {
          push: (record) => {
            exported++;
            for (const [key, value] of Object.entries(snapshots)) {
              const attribute = record.attributes.find(
                (item) => item.key === key,
              );
              if (record.eventName === "document.updated") {
                expect(attribute).toEqual(attr(key, value));
              } else {
                expect(attribute).toBeUndefined();
              }
            }
          },
        }),
      );
      yield* events
        .track({
          name: "document.updated",
          category: "audit",
          target: { id: "doc-a", name: "Document", type: "document" },
        })
        .pipe(
          Effect.annotateLogs({
            ...snapshots,
            "user.id": "user-a",
            "app.actor.type": "user",
            "app.actor.id": "user-a",
          }),
        );
      yield* events
        .track({ name: "analytics.clicked" })
        .pipe(Effect.annotateLogs(snapshots));
      expect(exported).toBe(2);
    }).pipe(Effect.provide(telemetry)),
  );

  for (const choice of ["missing", "declined", "accepted", "dnt", "gpc"]) {
    it.effect(
      `consent-gated ingestion handles ${choice} before enrichment`,
      () => {
        let identityLookups = 0;
        const { layer, request } = setup(
          true,
          () =>
            Effect.sync(() => {
              identityLookups++;
              return null;
            }),
          true,
        );
        const now = Date.now();
        const cookie = `${ANALYTICS_CONSENT_COOKIE}=${encodeURIComponent(
          JSON.stringify({
            version: ANALYTICS_NOTICE_VERSION,
            choice: choice === "declined" ? "declined" : "accepted",
            revision: "test-consent",
            issuedAt: now,
            expiresAt: now + 86400000,
          }),
        )}`;
        const headers: Record<string, string> = {};
        if (choice !== "missing") headers.cookie = cookie;
        if (choice === "dnt") headers.dnt = "1";
        if (choice === "gpc") headers["sec-gpc"] = "1";
        return Effect.gen(function* () {
          const events = yield* Events;
          const timestamp = DateTime.toEpochMillis(yield* DateTime.now);
          const result = yield* events.process(
            encode(envelope([event(timestamp)])),
          );
          const payload = yield* Schema.decodeUnknownEffect(
            Schema.fromJsonString(OtlpLogs),
          )(new TextDecoder().decode(result.body));
          const scopes = payload.resourceLogs.flatMap(
            (resource) => resource.scopeLogs,
          );
          expect(
            scopes.some(
              (scope) => scope.scope?.name === "krakstack.application.events",
            ),
          ).toBe(choice === "accepted");
          expect(
            scopes.some((scope) => scope.scope?.name === "ordinary.logs"),
          ).toBe(true);
          expect(identityLookups).toBe(choice === "accepted" ? 1 : 0);
          const tracked = yield* events.track({ name: "server.usage" });
          expect(tracked.inserted).toBe(false);
          yield* events
            .track({
              name: "security.change",
              category: "audit",
              target: { id: "1", type: "permission", name: "Role change" },
            })
            .pipe(
              Effect.annotateLogs({
                "app.actor.type": "user",
                "app.actor.id": "user-1",
              }),
            );
        }).pipe(
          Effect.provide(layer),
          Effect.provideService(
            HttpServerRequest.HttpServerRequest,
            request(headers),
          ),
        );
      },
    );
  }
  for (const scenario of [
    {
      name: "default layer",
      layer: Events.layer,
      config: {
        APP_SECRET: Redacted.value(secret),
        VITE_SITE_URL: "https://example.com/docs",
      },
      attributed: false,
    },
    {
      name: "default migration-free layer",
      layer: Events.baseLayer,
      config: {
        APP_SECRET: Redacted.value(secret),
        VITE_SITE_URL: "https://example.com",
      },
      attributed: false,
    },
    {
      name: "geolocation-only override",
      layer: Events.layerWith({ geolocation: "cloudflare" }),
      config: {
        APP_SECRET: Redacted.value(secret),
        VITE_SITE_URL: "https://example.com",
      },
      attributed: true,
    },
    {
      name: "explicit origin with default secret",
      layer: Events.layerWith({
        origin: "https://example.com",
        geolocation: "cloudflare",
      }),
      config: {
        APP_SECRET: Redacted.value(secret),
        VITE_SITE_URL: "not-a-url",
      },
      attributed: true,
    },
    {
      name: "explicit secret with default origin",
      layer: Events.layerWith({ secret, geolocation: "cloudflare" }),
      config: {
        APP_SECRET: "invalid-unused-secret",
        VITE_SITE_URL: "https://example.com",
      },
      attributed: true,
    },
    {
      name: "fully explicit configuration without environment variables",
      layer: Events.layerWith({
        origin: "https://example.com",
        secret,
        geolocation: "cloudflare",
      }),
      config: {},
      attributed: true,
    },
  ]) {
    it.effect(`resolves ${scenario.name}`, () => {
      const { request } = setup();
      return Effect.gen(function* () {
        const service = yield* Events;
        const now = yield* DateTime.now;
        const output = yield* service.process(
          encode(envelope([event(DateTime.toEpochMillis(now))])),
        );
        const payload = yield* Schema.decodeUnknownEffect(
          Schema.fromJsonString(OtlpLogs),
        )(new TextDecoder().decode(output.body));
        const record = yield* Schema.decodeUnknownEffect(EventLogRecord)(
          payload.resourceLogs[0]!.scopeLogs[0]!.logRecords[0],
        );
        const identity = record.attributes.find(
          ({ key }) => key === "analytics.anonymous_id",
        );
        if (scenario.attributed) {
          expect(identity).toEqual(
            attr(
              "analytics.anonymous_id",
              yield* dailyVisitorId({
                serviceName: "config-test",
                day: DateTime.formatIsoDate(now),
                ip: "203.0.113.42",
                userAgent: ua,
                secret,
              }),
            ),
          );
        } else {
          expect(identity).toBeUndefined();
        }
      }).pipe(
        Effect.provideService(HttpServerRequest.HttpServerRequest, request()),
        Effect.provide(scenario.layer),
        Effect.provide(telemetry),
        Effect.provide(
          ConfigProvider.layer(
            ConfigProvider.fromUnknown({
              ...scenario.config,
              OTEL_SERVICE_NAME: "config-test",
            }),
          ),
        ),
      );
    });
  }

  for (const config of [
    {},
    { APP_SECRET: Redacted.value(secret) },
    { VITE_SITE_URL: "https://example.com" },
    { APP_SECRET: Redacted.value(secret), VITE_SITE_URL: "not-a-url" },
    { APP_SECRET: "too-short", VITE_SITE_URL: "https://example.com" },
  ]) {
    it.effect(
      `rejects missing or invalid default configuration: ${Object.keys(config).join(", ") || "empty"}`,
      () =>
        Effect.gen(function* () {
          const result = yield* Effect.gen(function* () {
            yield* Events;
          }).pipe(
            Effect.provide(Events.layer),
            Effect.provide(telemetry),
            Effect.provide(
              ConfigProvider.layer(
                ConfigProvider.fromUnknown({
                  ...config,
                  OTEL_SERVICE_NAME: "config-test",
                }),
              ),
            ),
            Effect.result,
          );
          expect(result._tag).toBe("Failure");
        }),
    );
  }

  for (const scenario of [
    {
      name: "custom",
      location: {
        ip: "2001:db8::42",
        country: "CA",
        region: "ON",
        city: "Toronto",
      },
    },
    { name: "IP-only", location: { ip: "2001:db8::42" } },
    {
      name: "geography-only",
      location: { country: "CA", region: "ON", city: "Toronto" },
    },
    { name: "null", location: null },
  ]) {
    it.effect(
      `uses ${scenario.name} geolocation once per batch without falling back to Cloudflare`,
      () => {
        const { request } = setup();
        let calls = 0;
        return Effect.gen(function* () {
          const service = yield* Events;
          const now = yield* DateTime.now;
          const record = event(DateTime.toEpochMillis(now));
          const output = yield* service.process(
            encode(envelope([record, record])),
          );
          const payload = yield* Schema.decodeUnknownEffect(
            Schema.fromJsonString(OtlpLogs),
          )(new TextDecoder().decode(output.body));
          const records = yield* Schema.decodeUnknownEffect(
            Schema.Array(EventLogRecord),
          )(payload.resourceLogs[0]!.scopeLogs[0]!.logRecords);
          expect(calls).toBe(1);
          for (const record of records) {
            const attrs = Object.fromEntries(
              record.attributes.map(({ key, value }) => [key, value]),
            );
            expect(attrs["analytics.anonymous_id"]).toEqual(
              scenario.location?.ip
                ? {
                    stringValue: yield* dailyVisitorId({
                      serviceName: "custom-geo",
                      secret,
                      ip: scenario.location.ip,
                      userAgent: ua,
                      day: DateTime.formatIsoDate(now),
                    }),
                  }
                : undefined,
            );
            expect(attrs["geo.country.iso_code"]).toEqual(
              scenario.location?.country ? { stringValue: "CA" } : undefined,
            );
            expect(attrs["geo.region.iso_code"]).toEqual(
              scenario.location?.region ? { stringValue: "CA-ON" } : undefined,
            );
            expect(attrs["geo.locality.name"]).toEqual(
              scenario.location?.city ? { stringValue: "Toronto" } : undefined,
            );
            expect(attrs["session.id"]).toBeUndefined();
          }
          expect(new TextDecoder().decode(output.body)).not.toContain(
            "2001:db8::42",
          );
        }).pipe(
          Effect.provideService(HttpServerRequest.HttpServerRequest, request()),
          Effect.provide(
            eventsLayer({
              serviceName: "custom-geo",
              origin: "https://example.com",
              secret,
              geolocation: (incoming) =>
                Effect.sync(() => {
                  calls++;
                  expect(incoming.headers["cf-ipcountry"]).toBe("FR");
                  return scenario.location;
                }),
            }),
          ),
        );
      },
    );
  }

  it.effect(
    "does not call geolocation for unrelated or rejected browser batches",
    () => {
      const { request } = setup();
      let calls = 0;
      return Effect.gen(function* () {
        const service = yield* Events;
        const ordinary = encode({
          resourceLogs: [
            { scopeLogs: [{ scope: { name: "other" }, logRecords: [] }] },
          ],
        });
        expect((yield* service.process(ordinary)).body).toBe(ordinary);
        expect(
          (yield* service
            .process(encode(envelope([{ ...event(0), timeUnixNano: "-1" }])))
            .pipe(Effect.flip)).status,
        ).toBe(400);
        const valid = encode(
          envelope([event(DateTime.toEpochMillis(yield* DateTime.now))]),
        );
        expect(
          (yield* service
            .process(valid)
            .pipe(
              Effect.provideService(
                HttpServerRequest.HttpServerRequest,
                request({ origin: "https://other.test" }),
              ),
              Effect.flip,
            )).status,
        ).toBe(403);
        expect(calls).toBe(0);
      }).pipe(
        Effect.provideService(HttpServerRequest.HttpServerRequest, request()),
        Effect.provide(
          eventsLayer({
            serviceName: "custom-geo",
            origin: "https://example.com",
            secret,
            geolocation: () =>
              Effect.sync(() => {
                calls++;
                return null;
              }),
          }),
        ),
      );
    },
  );

  for (const scenario of [
    {
      name: "verified user",
      annotations: {
        "user.id": "verified-user",
        "user.roles": ["admin"],
        "organization.id": "verified-org",
        "app.actor.type": "user",
        "app.actor.id": "verified-user",
        "app.auth.method": "session",
        "app.auth.impersonator.id": "verified-admin",
      },
      expected: [
        attr("user.id", "verified-user"),
        attr("organization.id", "verified-org"),
        attr("app.actor.type", "user"),
        attr("app.actor.id", "verified-user"),
        attr("app.auth.method", "session"),
        attr("app.auth.impersonator.id", "verified-admin"),
        {
          key: "user.roles",
          value: { arrayValue: { values: [{ stringValue: "admin" }] } },
        },
      ],
    },
    {
      name: "organization actor",
      annotations: {
        "app.actor.type": "organization",
        "app.actor.id": "verified-org",
        "app.auth.method": "api_key",
        "app.auth.credential.id": "verified-key",
        "organization.id": "verified-org",
      },
      expected: [
        attr("organization.id", "verified-org"),
        attr("app.actor.type", "organization"),
        attr("app.actor.id", "verified-org"),
        attr("app.auth.method", "api_key"),
        attr("app.auth.credential.id", "verified-key"),
      ],
    },
  ]) {
    it.effect(
      `inherits ${scenario.name} annotations without an identity callback`,
      () => {
        const { layer, request } = setup(false, () =>
          Effect.die("Fallback must not override verified request annotations"),
        );
        return Effect.gen(function* () {
          const service = yield* Events;
          const now = DateTime.toEpochMillis(yield* DateTime.now);
          const record = event(now);
          const output = yield* service.process(
            encode(
              envelope([
                {
                  ...record,
                  attributes: [
                    ...record.attributes,
                    attr("user.id", "forged-user"),
                    attr("organization.id", "forged-org"),
                    attr("app.actor.type", "system"),
                    attr("app.actor.id", "forged-actor"),
                    attr("app.auth.method", "forged-method"),
                    attr("app.auth.credential.id", "forged-key"),
                    attr("app.auth.impersonator.id", "forged-admin"),
                    attr("user.full_name", "Forged member"),
                    attr("app.user.image", "https://example.com/forged.png"),
                    attr("user.roles", "owner"),
                    attr("app.audit.target.id", "forged-target"),
                    attr("app.event.category", "audit"),
                  ],
                },
              ]),
            ),
          );
          const payload = yield* Schema.decodeUnknownEffect(
            Schema.fromJsonString(OtlpLogs),
          )(new TextDecoder().decode(output.body));
          const records = yield* Schema.decodeUnknownEffect(
            Schema.Array(EventLogRecord),
          )(payload.resourceLogs[0]!.scopeLogs[0]!.logRecords);
          expect(
            records[0]!.attributes.filter(
              ({ key }) =>
                key.startsWith("user.") ||
                key.startsWith("app.user.") ||
                key === "organization.id" ||
                key.startsWith("app.actor.") ||
                key.startsWith("app.auth."),
            ),
          ).toEqual(scenario.expected);
          expect(records[0]!.attributes).toContainEqual(
            attr("app.event.category", "analytics"),
          );
          expect(
            records[0]!.attributes.some(({ key }) =>
              key.startsWith("app.audit."),
            ),
          ).toBe(false);
        }).pipe(
          Effect.annotateLogs(scenario.annotations),
          Effect.provideService(HttpServerRequest.HttpServerRequest, request()),
          Effect.provide(layer),
        );
      },
    );
  }

  for (const annotations of [
    { "user.id": 42 },
    { "app.actor.type": "user" },
    { "app.actor.type": "user", "app.actor.id": 42 },
    {
      "app.actor.type": "user",
      "app.actor.id": "user",
      "app.auth.impersonator.id": "",
    },
    {
      "app.actor.type": "organization",
      "app.actor.id": "org",
      "app.auth.credential.id": "",
    },
  ])
    it.effect(
      `rejects invalid request identity/actor annotations before ingestion: ${JSON.stringify(annotations)}`,
      () => {
        const { layer, request } = setup(false);
        return Effect.gen(function* () {
          const service = yield* Events;
          const now = DateTime.toEpochMillis(yield* DateTime.now);
          const error = yield* service
            .process(encode(envelope([event(now)])))
            .pipe(Effect.flip);
          expect(error.status).toBe(503);
        }).pipe(
          Effect.annotateLogs(annotations),
          Effect.provideService(HttpServerRequest.HttpServerRequest, request()),
          Effect.provide(layer),
        );
      },
    );

  it.effect("discards browser audit, actor and executor claims", () => {
    const { layer, request } = setup(true, () =>
      Effect.succeed({
        organizationId: "verified-org",
      }),
    );
    return Effect.gen(function* () {
      const analytics = yield* Events;
      const record = event(DateTime.toEpochMillis(yield* DateTime.now));
      const output = yield* analytics.process(
        encode(
          envelope([
            {
              ...record,
              attributes: [
                ...record.attributes,
                attr("app.actor.type", "system"),
                attr("app.actor.id", "forged"),
                attr("app.auth.method", "api_key"),
                attr("app.auth.credential.id", "forged-key"),
                attr("app.auth.impersonator.id", "forged-admin"),
                attr("app.audit.outcome", "success"),
                attr("app.audit.target.id", "forged"),
                attr("app.event.category", "audit"),
                attr("app.executor.type", "ai_agent"),
                attr("app.access.channel", "mcp"),
                attr("gen_ai.agent.id", "forged"),
              ],
            },
          ]),
        ),
      );
      const payload = yield* Schema.decodeUnknownEffect(
        Schema.fromJsonString(OtlpLogs),
      )(new TextDecoder().decode(output.body));
      const enriched = yield* Schema.decodeUnknownEffect(EventLogRecord)(
        payload.resourceLogs[0]!.scopeLogs[0]!.logRecords[0],
      );
      const attrs = Object.fromEntries(
        enriched.attributes.map(({ key, value }) => [key, value]),
      );
      expect(attrs).toMatchObject({
        "organization.id": { stringValue: "verified-org" },
        "app.event.category": { stringValue: "analytics" },
        "app.event.source": { stringValue: "browser" },
      });
      expect(attrs["app.audit.outcome"]).toBeUndefined();
      expect(attrs["app.actor.id"]).toBeUndefined();
      expect(attrs["app.actor.type"]).toBeUndefined();
      expect(attrs["app.auth.method"]).toBeUndefined();
      expect(attrs["app.auth.credential.id"]).toBeUndefined();
      expect(attrs["app.auth.impersonator.id"]).toBeUndefined();
      expect(attrs["app.audit.target.id"]).toBeUndefined();
      expect(attrs["app.executor.type"]).toBeUndefined();
      expect(attrs["app.access.channel"]).toBeUndefined();
      expect(attrs["gen_ai.agent.id"]).toBeUndefined();
    }).pipe(
      Effect.provideService(HttpServerRequest.HttpServerRequest, request()),
      Effect.provide(layer),
    );
  });
  for (const scenario of [
    {
      config: {
        OTEL_SERVICE_NAME: "server-api",
        OTEL_RESOURCE_ATTRIBUTES: "service.name=resource-api",
      },
      expected: "server-api",
    },
    {
      config: { OTEL_RESOURCE_ATTRIBUTES: "service.name=resource-api" },
      expected: "resource-api",
    },
    {
      config: { OTEL_SERVICE_NAME: "server-api" },
      serviceName: "explicit-api",
      expected: "explicit-api",
    },
  ]) {
    it.effect(
      `scopes visitor hashing to trusted OTel configuration (${scenario.expected})`,
      () => {
        const { request } = setup();
        return Effect.gen(function* () {
          const analytics = yield* Events;
          const now = yield* DateTime.now;
          const body = envelope([event(DateTime.toEpochMillis(now))]);
          const output = yield* analytics.process(encode(body));
          const decoded = yield* Schema.decodeUnknownEffect(
            Schema.fromJsonString(OtlpLogs),
          )(new TextDecoder().decode(output.body));
          // Keep producer metadata, but do not trust it for visitor or storage scoping.
          expect(decoded.resourceLogs[0]!.resource).toEqual(
            body.resourceLogs[0]!.resource,
          );
          const record = yield* Schema.decodeUnknownEffect(EventLogRecord)(
            decoded.resourceLogs[0]!.scopeLogs[0]!.logRecords[0],
          );
          expect(record.attributes).toContainEqual(
            attr(
              "analytics.anonymous_id",
              yield* dailyVisitorId({
                serviceName: scenario.expected,
                ip: "203.0.113.42",
                userAgent: ua,
                day: DateTime.formatIsoDate(now),
                secret,
              }),
            ),
          );
          expect(
            record.attributes.some(({ key }) => key === "analytics.site.id"),
          ).toBe(false);
        }).pipe(
          Effect.provideService(HttpServerRequest.HttpServerRequest, request()),
          Effect.provide(
            eventsLayer({
              origin: "https://example.com",
              secret,
              geolocation: "cloudflare",
              serviceName: scenario.serviceName,
            }),
          ),
          Effect.provide(
            ConfigProvider.layer(ConfigProvider.fromUnknown(scenario.config)),
          ),
        );
      },
    );
  }
  it.effect(
    "collects anonymous visitors without SQL, migrations or session IDs when no SqlClient is injected",
    () => {
      const { request } = setup();
      return Effect.gen(function* () {
        const analytics = yield* Events;
        const output = yield* analytics.process(
          encode(
            envelope([event(DateTime.toEpochMillis(yield* DateTime.now))]),
          ),
        );
        expect(output.persisted).toBe(false);
        const payload = yield* Schema.decodeUnknownEffect(
          Schema.fromJsonString(OtlpLogs),
        )(new TextDecoder().decode(output.body));
        const record = yield* Schema.decodeUnknownEffect(EventLogRecord)(
          payload.resourceLogs[0]!.scopeLogs[0]!.logRecords[0],
        );
        expect(
          record.attributes.some(({ key }) => key === "analytics.anonymous_id"),
        ).toBe(true);
        expect(record.attributes.some(({ key }) => key === "session.id")).toBe(
          false,
        );
      }).pipe(
        Effect.provideService(HttpServerRequest.HttpServerRequest, request()),
        Effect.provide(
          eventsLayer({
            serviceName: "stateless",
            origin: "https://example.com",
            secret,
            geolocation: "cloudflare",
          }),
        ),
      );
    },
  );
  for (const mode of [
    "no-hook",
    "verified",
    "anonymous",
    "user-only",
  ] as const) {
    it.effect(
      `handles ${mode} identity without trusting browser IDs over the hook`,
      () => {
        let calls = 0;
        const { layer, request } = setup(
          false,
          mode === "no-hook"
            ? undefined
            : (incoming) =>
                Effect.sync(() => {
                  calls++;
                  expect(incoming.headers.cookie).toBe("session=test");
                  if (mode === "anonymous") return null;
                  return mode === "verified"
                    ? {
                        userId: "verified-user",
                        organizationId: "verified-org",
                      }
                    : { userId: "verified-user" };
                }),
        );
        return Effect.gen(function* () {
          const service = yield* Events;
          const now = DateTime.toEpochMillis(yield* DateTime.now);
          const record = event(now);
          const identified = {
            ...record,
            attributes: [
              ...record.attributes,
              attr("user.id", "client-user"),
              attr("organization.id", "client-org"),
            ],
          };
          const output = yield* service.process(
            encode(envelope([identified, identified])),
          );
          const decoded = yield* Schema.decodeUnknownEffect(
            Schema.fromJsonString(OtlpLogs),
          )(new TextDecoder().decode(output.body));
          const records = yield* Schema.decodeUnknownEffect(
            Schema.Array(EventLogRecord),
          )(decoded.resourceLogs[0]!.scopeLogs[0]!.logRecords);
          for (const result of records) {
            const identity = result.attributes.filter(
              ({ key }) => key === "user.id" || key === "organization.id",
            );
            expect(identity).toEqual(
              mode === "anonymous" || mode === "no-hook"
                ? []
                : [
                    attr("user.id", "verified-user"),
                    ...(mode === "verified"
                      ? [attr("organization.id", "verified-org")]
                      : []),
                  ],
            );
          }
          expect(calls).toBe(mode === "no-hook" ? 0 : 1);
        }).pipe(
          Effect.provideService(
            HttpServerRequest.HttpServerRequest,
            request({ cookie: "session=test" }),
          ),
          Effect.provide(layer),
        );
      },
    );
  }

  for (const mode of ["failure", "invalid"] as const) {
    it.effect(
      `rejects ${mode} hook results before changing sessions and skips identity resolution for other scopes`,
      () => {
        let calls = 0;
        const { layer, request } = setup(true, () =>
          Effect.suspend(() => {
            calls++;
            return mode === "failure"
              ? Effect.fail("auth unavailable")
              : Effect.succeed({ userId: "" });
          }),
        );
        return Effect.gen(function* () {
          const service = yield* Events;
          const ordinary = encode({
            resourceLogs: [
              { scopeLogs: [{ scope: { name: "other" }, logRecords: [] }] },
            ],
          });
          expect((yield* service.process(ordinary)).body).toBe(ordinary);
          expect(calls).toBe(0);
          const now = DateTime.toEpochMillis(yield* DateTime.now);
          const invalid = { ...event(now), timeUnixNano: "-1" };
          expect(
            (yield* service
              .process(encode(envelope([invalid])))
              .pipe(Effect.flip)).status,
          ).toBe(400);
          expect(calls).toBe(0);
          expect(
            (yield* service
              .process(encode(envelope([event(now)])))
              .pipe(Effect.flip)).status,
          ).toBe(503);
          expect(calls).toBe(1);
        }).pipe(
          Effect.provideService(HttpServerRequest.HttpServerRequest, request()),
          Effect.provide(layer),
        );
      },
    );
  }

  it.effect(
    "preserves the OTLP envelope, scope and trace correlation while replacing untrusted enrichment",
    () => {
      const { layer, request } = setup();
      return Effect.gen(function* () {
        const service = yield* Events;
        const now = DateTime.toEpochMillis(yield* DateTime.now);
        const input = envelope([event(now)]);
        const output = yield* service.process(encode(input));
        const decoded = yield* Schema.decodeUnknownEffect(
          Schema.fromJsonString(OtlpLogs),
        )(new TextDecoder().decode(output.body));
        const resource = decoded.resourceLogs[0]!;
        expect(resource.resource).toEqual(input.resourceLogs[0]!.resource);
        expect(resource.schemaUrl).toBe(input.resourceLogs[0]!.schemaUrl);
        expect(resource.scopeLogs[1]).toEqual(
          input.resourceLogs[0]!.scopeLogs[1],
        );
        expect(resource.scopeLogs[0]!.scope).toEqual({
          name: "krakstack.application.events",
          version: "1",
        });
        const record = yield* Schema.decodeUnknownEffect(EventLogRecord)(
          resource.scopeLogs[0]!.logRecords[0],
        );
        expect(record.traceId).toBe("a".repeat(32));
        expect(record.spanId).toBe("b".repeat(16));
        expect(record.timeUnixNano).toBe(event(now).timeUnixNano);
        const values = Object.fromEntries(
          record.attributes.map(({ key, value }) => [key, value]),
        );
        expect(values["geo.country.iso_code"]).toEqual({ stringValue: "FR" });
        expect(values["session.id"]).toBeUndefined();
        expect(values["app.button"]).toEqual({ stringValue: "start" });
        expect(values["browser.name"]).toEqual({ stringValue: "Chrome" });
        expect(new TextDecoder().decode(output.body)).not.toContain(
          "203.0.113.42",
        );
        expect(new TextDecoder().decode(output.body)).not.toContain(ua);
      }).pipe(
        Effect.provideService(HttpServerRequest.HttpServerRequest, request()),
        Effect.provide(layer),
      );
    },
  );

  it.effect("leaves ordinary OTLP log batches byte-for-byte unchanged", () => {
    const { layer, request } = setup();
    return Effect.gen(function* () {
      const service = yield* Events;
      const body = encode({
        resourceLogs: [
          {
            scopeLogs: [
              { scope: { name: "other" }, logRecords: [{ body: {} }] },
            ],
          },
        ],
      });
      expect((yield* service.process(body)).body).toBe(body);
      const empty = new TextEncoder().encode("{}");
      expect((yield* service.process(empty)).body).toBe(empty);
    }).pipe(
      Effect.provideService(
        HttpServerRequest.HttpServerRequest,
        request({ origin: "https://other.test" }),
      ),
      Effect.provide(layer),
    );
  });

  const invalidHeaders: Array<Record<string, string>> = [
    { origin: "https://evil.test" },
    { origin: "" },
    { "sec-fetch-site": "cross-site" },
  ];
  for (const headers of invalidHeaders) {
    it.effect(
      `rejects disallowed browser origin ${JSON.stringify(headers)}`,
      () => {
        const { layer, request } = setup();
        return Effect.gen(function* () {
          const service = yield* Events;
          const now = DateTime.toEpochMillis(yield* DateTime.now);
          const error = yield* service
            .process(encode(envelope([event(now)])))
            .pipe(Effect.flip);
          expect(error.status).toBe(403);
        }).pipe(
          Effect.provideService(
            HttpServerRequest.HttpServerRequest,
            request(headers),
          ),
          Effect.provide(layer),
        );
      },
    );
  }

  for (const mode of ["untrusted", "missing", "invalid"] as const) {
    it.effect(
      `does not derive identity from ${mode} Cloudflare information`,
      () => {
        const { layer, request } = setup(mode !== "untrusted");
        return Effect.gen(function* () {
          const service = yield* Events;
          const now = DateTime.toEpochMillis(yield* DateTime.now);
          const output = new TextDecoder().decode(
            (yield* service.process(encode(envelope([event(now)])))).body,
          );
          expect(output).toContain("unattributed");
          expect(output).not.toContain('"key":"session.id"');
          expect(output).not.toContain("analytics.anonymous_id");
          if (mode === "untrusted") expect(output).not.toContain('"key":"geo.');
        }).pipe(
          Effect.provideService(
            HttpServerRequest.HttpServerRequest,
            request(
              mode === "untrusted"
                ? {}
                : { "cf-connecting-ip": mode === "missing" ? "" : "not-an-ip" },
            ),
          ),
          Effect.provide(layer),
        );
      },
    );
  }

  it.effect(
    "rejects invalid versions, timestamps, identifiers, paths, duplicate attributes and oversized batches before session mutation",
    () => {
      const { layer, request } = setup();
      return Effect.gen(function* () {
        const service = yield* Events;
        const now = DateTime.toEpochMillis(yield* DateTime.now);
        const valid = event(now);
        const invalid = [
          { ...valid, timeUnixNano: "-1" },
          {
            ...valid,
            timeUnixNano: (BigInt(now + 61_000) * 1_000_000n).toString(),
          },
          {
            ...valid,
            attributes: valid.attributes.map((a) =>
              a.key === "app.event.schema.version" ? attr(a.key, "2") : a,
            ),
          },
          {
            ...valid,
            attributes: valid.attributes.map((a) =>
              a.key === "log.record.uid" ? attr(a.key, "") : a,
            ),
          },
          {
            ...valid,
            attributes: valid.attributes.map((a) =>
              a.key === "url.path" ? attr(a.key, "/docs?secret=value") : a,
            ),
          },
          {
            ...valid,
            attributes: [...valid.attributes, attr("url.path", "/duplicate")],
          },
        ];
        for (const record of invalid) {
          const error = yield* service
            .process(encode(envelope([record])))
            .pipe(Effect.flip);
          expect(error.status).toBe(400);
        }
        expect(
          (yield* service
            .process(encode(envelope(Array.from({ length: 101 }, () => valid))))
            .pipe(Effect.flip)).status,
        ).toBe(400);
      }).pipe(
        Effect.provideService(HttpServerRequest.HttpServerRequest, request()),
        Effect.provide(layer),
      );
    },
  );

  it.effect(
    "scopes pseudonymous identity to the site, UTC day and secret",
    () =>
      Effect.gen(function* () {
        const input = {
          serviceName: "service-a",
          ip: "203.0.113.42",
          userAgent: ua,
          day: "2026-10-18",
          secret,
        };
        const original = yield* dailyVisitorId(input);
        expect(original).toMatch(/^[a-f0-9]{64}$/);
        expect(yield* dailyVisitorId(input)).toBe(original);
        for (const change of [
          { serviceName: "service-b" },
          { day: "2026-10-19" },
          { secret: Redacted.make("another-secure-secret") },
          { ip: "203.0.113.43" },
          { userAgent: "different-browser" },
        ]) {
          expect(yield* dailyVisitorId({ ...input, ...change })).not.toBe(
            original,
          );
        }
      }).pipe(Effect.provide(BrowserCrypto.layer)),
  );
});
