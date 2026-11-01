import { useState } from "react";
import type { Schema } from "effect";
import { Check, Clock, FileJson, X } from "lucide-react";
import {
  DataTable,
  type DataTableColDef,
  type DataTableProps,
} from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { CodeBlock } from "@/components/ui/code-block";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useKrakstackLocale } from "@/components/ui/krakstack-provider";

export interface WebhookDeliveryRow {
  readonly id: string;
  readonly event: string;
  readonly status: "pending" | "success" | "failed";
  readonly retries: number;
  readonly error: string | null;
  readonly retryAt: Date;
  readonly createdAt: Date;
  readonly completedAt: Date | null;
  readonly data: Schema.Json;
}

const translations = {
  en: {
    identifier: "ID",
    event: "Event",
    status: "Status",
    pending: "Pending",
    success: "Success",
    failed: "Failed",
    retries: "Retries",
    retryAt: "Next retry",
    errorUnavailable: "Error details unavailable",
    payload: "Payload",
    viewPayload: "View JSON",
    createdAt: "Created",
    completedAt: "Completed",
  },
  fr: {
    identifier: "Identifiant",
    event: "Événement",
    status: "Statut",
    pending: "En attente",
    success: "Réussite",
    failed: "Échec",
    retries: "Tentatives",
    retryAt: "Prochaine tentative",
    errorUnavailable: "Détails de l’erreur indisponibles",
    payload: "Données",
    viewPayload: "Voir le JSON",
    createdAt: "Créé",
    completedAt: "Terminé",
  },
};
export type WebhookDeliveryMessages = typeof translations.en;

/** A failed attempt remains failed while its next retry is pending. */
export const webhookDeliveryStatus = (
  delivery: Pick<WebhookDeliveryRow, "status" | "retries">,
) =>
  delivery.status === "pending" && delivery.retries > 0
    ? "failed"
    : delivery.status;

export type WebhookDeliveryTableProps<T extends WebhookDeliveryRow> = Pick<
  DataTableProps<T>,
  "state" | "onStateChange" | "status"
> & {
  entries: readonly T[];
  rowCount: number;
  locale?: string;
  messages?: Readonly<Record<string, Partial<WebhookDeliveryMessages>>>;
  events?: readonly { value: string; label: string }[];
  /** Application-owned navigation and resource references. */
  linksColumn?: DataTableColDef<T>;
};

export const WebhookDeliveryTable = <T extends WebhookDeliveryRow>({
  entries,
  rowCount,
  locale: localeOverride,
  messages,
  events = [],
  linksColumn,
  state,
  onStateChange,
  status,
}: WebhookDeliveryTableProps<T>) => {
  const locale = useKrakstackLocale(localeOverride);
  const base = locale.split("-")[0];
  const labels = {
    ...translations.en,
    ...(base === "fr" ? translations.fr : translations.en),
    ...messages?.[base],
    ...messages?.[locale],
  };
  const [selected, setSelected] = useState<T | null>(null);
  const dateFormatter = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const statusLabels = {
    pending: labels.pending,
    success: labels.success,
    failed: labels.failed,
  };
  const columns: DataTableColDef<T>[] = [
    { field: "id", headerName: labels.identifier },
    {
      field: "event",
      headerName: labels.event,
      valueGetter: ({ data }) =>
        events.find((event) => event.value === data.event)?.label ?? data.event,
      filterValueGetter: ({ data }) => data.event,
      filterable: events.length > 0,
      filterOptions: events,
    },
    {
      field: "status",
      headerName: labels.status,
      type: "reference",
      filterValueGetter: ({ data }) => webhookDeliveryStatus(data),
      valueGetter: ({ data }) => statusLabels[webhookDeliveryStatus(data)],
      filterOptions: Object.entries(statusLabels).map(([value, label]) => ({
        value,
        label,
      })),
      typeOptions: {
        imageVariant: "square",
        getItem: (delivery) => {
          const displayStatus = webhookDeliveryStatus(delivery);
          const details =
            displayStatus === "failed"
              ? [
                  delivery.error ?? labels.errorUnavailable,
                  `${labels.retries}: ${delivery.retries}`,
                  ...(delivery.status === "pending"
                    ? [
                        `${labels.retryAt}: ${dateFormatter.format(delivery.retryAt)}`,
                      ]
                    : []),
                ]
              : [];
          return {
            label: statusLabels[displayStatus],
            description: details.join(" · ") || undefined,
            icon:
              displayStatus === "failed" ? (
                <X />
              ) : displayStatus === "success" ? (
                <Check />
              ) : (
                <Clock />
              ),
            iconClassName:
              displayStatus === "failed"
                ? "bg-destructive/10 text-destructive"
                : displayStatus === "success"
                  ? "bg-success/10 text-success"
                  : "bg-primary/10 text-primary",
          };
        },
      },
    },
    ...(linksColumn ? [linksColumn] : []),
    {
      colId: "data",
      headerName: labels.payload,
      sortable: false,
      filterable: false,
      cellRenderer: ({ data }) => (
        <Button
          variant="outline"
          size="sm"
          onClick={(event) => {
            event.stopPropagation();
            setSelected(data);
          }}
        >
          <FileJson data-icon="inline-start" />
          {labels.viewPayload}
        </Button>
      ),
    },
    { field: "createdAt", headerName: labels.createdAt, type: "dateTime" },
    { field: "completedAt", headerName: labels.completedAt, type: "dateTime" },
  ];
  return (
    <>
      <DataTable
        locale={locale}
        rowData={entries}
        getRowId={(row) => row.id}
        columnDefs={columns}
        initialState={{ columnVisibility: { id: false } }}
        state={state}
        onStateChange={onStateChange}
        status={status}
        features={{
          search: true,
          export: { baseName: "webhook-deliveries" },
          pagination: { mode: "server", rowCount },
        }}
      />
      <Dialog
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <DialogContent className="grid max-h-[calc(100svh-2rem)] grid-rows-[auto_minmax(0,1fr)] overflow-hidden sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>{labels.payload}</DialogTitle>
          </DialogHeader>
          <div className="min-h-0 overflow-auto">
            <CodeBlock
              code={JSON.stringify(selected?.data ?? null, null, 2)}
              language="json"
              locale={locale}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
