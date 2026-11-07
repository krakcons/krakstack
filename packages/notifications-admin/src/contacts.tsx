import { useState } from "react";
import { Schema } from "effect";
import {
  CreateContact,
  type Contact,
  type ContactPage,
  type EmailConsentEvent,
  type ConsentEventPage,
} from "@krak-stack/notifications/admin/schema";

import { Button } from "@/components/ui/button";
import {
  DataTable,
  type DataTableColDef,
} from "@krak-stack/registry/data-table";
import type { DataTableProps } from "@krak-stack/registry/data-table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAppForm } from "@krak-stack/registry/form";

export {
  SendContacts as NotificationContacts,
  SendContactDetails as NotificationContactDetails,
};
export type {
  SendContactsProps as NotificationContactsProps,
  SendContactsMessages as NotificationContactsMessages,
};

export interface SendContactsMessages {
  readonly title: string;
  readonly description: string;
  readonly create: string;
  readonly name: string;
  readonly email: string;
  readonly consent: string;
  readonly unknown: string;
  readonly subscribed: string;
  readonly unsubscribed: string;
  readonly withdraw: string;
  readonly save: string;
  readonly savingFailed: string;
  readonly loading: string;
  readonly empty: string;
  readonly previous: string;
  readonly next: string;
}

export interface SendContactsProps {
  readonly table?: Pick<
    DataTableProps<Contact>,
    "state" | "onStateChange" | "features" | "status"
  >;
  readonly page: typeof ContactPage.Type | undefined;
  readonly pending?: boolean;
  readonly error?: string;
  readonly messages: SendContactsMessages;
  readonly defaultContactLocale: "en" | "fr";
  readonly onCreate: (input: CreateContact) => Promise<Contact | void>;
  readonly onWithdraw: (
    contact: Contact,
  ) => Promise<typeof EmailConsentEvent.Type | void>;
  readonly inspection?: {
    readonly label: string;
    readonly onSelect: (contact: Contact) => void;
  };
}

// Data and mutation ownership stays with the host. Mount only behind the host's
// admin guard and use the protected API; this view confers no authorization.
export const SendContacts = ({
  page,
  pending,
  error,
  messages,
  defaultContactLocale,
  onCreate,
  onWithdraw,
  inspection,
  table,
}: SendContactsProps) => {
  const [creating, setCreating] = useState(false);
  const [withdrawing, setWithdrawing] = useState<string>();
  const [failure, setFailure] = useState<string>();
  const defaultValues: CreateContact = {
    name: "",
    email: "",
    locale: defaultContactLocale,
  };
  const form = useAppForm({
    defaultValues,
    validators: { onSubmit: Schema.toStandardSchemaV1(CreateContact) },
    onSubmit: async ({ value }) => {
      setFailure(undefined);
      try {
        await onCreate(value);
        setCreating(false);
        form.reset();
      } catch {
        setFailure(messages.savingFailed);
      }
    },
  });
  const columns: DataTableColDef<Contact>[] = [
    { field: "name", headerName: messages.name },
    { field: "email", headerName: messages.email },
    {
      field: "emailConsent",
      headerName: messages.consent,
      filterOptions: (["unknown", "subscribed", "unsubscribed"] as const).map(
        (value) => ({ value, label: messages[value] }),
      ),
      cellRenderer: ({ data }) => messages[data.emailConsent],
    },
    {
      colId: "withdraw",
      sortable: false,
      filterable: false,
      searchable: false,
      hideable: false,
      headerName: messages.withdraw,
      cellRenderer: ({ data }) => (
        <Button
          variant="outline"
          size="sm"
          disabled={
            Boolean(withdrawing) ||
            pending ||
            data.emailConsent === "unsubscribed"
          }
          onClick={async () => {
            setFailure(undefined);
            setWithdrawing(data.id);
            try {
              await onWithdraw(data);
            } catch {
              setFailure(messages.savingFailed);
            } finally {
              setWithdrawing(undefined);
            }
          }}
        >
          {messages.withdraw}
        </Button>
      ),
    },
  ];
  if (inspection)
    columns.push({
      colId: "inspect",
      sortable: false,
      filterable: false,
      searchable: false,
      hideable: false,
      headerName: inspection.label,
      cellRenderer: ({ data }) => (
        <Button variant="outline" onClick={() => inspection.onSelect(data)}>
          {inspection.label}
        </Button>
      ),
    });
  return (
    <section className="space-y-4" aria-busy={pending}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{messages.title}</h1>
          <p className="text-muted-foreground">{messages.description}</p>
        </div>
        <Button
          onClick={() => {
            setFailure(undefined);
            setCreating(true);
          }}
        >
          {messages.create}
        </Button>
      </div>
      {(error || failure) && <p role="alert">{error || failure}</p>}
      <DataTable
        columnDefs={columns}
        rowData={page?.items ?? []}
        getRowId={(contact) => contact.id}
        features={{ pagination: { mode: "client" } }}
        status={{ loading: pending, error }}
        {...table}
      />
      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{messages.create}</DialogTitle>
          </DialogHeader>
          <form.AppForm>
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                void form.handleSubmit();
              }}
            >
              <form.AppField name="email">
                {(field) => (
                  <field.TextField label={messages.email} type="email" />
                )}
              </form.AppField>
              <form.AppField name="name">
                {(field) => <field.TextField label={messages.name} />}
              </form.AppField>
              {failure && <p role="alert">{failure}</p>}
              <form.SubmitButton>{messages.save}</form.SubmitButton>
            </form>
          </form.AppForm>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export interface SendContactDetailsMessages {
  readonly title: string;
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly locale: string;
  readonly consent: string;
  readonly created: string;
  readonly updated: string;
  readonly requestId: string;
  readonly status: string;
  readonly source: string;
  readonly actor: string;
  readonly noticeVersion: string;
  readonly occurred: string;
  readonly previous: string;
  readonly next: string;
  readonly close: string;
  readonly activity: string;
  readonly states: Readonly<Record<Contact["emailConsent"], string>>;
}
export const SendContactDetails = ({
  contact,
  history,
  messages: m,
  error,
  onClose,
  onActivity,
  table,
}: {
  contact: Contact | undefined;
  history: typeof ConsentEventPage.Type | undefined;
  table?: Pick<
    DataTableProps<typeof EmailConsentEvent.Type>,
    "state" | "onStateChange" | "features" | "status"
  >;
  messages: SendContactDetailsMessages;
  error?: string;
  onClose: () => void;
  onActivity: (id: string) => void;
}) => (
  <section className="space-y-4">
    <h2 className="text-xl font-semibold">{m.title}</h2>
    {error && <p role="alert">{error}</p>}
    {contact && (
      <>
        <dl className="grid gap-2 sm:grid-cols-2">
          {[
            [m.id, contact.id],
            [m.email, contact.email],
            [m.name, contact.name],
            [m.locale, contact.locale],
            [m.consent, m.states[contact.emailConsent]],
            [m.created, contact.createdAt.toLocaleString()],
            [m.updated, contact.updatedAt.toLocaleString()],
          ].map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
        <Button variant="outline" onClick={() => onActivity(contact.id)}>
          {m.activity}
        </Button>
      </>
    )}
    <DataTable
      rowData={history?.items ?? []}
      getRowId={(event) => event.requestId}
      features={{ pagination: { mode: "client" } }}
      {...table}
      columnDefs={[
        { field: "requestId", headerName: m.requestId },
        {
          field: "status",
          headerName: m.status,
          cellRenderer: ({ data }) => m.states[data.status],
        },
        { field: "source", headerName: m.source },
        { field: "actor", headerName: m.actor },
        { field: "noticeVersion", headerName: m.noticeVersion },
        {
          field: "occurredAt",
          type: "date",
          headerName: m.occurred,
          cellRenderer: ({ data }) => data.occurredAt.toLocaleString(),
        },
      ]}
    />
    <div className="flex gap-2">
      <Button variant="outline" onClick={onClose}>
        {m.close}
      </Button>
    </div>
  </section>
);
