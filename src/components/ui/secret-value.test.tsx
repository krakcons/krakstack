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
import { SecretValue } from "./secret-value";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("SecretValue", () => {
  it("masks initially, reveals explicitly and hides replacement values", () => {
    const { rerender } = render(
      <SecretValue value="first-secret" label="API key" />,
    );
    expect(screen.queryByText("first-secret")).toBeNull();
    const reveal = screen.getByRole("button", { name: "Show API key" });
    fireEvent.click(reveal);
    expect(screen.getByText("first-secret")).toBeTruthy();
    expect(reveal.getAttribute("aria-pressed")).toBe("true");
    rerender(<SecretValue value="replacement-secret" label="API key" />);
    expect(screen.queryByText("replacement-secret")).toBeNull();
    expect(screen.getByRole("button", { name: "Show API key" })).toBeTruthy();
  });

  it("copies the actual value without revealing or submitting it", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    const submit = vi.fn((event: React.FormEvent) => event.preventDefault());
    render(
      <form onSubmit={submit}>
        <SecretValue value="copy-secret" label="Clé API" locale="fr" />
      </form>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Copier Clé API" }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith("copy-secret"));
    expect(screen.queryByText("copy-secret")).toBeNull();
    expect(submit).not.toHaveBeenCalled();
  });

  it("auto-hides and prevents revealing disabled values", async () => {
    const { rerender } = render(
      <SecretValue
        value="short-lived"
        label="Token"
        autoHideDelay={10}
        copyable={false}
      />,
    );
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() => expect(screen.queryByText("short-lived")).toBeNull());
    rerender(
      <SecretValue
        value="short-lived"
        label="Token"
        disabled
        copyable={false}
      />,
    );
    fireEvent.click(screen.getByRole("button"));
    expect(screen.queryByText("short-lived")).toBeNull();
  });
});
