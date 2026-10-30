import type { ReactNode } from "react";
import {
  DataTable,
  DataTableReferenceCell,
  type DataTableColDef,
  type DataTableStatus,
  type DataTableReferenceItem,
} from "@/components/ui/data-table";
import { useKrakstackLocale } from "@/components/ui/krakstack-provider";
import type { EventLogRecord, EventQuery } from "../schema";
import { eventTextAttribute } from "../record";

const translations = {
  en: {
    title: "Activity history",
    event: "Action",
    allEvents: "All actions",
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
    title: "Historique d’activité",
    event: "Action",
    allEvents: "Toutes les actions",
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
export type AuditLogTableProps = DataTableStatus & {
  /** Full application-owned event catalog, with localized display labels. */
  events?: readonly { value: string; label: string }[];
  state?: EventQuery;
  onStateChange?: (state: EventQuery) => void;
  entries: readonly EventLogRecord[];
  /** Total matching records from the query response; paging lives in state. */
  rowCount: number;
  /** Display time zone for the dateTime column. Defaults to America/New_York. */
  timeZone?: string;
  /** Overrides the shared KrakstackProvider locale when supplied. */
  locale?: string;
  messages?: Readonly<Record<string, Partial<AuditLogMessages>>>;
  renderAction?: (entry: EventLogRecord) => ReactNode;
};

export const AuditLogTable = ({
  entries,
  events = [],
  rowCount,
  timeZone = "America/New_York",
  locale: localeOverride,
  messages,
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
  const tableState: EventQuery | undefined =
    state?.eventName &&
    !state.filters?.some((filter) => filter.id === "eventName")
      ? {
          ...state,
          filters: [
            ...(state.filters ?? []),
            { id: "eventName", kind: "values", values: [state.eventName] },
          ],
        }
      : state;
  const getActor = (entry: EventLogRecord): DataTableReferenceItem => {
    const type = eventTextAttribute(entry, "app.actor.type");
    const id =
      eventTextAttribute(entry, "app.actor.id") ??
      eventTextAttribute(entry, "user.id");
    if (type === "organization") {
      return { label: labels.actorOrganization, description: id };
    }
    if (type === "user" || eventTextAttribute(entry, "user.id") !== null) {
      const fullName = eventTextAttribute(entry, "user.full_name");
      const name = eventTextAttribute(entry, "user.name");
      const email = eventTextAttribute(entry, "user.email");
      return {
        label: fullName || name || email || labels.actorMember,
        description: fullName || name ? email || id : id,
      };
    }
    return { label: type ?? labels.actor, description: id };
  };
  const columns: DataTableColDef<EventLogRecord>[] = [
    {
      colId: "time",
      headerName: labels.time,
      type: "dateTime",
      typeOptions: { timeZone },
      valueGetter: ({ data }) =>
        new Date(Number(BigInt(data.timeUnixNano) / 1_000_000n)),
    },
    {
      field: "eventName",
      headerName: labels.action,
      filterOptions: events,
      cellRenderer: ({ data }) =>
        renderAction?.(data) ??
        events.find((event) => event.value === data.eventName)?.label ??
        data.eventName,
    },
    {
      colId: "record",
      headerName: labels.target,
      filterValueGetter: ({ data }) =>
        [
          eventTextAttribute(data, "app.audit.target.name") ?? "",
          eventTextAttribute(data, "app.audit.target.type") ?? "",
          eventTextAttribute(data, "app.audit.target.id") ?? "",
        ].join(" "),
      type: "reference",
      typeOptions: {
        imageVariant: "square",
        getItem: (entry) => {
          const id = eventTextAttribute(entry, "app.audit.target.id");
          const name = eventTextAttribute(entry, "app.audit.target.name");
          const type = eventTextAttribute(entry, "app.audit.target.type");
          return id === null
            ? null
            : {
                label: name && name !== id ? name : type || labels.target,
                description:
                  name && name !== id && type ? `${type} · ${id}` : id,
              };
        },
      },
    },
    {
      colId: "actor",
      headerName: labels.actor,
      filterValueGetter: ({ data }) =>
        [
          eventTextAttribute(data, "user.full_name") ||
            eventTextAttribute(data, "user.name") ||
            eventTextAttribute(data, "user.email") ||
            eventTextAttribute(data, "app.actor.type") ||
            "",
          eventTextAttribute(data, "user.email") ?? "",
          eventTextAttribute(data, "app.actor.id") ??
            eventTextAttribute(data, "user.id") ??
            "",
        ].join(" "),
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
                {labels.impersonatedBy}: {impersonatorId}
              </span>
            ) : null}
          </div>
        );
      },
    },
    {
      colId: "method",
      headerName: labels.method,
      filterOptions: [
        { value: "session", label: labels.methodSession },
        { value: "api_key", label: labels.methodApiKey },
        { value: "unknown", label: labels.methodUnknown },
      ],
      filterValueGetter: ({ data }) => {
        const method = eventTextAttribute(data, "app.auth.method");
        return method === "session" || method === "api_key"
          ? method
          : "unknown";
      },
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
    <section aria-label={labels.title} className="flex flex-col gap-4">
      <DataTable
        locale={locale}
        status={status}
        state={tableState}
        onStateChange={
          onStateChange
            ? (next) =>
                onStateChange({
                  ...next,
                  eventName: undefined,
                })
            : undefined
        }
        features={{
          filtering: !!onStateChange,
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
