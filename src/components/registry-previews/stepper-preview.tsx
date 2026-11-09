import { useId, useState } from "react";
import { useHydrated } from "@tanstack/react-router";
import { Stepper, StepperContent } from "@/components/ui/stepper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { m } from "@/paraglide/messages";

export const StepperPreview = () => {
  return (
    <div className="space-y-8">
      <CompactStepperPreview />
      <FormStepperPreview />
      <VerticalStepperPreview />
    </div>
  );
};

const CompactStepperPreview = () => {
  const hydrated = useHydrated();
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState<"forward" | "backward" | "none">(
    "none",
  );
  const steps = [
    { id: "connect", label: m.stepper_preview_connect() },
    { id: "configure", label: m.stepper_preview_configure() },
    { id: "verify", label: m.stepper_preview_verify() },
  ].map(
    (step, position) =>
      ({
        ...step,
        disabled: !hydrated,
        state: position < index ? "completed" : "upcoming",
      }) satisfies Parameters<typeof Stepper>[0]["steps"][number],
  );
  const current = steps[index];
  if (!current) return null;
  const go = (next: number) => {
    setDirection(next > index ? "forward" : "backward");
    setIndex(next);
  };

  return (
    <Card data-example="compact-stepper">
      <CardHeader>
        <CardTitle>{m.stepper_preview_title()}</CardTitle>
        <CardDescription>{m.stepper_preview_description()}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Stepper
          variant="underline"
          steps={steps}
          currentStep={current.id}
          onStepSelect={(step) =>
            go(steps.findIndex((item) => item.id === step.id))
          }
        />
        <StepperContent
          step={current.id}
          direction={direction}
          animate
          focusTarget="h3"
        >
          <div className="rounded-lg border p-5">
            <h3 tabIndex={-1} className="font-medium outline-none">
              {current.label}
            </h3>
            <p className="text-muted-foreground mt-2 text-sm">
              {m.stepper_preview_content()}
            </p>
          </div>
        </StepperContent>
        <div className="flex justify-between gap-3">
          {index > 0 ? (
            <Button
              disabled={!hydrated}
              variant="outline"
              onClick={() => go(index - 1)}
            >
              {m.stepper_preview_previous()}
            </Button>
          ) : (
            <span />
          )}
          <Button
            disabled={!hydrated}
            onClick={() => go(index === steps.length - 1 ? 0 : index + 1)}
          >
            {index === steps.length - 1
              ? m.stepper_preview_restart()
              : m.stepper_preview_continue()}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const FormStepperPreview = () => {
  const hydrated = useHydrated();
  const nameId = useId();
  const [index, setIndex] = useState(0);
  const [name, setName] = useState("");
  const [direction, setDirection] = useState<"forward" | "backward" | "none">(
    "none",
  );
  const steps = [
    { id: "details", label: m.stepper_example_details() },
    { id: "review", label: m.stepper_example_review() },
    { id: "done", label: m.stepper_example_done() },
  ].map(
    (step, position) =>
      ({
        ...step,
        disabled: !hydrated || position > index,
        state: position < index ? "completed" : "upcoming",
      }) satisfies Parameters<typeof Stepper>[0]["steps"][number],
  );
  const current = steps[index];
  if (!current) return null;
  const go = (next: number) => {
    setDirection(next > index ? "forward" : "backward");
    setIndex(next);
  };

  return (
    <Card data-example="form-stepper">
      <CardHeader>
        <CardTitle>{m.stepper_example_form_title()}</CardTitle>
        <CardDescription>
          {m.stepper_example_form_description()}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-6"
          onSubmit={(event) => {
            event.preventDefault();
            if (index < steps.length - 1) go(index + 1);
          }}
        >
          <Stepper
            variant="underline"
            steps={steps}
            currentStep={current.id}
            aria-label={m.stepper_example_form_title()}
            onStepSelect={(step) =>
              go(steps.findIndex((item) => item.id === step.id))
            }
          />
          <StepperContent
            step={current.id}
            direction={direction}
            animate
            focusTarget="h3"
          >
            <div className="min-h-40 space-y-4 rounded-lg border p-5">
              <h3 tabIndex={-1} className="font-medium outline-none">
                {current.label}
              </h3>
              {index === 0 ? (
                <div className="space-y-2">
                  <label htmlFor={nameId} className="text-sm font-medium">
                    {m.stepper_example_name()}
                  </label>
                  <Input
                    id={nameId}
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    required
                    disabled={!hydrated}
                  />
                </div>
              ) : index === 1 ? (
                <dl className="text-sm">
                  <dt className="text-muted-foreground">
                    {m.stepper_example_name()}
                  </dt>
                  <dd className="mt-1 break-words">{name}</dd>
                </dl>
              ) : (
                <p className="text-muted-foreground text-sm">
                  {m.stepper_example_finished()}
                </p>
              )}
            </div>
          </StepperContent>
          <div className="flex justify-between gap-3">
            {index > 0 ? (
              <Button
                type="button"
                variant="outline"
                disabled={!hydrated}
                onClick={() => go(index - 1)}
              >
                {m.stepper_preview_previous()}
              </Button>
            ) : (
              <span />
            )}
            {index === steps.length - 1 ? (
              <Button type="button" disabled={!hydrated} onClick={() => go(0)}>
                {m.stepper_preview_restart()}
              </Button>
            ) : (
              <Button type="submit" disabled={!hydrated}>
                {index === 1
                  ? m.stepper_example_confirm()
                  : m.stepper_preview_continue()}
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

const VerticalStepperPreview = () => (
  <Card data-example="vertical-stepper">
    <CardHeader>
      <CardTitle>{m.stepper_example_vertical_title()}</CardTitle>
      <CardDescription>
        {m.stepper_example_vertical_description()}
      </CardDescription>
    </CardHeader>
    <CardContent>
      <Stepper
        variant="underline"
        orientation="vertical"
        currentStep="configure"
        aria-label={m.stepper_example_vertical_title()}
        steps={[
          {
            id: "connect",
            label: m.stepper_preview_connect(),
            description: m.stepper_example_connected(),
            state: "completed",
          },
          {
            id: "configure",
            label: m.stepper_preview_configure(),
            description: m.stepper_example_attention(),
            state: "error",
          },
          {
            id: "verify",
            label: m.stepper_preview_verify(),
            description: m.stepper_example_waiting(),
          },
        ]}
      />
    </CardContent>
  </Card>
);
