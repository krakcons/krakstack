// @vitest-environment jsdom
import { describe, expect, it } from "@effect/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, vi } from "vitest";
import { UploadAttachment } from "./upload-attachment";

afterEach(cleanup);

describe("UploadAttachment", () => {
  it("reports real or indeterminate progress and never treats upload completion as processing completion", () => {
    const { rerender } = render(
      <UploadAttachment
        name="report.pdf"
        state={{ status: "uploading", progress: 42 }}
      />,
    );
    expect(screen.getByRole("progressbar").getAttribute("value")).toBe("42");
    rerender(
      <UploadAttachment name="report.pdf" state={{ status: "uploading" }} />,
    );
    expect(screen.getByRole("progressbar").hasAttribute("value")).toBe(false);
    rerender(
      <UploadAttachment name="report.pdf" state={{ status: "processing" }} />,
    );
    expect(screen.queryByRole("progressbar")).toBeNull();
    expect(screen.getByRole("status").textContent).toBe("Processing");
  });

  it("only exposes state-appropriate actions and delegates without changing authoritative state", () => {
    const cancel = vi.fn();
    const retry = vi.fn();
    const remove = vi.fn();
    const props = {
      name: "report.pdf",
      onCancel: cancel,
      onRetry: retry,
      onRemove: remove,
    };
    const { rerender } = render(
      <UploadAttachment
        {...props}
        state={{ status: "uploading", progress: 200 }}
      />,
    );
    expect(screen.getByRole("progressbar").getAttribute("value")).toBe("100");
    fireEvent.click(screen.getByRole("button", { name: /Cancel upload/ }));
    expect(cancel).toHaveBeenCalledOnce();
    expect(screen.queryByRole("button", { name: /Remove/ })).toBeNull();
    rerender(
      <UploadAttachment
        {...props}
        state={{ status: "error", message: "Upload failed" }}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /Retry upload/ }));
    expect(retry).toHaveBeenCalledOnce();
    expect(screen.getByRole("alert").textContent).toBe("Upload failed");
    fireEvent.click(screen.getByRole("button", { name: /Remove attachment/ }));
    expect(remove).toHaveBeenCalledOnce();
  });

  it("supports regional locale overrides and disables mutation actions", () => {
    const retry = vi.fn();
    render(
      <UploadAttachment
        name="rapport.pdf"
        state={{ status: "cancelled" }}
        onRetry={retry}
        disabled
        locale="fr-CA"
        messages={{ fr: { retry: "Reprendre" } }}
      />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Reprendre: rapport.pdf" }),
    );
    expect(retry).not.toHaveBeenCalled();
    expect(screen.getByRole("status").textContent).toBe("Téléversement annulé");
  });
});
