import { useAtomSet, useAtomValue } from "@effect/atom-react";
import { AsyncResult } from "effect/unstable/reactivity";
import { Pencil, Power, Trash2 } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import {
  DataTable,
  type DataTableColDef,
  type DataTableRowAction,
} from "@/components/ui/data-table";

import { allExamplesAtom, deleteExampleAtom, updateExampleAtom } from "./atom";
import { ExampleDialog } from "./form";
import type { Example } from "./schema";

const messages = {
  active: "Active",
  delete: "Delete",
  edit: "Edit",
  example: "Example",
  inactive: "Inactive",
  toggle: "Toggle",
};

export function ExampleTable() {
  const result = useAtomValue(allExamplesAtom);
  const updateExample = useAtomSet(updateExampleAtom);
  const deleteExample = useAtomSet(deleteExampleAtom);
  const [editing, setEditing] = useState<Example | null>(null);

  const examples = AsyncResult.match(result, {
    onInitial: () => [],
    onFailure: () => [],
    onSuccess: ({ value }: { value: ReadonlyArray<Example> }) =>
      Array.from(value),
  });

  const columns: DataTableColDef<Example>[] = [
    {
      field: "name",
      headerName: messages.example,
    },
    {
      field: "active",
      headerName: messages.active,
      cellRenderer: ({ data }) => (
        <Badge variant={data.active ? "default" : "secondary"}>
          {data.active ? messages.active : messages.inactive}
        </Badge>
      ),
    },
  ];

  const rowActions: DataTableRowAction<Example>[] = [
    { name: messages.edit, icon: <Pencil />, onClick: setEditing },
    {
      name: messages.toggle,
      icon: <Power />,
      onClick: (example) =>
        updateExample({
          id: example.id,
          payload: { active: !example.active },
        }),
    },
    {
      name: messages.delete,
      icon: <Trash2 />,
      variant: "destructive",
      onClick: (example) => deleteExample(example.id),
    },
  ];

  return (
    <>
      <DataTable
        columnDefs={columns}
        features={{ rowActions: { items: rowActions } }}
        getRowId={(example) => example.id}
        onRowClicked={setEditing}
        rowData={examples}
      />
      {editing ? (
        <ExampleDialog
          example={editing}
          open
          onOpenChange={(open) => !open && setEditing(null)}
        />
      ) : null}
    </>
  );
}
