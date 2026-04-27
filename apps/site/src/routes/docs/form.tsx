import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppForm } from "@/components/form";
import { InstallCommand } from "@/components/install-command";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/docs/form")({ component: FormDocs });

const interestOptions = [
  { label: "Forms", value: "forms" },
  { label: "Tables", value: "tables" },
  { label: "Localization", value: "localization" },
  { label: "Registry", value: "registry" },
];

const planOptions = [
  { label: "Starter", value: "starter" },
  { label: "Growth", value: "growth" },
  { label: "Enterprise", value: "enterprise" },
];

type FormValues = {
  name: string;
  email: string;
  plan: string;
  interests: string[];
  notes: string;
  metadata: Record<string, string>;
  acceptedTerms: boolean;
  attachment: File | "";
  heroImage: File | null;
};

function FormDocs() {
  const [submitted, setSubmitted] = useState<Record<string, unknown> | null>(null);
  const form = useAppForm({
    defaultValues: {
      name: "Ada Lovelace",
      email: "ada@example.com",
      plan: "growth",
      interests: ["forms", "tables"],
      notes: "Show me a workflow with reusable fields and guarded navigation.",
      metadata: {
        source: "docs",
        priority: "high",
      },
      acceptedTerms: true,
      attachment: "",
      heroImage: null,
    } as FormValues,
    onSubmit: async ({ value }) => {
      setSubmitted({
        ...value,
        attachment: value.attachment instanceof File ? value.attachment.name : "No file selected",
        heroImage: value.heroImage instanceof File ? value.heroImage.name : "No image selected",
      });
    },
  });

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <section className="grid min-w-0 gap-3">
        <p className="text-sm font-semibold tracking-[0.24em] text-[var(--kicker)] uppercase">
          Components
        </p>
        <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-end">
          <div className="grid min-w-0 gap-3">
            <h1 className="font-serif text-4xl font-bold tracking-tight text-[var(--sea-ink)] sm:text-5xl">
              Form
            </h1>
            <p className="max-w-2xl text-lg text-[var(--sea-ink-soft)]">
              A working demo of the app form hook, field wrappers, text inputs, text areas,
              select controls, multi-select controls, key/value editing, file uploads, submit state,
              and navigation blocking for dirty forms.
            </p>
          </div>
          <Card className="bg-[var(--surface-strong)]">
            <CardHeader>
              <CardTitle>Try it</CardTitle>
              <CardDescription>
                Change a field, submit the form, or navigate away to see the guard.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      <InstallCommand slug="form" />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <Card className="bg-[var(--surface-strong)]">
          <CardHeader>
            <CardTitle>Lead Capture</CardTitle>
            <CardDescription>
              This form uses the exported field and form components from `useAppForm`.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form.AppForm>
              <form
                className="grid gap-8"
                onSubmit={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  void form.handleSubmit();
                }}
              >
                <form.FieldWrapper
                  description="Core contact details with text, select, and multi-select fields."
                  legend="Profile"
                  localized={false}
                >
                  <form.AppField name="name">
                    {(field) => <field.TextField label="Name" placeholder="Ada Lovelace" />}
                  </form.AppField>
                  <form.AppField name="email">
                    {(field) => (
                      <field.TextField
                        description="Used only for this demonstration."
                        label="Email"
                        placeholder="ada@example.com"
                        type="email"
                      />
                    )}
                  </form.AppField>
                  <form.AppField name="plan">
                    {(field) => (
                      <field.SelectField
                        description="SelectField stores a single string value."
                        label="Plan"
                        options={planOptions}
                      />
                    )}
                  </form.AppField>
                  <form.AppField name="interests">
                    {(field) => (
                      <field.MultiSelectField
                        description="MultiSelectField stores an array of string values."
                        label="Interests"
                        options={interestOptions}
                        placeholder="Pick interests"
                      />
                    )}
                  </form.AppField>
                </form.FieldWrapper>

                <form.FieldWrapper
                  description="Compound fields can be composed in the same wrapper."
                  legend="Details"
                  localized={false}
                >
                  <form.AppField name="notes">
                    {(field) => (
                      <field.TextAreaField
                        label="Notes"
                        placeholder="What should the team know?"
                        rows={4}
                      />
                    )}
                  </form.AppField>
                  <form.AppField name="metadata">
                    {(field) => (
                      <field.KeyValueField
                        description="Add, edit, or remove arbitrary metadata pairs."
                        label="Metadata"
                      />
                    )}
                  </form.AppField>
                  <form.AppField name="attachment">
                    {(field) => <field.FileField accept=".pdf,.txt" label="Attachment" />}
                  </form.AppField>
                  <form.AppField name="heroImage">
                    {(field) => (
                      <field.ImageField
                        label="Preview image"
                        size={{ width: 192, height: 108, suggestedWidth: 1280, suggestedHeight: 720 }}
                      />
                    )}
                  </form.AppField>
                  <form.AppField name="acceptedTerms">
                    {(field) => (
                      <field.CheckboxField
                        description="CheckboxField stores a boolean value."
                        label="I agree to be contacted about this request"
                      />
                    )}
                  </form.AppField>
                </form.FieldWrapper>

                <div className="flex flex-wrap items-center gap-3">
                  <form.SubmitButton />
                  <Button type="reset" variant="outline" onClick={() => form.reset()}>
                    Reset demo
                  </Button>
                </div>
                <form.BlockNavigation />
              </form>
            </form.AppForm>
          </CardContent>
        </Card>

        <Card className="h-fit bg-[var(--surface-strong)]">
          <CardHeader>
            <CardTitle>Submitted Value</CardTitle>
            <CardDescription>The submit handler normalizes files to displayable names.</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="overflow-auto rounded-lg border border-[var(--line)] bg-[#1d2e45] p-4 text-xs text-[#e8efff]">
              <code>{JSON.stringify(submitted ?? "Submit the form to see its value.", null, 2)}</code>
            </pre>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
