import { Check, CircleAlert } from "lucide-react";
import {
  Component,
  useLayoutEffect,
  useRef,
  type ComponentProps,
  type ReactNode,
  type RefObject,
} from "react";

import { useKrakstackLocale } from "@/components/ui/krakstack-provider";
import { cn } from "@/lib/utils";

export type StepperStep = {
  id: string;
  label: string;
  description?: string;
  icon?: ReactNode;
  state?: "upcoming" | "completed" | "error";
  disabled?: boolean;
  disabledReason?: string;
};

export type StepperMessages = {
  label: string;
  progress: (current: number, total: number) => string;
  completed: string;
  error: string;
};

export type StepperMessageTranslations = Partial<
  Record<string, Partial<StepperMessages>>
>;

const defaults = {
  en: {
    label: "Progress",
    progress: (current: number, total: number) => `Step ${current} of ${total}`,
    completed: "Completed",
    error: "Needs attention",
  },
  fr: {
    label: "Progression",
    progress: (current: number, total: number) =>
      `Étape ${current} sur ${total}`,
    completed: "Terminée",
    error: "À vérifier",
  },
} satisfies Record<string, StepperMessages>;

export type StepperProps = Omit<ComponentProps<"nav">, "children"> & {
  steps: readonly StepperStep[];
  currentStep: string;
  onStepSelect?: (step: StepperStep) => void;
  variant?: "labelled" | "segmented" | "underline";
  orientation?: "horizontal" | "vertical" | "responsive";
  locale?: string;
  messages?: StepperMessageTranslations;
};

/** Controlled progress navigation, not a form or workflow engine. */
export const Stepper = ({
  steps,
  currentStep,
  onStepSelect,
  variant = "labelled",
  orientation = "horizontal",
  locale: localeOverride,
  messages,
  className,
  "aria-label": ariaLabel,
  ...props
}: StepperProps) => {
  const locale = useKrakstackLocale(localeOverride);
  const base = locale.split("-")[0] ?? locale;
  const labels = {
    ...(base === "fr" ? defaults.fr : defaults.en),
    ...messages?.[base],
    ...messages?.[locale],
  };
  const currentIndex = steps.findIndex((step) => step.id === currentStep);
  if (steps.length === 0 || currentIndex < 0) return null;

  return (
    <nav
      {...props}
      aria-label={ariaLabel ?? labels.label}
      data-slot="stepper"
      data-variant={variant}
      data-orientation={orientation}
      className={cn("min-w-0", className)}
    >
      <p aria-live="polite" aria-atomic="true" className="sr-only">
        {labels.progress(currentIndex + 1, steps.length)}
      </p>
      <ol
        className={cn(
          "flex gap-2",
          variant === "underline" && "flex-wrap gap-x-6 gap-y-1",
          variant === "underline" &&
            orientation === "horizontal" &&
            "justify-center",
          orientation === "vertical" && "flex-col",
          orientation === "responsive" && "lg:flex-col",
        )}
      >
        {steps.map((step, index) => {
          const active = step.id === currentStep;
          const state = step.state ?? "upcoming";
          const content = (
            <>
              {variant === "segmented" ? (
                <span
                  aria-hidden="true"
                  className={cn(
                    "bg-muted block h-1.5 w-full rounded-full motion-safe:transition-colors motion-safe:duration-150",
                    state === "completed" && "bg-primary/50",
                    active && "bg-primary",
                    state === "error" && "bg-destructive",
                  )}
                />
              ) : variant === "labelled" ? (
                <span
                  aria-hidden="true"
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full border text-xs font-medium motion-safe:transition-colors motion-safe:duration-150 [&_svg]:size-4",
                    state === "completed" &&
                      "border-primary/30 bg-primary/10 text-primary",
                    active &&
                      "border-primary bg-primary text-primary-foreground",
                    state === "error" && "border-destructive text-destructive",
                  )}
                >
                  {state === "error" ? (
                    <CircleAlert />
                  ) : state === "completed" && !active ? (
                    <Check />
                  ) : (
                    (step.icon ?? index + 1)
                  )}
                </span>
              ) : null}
              <span
                className={cn(
                  "min-w-0 break-words",
                  variant === "segmented" && "sr-only",
                  orientation === "responsive" &&
                    variant === "labelled" &&
                    "sr-only lg:not-sr-only",
                )}
              >
                <span className="block">{step.label}</span>
                {step.description ? (
                  <span className="text-muted-foreground block text-xs font-normal">
                    {step.description}
                  </span>
                ) : null}
                {state !== "upcoming" ? (
                  <span className="sr-only"> — {labels[state]}</span>
                ) : null}
                {step.disabledReason ? (
                  <span className="text-muted-foreground block text-xs font-normal">
                    {step.disabledReason}
                  </span>
                ) : null}
              </span>
            </>
          );
          const itemClassName = cn(
            "text-muted-foreground flex min-h-11 w-full min-w-0 items-center rounded-md text-sm",
            variant === "labelled" && orientation === "horizontal"
              ? "flex-col gap-2 text-center sm:flex-row sm:gap-3 sm:text-left"
              : "gap-3 text-left",
            variant === "labelled" && "px-2 py-2",
            orientation === "responsive" && "justify-center lg:justify-start",
            variant === "underline" &&
              "w-auto justify-start rounded-none border-b-2 border-transparent py-3 text-left motion-safe:transition-colors motion-safe:duration-150",
            variant === "underline" && active && "border-foreground",
            active && "text-foreground font-medium",
            state === "error" && "text-destructive",
          );
          return (
            <li
              key={step.id}
              data-state={state}
              className={cn("min-w-0", variant !== "underline" && "flex-1")}
            >
              {onStepSelect ? (
                <button
                  type="button"
                  aria-current={active ? "step" : undefined}
                  aria-disabled={step.disabled || undefined}
                  title={step.disabledReason ?? step.label}
                  className={cn(
                    itemClassName,
                    "focus-visible:ring-ring hover:bg-muted/50 focus-visible:ring-2 focus-visible:outline-none aria-disabled:cursor-not-allowed aria-disabled:opacity-60",
                  )}
                  onClick={() => {
                    if (!step.disabled && !active) onStepSelect(step);
                  }}
                >
                  {content}
                </button>
              ) : (
                <div
                  aria-current={active ? "step" : undefined}
                  className={itemClassName}
                >
                  {content}
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export type StepperContentProps = ComponentProps<"div"> & {
  step: string;
  direction?: "forward" | "backward" | "none";
  animate?: boolean;
  /** Opt in only when the router does not already manage content focus. */
  focusTarget?: string;
};

type StepperPanelProps = {
  step: string;
  animate: boolean;
  panelRef: RefObject<HTMLDivElement | null>;
  snapshotRef: RefObject<HTMLElement | null>;
  children: ReactNode;
};

// Capture outgoing DOM before React replaces it, including current field values.
class StepperPanel extends Component<StepperPanelProps> {
  override getSnapshotBeforeUpdate(previous: StepperPanelProps) {
    if (!this.props.animate || previous.step === this.props.step) return null;
    const copy = this.props.panelRef.current?.cloneNode(true);
    return copy instanceof HTMLElement ? copy : null;
  }

  override componentDidUpdate(
    _previous: StepperPanelProps,
    _state: StepperPanel["state"],
    snapshot: HTMLElement | null,
  ) {
    this.props.snapshotRef.current = snapshot;
  }

  override render() {
    return (
      <div
        ref={this.props.panelRef}
        data-slot="stepper-panel"
        className="flow-root min-w-0"
      >
        {this.props.children}
      </div>
    );
  }
}

/** Keeps content mounted; callers own field state and route transitions. */
export const StepperContent = ({
  step,
  direction = "none",
  animate = false,
  focusTarget,
  children,
  className,
  ...props
}: StepperContentProps) => {
  const content = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const exit = useRef<HTMLDivElement>(null);
  const snapshot = useRef<HTMLElement | null>(null);
  const previousStep = useRef(step);
  useLayoutEffect(() => {
    if (previousStep.current === step) return;
    previousStep.current = step;
    const element = content.current;
    const animatedPanel = panel.current;
    if (!element || !animatedPanel) return;
    if (focusTarget)
      animatedPanel
        .querySelector<HTMLElement>(focusTarget)
        ?.focus({ preventScroll: true });
    if (
      !animate ||
      direction === "none" ||
      !animatedPanel.animate ||
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const animation = animatedPanel.animate(
      [
        {
          transform: `translateX(${direction === "forward" ? "100%" : "-100%"})`,
        },
        { transform: "translateX(0)" },
      ],
      {
        duration: 500,
        easing: "cubic-bezier(0.4, 0, 0.2, 1)",
      },
    );
    const outgoing = snapshot.current;
    const exitElement = exit.current;
    let exitAnimation: Animation | undefined;
    if (outgoing && exitElement) {
      outgoing.dataset.slot = "stepper-exiting-panel";
      // A visual copy must not duplicate IDs or participate in the host form.
      for (const node of outgoing.querySelectorAll("[id], [name]")) {
        node.removeAttribute("id");
        node.removeAttribute("name");
      }
      for (const node of outgoing.querySelectorAll(
        "input, select, textarea, button",
      )) {
        node.setAttribute("disabled", "");
      }
      exitElement.replaceChildren(outgoing);
      exitAnimation = animatedPanel.animate.call(
        outgoing,
        [
          { transform: "translateX(0)" },
          {
            transform: `translateX(${direction === "forward" ? "-100%" : "100%"})`,
          },
        ],
        {
          duration: 500,
          easing: "cubic-bezier(0.4, 0, 0.2, 1)",
          fill: "forwards",
        },
      );
      exitAnimation.onfinish = () => exitElement.replaceChildren();
    }
    return () => {
      animation.cancel();
      exitAnimation?.cancel();
      exitElement?.replaceChildren();
    };
  }, [step, direction, animate, focusTarget]);

  return (
    <div
      {...props}
      ref={content}
      data-slot="stepper-content"
      className={cn(
        "relative min-w-0",
        animate && "overflow-x-clip",
        className,
      )}
    >
      <div
        ref={exit}
        data-slot="stepper-exit"
        inert
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      />
      <StepperPanel
        step={step}
        animate={animate}
        panelRef={panel}
        snapshotRef={snapshot}
      >
        {children}
      </StepperPanel>
    </div>
  );
};
