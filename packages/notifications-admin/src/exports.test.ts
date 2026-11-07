import { describe, expect, it } from "@effect/vitest";
import * as admin from "@krak-stack/notifications-admin";
import { NotificationContacts } from "@krak-stack/notifications-admin/contacts";
import { NotificationCampaigns } from "@krak-stack/notifications-admin/campaigns";
import {
  NotificationOperations,
  NotificationDeliveries,
} from "@krak-stack/notifications-admin/operations";
import { NotificationDeliveries as Deliveries } from "@krak-stack/notifications-admin/deliveries";
import * as legacyContacts from "@krak-stack/registry/notifications/contacts";
import * as legacyCampaigns from "@krak-stack/registry/notifications/campaigns";
import * as legacyOperations from "@krak-stack/registry/notifications/operations";
import {
  makeNotificationContactAtoms,
  makeSendContactAtoms,
  makeNotificationCampaignAtoms,
  makeSendCampaignAtoms,
  makeNotificationOperationsAtoms,
  makeSendOperationsAtoms,
} from "@krak-stack/notifications-admin/atoms";

describe("notification admin package compatibility", () => {
  it("preserves one implementation across direct, root and legacy registry imports", () => {
    expect(admin.NotificationContacts).toBe(NotificationContacts);
    expect(admin.NotificationCampaigns).toBe(NotificationCampaigns);
    expect(admin.NotificationOperations).toBe(NotificationOperations);
    expect(admin.NotificationDeliveries).toBe(Deliveries);
    expect(legacyContacts.NotificationContacts).toBe(NotificationContacts);
    expect(legacyCampaigns.NotificationCampaigns).toBe(NotificationCampaigns);
    expect(legacyOperations.NotificationOperations).toBe(
      NotificationOperations,
    );
    expect(legacyOperations.NotificationDeliveries).toBe(
      NotificationDeliveries,
    );
    expect(legacyContacts.SendContacts).toBe(NotificationContacts);
    expect(legacyCampaigns.SendCampaignAdmin).toBe(NotificationCampaigns);
    expect(legacyOperations.SendOperationsAdmin).toBe(NotificationOperations);
  });
  it("keeps existing Effect Atom factory names as aliases", () => {
    expect(makeNotificationContactAtoms).toBe(makeSendContactAtoms);
    expect(makeNotificationCampaignAtoms).toBe(makeSendCampaignAtoms);
    expect(makeNotificationOperationsAtoms).toBe(makeSendOperationsAtoms);
  });
});
