// @vitest-environment jsdom
import { describe, expect, it } from "@effect/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, vi } from "vitest";
import { Building2 } from "lucide-react";
import { AppBrand } from "./app-brand";

afterEach(cleanup);

describe("AppBrand presentation", () => {
  it("keeps static semantics and applies classes to named parts without leaking props to the DOM", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const view = render(
        <AppBrand
          to={null}
          label="Workspace"
          subtitle="Account"
          icon={Building2}
          classNames={{
            visual: "project-visual",
            label: "project-label",
            subtitle: "project-subtitle",
          }}
        />,
      );
      expect(screen.queryByRole("link")).toBeNull();
      expect(
        screen.getByText("Workspace").classList.contains("project-label"),
      ).toBe(true);
      expect(
        screen.getByText("Account").classList.contains("project-subtitle"),
      ).toBe(true);
      expect(
        view.container
          .querySelector('[data-slot="app-brand-visual"]')
          ?.classList.contains("project-visual"),
      ).toBe(true);
      expect(view.container.querySelector("[classnames]")).toBeNull();
      expect(error).not.toHaveBeenCalled();
    } finally {
      error.mockRestore();
    }
  });

  it("preserves anchor destinations, attributes and image alternative text", () => {
    render(
      <AppBrand
        href="https://example.com/workspace"
        label="Workspace"
        subtitle="Account"
        imageSrc="/logo.png"
        target="_blank"
        rel="noreferrer"
        classNames={{ image: "project-image" }}
      />,
    );
    const link = screen.getByRole("link", { name: /Workspace/ });
    expect(link.getAttribute("href")).toBe("https://example.com/workspace");
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toBe("noreferrer");
    expect(
      screen
        .getByRole("img", { name: "Workspace" })
        .classList.contains("project-image"),
    ).toBe(true);
  });
});
