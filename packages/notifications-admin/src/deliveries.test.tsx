// @vitest-environment jsdom
import { describe, expect, it } from "@effect/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, vi } from "vitest";
import { useState } from "react";
import type {
  AdminDelivery,
  AdminDeliveryInspection,
} from "@krak-stack/notifications/admin/delivery.schema";
import { KrakstackProvider } from "@krak-stack/registry/krakstack-provider";
import { sendOperationsMessages } from "@/agent-examples/send/operations.messages";
import {
  NotificationDeliveries,
  NotificationDeliveryActivity,
  type NotificationDeliveryActivityProps,
  NotificationDeliveryDetails,
  NotificationDeliveryDialog,
  NotificationEmailPreview,
  type NotificationDeliverySelection,
  NotificationAttemptHistory,
  type NotificationDeliveriesProps,
  type NotificationDeliveryMessages,
} from "./deliveries.js";
import { NotificationPresentationProvider } from "./presentation.js";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
const messages: NotificationDeliveryMessages = {
  title: "Delivery history override",
  description: "Delivery details",
  source: "Source",
  sources: { all: "All", contacts: "Contacts", engine: "Engine" },
  recipientUserId: "Account",
  organizationId: "Organization",
  workspaceId: "Workspace",
  template: "Template",
  purposes: {
    transactional: "Transactional",
    notification: "Notification",
    marketing: "Marketing",
  },
  eventKey: "Event key",
  references: "References",
  feedbackNotice: "Feedback coverage varies.",
  feedbackCovered: "Covered",
  feedbackUnavailable: "Unavailable",
  common: sendOperationsMessages("en"),
};
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
  it("opens separate details and preview dialogs and loads email only for preview", async () => {
    const fetchPreview = vi.fn<typeof fetch>(async () =>
      Response.json({
        from: "notifications@example.com",
        fromName: "Example Team",
        subject: "Saved subject",
        text: "Saved body",
        html: null,
      }),
    );
    vi.stubGlobal("fetch", fetchPreview);
    const customizeColumns = vi.fn();
    const activityProps: NotificationDeliveryActivityProps = {
      activity: { items: [delivery], total: 1 },
      state: { page: 0, pageSize: 20 },
      total: 1,
      onStateChange: vi.fn(),
      tableOptions: {
        columns: (columns) => {
          customizeColumns();
          return columns;
        },
      },
    };
    const Host = ({ pending }: { pending: boolean }) => {
      const [selection, setSelection] =
        useState<NotificationDeliverySelection>();
      return (
        <NotificationDeliveryActivity
          {...activityProps}
          selection={selection}
          onSelectionChange={setSelection}
          details={pending ? { pending } : { inspection }}
        />
      );
    };
    const { rerender } = render(<Host pending />);
    const builds = customizeColumns.mock.calls.length;
    fireEvent.click(screen.getByRole("button", { name: "Actions" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "View delivery" }));
    expect(
      screen.getByRole("dialog", {
        name: "Delivery details",
        description: /delivery status, provider, and send attempts/,
      }),
    ).toBeTruthy();
    expect(customizeColumns).toHaveBeenCalledTimes(builds);
    rerender(<Host pending={false} />);
    expect(
      screen.getByRole("heading", { name: "Provider attempts" }),
    ).toBeTruthy();
    expect(screen.queryByRole("tablist")).toBeNull();
    expect(fetchPreview).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(customizeColumns).toHaveBeenCalledTimes(builds);

    fireEvent.click(screen.getByRole("button", { name: "Actions" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Preview email" }));
    expect(await screen.findByText("Saved body")).toBeTruthy();
    expect(
      screen.getByText("Example Team <notifications@example.com>"),
    ).toBeTruthy();
    expect(
      screen.getByRole("dialog", {
        name: "Email preview",
        description: /saved email subject and body/,
      }),
    ).toBeTruthy();
    expect(
      screen.queryByRole("heading", { name: "Provider attempts" }),
    ).toBeNull();
    expect(screen.queryByRole("tablist")).toBeNull();
    expect(String(fetchPreview.mock.calls[0]?.[0])).toBe(
      `${location.origin}/api/send/staff/deliveries/${delivery.id}/preview`,
    );
  });
  it("expands the full inspection input as inert JSON without a separate request", async () => {
    const input = {
      channel: "email",
      payloadVersion: 1,
      payload: {
        subject: "Saved subject",
        html: "<p>Saved HTML</p>",
        metadata: { custom: [1, true, null] },
      },
    };
    const fetchInput = vi.fn();
    vi.stubGlobal("fetch", fetchInput);
    const { rerender } = render(
      <NotificationDeliveryDialog
        details={<NotificationDeliveryDetails inspection={inspection} />}
        onClose={vi.fn()}
      />,
    );
    expect(screen.queryByRole("button", { name: "Delivery input" })).toBeNull();
    rerender(
      <NotificationDeliveryDialog
        details={
          <NotificationDeliveryDetails inspection={{ ...inspection, input }} />
        }
        onClose={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Delivery input" }));
    const block = await screen.findByRole("region", { name: "Delivery input" });
    expect(block.querySelector("code")?.textContent?.trim()).toBe(
      JSON.stringify(input, null, 2),
    );
    expect(block.querySelector("p")).toBeNull();
    expect(fetchInput).not.toHaveBeenCalled();
  });
  it("renders sanitized HTML in an isolated iframe", () => {
    render(
      <NotificationEmailPreview
        preview={{
          subject: "Saved subject",
          text: null,
          html: "<p>Saved body</p>",
        }}
      />,
    );
    expect(screen.queryByText(delivery.recipientAddress)).toBeNull();
    expect(screen.getByText("Saved subject")).toBeTruthy();
    const frame = screen.getByTitle("Email preview");
    expect(frame.getAttribute("sandbox")).toBe("");
    expect(frame.getAttribute("srcdoc")).toContain("default-src 'none'");
  });
  it("uses the provider locale without a messages prop and accepts overrides", () => {
    const p = props();
    const { rerender } = render(
      <KrakstackProvider locale="fr-CA">
        <NotificationDeliveries {...p} messages={undefined} />
      </KrakstackProvider>,
    );
    expect(
      screen.getByRole("heading", {
        name: "Administration des courriels par le personnel",
      }),
    ).toBeTruthy();
    rerender(
      <KrakstackProvider locale="fr-CA">
        <NotificationDeliveries {...p} />
      </KrakstackProvider>,
    );
    expect(screen.getByRole("heading", { name: messages.title })).toBeTruthy();
  });
  it("omits source and view navigation without CSS or changing the query selection", () => {
    const p = props();
    render(
      <NotificationDeliveries {...p} navigation={false} sourcePicker={false} />,
    );
    expect(screen.queryByRole("tab")).toBeNull();
    expect(
      screen.queryByRole("columnheader", { name: /view delivery/i }),
    ).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Actions" }));
    fireEvent.click(
      screen.getByRole("menuitem", { name: messages.common.inspect }),
    );
    expect(p.onInspect).toHaveBeenCalledWith(delivery.id);
    expect(p.onSource).not.toHaveBeenCalled();
  });

  it("shows the main delivery columns by default and lets the host reveal metadata", () => {
    const props = {
      activity: { items: [delivery], total: 1 },
      table: { page: 0, pageSize: 20 },
      total: 1,
      onTable: vi.fn(),
      onInspect: vi.fn(),
    };
    const { unmount } = render(<NotificationDeliveryActivity {...props} />);
    for (const name of [
      "Email",
      "Event key",
      "Status",
      "Provider",
      "Provider attempts",
      "Created",
    ]) {
      expect(screen.getByRole("button", { name })).toBeTruthy();
    }
    expect(screen.queryByRole("button", { name: "Template" })).toBeNull();
    unmount();

    render(
      <NotificationDeliveryActivity
        {...props}
        tableOptions={{
          initialState: {
            columnVisibility: { template: true, provider: false },
          },
        }}
      />,
    );
    expect(screen.getByRole("button", { name: "Template" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Provider" })).toBeNull();
  });

  it("reports the next server-side sort through onStateChange", async () => {
    const onStateChange = vi.fn();
    render(
      <NotificationDeliveryActivity
        activity={{ items: [delivery], total: 1 }}
        total={1}
        state={{ page: 0, pageSize: 20 }}
        onStateChange={onStateChange}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Created" }));
    fireEvent.click(await screen.findByRole("menuitem", { name: "Ascending" }));
    expect(onStateChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        page: 0,
        pageSize: 20,
        sort: [expect.objectContaining({ id: "createdAt" })],
      }),
    );
  });

  it("offers email preview as a row action when the host enables it", () => {
    const preview = vi.fn();
    render(<NotificationDeliveries {...props()} onPreview={preview} />);
    fireEvent.click(screen.getByRole("button", { name: "Actions" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Preview email" }));
    expect(preview).toHaveBeenCalledWith(delivery.id);
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
