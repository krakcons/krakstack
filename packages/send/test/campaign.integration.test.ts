import { describe, expect, it } from "@effect/vitest";
import { DateTime, Effect } from "effect";
import { WorkflowEngine } from "effect/workflow";
import * as TestClock from "effect/testing/TestClock";
import { SendCampaigns } from "../src/campaign.js";
import {
  DispatchSendCampaignBatchV1,
  campaignWorkflowLayer,
} from "../src/campaign.workflows.js";
import { CreateCampaign } from "../src/schema.js";
import { withSend } from "./fixtures/send.js";

export const campaignPayload = {
  requestId: "campaign-create",
  name: "News",
  from: "sender@example.com",
  audience: { _tag: "AllSubscribed" },
  content: {
    en: {
      subject: "News",
      text: "English body",
      unsubscribeText: "Unsubscribe",
    },
    fr: {
      subject: "Nouvelles",
      text: "Corps français",
      unsubscribeText: "Désabonner",
    },
  },
} satisfies typeof CreateCampaign.Type;
const scope = {
  recipientUserId: null,
  organizationId: null,
  workspaceId: null,
};
const grant = (contactId: string, requestId: string) =>
  ({
    contactId,
    requestId,
    status: "subscribed",
    source: "test",
    actor: "host",
    noticeVersion: "v1",
  }) satisfies Parameters<
    import("../src/index.js").KrakSend["Service"]["recordEmailConsent"]
  >[0];

describe.skipIf(!process.env.TEST_DATABASE_URL)(
  "campaign orchestration",
  () => {
    it.effect(
      "reports distinct recipients and keeps acceptance separate from provider confirmations",
      () =>
        withSend(({ send, campaigns, runtime, notifications, feedback }) =>
          Effect.gen(function* () {
            const contact = yield* send.createContact({
              email: "person@example.com",
            });
            yield* send.recordEmailConsent(grant(contact.id, "report-grant"));
            const campaign = yield* campaigns.create({
              payload: campaignPayload,
              actor: "admin",
            });
            yield* campaigns.schedule({
              id: campaign.id,
              scheduledFor: new Date(0),
            });
            expect(yield* campaigns.report({ id: campaign.id })).toMatchObject({
              audience: 1,
              pending: 1,
              published: 0,
              accepted: 0,
              confirmed: 0,
            });
            yield* campaigns.processBatch({ id: campaign.id, batchNumber: 0 });
            expect(yield* campaigns.report({ id: campaign.id })).toMatchObject({
              pending: 0,
              published: 1,
              accepted: 0,
              confirmed: 0,
            });
            yield* runtime.runDeliveryWorkerOnce;
            expect(yield* campaigns.report({ id: campaign.id })).toMatchObject({
              accepted: 1,
              confirmed: 0,
            });
            const page = yield* notifications.listDeliveries({
              scope,
              channel: "email",
              statuses: [],
              pagination: { limit: 25, cursor: null },
            });
            const delivery = page.items[0];
            if (!delivery.providerMessageId)
              return yield* Effect.die(new Error("Missing acceptance ID"));
            for (const eventId of ["confirmation-1", "confirmation-2"])
              yield* feedback.record({
                provider: "fake",
                eventId,
                providerMessageId: delivery.providerMessageId,
                recipientAddress: contact.email,
                kind: "delivered",
                occurredAt: new Date(),
              });
            yield* feedback.record({
              provider: "fake",
              eventId: "complaint",
              providerMessageId: delivery.providerMessageId,
              recipientAddress: contact.email,
              kind: "complaint",
              occurredAt: new Date(),
            });
            expect(yield* campaigns.report({ id: campaign.id })).toMatchObject({
              audience: 1,
              accepted: 1,
              confirmed: 1,
              complained: 1,
            });
          }),
        ),
    );
    it.effect(
      "snapshots subscribed recipients once and renders the required locale and unsubscribe link",
      () =>
        withSend(({ send, campaigns, notifications }) =>
          Effect.gen(function* () {
            const contact = yield* send.createContact({
              email: "person@example.com",
              locale: "fr",
            });
            yield* send.recordEmailConsent(grant(contact.id, "grant"));
            yield* send.createContact({ email: "other@example.com" });
            const campaign = yield* campaigns.create({
              payload: campaignPayload,
              actor: "admin",
            });
            expect(
              (yield* campaigns.create({
                payload: campaignPayload,
                actor: "admin",
              })).id,
            ).toBe(campaign.id);
            expect(
              (yield* campaigns
                .create({
                  payload: { ...campaignPayload, name: "changed" },
                  actor: "admin",
                })
                .pipe(Effect.flip))._tag,
            ).toBe("SendConflict");
            yield* campaigns.schedule({
              id: campaign.id,
              scheduledFor: new Date(0),
            });
            const later = yield* send.createContact({
              email: "one@example.com",
            });
            yield* send.recordEmailConsent(grant(later.id, "later"));
            yield* campaigns.schedule({
              id: campaign.id,
              scheduledFor: new Date(0),
            });
            expect(
              yield* campaigns.processBatch({
                id: campaign.id,
                batchNumber: 0,
              }),
            ).toEqual({ queued: 1, skipped: 0, hasMore: false });
            const deliveries = yield* notifications.listDeliveries({
              scope,
              channel: "email",
              statuses: [],
              pagination: { limit: 25, cursor: null },
            });
            expect(deliveries.items).toHaveLength(1);
            expect(deliveries.items[0].payload).toMatchObject({
              subject: "Nouvelles",
              text: expect.stringContaining("Désabonner: https://"),
              unsubscribeUrl: expect.stringContaining("token="),
            });
            expect((yield* campaigns.get({ id: campaign.id })).status).toBe(
              "completed",
            );
          }),
        ),
    );

    it.effect(
      "rechecks consent and environment restrictions during fan-out",
      () =>
        withSend(({ send, campaigns }) =>
          Effect.gen(function* () {
            for (const email of ["person@example.com", "blocked@example.com"]) {
              const contact = yield* send.createContact({ email });
              yield* send.recordEmailConsent(grant(contact.id, email));
            }
            const campaign = yield* campaigns.create({
              payload: campaignPayload,
              actor: "admin",
            });
            yield* campaigns.schedule({
              id: campaign.id,
              scheduledFor: new Date(0),
            });
            const contacts = yield* send.listContacts({});
            const person = contacts.items.find(
              (contact) => contact.email === "person@example.com",
            );
            if (!person)
              return yield* Effect.die(new Error("Missing test contact"));
            yield* send.withdrawEmailConsent({ id: person.id });
            expect(
              yield* campaigns.processBatch({
                id: campaign.id,
                batchNumber: 0,
              }),
            ).toEqual({ queued: 0, skipped: 2, hasMore: false });
          }),
        ),
    );

    it.effect(
      "concurrent and repeated generations publish each recipient only once",
      () =>
        withSend(({ send, campaigns, sql }) =>
          Effect.gen(function* () {
            for (const email of ["person@example.com", "other@example.com"]) {
              const contact = yield* send.createContact({ email });
              yield* send.recordEmailConsent(grant(contact.id, email));
            }
            const campaign = yield* campaigns.create({
              payload: campaignPayload,
              actor: "admin",
            });
            yield* campaigns.schedule({
              id: campaign.id,
              scheduledFor: new Date(0),
            });
            yield* Effect.all(
              [
                campaigns.processBatch({
                  id: campaign.id,
                  batchNumber: 0,
                  limit: 1,
                }),
                campaigns.processBatch({
                  id: campaign.id,
                  batchNumber: 0,
                  limit: 1,
                }),
              ],
              { concurrency: "unbounded" },
            );
            expect(
              yield* sql`SELECT count(*)::int AS count FROM kraksend_email_requests`,
            ).toEqual([{ count: 1 }]);
            yield* campaigns.processBatch({
              id: campaign.id,
              batchNumber: 1,
              limit: 1,
            });
            yield* campaigns.processBatch({
              id: campaign.id,
              batchNumber: 0,
              limit: 1,
            });
            expect(
              yield* sql`SELECT count(*)::int AS count FROM kraksend_email_requests`,
            ).toEqual([{ count: 2 }]);
          }),
        ),
    );

    it.effect(
      "does not fan out a future campaign and rolls back sender verification failures",
      () =>
        withSend(({ send, campaigns, setSenderVerified }) =>
          Effect.gen(function* () {
            const contact = yield* send.createContact({
              email: "person@example.com",
            });
            yield* send.recordEmailConsent(grant(contact.id, "grant"));
            const campaign = yield* campaigns.create({
              payload: campaignPayload,
              actor: "admin",
            });
            setSenderVerified(false);
            expect(
              (yield* campaigns
                .schedule({ id: campaign.id, scheduledFor: new Date(0) })
                .pipe(Effect.flip))._tag,
            ).toBe("CampaignSafetyError");
            expect(
              (yield* campaigns.get({ id: campaign.id })).snapshotAt,
            ).toBeNull();
            setSenderVerified(true);
            const now = yield* DateTime.nowAsDate;
            yield* campaigns.schedule({
              id: campaign.id,
              scheduledFor: new Date(now.getTime() + 60_000),
            });
            expect(
              (yield* campaigns.processBatch({
                id: campaign.id,
                batchNumber: 0,
              })).queued,
            ).toBe(0);
            yield* TestClock.adjust("60 seconds");
            expect(
              (yield* campaigns.processBatch({
                id: campaign.id,
                batchNumber: 1,
              })).queued,
            ).toBe(1);
          }),
        ),
    );

    it.effect(
      "pauses queued deliveries without spending provider attempts and resumes them",
      () =>
        withSend(({ send, campaigns, runtime, notifications, transport }) =>
          Effect.gen(function* () {
            const contact = yield* send.createContact({
              email: "person@example.com",
            });
            yield* send.recordEmailConsent(grant(contact.id, "grant"));
            const campaign = yield* campaigns.create({
              payload: campaignPayload,
              actor: "admin",
            });
            yield* campaigns.schedule({
              id: campaign.id,
              scheduledFor: new Date(0),
            });
            yield* campaigns.processBatch({ id: campaign.id, batchNumber: 0 });
            yield* campaigns.transition({ id: campaign.id, action: "pause" });
            yield* runtime.runDeliveryWorkerOnce;
            expect(transport.sent).toHaveLength(0);
            const page = yield* notifications.listDeliveries({
              scope,
              channel: "email",
              statuses: [],
              pagination: { limit: 25, cursor: null },
            });
            expect(page.items[0].attempts).toBe(0);
            yield* campaigns.transition({ id: campaign.id, action: "resume" });
            yield* TestClock.adjust("30 seconds");
            yield* runtime.enqueueDue();
            yield* runtime.runDeliveryWorkerOnce;
            expect(transport.sent).toHaveLength(1);
          }),
        ),
    );

    it.effect(
      "cancels pending and queued recipients, and blocks invalid terminal transitions",
      () =>
        withSend(
          ({ send, campaigns, runtime, notifications, transport, sql }) =>
            Effect.gen(function* () {
              for (const email of ["person@example.com", "other@example.com"]) {
                const contact = yield* send.createContact({ email });
                yield* send.recordEmailConsent(grant(contact.id, email));
              }
              const campaign = yield* campaigns.create({
                payload: campaignPayload,
                actor: "admin",
              });
              yield* campaigns.schedule({
                id: campaign.id,
                scheduledFor: new Date(0),
              });
              yield* campaigns.processBatch({
                id: campaign.id,
                batchNumber: 0,
                limit: 1,
              });
              yield* campaigns.transition({
                id: campaign.id,
                action: "cancel",
              });
              yield* runtime.runDeliveryWorkerOnce;
              expect(transport.sent).toHaveLength(0);
              expect(
                yield* sql`SELECT count(*)::int AS count FROM kraksend_campaign_recipients WHERE status = 'pending'`,
              ).toEqual([{ count: 0 }]);
              const deliveries = yield* notifications.listDeliveries({
                scope,
                channel: "email",
                statuses: [],
                pagination: { limit: 25, cursor: null },
              });
              expect(deliveries.items[0].errorMessage).toBe(
                "campaign_cancelled",
              );
              expect(
                (yield* campaigns
                  .transition({ id: campaign.id, action: "resume" })
                  .pipe(Effect.flip))._tag,
              ).toBe("SendConflict");
            }),
        ),
    );

    it.effect(
      "fails closed when sender verification is revoked after queueing",
      () =>
        withSend(({ send, campaigns, runtime, setSenderVerified, transport }) =>
          Effect.gen(function* () {
            const contact = yield* send.createContact({
              email: "person@example.com",
            });
            yield* send.recordEmailConsent(grant(contact.id, "grant"));
            const campaign = yield* campaigns.create({
              payload: campaignPayload,
              actor: "admin",
            });
            yield* campaigns.schedule({
              id: campaign.id,
              scheduledFor: new Date(0),
            });
            yield* campaigns.processBatch({ id: campaign.id, batchNumber: 0 });
            setSenderVerified(false);
            expect(
              (yield* runtime.runDeliveryWorkerOnce.pipe(Effect.flip))._tag,
            ).toBe("NotificationQueueError");
            expect(transport.sent).toHaveLength(0);
          }),
        ),
    );

    it.effect(
      "replays a completed durable workflow batch without publishing again",
      () =>
        withSend(({ send, campaigns, sql }) =>
          Effect.gen(function* () {
            const contact = yield* send.createContact({
              email: "person@example.com",
            });
            yield* send.recordEmailConsent(grant(contact.id, "grant"));
            const campaign = yield* campaigns.create({
              payload: campaignPayload,
              actor: "admin",
            });
            yield* campaigns.schedule({
              id: campaign.id,
              scheduledFor: new Date(0),
            });
            yield* Effect.gen(function* () {
              const input = { id: campaign.id, batchNumber: 0 };
              const first = yield* DispatchSendCampaignBatchV1.execute(input);
              expect(yield* DispatchSendCampaignBatchV1.execute(input)).toEqual(
                first,
              );
            }).pipe(
              Effect.provide(campaignWorkflowLayer),
              Effect.provideService(SendCampaigns, campaigns),
              Effect.provide(WorkflowEngine.layerMemory),
            );
            expect(
              yield* sql`SELECT count(*)::int AS count FROM kraksend_email_requests`,
            ).toEqual([{ count: 1 }]);
          }),
        ),
    );
  },
);
