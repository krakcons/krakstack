import type { ReactNode } from "react";
import {
  DataTable,
  DataTableReferenceCell,
  type DataTableColDef,
  type DataTableProps,
  type DataTableStatus,
  type DataTableReferenceItem,
} from "@/components/ui/data-table";
import { useKrakstackLocale } from "@/components/ui/krakstack-provider";
import type { EventLogRecord } from "../schema";
import { eventTextAttribute } from "../record";

const translations = {
  en: {
    title: "Audit log",
    time: "Time",
    action: "Action",
    target: "Target",
    actor: "Actor",
    method: "Method",
    actorMember: "Member",
    impersonatedBy: "Impersonated by",
    actorOrganization: "Organization",
    methodApiKey: "API Key",
    methodSession: "User session",
    methodUnknown: "Unknown",
  },
  fr: {
    title: "Journal d’audit",
    time: "Date",
    action: "Action",
    target: "Cible",
    actor: "Acteur",
    method: "Méthode",
    actorMember: "Membre",
    impersonatedBy: "Identité empruntée par",
    actorOrganization: "Organisation",
    methodApiKey: "Clé API",
    methodSession: "Session utilisateur",
    methodUnknown: "Inconnue",
  },
};
export type AuditLogMessages = typeof translations.en;
export type AuditActor = DataTableReferenceItem & {
  type: "user" | "organization";
  id: string;
};

export type AuditLogTableProps = DataTableStatus &
  Pick<DataTableProps<EventLogRecord>, "state" | "onStateChange"> & {
    entries: readonly EventLogRecord[];
    /** Total matching records from the query response; paging lives in state. */
    rowCount: number;
    /** Overrides the shared KrakstackProvider locale when supplied. */
    locale?: string;
    messages?: Readonly<Record<string, Partial<AuditLogMessages>>>;
    /** Current profiles the viewer may access. Matched by type and ID, including user impersonators.
     * Missing profiles use neutral labels: the list may be loading, incomplete, or unavailable.
     */
    actors?: readonly AuditActor[];
    renderAction?: (entry: EventLogRecord) => ReactNode;
  };

export const AuditLogTable = ({
  entries,
  rowCount,
  locale: localeOverride,
  messages,
  actors = [],
  renderAction,
  state,
  onStateChange,
  ...status
}: AuditLogTableProps) => {
  const locale = useKrakstackLocale(localeOverride);
  const base = locale.split("-")[0];
  const labels = {
    ...translations.en,
    ...(base === "fr" ? translations.fr : translations.en),
    ...messages?.[base],
    ...messages?.[locale],
  };
  const methods = new Map([
    ["session", labels.methodSession],
    ["api_key", labels.methodApiKey],
  ]);
  const actorsByKey = new Map(
    actors.map((actor) => [`${actor.type}:${actor.id}`, actor]),
  );
  const getActor = (entry: EventLogRecord): DataTableReferenceItem => {
    const type = eventTextAttribute(entry, "app.actor.type");
    const id = eventTextAttribute(entry, "app.actor.id");
    const actor = actorsByKey.get(`${type}:${id}`);
    if (actor) return actor;
    if (type === "organization") {
      return { label: labels.actorOrganization, description: id };
    }
    if (type === "user") {
      return { label: labels.actorMember, description: id };
    }
    return { label: type ?? labels.actor, description: id };
  };
  const columns: DataTableColDef<EventLogRecord>[] = [
    {
      colId: "time",
      headerName: labels.time,
      type: "dateTime",
      valueGetter: ({ data }) =>
        new Date(Number(BigInt(data.timeUnixNano) / 1_000_000n)),
    },
    {
      field: "eventName",
      headerName: labels.action,
      cellRenderer: ({ data }) => renderAction?.(data) ?? data.eventName,
    },
    {
      colId: "record",
      headerName: labels.target,
      type: "reference",
      typeOptions: {
        imageVariant: "square",
        getItem: (entry) => {
          const id = eventTextAttribute(entry, "app.audit.target.id");
          const name = eventTextAttribute(entry, "app.audit.target.name");
          return id === null
            ? null
            : {
                label: name || id,
                description: name && name !== id ? id : null,
              };
        },
      },
    },
    {
      colId: "actor",
      headerName: labels.actor,
      sortable: false,
      type: "reference",
      typeOptions: {
        getItem: getActor,
      },
      cellRenderer: ({ data }) => {
        const impersonatorId = eventTextAttribute(
          data,
          "app.auth.impersonator.id",
        );
        return (
          <div className="flex min-w-0 flex-col gap-1">
            <DataTableReferenceCell item={getActor(data)} />
            {impersonatorId !== null ? (
              <span className="text-muted-foreground text-xs">
                {labels.impersonatedBy}:{" "}
                {actorsByKey.get(`user:${impersonatorId}`)?.label ??
                  impersonatorId}
              </span>
            ) : null}
          </div>
        );
      },
    },
    {
      colId: "method",
      headerName: labels.method,
      sortable: false,
      valueGetter: ({ data }) => {
        const method = eventTextAttribute(data, "app.auth.method");
        return method === null
          ? labels.methodUnknown
          : (methods.get(method) ?? labels.methodUnknown);
      },
    },
  ];
  return (
    <section aria-label={labels.title}>
      <DataTable
        locale={locale}
        status={status}
        state={state}
        onStateChange={onStateChange}
        features={{
          pagination: { mode: "server", rowCount },
        }}
        columnDefs={columns}
        rowData={entries}
        getRowId={(entry) =>
          eventTextAttribute(entry, "log.record.uid") ??
          `${entry.timeUnixNano}:${entry.eventName}`
        }
      />
    </section>
  );
};
