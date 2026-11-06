import { useState } from "react";
import { Effect, Schema } from "effect";
import {
  CampaignForm,
  CampaignScheduleForm,
  type Campaign,
  type CampaignPage,
  type CampaignReport,
  type CampaignStatus,
  type CampaignTransition,
  type CreateCampaign,
  type ScheduleCampaign,
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

export interface SendCampaignMessages {
  readonly title: string;
  readonly description: string;
  readonly create: string;
  readonly name: string;
  readonly from: string;
  readonly subject: string;
  readonly text: string;
  readonly save: string;
  readonly manage: string;
  readonly status: string;
  readonly schedule: string;
  readonly scheduledFor: string;
  readonly pause: string;
  readonly resume: string;
  readonly cancel: string;
  readonly confirmCancel: string;
  readonly cancelDescription: string;
  readonly failed: string;
  readonly empty: string;
  readonly next: string;
  readonly previous: string;
  readonly close: string;
  readonly reporting: string;
  readonly statuses: Readonly<Record<typeof CampaignStatus.Type, string>>;
  readonly metrics: Readonly<Record<keyof typeof CampaignReport.Type, string>>;
  readonly enUnsubscribe: string;
  readonly frUnsubscribe: string;
  readonly english: string;
  readonly french: string;
}
const metricKeys = [
  "audience",
  "pending",
  "published",
  "skipped",
  "accepted",
  "failed",
  "suppressed",
  "confirmed",
  "hardBounced",
  "complained",
] satisfies ReadonlyArray<keyof typeof CampaignReport.Type>;
export interface SendCampaignAdminProps {
  readonly page: typeof CampaignPage.Type | undefined;
  readonly selected?: typeof Campaign.Type;
  readonly report?: typeof CampaignReport.Type;
  readonly pending?: boolean;
  readonly error?: string;
  readonly messages: SendCampaignMessages;
  readonly onSelect: (campaign: typeof Campaign.Type) => void;
  readonly onClose: () => void;
  readonly onCreate: (
    input: typeof CreateCampaign.Type,
  ) => Promise<typeof Campaign.Type | void>;
  readonly onSchedule: (
    input: typeof ScheduleCampaign.Type,
  ) => Promise<typeof Campaign.Type | void>;
  readonly onTransition: (
    input: typeof CampaignTransition.Type,
  ) => Promise<typeof Campaign.Type | void>;
  readonly onNext?: () => void;
  readonly onPrevious?: () => void;
}

export const SendCampaignAdmin = ({
  page,
  selected,
  report,
  pending,
  error,
  messages: m,
  onSelect,
  onClose,
  onCreate,
  onSchedule,
  onTransition,
  onNext,
  onPrevious,
}: SendCampaignAdminProps) => {
  const [creating, setCreating] = useState(false);
  const [requestId, setRequestId] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string>();
  const [initialSchedule] = useState(() => new Date().toISOString());
  const createForm = useAppForm({
    defaultValues: {
      name: "",
      from: "",
      enSubject: "",
      enText: "",
      frSubject: "",
      frText: "",
    },
    validators: { onSubmit: Schema.toStandardSchemaV1(CampaignForm) },
    onSubmit: async ({ value }) => {
      setFailure(undefined);
      try {
        await onCreate({
          requestId,
          name: value.name,
          from: value.from,
          audience: { _tag: "AllSubscribed" },
          content: {
            en: {
              subject: value.enSubject,
              text: value.enText,
              unsubscribeText: m.enUnsubscribe,
            },
            fr: {
              subject: value.frSubject,
              text: value.frText,
              unsubscribeText: m.frUnsubscribe,
            },
          },
        });
        setCreating(false);
        createForm.reset();
      } catch {
        setFailure(m.failed);
      }
    },
  });
  const scheduleForm = useAppForm({
    defaultValues: { scheduledFor: initialSchedule },
    validators: { onSubmit: Schema.toStandardSchemaV1(CampaignScheduleForm) },
    onSubmit: async ({ value }) => {
      if (!selected) return;
      setFailure(undefined);
      try {
        const decoded = await Effect.runPromise(
          Schema.decodeEffect(CampaignScheduleForm)(value),
        );
        await onSchedule({
          id: selected.id,
          scheduledFor: decoded.scheduledFor,
        });
      } catch {
        setFailure(m.failed);
      }
    },
  });
  const transition = async (
    action: (typeof CampaignTransition.Type)["action"],
  ) => {
    if (!selected) return;
    setBusy(true);
    setFailure(undefined);
    try {
      await onTransition({ id: selected.id, action });
      setConfirming(false);
    } catch {
      setFailure(m.failed);
    } finally {
      setBusy(false);
    }
  };
  const columns: DataTableColDef<typeof Campaign.Type>[] = [
    { field: "name", headerName: m.name },
    {
      field: "status",
      headerName: m.status,
      cellRenderer: ({ data }) => m.statuses[data.status],
    },
    {
      colId: "manage",
      headerName: m.manage,
      cellRenderer: ({ data }) => (
        <Button
          variant="outline"
          onClick={() => {
            setFailure(undefined);
            onSelect(data);
          }}
        >
          {m.manage}
        </Button>
      ),
    },
  ];
  return (
    <section className="space-y-4" aria-busy={pending || busy}>
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{m.title}</h1>
          <p>{m.description}</p>
        </div>
        <Button
          onClick={() => {
            setRequestId(crypto.randomUUID());
            setFailure(undefined);
            setCreating(true);
          }}
        >
          {m.create}
        </Button>
      </header>
      {(error || (failure && !creating)) && (
        <p role="alert">{error || failure}</p>
      )}
      {page &&
        (page.items.length ? (
          <DataTable
            columnDefs={columns}
            rowData={page.items}
            getRowId={(campaign) => campaign.id}
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
          <p>{m.empty}</p>
        ))}
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={onPrevious}
          disabled={!onPrevious || pending}
        >
          {m.previous}
        </Button>
        <Button
          variant="outline"
          onClick={onNext}
          disabled={!onNext || !page?.nextCursor || pending}
        >
          {m.next}
        </Button>
      </div>
      {selected && (
        <section
          aria-label={selected.name}
          className="space-y-4 rounded border p-4"
        >
          <h2>{selected.name}</h2>
          <p>{m.statuses[selected.status]}</p>
          {selected.status === "draft" && (
            <scheduleForm.AppForm>
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  void scheduleForm.handleSubmit();
                }}
                className="space-y-2"
              >
                <scheduleForm.AppField name="scheduledFor">
                  {(field) => <field.TextField label={m.scheduledFor} />}
                </scheduleForm.AppField>
                <scheduleForm.SubmitButton>
                  {m.schedule}
                </scheduleForm.SubmitButton>
              </form>
            </scheduleForm.AppForm>
          )}
          <div className="flex gap-2">
            {["scheduled", "running", "completed"].includes(
              selected.status,
            ) && (
              <Button
                disabled={pending || busy}
                onClick={() => void transition("pause")}
              >
                {m.pause}
              </Button>
            )}
            {selected.status === "paused" && (
              <Button
                disabled={pending || busy}
                onClick={() => void transition("resume")}
              >
                {m.resume}
              </Button>
            )}
            {selected.status !== "cancelled" && (
              <Button
                variant="destructive"
                disabled={pending || busy}
                onClick={() => setConfirming(true)}
              >
                {m.cancel}
              </Button>
            )}
            <Button variant="outline" onClick={onClose}>
              {m.close}
            </Button>
          </div>
          {report && (
            <div>
              <h3>{m.reporting}</h3>
              <dl>
                {metricKeys.map((key) => (
                  <div key={key} className="flex justify-between gap-4">
                    <dt>{m.metrics[key]}</dt>
                    <dd>{report[key]}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </section>
      )}
      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{m.create}</DialogTitle>
          </DialogHeader>
          <createForm.AppForm>
            <form
              className="space-y-3"
              onSubmit={(event) => {
                event.preventDefault();
                void createForm.handleSubmit();
              }}
            >
              <createForm.AppField name="name">
                {(field) => <field.TextField label={m.name} />}
              </createForm.AppField>
              <createForm.AppField name="from">
                {(field) => <field.TextField label={m.from} type="email" />}
              </createForm.AppField>
              <fieldset>
                <legend>{m.english}</legend>
                <createForm.AppField name="enSubject">
                  {(field) => <field.TextField label={m.subject} />}
                </createForm.AppField>
                <createForm.AppField name="enText">
                  {(field) => <field.TextAreaField label={m.text} />}
                </createForm.AppField>
              </fieldset>
              <fieldset>
                <legend>{m.french}</legend>
                <createForm.AppField name="frSubject">
                  {(field) => <field.TextField label={m.subject} />}
                </createForm.AppField>
                <createForm.AppField name="frText">
                  {(field) => <field.TextAreaField label={m.text} />}
                </createForm.AppField>
              </fieldset>
              {failure && <p role="alert">{failure}</p>}
              <createForm.SubmitButton>{m.save}</createForm.SubmitButton>
            </form>
          </createForm.AppForm>
        </DialogContent>
      </Dialog>
      <Dialog open={confirming} onOpenChange={setConfirming}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{m.confirmCancel}</DialogTitle>
          </DialogHeader>
          <p>{m.cancelDescription}</p>
          {failure && <p role="alert">{failure}</p>}
          <Button
            variant="destructive"
            disabled={busy}
            onClick={() => void transition("cancel")}
          >
            {m.confirmCancel}
          </Button>
        </DialogContent>
      </Dialog>
    </section>
  );
};
