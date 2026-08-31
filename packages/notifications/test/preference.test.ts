import { describe, expect, it } from "@effect/vitest";

import { selectPreference } from "../src/internal/policy.js";
import type {
  NotificationPreference,
  RecipientNotificationScope,
} from "../src/schema.js";

const scope: RecipientNotificationScope = {
  recipientUserId: "user-1",
  organizationId: "org-1",
  workspaceId: "workspace-1",
};

const preference = (
  overrides: Partial<NotificationPreference>,
): NotificationPreference => ({
  id: "00000000-0000-4000-8000-000000000001",
  scope: {
    recipientUserId: "user-1",
    organizationId: null,
    workspaceId: null,
  },
  eventKey: null,
  channel: "email",
  enabled: false,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  ...overrides,
});

describe("preference resolution", () => {
  it("selects event, workspace, and organization specificity deterministically", () => {
    const selected = selectPreference(
      [
        preference({}),
        preference({
          id: "00000000-0000-4000-8000-000000000002",
          scope: { ...scope, workspaceId: null },
          enabled: true,
        }),
        preference({
          id: "00000000-0000-4000-8000-000000000003",
          scope,
          enabled: false,
        }),
        preference({
          id: "00000000-0000-4000-8000-000000000004",
          scope,
          eventKey: "application.approved",
          enabled: true,
        }),
      ],
      { scope, eventKey: "application.approved" },
    );

    expect(selected?.id).toBe("00000000-0000-4000-8000-000000000004");
    expect(selected?.enabled).toBe(true);
  });

  it("ignores preferences from a different scope", () => {
    const selected = selectPreference(
      [
        preference({
          scope: { ...scope, workspaceId: "workspace-2" },
        }),
      ],
      { scope, eventKey: "application.approved" },
    );

    expect(selected).toBeUndefined();
  });
});
