import { useAtomValue } from "@effect/atom-react";
import { FormBuilder, FormReact } from "@lucas-barake/effect-form-react";
import { Effect, Schema } from "effect";
import { useState } from "react";

import {
  CheckboxField,
  FieldWrapper,
  FileField,
  KeyValueField,
  MultiSelectField,
  SearchableSelectField,
  SelectField,
  SubmitButton,
  SubmitError,
  TextAreaField,
  TextField,
} from "@/components/ui/effect-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const options = [
  { label: "Forms", value: "forms" },
  { label: "Tables", value: "tables" },
  { label: "Localization", value: "localization" },
  { label: "Registry", value: "registry" },
];

const builder = FormBuilder.empty
  .addField("name", Schema.String)
  .addField("description", Schema.String)
  .addField("plan", Schema.String)
  .addField("interests", Schema.Array(Schema.String))
  .addField("searchableInterests", Schema.Array(Schema.String))
  .addField("metadata", Schema.Record(Schema.String, Schema.String))
  .addField("notifications", Schema.Boolean)
  .addField("attachment", Schema.UndefinedOr(Schema.instanceOf(File)));

const makeForm = () =>
  FormReact.make(builder, {
    fields: {
      name: TextField,
      description: TextAreaField,
      plan: SelectField,
      interests: MultiSelectField,
      searchableInterests: SearchableSelectField,
      metadata: KeyValueField,
      notifications: CheckboxField,
      attachment: FileField,
    },
    mode: { validation: "onSubmit" },
    onSubmit: (_, { decoded }) => Effect.succeed(decoded),
  });

export const EffectFormPreview = () => {
  const [form] = useState(makeForm);
  const submitResult = useAtomValue(form.submit);

  return (
    <Card className="bg-[var(--surface-strong)]">
      <CardHeader>
        <CardTitle>Effect Form Fields</CardTitle>
        <CardDescription>
          Schema-backed fields with Effect Atom submission and validation state.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form.Initialize
          defaultValues={{
            name: "Ada Lovelace",
            description: "A schema-backed Effect Form preview.",
            plan: "registry",
            interests: ["forms", "tables"],
            searchableInterests: ["localization"],
            metadata: { source: "docs" },
            notifications: true,
            attachment: undefined,
          }}
        >
          <div className="grid gap-8">
            <FieldWrapper
              description="Text, selection, and boolean field adapters."
              legend="Profile"
              localized={false}
            >
              <form.name label="Name" placeholder="Ada Lovelace" />
              <form.description
                label="Description"
                placeholder="Describe the workflow"
                rows={3}
              />
              <form.plan label="Primary area" options={options} />
              <form.interests
                label="Interests"
                options={options}
                placeholder="Select interests"
              />
              <form.searchableInterests
                emptyLabel="No interests found."
                items={options}
                label="Searchable interests"
                multiple
                placeholder="Search interests"
              />
              <form.notifications label="Send update notifications" />
            </FieldWrapper>

            <FieldWrapper
              description="Structured metadata and native file values."
              legend="Additional Data"
              localized={false}
            >
              <form.metadata label="Metadata" />
              <form.attachment accept=".pdf,.txt" label="Attachment" />
            </FieldWrapper>

            <SubmitError result={submitResult} />
            <SubmitButton form={form}>Submit preview</SubmitButton>
          </div>
        </form.Initialize>
      </CardContent>
    </Card>
  );
};
