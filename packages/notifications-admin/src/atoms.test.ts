import { describe, expect, it } from "@effect/vitest";
import { Effect, Layer, Schema } from "effect";
import { HttpClient, HttpClientResponse } from "effect/http";
import { AtomRegistry } from "effect/reactivity";
import {
  makeNotificationDeliveryAtoms,
  deliveryQueryKey,
  deliveryInspectionKey,
} from "./delivery.atom.js";
import {
  makeSendOperationsAtoms,
  operationsQueryKey,
} from "./operations.atom.js";
import { NotificationScope } from "@krak-stack/notifications/schema";
import type { AdminDeliveryInspection } from "@krak-stack/notifications/admin/delivery.schema";

const scope = {
  recipientUserId: "reader-1",
  organizationId: "org-1",
  workspaceId: null,
};
const key = deliveryQueryKey({
  view: "overview",
  source: "all",
  table: { page: 0, pageSize: 20 },
});
const overview = {
  total: 7,
  queued: 0,
  processing: 0,
  retrying: 0,
  accepted: 7,
  failed: 0,
  suppressed: 0,
  cancelled: 0,
  feedbackCovered: 0,
  feedbackUnavailable: 7,
  confirmed: 0,
  hardBounced: 0,
  softBounced: 0,
  complained: 0,
  pendingFeedback: 0,
  activeSuppressions: 0,
};
const registry = Effect.acquireRelease(
  Effect.sync(() => AtomRegistry.make()),
  (registry) => Effect.sync(() => registry.dispose()),
);
const transport = (
  requests: URL[],
  total = 7,
  inspection?: typeof AdminDeliveryInspection.Type,
) =>
  Layer.succeed(
    HttpClient.HttpClient,
    HttpClient.make((request, url) =>
      Effect.sync(() => {
        requests.push(url);
        return HttpClientResponse.fromWeb(
          request,
          Response.json(
            url.pathname.endsWith("/overview") || !inspection
              ? { ...overview, total }
              : inspection,
          ),
        );
      }),
    ),
  );

describe("notification admin query configuration", () => {
  it.effect(
    "applies configured delivery scope when absent from the query key",
    () =>
      Effect.gen(function* () {
        const requests: URL[] = [];
        const inspection: typeof AdminDeliveryInspection.Type = {
          delivery: {
            id: "019a0000-0000-7000-8000-000000000001",
            source: "engine",
            ...scope,
            contactId: null,
            campaignId: null,
            campaignName: null,
            recipientAddress: "reader@example.com",
            recipientName: null,
            eventKey: "example.receipt",
            purpose: "transactional",
            template: null,
            status: "sent",
            attempts: 1,
            maxAttempts: 5,
            provider: "fake",
            providerMessageId: null,
            errorMessage: null,
            createdAt: new Date(0),
            updatedAt: new Date(0),
            scheduledFor: new Date(0),
            sentAt: null,
          },
          attempts: [],
          references: [],
        };
        const atoms = makeNotificationDeliveryAtoms({
          baseUrl: "https://admin.example",
          authorizationKey: "session-1",
          scope,
          httpClient: transport(requests, 7, inspection),
        });
        const store = yield* registry;
        const value = yield* AtomRegistry.getResult(
          store,
          atoms.query(key).atom,
        ).pipe(Effect.orDie);
        expect(value.overview?.total).toBe(7);
        expect(requests).toHaveLength(1);
        expect(
          yield* Schema.decodeEffect(Schema.fromJsonString(NotificationScope))(
            requests[0].searchParams.get("scope") ?? "",
          ),
        ).toEqual(scope);
        const inspected = yield* AtomRegistry.getResult(
          store,
          atoms.inspection(
            deliveryInspectionKey({
              id: inspection.delivery.id,
              queryKey: key,
            }),
          ),
        ).pipe(Effect.orDie);
        expect(inspected.delivery.organizationId).toBe(scope.organizationId);
        expect(requests).toHaveLength(2);
        expect(
          yield* Schema.decodeEffect(Schema.fromJsonString(NotificationScope))(
            requests[1].searchParams.get("scope") ?? "",
          ),
        ).toEqual(scope);
      }),
  );

  it("rejects conflicting scope for both lists and inspections before dispatch", () => {
    const atoms = makeNotificationDeliveryAtoms({
      baseUrl: "https://admin.example",
      authorizationKey: "session-1",
      scope,
    });
    const conflicting = deliveryQueryKey({
      view: "activity",
      source: "all",
      table: { page: 0, pageSize: 20 },
      scope: { ...scope, organizationId: "org-2" },
    });
    expect(() => atoms.query(conflicting)).toThrow();
    expect(() =>
      atoms.inspection(
        deliveryInspectionKey({
          id: "delivery-1",
          queryKey: conflicting,
        }),
      ),
    ).toThrow();
  });

  it.effect(
    "partitions operations queries by host/session and accepts a host transport",
    () =>
      Effect.gen(function* () {
        const firstRequests: URL[] = [];
        const secondRequests: URL[] = [];
        const otherHostRequests: URL[] = [];
        const first = makeSendOperationsAtoms({
          baseUrl: "https://admin.example",
          authorizationKey: "session-1",
          httpClient: transport(firstRequests, 7),
        });
        const second = makeSendOperationsAtoms({
          baseUrl: "https://admin.example",
          authorizationKey: "session-2",
          httpClient: transport(secondRequests, 2),
        });
        const otherHost = makeSendOperationsAtoms({
          baseUrl: "https://another-admin.example",
          authorizationKey: "session-1",
          httpClient: transport(otherHostRequests, 3),
        });
        const store = yield* registry;
        const key = operationsQueryKey({
          view: "overview",
          filters: {},
          table: { page: 0, pageSize: 20 },
        });
        expect(
          (yield* AtomRegistry.getResult(store, first.query(key).atom).pipe(
            Effect.orDie,
          )).overview?.total,
        ).toBe(7);
        expect(
          (yield* AtomRegistry.getResult(store, second.query(key).atom).pipe(
            Effect.orDie,
          )).overview?.total,
        ).toBe(2);
        expect(
          (yield* AtomRegistry.getResult(store, otherHost.query(key).atom).pipe(
            Effect.orDie,
          )).overview?.total,
        ).toBe(3);
        expect(firstRequests).toHaveLength(1);
        expect(secondRequests).toHaveLength(1);
        expect(otherHostRequests).toHaveLength(1);
        expect(first.authorizationKey).not.toBe(second.authorizationKey);
      }),
  );

  it("keeps the legacy operations factory isolated per construction", () => {
    expect(makeSendOperationsAtoms("/api").authorizationKey).not.toBe(
      makeSendOperationsAtoms("/api").authorizationKey,
    );
  });
});
