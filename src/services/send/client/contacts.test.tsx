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
import type { Contact } from "@krak-stack/send/schema";

import { SendContacts, type SendContactsMessages } from "./contacts";

afterEach(cleanup);

const messages: SendContactsMessages = {
  title: "Contacts",
  description: "Manage contacts",
  create: "Add contact",
  name: "Name",
  email: "Email",
  consent: "Consent",
  unknown: "Unknown",
  subscribed: "Subscribed",
  unsubscribed: "Unsubscribed",
  withdraw: "Unsubscribe",
  save: "Save",
  savingFailed: "Operation failed",
  loading: "Loading",
  empty: "No contacts",
  previous: "Previous",
  next: "Next",
};

describe("KrakSend contact administration", () => {
  it("creates a contact without adding consent and waits for server completion", async () => {
    const create = vi.fn().mockResolvedValue(undefined);
    const withdraw = vi.fn();
    render(
      <SendContacts
        page={{ items: [], nextCursor: null }}
        messages={messages}
        defaultContactLocale="fr"
        onCreate={create}
        onWithdraw={withdraw}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Add contact" }));
    const dialog = await screen.findByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText("Email"), {
      target: { value: "person@example.com" },
    });
    fireEvent.change(within(dialog).getByLabelText("Name"), {
      target: { value: "Person" },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Save" }));
    await waitFor(() =>
      expect(create).toHaveBeenCalledWith({
        email: "person@example.com",
        name: "Person",
        locale: "fr",
      }),
    );
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(withdraw).not.toHaveBeenCalled();
  });

  it("keeps a failed creation draft open for correction or retry", async () => {
    const create = vi.fn().mockRejectedValue(new Error("server rejected"));
    render(
      <SendContacts
        page={{ items: [], nextCursor: null }}
        messages={messages}
        defaultContactLocale="en"
        onCreate={create}
        onWithdraw={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Add contact" }));
    const dialog = await screen.findByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText("Email"), {
      target: { value: "person@example.com" },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Save" }));
    await waitFor(() =>
      expect(within(dialog).getByRole("alert").textContent).toBe(
        "Operation failed",
      ),
    );
    expect(within(dialog).getByLabelText("Email").getAttribute("value")).toBe(
      "person@example.com",
    );
  });

  it("surfaces failed withdrawal and permits retry rather than inventing success", async () => {
    const contact = {
      id: "019a0000-0000-7000-8000-000000000001",
      name: "Person",
      email: "person@example.com",
      locale: "en",
      emailConsent: "subscribed",
      createdAt: new Date(0),
      updatedAt: new Date(0),
    } satisfies Contact;
    const withdraw = vi.fn().mockRejectedValue(new Error("request failed"));
    render(
      <SendContacts
        page={{ items: [contact], nextCursor: null }}
        messages={messages}
        defaultContactLocale="en"
        onCreate={vi.fn()}
        onWithdraw={withdraw}
      />,
    );
    const row = screen.getByRole("row", { name: /person@example.com/ });
    fireEvent.click(within(row).getByRole("button", { name: "Unsubscribe" }));
    await waitFor(() => expect(withdraw).toHaveBeenCalledWith(contact));
    await waitFor(() =>
      expect(screen.getByRole("alert").textContent).toBe("Operation failed"),
    );
    expect(
      within(row)
        .getByRole("button", { name: "Unsubscribe" })
        .hasAttribute("disabled"),
    ).toBe(false);
  });
});
