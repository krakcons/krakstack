import { useState } from "react";
import { AsyncResult } from "effect/unstable/reactivity";
import { type ColumnDef } from "@tanstack/react-table";
import { CheckCircle2, Circle, Pencil, RotateCcw } from "lucide-react";
import { useAtomSet } from "@effect/atom-react";

import {
  createDataTableActionsColumn,
  DataTable,
  DataTableColumnHeader,
} from "@/components/data-table/data-table";
import { TaskDialog } from "@/components/tasks/task-dialog";
import { Badge } from "@/components/ui/badge";
import { updateTaskAtom, useTasksAtom, type Task } from "@/lib/atoms/tasks";

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);

export function TaskTable() {
  const tasksResult = useTasksAtom();
  const updateTask = useAtomSet(updateTaskAtom);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const tasks = AsyncResult.match(tasksResult, {
    onInitial: () => [],
    onFailure: () => [],
    onSuccess: ({ value }) => Array.from(value),
  });

  const columns: ColumnDef<Task>[] = [
    {
      accessorKey: "title",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Task" />,
      cell: ({ row }) => (
        <div className="flex min-w-52 flex-col gap-1">
          <span className="font-medium">{row.original.title}</span>
          {row.original.description ? (
            <span className="line-clamp-2 text-sm text-muted-foreground">{row.original.description}</span>
          ) : null}
        </div>
      ),
    },
    {
      accessorKey: "completed",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => (
        <Badge variant={row.original.completed ? "default" : "secondary"}>
          {row.original.completed ? <CheckCircle2 data-icon="inline-start" /> : <Circle data-icon="inline-start" />}
          {row.original.completed ? "Done" : "Open"}
        </Badge>
      ),
    },
    {
      accessorKey: "updatedAt",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Updated" />,
      cell: ({ row }) => <span className="text-sm text-muted-foreground">{formatDate(row.original.updatedAt)}</span>,
    },
    createDataTableActionsColumn<Task>([
      {
        name: "Edit",
        icon: <Pencil />,
        onClick: setEditingTask,
      },
      {
        name: "Complete",
        icon: <CheckCircle2 />,
        visible: (task) => !task.completed,
        onClick: (task) => {
          updateTask({
            params: { id: task.id },
            payload: { completed: true },
            reactivityKeys: ["tasks"],
          });
        },
      },
      {
        name: "Reopen",
        icon: <RotateCcw />,
        visible: (task) => task.completed,
        onClick: (task) => {
          updateTask({
            params: { id: task.id },
            payload: { completed: false },
            reactivityKeys: ["tasks"],
          });
        },
      },
    ]),
  ];

  return AsyncResult.match(tasksResult, {
    onInitial: () => <div className="rounded-xl border bg-card p-6 text-muted-foreground">Loading tasks...</div>,
    onFailure: () => (
      <div className="rounded-xl border bg-card p-6 text-destructive">Unable to load tasks.</div>
    ),
    onSuccess: () => {
      return (
        <>
          <DataTable
            columns={columns}
            data={tasks}
            exportFileName="tasks.csv"
            features={{ gallery: false }}
            from="/"
            onRowClick={setEditingTask}
          />

          {editingTask ? (
            <TaskDialog
              task={editingTask}
              open
              onOpenChange={(open) => {
                if (!open) setEditingTask(null);
              }}
            />
          ) : null}
        </>
      );
    },
  });
}
