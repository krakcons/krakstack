// @vitest-environment jsdom
import { describe, expect, it } from "@effect/vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, vi } from "vitest";
import { useState } from "react";
import { DangerConfirmation } from "./danger-confirmation";

afterEach(cleanup);

describe("DangerConfirmation", () => {
  it("requires an exact phrase and blocks dismissal while the action is pending", async () => {
    const task = Promise.withResolvers<void>();
    const confirm = vi.fn(() => task.promise);
    const openChange = vi.fn();
    render(
      <DangerConfirmation
        open
        onOpenChange={openChange}
        title="Delete workspace"
        description="This cannot be undone."
        confirmation="Workspace"
        onConfirm={confirm}
      />,
    );
    expect(
      screen
        .getByRole("button", { name: "Confirm deletion" })
        .hasAttribute("disabled"),
    ).toBe(true);
    expect(
      document.getElementById(
        screen.getByRole("textbox").getAttribute("aria-describedby") ?? "",
      )?.textContent,
    ).toBe("Workspace");
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "Workspace " },
    });
    expect(
      screen
        .getByRole("button", { name: "Confirm deletion" })
        .hasAttribute("disabled"),
    ).toBe(true);
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "Workspace" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Confirm deletion" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    fireEvent.keyDown(screen.getByRole("alertdialog"), { key: "Escape" });
    expect(openChange).not.toHaveBeenCalled();
    expect(confirm).toHaveBeenCalledOnce();
    await act(async () => task.resolve());
    expect(openChange).toHaveBeenCalledWith(false);
  });

  it("retains the dialog after failure and clears confirmation when reopened", async () => {
    const confirm = vi
      .fn<() => Promise<void>>()
      .mockRejectedValueOnce(new Error("failure"))
      .mockResolvedValue(undefined);
    const Example = () => {
      const [open, setOpen] = useState(true);
      return (
        <>
          <button onClick={() => setOpen(true)}>Open</button>
          <DangerConfirmation
            open={open}
            onOpenChange={setOpen}
            title="Delete"
            description="Permanent"
            confirmation="delete"
            onConfirm={confirm}
          />
        </>
      );
    };
    render(<Example />);
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "delete" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Confirm deletion" }));
    await waitFor(() =>
      expect(screen.getByRole("status").textContent).toContain(
        "Could not complete",
      ),
    );
    expect(screen.getByRole("textbox").getAttribute("value")).toBe("delete");
    fireEvent.click(screen.getByRole("button", { name: "Confirm deletion" }));
    await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull());
    fireEvent.click(screen.getByRole("button", { name: "Open" }));
    await screen.findByRole("alertdialog");
    expect(screen.getByRole("textbox").getAttribute("value")).toBe("");
    expect(
      screen.getByRole("button", { name: "Cancel" }).hasAttribute("disabled"),
    ).toBe(false);
  });
});
