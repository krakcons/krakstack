import { useAtomSet } from "@effect/atom-react";
import { Schema } from "effect";
import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAppForm } from "@/components/ui/form";
import { createExampleAtom, updateExampleAtom } from "./atom";
import { CreateExample, type CreateExamplePayload, type Example } from "./schema";

type Props = {
  readonly example?: Example | undefined;
  readonly open?: boolean | undefined;
  readonly onOpenChange?: ((open: boolean) => void) | undefined;
  readonly trigger?: ReactNode | undefined;
};

const messages = {
  create: "Create example",
  description: "Description",
  edit: "Edit example",
  name: "Name",
  saveFailed: "Could not save the example.",
};

export function ExampleDialog({ example, open, onOpenChange, trigger }: Props) {
  const createExample = useAtomSet(createExampleAtom);
  const updateExample = useAtomSet(updateExampleAtom);
  const [error, setError] = useState("");
  const isEditing = Boolean(example);
  const defaultValues: CreateExamplePayload = example?.description
    ? { name: example.name, description: example.description }
    : { name: example?.name ?? "" };

  const form = useAppForm({
    defaultValues,
    validators: { onSubmit: Schema.toStandardSchemaV1(CreateExample) },
    onSubmit: async ({ value }) => {
      try {
        const payload = {
          name: value.name.trim(),
          description: value.description?.trim() || undefined,
        };

        if (example) {
          await updateExample({ id: example.id, payload });
        } else {
          await createExample(payload);
        }

        onOpenChange?.(false);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : messages.saveFailed);
      }
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger ? <DialogTrigger render={<Button>{trigger}</Button>} /> : null}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? messages.edit : messages.create}</DialogTitle>
        </DialogHeader>
        <form.AppForm>
          <form
            className="grid gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              void form.handleSubmit();
            }}
          >
            <form.AppField name="name">
              {(field) => <field.TextField label={messages.name} autoFocus />}
            </form.AppField>
            <form.AppField name="description">
              {(field) => <field.TextAreaField label={messages.description} />}
            </form.AppField>
            {error ? <p className="text-destructive text-sm">{error}</p> : null}
            <DialogFooter>
              <form.SubmitButton />
            </DialogFooter>
          </form>
        </form.AppForm>
      </DialogContent>
    </Dialog>
  );
}
