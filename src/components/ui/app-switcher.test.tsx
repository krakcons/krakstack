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
import { AppSwitcher } from "./app-switcher";
import { KrakstackProvider } from "./krakstack-provider";

afterEach(cleanup);

describe("AppSwitcher", () => {
  it("opens from the keyboard without submitting and exposes native destinations", async () => {
    const submit = vi.fn((event: React.FormEvent) => event.preventDefault());
    render(
      <form onSubmit={submit}>
        <KrakstackProvider locale="fr-CA">
          <AppSwitcher
            currentApp="learning"
            items={[
              { id: "learning", label: "Learning", href: "/learning" },
              { id: "courses", label: "Courses", href: "/courses" },
              {
                id: "disabled",
                label: "Unavailable",
                href: "/unavailable",
                disabled: true,
              },
            ]}
          />
        </KrakstackProvider>
      </form>,
    );
    const trigger = screen.getByRole("button", {
      name: "Changer d’application",
    });
    trigger.focus();
    fireEvent.keyDown(trigger, { key: "ArrowDown", code: "ArrowDown" });
    const current = await screen.findByRole("menuitem", { name: /Learning/ });
    expect(current.getAttribute("href")).toBe("/learning");
    expect(current.getAttribute("aria-current")).toBe("page");
    expect(
      screen.getByRole("menuitem", { name: "Courses" }).getAttribute("href"),
    ).toBe("/courses");
    expect(
      screen
        .getByRole("menuitem", { name: "Unavailable" })
        .hasAttribute("href"),
    ).toBe(false);
    fireEvent.keyDown(current, { key: "Escape", code: "Escape" });
    await waitFor(() => expect(document.activeElement).toBe(trigger));
    expect(submit).not.toHaveBeenCalled();
  });

  it("does not open when disabled", () => {
    render(<AppSwitcher items={[]} disabled />);
    fireEvent.click(screen.getByRole("button"));
    expect(screen.queryByRole("menu")).toBeNull();
  });
});
