// @vitest-environment jsdom
import { describe, expect, it } from "@effect/vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, vi } from "vitest";
import { SendOperationsAdmin, type SendOperationsProps } from "./operations";
import { sendOperationsMessages } from "@/agent-examples/send/operations.messages";
afterEach(cleanup);
const m = sendOperationsMessages("en");
const id = "019a0000-0000-7000-8000-000000000001";
const props = (): SendOperationsProps => ({
  view: "suppressions",
  filters: {},
  messages: m,
  suppressions: { items: [], nextCursor: null },
  onView: vi.fn(),
  onFilters: vi.fn(),
  onRefresh: vi.fn(),
  onInspect: vi.fn(),
  onCloseInspection: vi.fn(),
  onDeliveryFeedback: vi.fn(),
  onAddSuppression: vi.fn(),
  onRemoveSuppression: vi.fn(),
});
describe("sending operations frontend behavior", () => {
  it("forwards shared table search to the server and resets the page", async () => {
    const apply = vi.fn();
    const p = {
      ...props(),
      view: "feedback",
      tableState: { page: 1, pageSize: 20 },
      total: 50,
      onTableStateChange: apply,
    } satisfies SendOperationsProps;
    render(<SendOperationsAdmin {...p} />);
    fireEvent.change(screen.getByPlaceholderText("Filter results..."), {
      target: { value: "recipient@example.com" },
    });
    await waitFor(() =>
      expect(apply).toHaveBeenCalledWith(
        expect.objectContaining({
          globalFilter: "recipient@example.com",
          page: 0,
        }),
      ),
    );
  });
  it("requires an audit reason and exact reviewed version before unblocking; failed removal remains retryable", async () => {
    const remove = vi
      .fn()
      .mockRejectedValueOnce(new Error("stale"))
      .mockResolvedValueOnce({ suppressionId: id });
    render(
      <SendOperationsAdmin
        {...props()}
        onRemoveSuppression={remove}
        suppressions={{
          items: [
            {
              id,
              version: "42",
              email: "person@example.com",
              purpose: null,
              reason: "provider_hard_bounce",
              createdAt: new Date(0),
              expiresAt: null,
              active: true,
            },
          ],
          nextCursor: null,
        }}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: m.removeSuppression }));
    expect(remove).not.toHaveBeenCalled();
    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: m.confirm }));
    expect(remove).not.toHaveBeenCalled();
    fireEvent.change(within(dialog).getByLabelText(m.reason), {
      target: { value: "Reviewed provider evidence" },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: m.confirm }));
    await waitFor(() =>
      expect(within(dialog).getByRole("alert").textContent).toBe(m.failed),
    );
    expect(remove.mock.calls[0][0]).toMatchObject({
      id,
      payload: { version: "42", reason: "Reviewed provider evidence" },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: m.confirm }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(remove.mock.calls[1][0]).toEqual(remove.mock.calls[0][0]);
  });
  it("retains the endpoint, reason and idempotency key when adding a block fails", async () => {
    const add = vi
      .fn()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce({ suppressionId: id });
    render(<SendOperationsAdmin {...props()} onAddSuppression={add} />);
    fireEvent.click(screen.getByRole("button", { name: m.addSuppression }));
    const dialog = await screen.findByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText(m.email), {
      target: { value: "person@example.com" },
    });
    fireEvent.change(within(dialog).getByLabelText(m.reason), {
      target: { value: "Operator investigation" },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: m.confirm }));
    await waitFor(() => expect(within(dialog).getByRole("alert")).toBeTruthy());
    fireEvent.click(within(dialog).getByRole("button", { name: m.confirm }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(add.mock.calls[0][0]).toEqual(add.mock.calls[1][0]);
  });
  it("validates date filters and submits decoded UTC instants rather than inventing local dates", async () => {
    const apply = vi.fn();
    render(
      <SendOperationsAdmin {...props()} view="overview" onFilters={apply} />,
    );
    fireEvent.change(screen.getByLabelText(m.since), {
      target: { value: "invalid" },
    });
    fireEvent.click(screen.getByRole("button", { name: m.apply }));
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: m.apply }).hasAttribute("disabled"),
      ).toBe(false),
    );
    expect(apply).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText(m.since), {
      target: { value: "2026-11-01T00:00:00Z" },
    });
    fireEvent.click(screen.getByRole("button", { name: m.apply }));
    await waitFor(() =>
      expect(apply).toHaveBeenCalledWith(
        expect.objectContaining({ since: new Date("2026-11-01T00:00:00Z") }),
      ),
    );
  });
  it("exposes refresh, delivery inspection and all-feedback navigation without mutating a delivery", () => {
    const p = props();
    render(
      <SendOperationsAdmin
        {...p}
        inspecting
        inspection={{
          delivery: {
            id,
            contactId: id,
            email: "person@example.com",
            name: "Person",
            campaignId: null,
            campaignName: null,
            purpose: "transactional",
            eventKey: "test",
            subject: "News",
            status: "sent",
            attempts: 1,
            maxAttempts: 5,
            provider: "fake",
            providerMessageId: "accepted-1",
            errorMessage: null,
            createdAt: new Date(0),
            scheduledFor: new Date(0),
            updatedAt: new Date(0),
            sentAt: new Date(0),
            confirmed: false,
            hardBounced: false,
            softBounced: false,
            complained: false,
          },
          attempts: [],
        }}
      />,
    );
    const dialog = screen.getByRole("dialog");
    fireEvent.click(
      within(dialog).getByRole("button", { name: m.views.feedback }),
    );
    expect(p.onDeliveryFeedback).toHaveBeenCalledWith(id);
    expect(p.onCloseInspection).toHaveBeenCalled();
  });
});
