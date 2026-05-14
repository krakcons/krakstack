import { useState } from "react";
import { AsyncResult } from "effect/unstable/reactivity";
import { type ColumnDef } from "@tanstack/react-table";
import { CheckCircle2, Circle, Pencil, RotateCcw, Trash2 } from "lucide-react";
import { useAtomSet } from "@effect/atom-react";

import {
  createDataTableActionsColumn,
  DataTable,
  DataTableColumnHeader,
} from "@/components/data-table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";

import { TaskDialog } from "./form";
import {
  deleteTaskAtom,
  updateTaskAtom,
  useTasksAtom,
  type Task,
} from "./atom";

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);

export function TaskTable({ from = "/" }: { from?: "/" | "/admin" }) {
  const tasksResult = useTasksAtom();
  const updateTask = useAtomSet(updateTaskAtom);
  const deleteTask = useAtomSet(deleteTaskAtom);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);
  const tasks = AsyncResult.match(tasksResult, {
    onInitial: () => [],
    onFailure: () => [],
    onSuccess: ({ value }) => Array.from(value),
  });

  const columns: ColumnDef<Task>[] = [
    {
      accessorKey: "title",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Task" />
      ),
      cell: ({ row }) => (
        <div className="flex min-w-52 flex-col gap-1">
          <span className="font-medium">{row.original.title}</span>
          {row.original.description ? (
            <span className="text-muted-foreground line-clamp-2 text-sm">
              {row.original.description}
            </span>
          ) : null}
        </div>
      ),
    },
    {
      accessorKey: "completed",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => (
        <Badge variant={row.original.completed ? "default" : "secondary"}>
          {row.original.completed ? (
            <CheckCircle2 data-icon="inline-start" />
          ) : (
            <Circle data-icon="inline-start" />
          )}
          {row.original.completed ? "Done" : "Open"}
        </Badge>
      ),
    },
    {
      accessorKey: "updatedAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Updated" />
      ),
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm">
          {formatDate(row.original.updatedAt)}
        </span>
      ),
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
      {
        name: "Delete",
        icon: <Trash2 />,
        variant: "destructive",
        onClick: setDeletingTask,
      },
    ]),
  ];

  const confirmDelete = () => {
    if (!deletingTask) return;

    deleteTask({
      params: { id: deletingTask.id },
      reactivityKeys: ["tasks"],
    });
    setDeletingTask(null);
  };

  return AsyncResult.match(tasksResult, {
    onInitial: () => (
      <div className="bg-card text-muted-foreground rounded-xl border p-6">
        Loading tasks...
      </div>
    ),
    onFailure: () => (
      <div className="bg-card text-destructive rounded-xl border p-6">
        Unable to load tasks.
      </div>
    ),
    onSuccess: () => {
      return (
        <>
          <DataTable
            columns={columns}
            data={tasks}
            exportFileName="tasks.csv"
            features={{ gallery: false }}
            from={from}
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

          <AlertDialog
            open={Boolean(deletingTask)}
            onOpenChange={(open) => !open && setDeletingTask(null)}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete task?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete{" "}
                  {deletingTask ? `"${deletingTask.title}"` : "this task"}.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  onClick={confirmDelete}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      );
    },
  });
}
