// @vitest-environment jsdom
import { describe, expect, it } from "@effect/vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, vi } from "vitest";
import { CopyValue } from "./copy-value";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("CopyValue", () => {
  it("shows a read-only value without a secret toggle by default and selects on focus", () => {
    render(<CopyValue value="https://example.com" label="URL" />);
    const input = screen.getByRole<HTMLInputElement>("textbox", {
      name: "URL",
    });
    expect(input.value).toBe("https://example.com");
    expect(input.readOnly).toBe(true);
    fireEvent.focus(input);
    expect(input.selectionStart).toBe(0);
    expect(input.selectionEnd).toBe(input.value.length);
    expect(screen.queryByRole("button", { name: "Show URL" })).toBeNull();
  });

  it("masks secrets initially and resets reveal when the value or secret mode changes", () => {
    const { rerender } = render(
      <CopyValue secret value="first-secret" label="API key" />,
    );
    const input = screen.getByLabelText<HTMLInputElement>(
      "API key: Hidden value",
    );
    expect(input.type).toBe("password");
    const reveal = screen.getByRole("button", { name: "Show API key" });
    fireEvent.click(reveal);
    expect(input.type).toBe("text");
    expect(reveal.getAttribute("aria-pressed")).toBe("true");
    rerender(<CopyValue secret value="replacement-secret" label="API key" />);
    expect(input.type).toBe("password");
    expect(input.value).toBe("replacement-secret");
    rerender(<CopyValue value="replacement-secret" label="API key" />);
    expect(input.type).toBe("text");
    rerender(<CopyValue secret value="replacement-secret" label="API key" />);
    expect(input.type).toBe("password");
  });

  it("copies the actual secret without revealing or submitting it", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    const submit = vi.fn((event: React.FormEvent) => event.preventDefault());
    render(
      <form onSubmit={submit}>
        <CopyValue secret value="copy-secret" label="Clé API" locale="fr" />
      </form>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Copier Clé API" }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith("copy-secret"));
    expect(
      screen.getByLabelText<HTMLInputElement>("Clé API: Valeur masquée").type,
    ).toBe("password");
    expect(submit).not.toHaveBeenCalled();
  });

  it("auto-hides and masks on disable, disabling both actions", async () => {
    const { rerender } = render(
      <CopyValue secret value="short-lived" label="Token" autoHideDelay={10} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Show Token" }));
    await waitFor(() =>
      expect(
        screen.getByLabelText<HTMLInputElement>("Token: Hidden value").type,
      ).toBe("password"),
    );
    fireEvent.click(screen.getByRole("button", { name: "Show Token" }));
    rerender(<CopyValue secret value="short-lived" label="Token" disabled />);
    expect(
      screen.getByLabelText<HTMLInputElement>("Token: Hidden value").type,
    ).toBe("password");
    for (const button of screen.getAllByRole<HTMLButtonElement>("button"))
      expect(button.disabled).toBe(true);
  });
});
