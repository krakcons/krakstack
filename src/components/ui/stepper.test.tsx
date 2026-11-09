// @vitest-environment jsdom

import { describe, expect, it } from "@effect/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, vi } from "vitest";

import { Stepper, StepperContent } from "./stepper";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

const steps = [
  { id: "connect", label: "Connect" },
  { id: "configure", label: "Configure", state: "error" },
  {
    id: "verify",
    label: "Verify",
    disabled: true,
    disabledReason: "Connect first",
  },
] satisfies Parameters<typeof Stepper>[0]["steps"];

describe("Stepper", () => {
  it("requests navigation without changing controlled state or submitting its enclosing form", () => {
    const onStepSelect = vi.fn();
    const onSubmit = vi.fn();
    const { container } = render(
      <form onSubmit={onSubmit}>
        <Stepper
          variant="underline"
          steps={steps}
          currentStep="connect"
          onStepSelect={onStepSelect}
        />
      </form>,
    );
    fireEvent.click(screen.getByRole("button", { name: /Configure/ }));
    expect(onStepSelect).toHaveBeenCalledWith(steps[1]);
    expect(onSubmit).not.toHaveBeenCalled();
    expect(container.querySelector('nav [aria-hidden="true"]')).toBeNull();
    expect(
      container.querySelector('[aria-current="step"]')?.textContent,
    ).toContain("Connect");
    expect(container.querySelector('[data-state="completed"]')).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /Verify/ }));
    fireEvent.click(screen.getByRole("button", { name: /Connect$/ }));
    expect(onStepSelect).toHaveBeenCalledTimes(1);
  });

  it("supports read-only progress, explicit completion, French and arbitrary locale overrides", () => {
    const { rerender } = render(
      <Stepper
        steps={[{ ...steps[0], state: "completed" }, steps[1]]}
        currentStep="configure"
        locale="fr-CA"
        variant="segmented"
      />,
    );
    expect(screen.queryByRole("button")).toBeNull();
    expect(
      screen.getByRole("navigation", { name: "Progression" }),
    ).toBeTruthy();
    expect(screen.getByText("Étape 2 sur 2")).toBeTruthy();
    expect(screen.getByText(/Terminée/)).toBeTruthy();
    rerender(
      <Stepper
        steps={steps}
        currentStep="connect"
        locale="es-MX"
        messages={{ es: { label: "Progreso" } }}
      />,
    );
    expect(screen.getByRole("navigation", { name: "Progreso" })).toBeTruthy();
  });

  it("does not announce an invalid or empty step position", () => {
    const { container, rerender } = render(
      <Stepper steps={[]} currentStep="missing" />,
    );
    expect(container.textContent).toBe("");
    rerender(<Stepper steps={steps} currentStep="missing" />);
    expect(container.textContent).toBe("");
  });

  it("animates only committed step changes, cancels interrupted motion and respects reduced motion", () => {
    const cancel = vi.fn();
    const animate = vi.fn(
      (_keyframes: Keyframe[], _options: KeyframeAnimationOptions) => ({
        cancel,
        onfinish: () => {},
      }),
    );
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({ matches: false })),
    );
    const { container, rerender } = render(
      <StepperContent
        step="connect"
        direction="forward"
        animate
        focusTarget="h2"
      >
        <div>
          <h2 tabIndex={-1}>Connect</h2>
          <input
            id="draft"
            name="draft"
            defaultValue="Retained draft"
            required
          />
        </div>
      </StepperContent>,
    );
    Object.defineProperty(
      container.querySelector('[data-slot="stepper-panel"]'),
      "animate",
      {
        value: animate,
      },
    );
    expect(animate).not.toHaveBeenCalled();
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "Edited draft" },
    });
    rerender(
      <StepperContent
        step="configure"
        direction="forward"
        animate
        focusTarget="h2"
      >
        <h2 tabIndex={-1}>Configure</h2>
      </StepperContent>,
    );
    expect(animate.mock.calls[0]).toEqual([
      [{ transform: "translateX(100%)" }, { transform: "translateX(0)" }],
      { duration: 500, easing: "cubic-bezier(0.4, 0, 0.2, 1)" },
    ]);
    expect(animate.mock.calls[1]).toEqual([
      [{ transform: "translateX(0)" }, { transform: "translateX(-100%)" }],
      {
        duration: 500,
        easing: "cubic-bezier(0.4, 0, 0.2, 1)",
        fill: "forwards",
      },
    ]);
    const outgoing = container.querySelector(
      '[data-slot="stepper-exiting-panel"]',
    );
    expect(outgoing?.textContent).toContain("Connect");
    expect(outgoing?.querySelector("input")?.value).toBe("Edited draft");
    expect(outgoing?.querySelector("[id], [name]")).toBeNull();
    expect(outgoing?.querySelector("input")?.disabled).toBe(true);
    expect(outgoing?.parentElement?.hasAttribute("inert")).toBe(true);
    expect(document.activeElement).toBe(
      screen.getByRole("heading", { name: "Configure" }),
    );
    rerender(
      <StepperContent
        step="connect"
        direction="backward"
        animate
        focusTarget="h2"
      >
        <h2 tabIndex={-1}>Connect</h2>
      </StepperContent>,
    );
    expect(cancel).toHaveBeenCalledTimes(2);
    expect(animate.mock.calls[2]?.[0]).toEqual([
      { transform: "translateX(-100%)" },
      { transform: "translateX(0)" },
    ]);
    expect(animate.mock.calls[3]?.[0]).toEqual([
      { transform: "translateX(0)" },
      { transform: "translateX(100%)" },
    ]);
    expect(
      container.querySelector('[data-slot="stepper-exiting-panel"]')
        ?.textContent,
    ).toContain("Configure");
    animate.mock.results[3]?.value.onfinish();
    expect(
      container.querySelector('[data-slot="stepper-exiting-panel"]'),
    ).toBeNull();
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({ matches: true })),
    );
    rerender(
      <StepperContent step="verify" direction="forward" animate>
        <h2>Verify</h2>
      </StepperContent>,
    );
    expect(animate).toHaveBeenCalledTimes(4);
    expect(
      container.querySelector('[data-slot="stepper-exiting-panel"]'),
    ).toBeNull();
  });
});
