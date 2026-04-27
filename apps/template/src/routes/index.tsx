import { createFileRoute } from "@tanstack/react-router";

import { TableSearchSchema } from "@/components/data-table/data-table";
import { TaskDialog } from "@/components/tasks/task-dialog";
import { TaskTable } from "@/components/tasks/task-table";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  component: Home,
  validateSearch: TableSearchSchema,
});

function Home() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-6 md:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-muted-foreground">Tasks</p>
          <h1 className="text-3xl font-semibold tracking-tight">Simple task table</h1>
          <p className="max-w-2xl text-muted-foreground">
            Query tasks through an Effect atom, then create or edit them from the dialog.
          </p>
        </div>
        <TaskDialog trigger={<Button type="button">Create task</Button>} />
      </div>

      <TaskTable />
    </div>
  );
}
