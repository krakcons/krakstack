// @vitest-environment jsdom
import { describe, expect, it } from "@effect/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, vi } from "vitest";
import { DataTable } from "@krak-stack/registry/data-table";
import {
  NotificationPresentationProvider,
  NotificationReference,
} from "./presentation.js";
import {
  NotificationOperations,
  type NotificationOperationsProps,
} from "./operations.js";
import { sendOperationsMessages } from "@/agent-examples/send/operations.messages";

afterEach(cleanup);
describe("host notification presentation", () => {
  it("preserves controlled table state and actions through a host table", () => {
    const change = vi.fn();
    const HostTable: typeof DataTable = ({
      rowData,
      onStateChange,
      state,
      features,
    }) => (
      <button
        onClick={() => onStateChange?.({ ...state, page: 1, pageSize: 25 })}
      >
        {rowData.length} host rows ·{" "}
        {features?.pagination ? features.pagination.mode : "none"}
      </button>
    );
    const props: NotificationOperationsProps = {
      view: "suppressions",
      filters: {},
      messages: sendOperationsMessages("en"),
      suppressions: { items: [], nextCursor: null },
      total: 50,
      tableState: { page: 0, pageSize: 25 },
      onTableStateChange: change,
      onView: vi.fn(),
      onFilters: vi.fn(),
      onRefresh: vi.fn(),
      onInspect: vi.fn(),
      onCloseInspection: vi.fn(),
      onDeliveryFeedback: vi.fn(),
      onAddSuppression: vi.fn(),
      onRemoveSuppression: vi.fn(),
    };
    render(
      <NotificationPresentationProvider Table={HostTable}>
        <NotificationOperations {...props} />
      </NotificationPresentationProvider>,
    );
    fireEvent.click(
      screen.getByRole("button", { name: "0 host rows · server" }),
    );
    expect(change).toHaveBeenCalledWith({ page: 1, pageSize: 25 });
  });
  it("resolves references within its provider without changing default rendering", () => {
    const reference = vi.fn(
      (kind: string, _id: string) => `${kind}: Named record`,
    );
    const { unmount } = render(
      <NotificationPresentationProvider
        Table={DataTable}
        renderReference={reference}
      >
        <NotificationReference kind="organization" id="organization-id" />
      </NotificationPresentationProvider>,
    );
    expect(screen.getByText("organization: Named record")).toBeTruthy();
    expect(reference).toHaveBeenCalledWith("organization", "organization-id");
    unmount();
    render(<NotificationReference kind="organization" id="organization-id" />);
    expect(screen.getByText("organization-id")).toBeTruthy();
  });
});
