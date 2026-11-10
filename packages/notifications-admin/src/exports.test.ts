import { describe, expect, it } from "@effect/vitest";
import { createRequire } from "node:module";
import * as admin from "@krak-stack/notifications-admin";
import { NotificationContacts } from "@krak-stack/notifications-admin/contacts";
import { NotificationCampaigns } from "@krak-stack/notifications-admin/campaigns";
import {
  NotificationOperations,
  NotificationDeliveries,
} from "@krak-stack/notifications-admin/operations";
import { NotificationDeliveries as Deliveries } from "@krak-stack/notifications-admin/deliveries";
import { NotificationPresentationProvider } from "@krak-stack/notifications-admin/presentation";
import {
  makeNotificationContactAtoms,
  makeSendContactAtoms,
  makeNotificationCampaignAtoms,
  makeSendCampaignAtoms,
  makeNotificationOperationsAtoms,
  makeSendOperationsAtoms,
} from "@krak-stack/notifications-admin/atoms";

describe("notification admin package exports", () => {
  it("preserves one implementation across direct, root and existing named exports", () => {
    expect(admin.NotificationContacts).toBe(NotificationContacts);
    expect(admin.NotificationPresentationProvider).toBe(
      NotificationPresentationProvider,
    );
    expect(admin.NotificationCampaigns).toBe(NotificationCampaigns);
    expect(admin.NotificationOperations).toBe(NotificationOperations);
    expect(admin.NotificationDeliveries).toBe(Deliveries);
    expect(NotificationDeliveries).toBe(Deliveries);
    expect(admin.SendContacts).toBe(NotificationContacts);
    expect(admin.SendCampaignAdmin).toBe(NotificationCampaigns);
    expect(admin.SendOperationsAdmin).toBe(NotificationOperations);
  });
  it("keeps existing Effect Atom factory names as aliases", () => {
    expect(makeNotificationContactAtoms).toBe(makeSendContactAtoms);
    expect(makeNotificationCampaignAtoms).toBe(makeSendCampaignAtoms);
    expect(makeNotificationOperationsAtoms).toBe(makeSendOperationsAtoms);
  });
  it("does not expose administration screens through registry", () => {
    const require = createRequire(import.meta.url);
    for (const screen of ["contacts", "campaigns", "operations"]) {
      expect(() =>
        require.resolve(`@krak-stack/registry/notifications/${screen}`),
      ).toThrowError(
        expect.objectContaining({ code: "ERR_PACKAGE_PATH_NOT_EXPORTED" }),
      );
    }
  });
});
