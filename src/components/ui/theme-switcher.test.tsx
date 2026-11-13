// @vitest-environment jsdom
import { describe, expect, it } from "@effect/vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, vi } from "vitest";
import { KrakstackProvider } from "./krakstack-provider";
import { ThemeProvider, ThemeSwitcher, useTheme } from "./theme-switcher";

const Switcher = ({ custom = false }: { custom?: boolean }) => {
  const { theme, setTheme } = useTheme();
  return (
    <ThemeSwitcher
      value={theme}
      onChange={setTheme}
      className={custom ? "custom-trigger" : undefined}
      contentClassName={custom ? "custom-menu" : undefined}
    />
  );
};

beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  localStorage.clear();
  document.documentElement.className = "";
  delete document.documentElement.dataset.theme;
});

describe("ThemeSwitcher", () => {
  it.each(["en", "fr"])(
    "preserves %s choices, callbacks and theme persistence with styling hooks",
    async (locale) => {
      const french = locale === "fr";
      const mount = () =>
        render(
          <KrakstackProvider locale={locale}>
            <ThemeProvider scriptDisabled>
              <Switcher custom />
            </ThemeProvider>
          </KrakstackProvider>,
        );
      const view = mount();
      const trigger = screen.getByRole("button");
      expect(trigger.classList.contains("custom-trigger")).toBe(true);
      fireEvent.click(trigger);
      const menu = await screen.findByRole("menu");
      expect(menu.classList.contains("custom-menu")).toBe(true);
      expect(trigger.contains(menu)).toBe(false);
      const choices: readonly [string, string, string][] = [
        ["light", french ? "Clair" : "Light", "light"],
        ["dark", french ? "Sombre" : "Dark", "dark"],
        ["system", french ? "Système" : "System", "dark"],
      ];
      for (const [value, label, resolved] of choices) {
        const item = screen.getByRole("menuitemradio", { name: label });
        fireEvent.click(item);
        await waitFor(() => expect(localStorage.getItem("theme")).toBe(value));
        expect(document.documentElement.dataset.theme).toBe(value);
        expect(document.documentElement.classList.contains(resolved)).toBe(
          true,
        );
        expect(item.getAttribute("aria-checked")).toBe("true");
      }
      view.unmount();
      mount();
      fireEvent.click(screen.getByRole("button"));
      const selected = await screen.findByRole("menuitemradio", {
        name: french ? "Système" : "System",
      });
      expect(selected.getAttribute("aria-checked")).toBe("true");
    },
  );

  it("retains keyboard opening and Escape focus restoration without submitting its form", async () => {
    const submit = vi.fn((event: React.FormEvent) => event.preventDefault());
    render(
      <form onSubmit={submit}>
        <ThemeProvider scriptDisabled>
          <Switcher custom />
        </ThemeProvider>
      </form>,
    );
    const trigger = screen.getByRole("button");
    trigger.focus();
    fireEvent.keyDown(trigger, { key: "ArrowDown", code: "ArrowDown" });
    const item = await screen.findByRole("menuitemradio", { name: "Light" });
    fireEvent.keyDown(item, { key: "Escape", code: "Escape" });
    await waitFor(() => expect(document.activeElement).toBe(trigger));
    expect(submit).not.toHaveBeenCalled();
  });

  it("keeps the default menu classes and selected option without customization", async () => {
    localStorage.setItem("theme", "light");
    render(
      <ThemeProvider scriptDisabled>
        <Switcher />
      </ThemeProvider>,
    );
    fireEvent.click(screen.getByRole("button"));
    const menu = await screen.findByRole("menu");
    expect(menu.classList.contains("w-32")).toBe(true);
    expect(menu.classList.contains("custom-menu")).toBe(false);
    expect(
      screen
        .getByRole("menuitemradio", { name: "Light" })
        .getAttribute("aria-checked"),
    ).toBe("true");
  });
});
