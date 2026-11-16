// @vitest-environment jsdom
import { describe, expect, it } from "@effect/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, vi } from "vitest";
import type {
  AdminDelivery,
  AdminDeliveryInspection,
} from "@krak-stack/notifications/admin/delivery.schema";
import { notificationDeliveryMessages } from "@/agent-examples/send/delivery.messages";
import {
  NotificationDeliveries,
  NotificationDeliveryActivity,
  NotificationDeliveryDetails,
  NotificationAttemptHistory,
  type NotificationDeliveriesProps,
} from "./deliveries.js";
import { NotificationPresentationProvider } from "./presentation.js";

afterEach(cleanup);
const messages = notificationDeliveryMessages("en");
const delivery: typeof AdminDelivery.Type = {
  id: "019a0000-0000-7000-8000-000000000001",
  source: "engine",
  recipientUserId: "account-1",
  organizationId: "org-1",
  workspaceId: null,
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
  providerMessageId: "accepted-1",
  errorMessage: null,
  createdAt: new Date(0),
  updatedAt: new Date(0),
  scheduledFor: new Date(0),
  sentAt: null,
};
const inspection: typeof AdminDeliveryInspection.Type = {
  delivery,
  attempts: [],
  references: [],
};
const props = (): NotificationDeliveriesProps => ({
  messages,
  source: "all",
  onSource: vi.fn(),
  view: "activity",
  onView: vi.fn(),
  activity: { items: [delivery], total: 50 },
  table: { page: 1, pageSize: 20 },
  total: 50,
  onTable: vi.fn(),
  pending: false,
  inspecting: false,
  onInspect: vi.fn(),
  onRefresh: vi.fn(),
});

describe("composable delivery administration", () => {
  it("omits source and view navigation without CSS or changing the query selection", () => {
    const p = props();
    render(
      <NotificationDeliveries {...p} navigation={false} sourcePicker={false} />,
    );
    expect(screen.queryByRole("tab")).toBeNull();
    fireEvent.click(
      screen.getByRole("button", { name: messages.common.inspect }),
    );
    expect(p.onInspect).toHaveBeenCalledWith(delivery.id);
    expect(p.onSource).not.toHaveBeenCalled();
  });

  it("uses typed columns and stable table identity without altering records or actions", () => {
    const inspect = vi.fn();
    render(
      <NotificationPresentationProvider
        Table={({
          notificationTable,
          rowData,
          columnDefs,
          state,
          features,
        }) => (
          <div>
            <span>
              {notificationTable}:{state?.page}:
              {features?.pagination ? features.pagination.mode : "none"}
            </span>
            {columnDefs.map((column) => (
              <span key={column.field ?? column.colId}>
                {column.headerName}
              </span>
            ))}
            <button onClick={() => inspect(rowData[0])}>Host row</button>
          </div>
        )}
      >
        <NotificationDeliveryActivity
          messages={messages}
          activity={{ items: [delivery], total: 50 }}
          table={{ page: 1, pageSize: 20 }}
          onTable={vi.fn()}
          total={50}
          onInspect={vi.fn()}
          tableOptions={{
            columns: (columns) =>
              columns.filter((column) => column.field !== "eventKey"),
          }}
        />
      </NotificationPresentationProvider>,
    );
    expect(screen.getByText("delivery-activity:1:server")).toBeTruthy();
    expect(screen.queryByText(messages.eventKey)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Host row" }));
    expect(inspect).toHaveBeenCalledWith(delivery);
  });

  it("renders details outside a dialog and clears retained details on failure", () => {
    const { rerender } = render(
      <NotificationDeliveryDetails
        messages={messages}
        inspection={inspection}
      />,
    );
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByText(delivery.recipientAddress)).toBeTruthy();
    rerender(
      <NotificationDeliveryDetails
        messages={messages}
        inspection={inspection}
        error="Denied"
      />,
    );
    expect(screen.getByRole("alert").textContent).toBe("Denied");
    expect(screen.queryByText(delivery.recipientAddress)).toBeNull();
  });

  it("does not render retained list rows on failure", () => {
    render(
      <NotificationDeliveryActivity
        messages={messages}
        activity={{ items: [delivery], total: 50 }}
        table={{ page: 0, pageSize: 20 }}
        onTable={vi.fn()}
        total={50}
        onInspect={vi.fn()}
        error="Denied"
      />,
    );
    expect(screen.queryByText(delivery.recipientAddress)).toBeNull();
  });

  it("allows standalone attempt history without requiring screen callbacks", () => {
    render(
      <NotificationAttemptHistory messages={messages.common} attempts={[]} />,
    );
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.queryByRole("tab")).toBeNull();
  });
});
