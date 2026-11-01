// @vitest-environment jsdom

import { describe, expect, it } from "@effect/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach } from "vitest";
import {
  WebhookDeliveryTable,
  webhookDeliveryStatus,
  type WebhookDeliveryRow,
} from "./delivery-table";

afterEach(cleanup);

describe("Webhook delivery activity", () => {
  it("keeps failed attempts visible while retrying", () => {
    expect(webhookDeliveryStatus({ status: "pending", retries: 0 })).toBe(
      "pending",
    );
    expect(webhookDeliveryStatus({ status: "pending", retries: 1 })).toBe(
      "failed",
    );
    expect(webhookDeliveryStatus({ status: "success", retries: 2 })).toBe(
      "success",
    );
    expect(webhookDeliveryStatus({ status: "failed", retries: 0 })).toBe(
      "failed",
    );
  });

  it("emits the server failure filter and opens the selected delivery payload", async () => {
    const delivery: WebhookDeliveryRow = {
      id: "delivery",
      event: "organization.deletion_requested",
      status: "pending",
      retries: 2,
      error: "HTTP 400",
      retryAt: new Date("2026-11-01T20:00:00Z"),
      createdAt: new Date("2026-11-01T19:00:00Z"),
      completedAt: null,
      data: { organizationId: "deleted-organization" },
    };
    const changes: unknown[] = [];
    render(
      <WebhookDeliveryTable
        entries={[delivery]}
        rowCount={80}
        locale="en"
        state={{ page: 2, pageSize: 20 }}
        onStateChange={(state) => {
          changes.push(state);
        }}
      />,
    );
    expect(screen.getByText(/HTTP 400/).textContent).toContain("Retries: 2");
    fireEvent.click(screen.getByRole("button", { name: "View JSON" }));
    expect(
      (await screen.findByRole("dialog", { name: "Payload" })).textContent,
    ).toContain("deleted-organization");
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    fireEvent.click(screen.getByRole("menuitem", { name: "Filters" }));
    fireEvent.click(await screen.findByRole("menuitem", { name: "Status" }));
    fireEvent.click(
      await screen.findByRole("menuitemcheckbox", { name: "Failed" }),
    );
    expect(changes.at(-1)).toMatchObject({
      page: 0,
      filters: [{ id: "status", kind: "values", values: ["failed"] }],
    });
  });
});
