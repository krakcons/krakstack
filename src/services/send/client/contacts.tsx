import { useState } from "react";
import { Schema } from "effect";
import {
  CreateContact,
  type Contact,
  type ContactPage,
  type EmailConsentEvent,
} from "@krak-stack/send/schema";

import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColDef } from "@/components/ui/data-table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAppForm } from "@/components/ui/form";

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
  readonly page: typeof ContactPage.Type | undefined;
  readonly pending?: boolean;
  readonly error?: string;
  readonly messages: SendContactsMessages;
  readonly defaultContactLocale: "en" | "fr";
  readonly onCreate: (input: CreateContact) => Promise<Contact | void>;
  readonly onWithdraw: (
    contact: Contact,
  ) => Promise<typeof EmailConsentEvent.Type | void>;
  readonly onNext?: () => void;
  readonly onPrevious?: () => void;
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
  onNext,
  onPrevious,
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
      cellRenderer: ({ data }) => messages[data.emailConsent],
    },
    {
      colId: "withdraw",
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
      {page ? (
        page.items.length ? (
          <DataTable
            columnDefs={columns}
            rowData={page.items}
            getRowId={(contact) => contact.id}
            features={{
              toolbar: false,
              search: false,
              filtering: false,
              sorting: false,
              pagination: false,
              columnVisibility: false,
            }}
          />
        ) : (
          <p>{messages.empty}</p>
        )
      ) : pending ? (
        <p role="status">{messages.loading}</p>
      ) : null}
      <div className="flex gap-2">
        <Button
          variant="outline"
          disabled={!onPrevious || pending}
          onClick={onPrevious}
        >
          {messages.previous}
        </Button>
        <Button
          variant="outline"
          disabled={!page?.nextCursor || !onNext || pending}
          onClick={onNext}
        >
          {messages.next}
        </Button>
      </div>
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
