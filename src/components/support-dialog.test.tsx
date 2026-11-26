// @vitest-environment jsdom
import { describe, expect, it } from "@effect/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, vi } from "vitest";
import { SupportDialog, SupportForm } from "./support";

afterEach(cleanup);

const messages = {
  title: "Help & support",
  description: "Tell us how we can help.",
  replyEmail: "Reply email",
  attach: "Attach screenshots",
  invalidAttachments: "Screenshots could not be added.",
  removeAttachment: "Remove screenshot",
  submit: "Send message",
  pending: "Sending…",
  success: "Request received.",
  close: "Close",
  invalid: "Enter a message.",
  failed: "Could not send your request. Try again.",
};

describe("SupportDialog", () => {
  it("validates the draft, sends only the request fields, and preserves the draft on failure", async () => {
    const onSubmit = vi
      .fn()
      .mockRejectedValueOnce(new Error("Delivery failed"))
      .mockResolvedValueOnce(undefined);
    render(
      <SupportDialog
        messages={{ en: messages }}
        askForReplyEmail={false}
        onSubmit={onSubmit}
      />,
    );
    const trigger = screen.getByRole("button", { name: messages.title });
    fireEvent.click(trigger);
    const message = screen.getByRole<HTMLTextAreaElement>("textbox", {
      name: messages.title,
    });
    const send = screen.getByRole("button", { name: messages.submit });
    expect(screen.queryByLabelText(messages.replyEmail)).toBeNull();
    fireEvent.change(message, { target: { value: "   " } });
    fireEvent.click(send);
    expect(screen.getByRole("alert").textContent).toBe(messages.invalid);
    expect(onSubmit).not.toHaveBeenCalled();

    fireEvent.change(message, { target: { value: " Steps to reproduce " } });
    const screenshot = new File(["png"], "screen.png", { type: "image/png" });
    fireEvent.paste(message, { clipboardData: { files: [screenshot] } });
    fireEvent.click(send);
    expect(onSubmit).toHaveBeenCalledWith({
      message: "Steps to reproduce",
      attachments: [screenshot],
    });
    expect((await screen.findByRole("alert")).textContent).toBe(
      messages.failed,
    );
    expect(message.value).toBe(" Steps to reproduce ");
    expect(screen.getByText(screenshot.name)).toBeTruthy();

    fireEvent.click(send);
    expect(
      await screen.findByRole("dialog", {
        name: messages.success,
        description: "We will get back to you as soon as possible.",
      }),
    ).toBeTruthy();
    expect(screen.queryByRole("textbox")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: messages.close }));
    fireEvent.click(trigger);
    expect(
      screen.getByRole<HTMLTextAreaElement>("textbox", { name: messages.title })
        .value,
    ).toBe("");
    expect(screen.queryByText(screenshot.name)).toBeNull();
  });

  it("collects a reply address when requested and lets users remove screenshots", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(
      <SupportDialog
        messages={{ en: messages }}
        askForReplyEmail
        onSubmit={onSubmit}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: messages.title }));
    const message = screen.getByRole("textbox", { name: messages.title });
    fireEvent.change(message, { target: { value: "Help please" } });
    const picker = screen.getByLabelText(messages.attach);
    const screenshot = new File(["png"], "screen.png", { type: "image/png" });
    const unsupported = new File(["gif"], "screen.gif", { type: "image/gif" });
    fireEvent.change(picker, { target: { files: [screenshot] } });
    fireEvent.paste(message, { clipboardData: { files: [unsupported] } });
    expect(screen.getByRole("alert").textContent).toBe(
      messages.invalidAttachments,
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: `${messages.removeAttachment}: screen.png`,
      }),
    );
    fireEvent.change(screen.getByLabelText(messages.replyEmail), {
      target: { value: "learner@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: messages.submit }));
    expect(onSubmit).toHaveBeenCalledWith({
      message: "Help please",
      replyEmail: "learner@example.com",
      attachments: [],
    });
    expect((await screen.findByRole("status")).textContent).toContain(
      messages.success,
    );
  });
});

describe("SupportForm", () => {
  it("lets the user clear the prefilled email and exclude diagnostics", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(
      <SupportForm
        locale="en"
        defaultReplyEmail="learner@example.com"
        supportEmail="support@krakconsultants.com"
        errorDetails="Reference: abc123"
        onSubmit={onSubmit}
      />,
    );
    const email = screen.getByLabelText<HTMLInputElement>(
      "Reply email (optional)",
    );
    expect(email.value).toBe("learner@example.com");
    expect(
      screen
        .getByRole("link", { name: "support@krakconsultants.com" })
        .getAttribute("href"),
    ).toBe("mailto:support@krakconsultants.com");
    expect(screen.queryByText("Reference: abc123")).toBeNull();
    fireEvent.change(email, { target: { value: "" } });
    fireEvent.click(
      screen.getByRole("checkbox", { name: "Include error details" }),
    );
    fireEvent.change(
      screen.getByRole("textbox", { name: "Tell us how we can help" }),
      {
        target: { value: "Help please" },
      },
    );
    fireEvent.click(screen.getByRole("button", { name: "Send message" }));
    expect(onSubmit).toHaveBeenCalledWith({
      message: "Help please",
      attachments: [],
    });
    await screen.findByRole("status");
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(
      screen.queryByRole("link", { name: "support@krakconsultants.com" }),
    ).toBeNull();
  });

  it("submits an edited reply address and includes error details by default", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(
      <SupportForm
        locale="en"
        defaultReplyEmail="learner@example.com"
        errorDetails="Reference: abc123"
        onSubmit={onSubmit}
      />,
    );
    fireEvent.change(screen.getByLabelText("Reply email (optional)"), {
      target: { value: "other@example.com" },
    });
    fireEvent.change(
      screen.getByRole("textbox", { name: "Tell us how we can help" }),
      {
        target: { value: "Help please" },
      },
    );
    fireEvent.click(screen.getByRole("button", { name: "Send message" }));
    expect(onSubmit).toHaveBeenCalledWith({
      message: "Help please",
      replyEmail: "other@example.com",
      errorDetails: "Reference: abc123",
      attachments: [],
    });
    await screen.findByRole("status");
  });
});
