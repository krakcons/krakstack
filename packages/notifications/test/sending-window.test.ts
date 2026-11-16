import { describe, expect, it } from "@effect/vitest";
import { Effect, Schema } from "effect";
import * as TestClock from "effect/testing/TestClock";
import {
  SendingWindow,
  sendingWindowPolicy,
  sendingWindowRequirement,
} from "../src/sending-window.js";
import { publicationFingerprint } from "../src/internal/idempotency.js";
import { resolvePublication } from "../src/internal/publication.js";
import type { PublicationInput } from "../src/schema.js";

const window = {
  timeZone: "America/Edmonton",
  start: "01:00",
  end: "05:00",
};

const checkAt = Effect.fnUntraced(function* (
  instant: string,
  configuration = window,
) {
  yield* TestClock.setTime(new Date(instant).getTime());
  const requirement = yield* sendingWindowRequirement(configuration);
  return yield* sendingWindowPolicy.check({
    scope: { recipientUserId: null, organizationId: null, workspaceId: null },
    eventKey: "example.optional",
    channel: "email",
    subject: requirement.subject,
    publication: {
      version: 1,
      recipient: { address: "reader@example.com", name: null },
      policy: { kind: "transactional" },
      checks: [requirement],
    },
  });
});

describe("sending windows", () => {
  for (const [instant, until] of [
    ["2026-01-15T07:59:59.999Z", "2026-01-15T08:00:00.000Z"],
    ["2026-01-15T08:00:00.000Z", null],
    ["2026-01-15T10:30:00.000Z", null],
    ["2026-01-15T11:59:59.999Z", null],
    ["2026-01-15T12:00:00.000Z", "2026-01-16T08:00:00.000Z"],
  ] satisfies ReadonlyArray<readonly [string, string | null]>) {
    it.effect(`uses inclusive start and exclusive end at ${instant}`, () =>
      Effect.gen(function* () {
        const decision = yield* checkAt(instant);
        if (until === null) expect(decision).toEqual({ _tag: "Allow" });
        else
          expect(decision).toEqual({
            _tag: "Defer",
            reason: "outside_sending_window",
            until: new Date(until),
          });
      }),
    );
  }

  it.effect("handles both sides of an overnight window", () =>
    Effect.gen(function* () {
      const overnight = { ...window, start: "23:00", end: "05:00" };
      for (const instant of [
        "2026-01-16T06:00:00Z",
        "2026-01-16T07:00:00Z",
        "2026-01-16T11:59:59Z",
      ]) {
        expect(yield* checkAt(instant, overnight)).toEqual({ _tag: "Allow" });
      }
      expect(yield* checkAt("2026-01-16T12:00:00Z", overnight)).toMatchObject({
        _tag: "Defer",
        until: new Date("2026-01-17T06:00:00Z"),
      });
    }),
  );

  it.effect("uses the delivery timezone, including non-hour offsets", () =>
    Effect.gen(function* () {
      expect(yield* checkAt("2026-01-15T08:00:00Z")).toEqual({ _tag: "Allow" });
      expect(
        yield* checkAt("2026-01-15T08:00:00Z", {
          ...window,
          timeZone: "Asia/Kathmandu",
        }),
      ).toMatchObject({
        _tag: "Defer",
        until: new Date("2026-01-15T19:15:00Z"),
      });
    }),
  );

  for (const [name, instant, configuration, until] of [
    [
      "gap opening",
      "2026-03-08T08:59:59Z",
      { ...window, start: "02:30", end: "04:00" },
      "2026-03-08T09:00:00Z",
    ],
    [
      "entirely missing window",
      "2026-03-08T08:00:00Z",
      { ...window, start: "02:15", end: "02:45" },
      "2026-03-09T08:15:00Z",
    ],
    [
      "second repeated opening",
      "2025-11-02T07:50:00Z",
      { ...window, start: "01:15", end: "01:45" },
      "2025-11-02T08:15:00Z",
    ],
    [
      "rollback into an already open window",
      "2025-11-02T07:50:00Z",
      { ...window, start: "00:30", end: "01:45" },
      "2025-11-02T08:00:00Z",
    ],
    [
      "half-hour DST gap",
      "2026-10-03T15:20:00Z",
      { timeZone: "Australia/Lord_Howe", start: "02:10", end: "03:00" },
      "2026-10-03T15:30:00Z",
    ],
    [
      "skipped calendar date",
      "2011-12-30T09:00:00Z",
      { timeZone: "Pacific/Apia", start: "01:00", end: "02:00" },
      "2011-12-30T11:00:00Z",
    ],
  ] satisfies ReadonlyArray<readonly [string, string, typeof window, string]>) {
    it.effect(`finds the earliest actual opening: ${name}`, () =>
      Effect.gen(function* () {
        expect(yield* checkAt(instant, configuration)).toMatchObject({
          _tag: "Defer",
          until: new Date(until),
        });
        expect(yield* checkAt(until, configuration)).toEqual({ _tag: "Allow" });
      }),
    );
  }

  it.effect(
    "allows both repeated intervals but not the closed interval between them",
    () =>
      Effect.gen(function* () {
        const repeated = { ...window, start: "01:15", end: "01:45" };
        for (const instant of [
          "2025-11-02T07:30:00Z",
          "2025-11-02T08:30:00Z",
        ]) {
          expect(yield* checkAt(instant, repeated)).toEqual({ _tag: "Allow" });
        }
        for (const instant of [
          "2025-11-02T07:45:00Z",
          "2025-11-02T08:45:00Z",
        ]) {
          expect((yield* checkAt(instant, repeated))._tag).toBe("Defer");
        }
      }),
  );

  for (const invalid of [
    { ...window, timeZone: "Not/AZone" },
    { ...window, timeZone: "+07:00" },
    { ...window, start: "1:00" },
    { ...window, end: "24:00" },
    { ...window, start: "01:60" },
    { ...window, start: "01:00:00" },
    { ...window, end: "01:00" },
  ]) {
    it.effect(`rejects invalid configuration ${JSON.stringify(invalid)}`, () =>
      Effect.gen(function* () {
        expect(Schema.decodeExit(SendingWindow)(invalid)._tag).toBe("Failure");
        expect(
          (yield* sendingWindowRequirement(invalid).pipe(Effect.flip))._tag,
        ).toBe("DispatchPolicyError");
      }),
    );
  }

  it.effect("fails closed for malformed persisted subjects", () =>
    Effect.gen(function* () {
      const requirement = yield* sendingWindowRequirement(window);
      for (const subject of [
        { namespace: requirement.subject.namespace, value: "not json" },
        { namespace: "unrecognized", value: requirement.subject.value },
        {
          namespace: requirement.subject.namespace,
          value: JSON.stringify({
            ...window,
            timeZone: "Not/AZone",
          }),
        },
      ]) {
        expect(
          (yield* sendingWindowPolicy
            .check({
              scope: {
                recipientUserId: null,
                organizationId: null,
                workspaceId: null,
              },
              eventKey: "example.optional",
              channel: "email",
              subject,
              publication: {
                version: 1,
                recipient: { address: "reader@example.com", name: null },
                policy: { kind: "transactional" },
                checks: [requirement],
              },
            })
            .pipe(Effect.flip))._tag,
        ).toBe("DispatchPolicyError");
      }
    }),
  );

  it.effect(
    "encodes deterministically and fingerprints every part of immutable intent",
    () =>
      Effect.gen(function* () {
        const original = yield* sendingWindowRequirement(window);
        expect(
          yield* sendingWindowRequirement({
            end: window.end,
            start: window.start,
            timeZone: window.timeZone,
          }),
        ).toEqual(original);
        const fingerprint = (check: typeof original) =>
          publicationFingerprint(
            resolvePublication({
              idempotencyKey: "example",
              scope: {
                recipientUserId: null,
                organizationId: null,
                workspaceId: null,
              },
              eventKey: "example.optional",
              eventVersion: 1,
              deliveries: [
                {
                  key: "email",
                  channel: "email",
                  recipient: { address: "reader@example.com", name: null },
                  policy: { kind: "transactional" },
                  checks: [check],
                  template: null,
                  payloadVersion: 1,
                  payload: {},
                },
              ],
            } satisfies PublicationInput),
          );
        for (const changed of [
          { ...window, start: "02:00" },
          { ...window, end: "06:00" },
          { ...window, timeZone: "Europe/Paris" },
        ]) {
          expect(
            fingerprint(yield* sendingWindowRequirement(changed)),
          ).not.toBe(fingerprint(original));
        }
        expect(
          fingerprint({ ...original, version: original.version + 1 }),
        ).not.toBe(fingerprint(original));
      }),
  );
});
