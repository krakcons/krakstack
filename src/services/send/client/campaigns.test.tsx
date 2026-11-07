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
import type { Campaign } from "@krak-stack/notifications/admin/schema";
import { SendCampaignAdmin } from "./campaigns";
import { sendCampaignMessages } from "@/agent-examples/send/campaign.messages";

afterEach(cleanup);
const m = sendCampaignMessages("en");
const campaign: typeof Campaign.Type = {
  id: "019a0000-0000-7000-8000-000000000001",
  name: "News",
  from: "sender@example.com",
  audience: { _tag: "AllSubscribed" },
  content: {
    en: { subject: "News", text: "Body", unsubscribeText: "Unsubscribe" },
    fr: { subject: "Nouvelles", text: "Texte", unsubscribeText: "Désabonner" },
  },
  status: "scheduled",
  scheduledFor: new Date(0),
  snapshotAt: new Date(0),
  batchNumber: 0,
  createdAt: new Date(0),
};
const props = () => ({
  page: { items: [], nextCursor: null },
  messages: m,
  onSelect: vi.fn(),
  onClose: vi.fn(),
  onCreate: vi.fn(),
  onSchedule: vi.fn(),
  onTransition: vi.fn(),
});

describe("campaign admin behavior", () => {
  it("requires confirmation before cancellation and retains a failed confirmation for retry", async () => {
    const p = props();
    p.onTransition
      .mockRejectedValueOnce(new Error("denied"))
      .mockResolvedValueOnce(campaign);
    render(<SendCampaignAdmin {...p} selected={campaign} />);
    fireEvent.click(screen.getByRole("button", { name: m.cancel }));
    expect(p.onTransition).not.toHaveBeenCalled();
    const dialog = await screen.findByRole("dialog");
    fireEvent.click(
      within(dialog).getByRole("button", { name: m.confirmCancel }),
    );
    await waitFor(() =>
      expect(screen.getByRole("alert").textContent).toBe(m.failed),
    );
    expect(screen.getByRole("dialog")).toBeTruthy();
    fireEvent.click(
      within(dialog).getByRole("button", { name: m.confirmCancel }),
    );
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(p.onTransition).toHaveBeenLastCalledWith({
      id: campaign.id,
      action: "cancel",
    });
  });
  it("retains a bilingual draft and its idempotency key after a failed save", async () => {
    const p = props();
    p.onCreate
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce(campaign);
    render(<SendCampaignAdmin {...p} />);
    fireEvent.click(screen.getByRole("button", { name: m.create }));
    const dialog = await screen.findByRole("dialog");
    for (const [label, value] of [
      [m.name, "News"],
      [m.from, "sender@example.com"],
    ])
      fireEvent.change(within(dialog).getByLabelText(label), {
        target: { value },
      });
    for (const language of [m.english, m.french]) {
      const group = within(dialog).getByRole("group", { name: language });
      fireEvent.change(within(group).getByLabelText(m.subject), {
        target: { value: language },
      });
      fireEvent.change(within(group).getByLabelText(m.text), {
        target: { value: `${language} body` },
      });
    }
    fireEvent.click(within(dialog).getByRole("button", { name: m.save }));
    await waitFor(() => expect(within(dialog).getByRole("alert")).toBeTruthy());
    fireEvent.click(within(dialog).getByRole("button", { name: m.save }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(p.onCreate).toHaveBeenCalledTimes(2);
    expect(p.onCreate.mock.calls[0][0]).toEqual(p.onCreate.mock.calls[1][0]);
    expect(p.onCreate.mock.calls[0][0].content.fr.unsubscribeText).toBe(
      m.frUnsubscribe,
    );
  });
  it("validates scheduling before calling the API", async () => {
    const p = props();
    render(
      <SendCampaignAdmin {...p} selected={{ ...campaign, status: "draft" }} />,
    );
    fireEvent.change(screen.getByRole("textbox", { name: m.scheduledFor }), {
      target: { value: "invalid" },
    });
    fireEvent.click(screen.getByRole("button", { name: m.schedule }));
    await waitFor(() =>
      expect(
        screen
          .getByRole("button", { name: m.schedule })
          .hasAttribute("disabled"),
      ).toBe(false),
    );
    expect(p.onSchedule).not.toHaveBeenCalled();
    fireEvent.change(screen.getByRole("textbox", { name: m.scheduledFor }), {
      target: { value: "2026-12-01T12:00:00Z" },
    });
    fireEvent.click(screen.getByRole("button", { name: m.schedule }));
    await waitFor(() =>
      expect(p.onSchedule).toHaveBeenCalledWith({
        id: campaign.id,
        scheduledFor: new Date("2026-12-01T12:00:00Z"),
      }),
    );
  });
});
