import { useEffect, useState, type ReactElement } from "react";
import { useAtomSet } from "@effect/atom-react";

import { useAppForm } from "@/components/form";
import { createTaskAtom, updateTaskAtom, type Task } from "@/lib/atoms/tasks";
import { CreateTask } from "@/services/task/schema";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Schema } from "effect";

type TaskDialogProps = {
  task?: Task | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: ReactElement;
};

const getErrorMessage = (isEditing: boolean, error: unknown) => {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return isEditing ? "Failed to save task." : "Failed to create task.";
};

export function TaskDialog({ task, open: controlledOpen, onOpenChange, trigger }: TaskDialogProps) {
  const createTask = useAtomSet(createTaskAtom);
  const updateTask = useAtomSet(updateTaskAtom);
  const [internalOpen, setInternalOpen] = useState(false);
  const [error, setError] = useState("");

  const open = controlledOpen ?? internalOpen;
  const isEditing = Boolean(task);

  const form = useAppForm({
    defaultValues: {
      title: task?.title ?? "",
      description: task?.description ?? "",
    } as (typeof CreateTask)["Encoded"],
    validators: {
      onSubmit: Schema.toStandardSchemaV1(CreateTask),
    },
    onSubmit: async ({ value }) => {
      setError("");

      const trimmedTitle = value.title.trim();
      const trimmedDescription = value.description?.trim();

      if (!trimmedTitle) {
        setError("Title is required.");
        return;
      }

      try {
        if (task) {
          await Promise.resolve(
            updateTask({
              params: { id: task.id },
              payload: {
                title: trimmedTitle,
                description: trimmedDescription || null,
              },
              reactivityKeys: ["tasks"],
            }),
          );
        } else {
          await Promise.resolve(
            createTask({
              payload: {
                title: trimmedTitle,
                description: trimmedDescription || undefined,
              },
              reactivityKeys: ["tasks"],
            }),
          );
        }

        handleOpenChange(false);
      } catch (error) {
        setError(getErrorMessage(isEditing, error));
      }
    },
  });

  useEffect(() => {
    if (!open) return;

    form.reset({
      title: task?.title ?? "",
      description: task?.description ?? "",
    });
    setError("");
  }, [form, open, task]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (controlledOpen === undefined) {
      setInternalOpen(nextOpen);
    }

    onOpenChange?.(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger ? <DialogTrigger render={trigger} /> : null}
      <DialogContent>
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            event.stopPropagation();
            form.handleSubmit();
          }}
        >
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit task" : "Create task"}</DialogTitle>
            <DialogDescription>
              {isEditing ? "Update the task details." : "Add a task to the list."}
            </DialogDescription>
          </DialogHeader>

          <form.AppForm>
            <form.AppField name="title">
              {(field) => (
                <field.TextField label="Title" placeholder="Ship the table view" autoFocus />
              )}
            </form.AppField>
            <form.AppField name="description">
              {(field) => (
                <field.TextAreaField label="Description" placeholder="Optional details" />
              )}
            </form.AppField>

            <div className="min-h-5 text-sm text-destructive">{error || null}</div>

            <DialogFooter>
              <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
              <form.SubmitButton />
            </DialogFooter>
          </form.AppForm>
        </form>
      </DialogContent>
    </Dialog>
  );
}
