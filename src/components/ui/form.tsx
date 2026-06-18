import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createFormHook,
  createFormHookContexts,
  useStore,
} from "@tanstack/react-form";
import { Block } from "@tanstack/react-router";
import { Loader2, Plus, Trash, Languages } from "lucide-react";
import type { InputHTMLAttributes, JSX } from "react";
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
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { getLocale } from "@/paraglide/runtime";

export type FormMessages = {
  keyValueKey: string;
  keyValueValue: string;
  keyValueDelete: string;
  keyValueAdd: string;
  accepts: (accepts: string) => string;
  delete: string;
  suggestedImageSize: (width: string, height: string) => string;
  blockNavigationTitle: string;
  blockNavigationDescription: string;
  blockNavigationCancel: string;
  blockNavigationConfirm: string;
  submit: string;
  revert: string;
};

const messages = {
  en: {
    keyValueKey: "Key",
    keyValueValue: "Value",
    keyValueDelete: "Delete",
    keyValueAdd: "Add",
    accepts: (accepts: string) => `Accepts: ${accepts}`,
    delete: "Delete",
    suggestedImageSize: (width: string, height: string) =>
      `Suggested image size: ${width} x ${height}`,
    blockNavigationTitle: "Leave without saving?",
    blockNavigationDescription:
      "Your changes have not been saved. If you leave, you will lose your changes.",
    blockNavigationCancel: "Cancel",
    blockNavigationConfirm: "Confirm",
    submit: "Submit",
    revert: "Revert to default",
  },
  fr: {
    keyValueKey: "Clé",
    keyValueValue: "Valeur",
    keyValueDelete: "Supprimer",
    keyValueAdd: "Ajouter",
    accepts: (accepts: string) => `Accepte : ${accepts}`,
    delete: "Supprimer",
    suggestedImageSize: (width: string, height: string) =>
      `Taille de l'image suggérée : ${width} x ${height}`,
    blockNavigationTitle: "Quitter sans sauvegarder?",
    blockNavigationDescription:
      "Vos modifications n'ont pas été sauvegardés. Si vous quittez, vous perdrez vos modifications.",
    blockNavigationCancel: "Annuler",
    blockNavigationConfirm: "Confirmer",
    submit: "Soumettre",
    revert: "Revenir aux paramètres par défaut",
  },
} as const satisfies Record<"en" | "fr", FormMessages>;

export type FormMessageOverrides = Partial<FormMessages>;

export const formMessages = (overrides?: FormMessageOverrides) => ({
  ...(getLocale().startsWith("fr") ? messages.fr : messages.en),
  ...overrides,
});

export const ErrorMessage = ({ text }: { text: string }) => {
  return (
    <em role="alert" className="text-destructive text-sm">
      {text}
    </em>
  );
};

export function FieldError({ errors = [] }: { errors?: any[] }) {
  return errors?.length > 0 ? (
    <ErrorMessage
      text={errors
        .map((error) => {
          return error.message
            ?.toString()
            .split(" ")
            .map((word: string) => {
              if (word.startsWith("t:")) return word.slice(2);
              return word;
            })
            .join(" ");
        })
        .join(", ")}
    />
  ) : null;
}

const { fieldContext, useFieldContext, formContext, useFormContext } =
  createFormHookContexts();

export type DefaultFormOptions = {
  legend?: string;
  description?: string;
};
export type DefaultOptions = {
  label: JSX.Element | string;
  description?: string;
};

const TextField = ({
  children,
  ...props
}: React.ComponentProps<"input"> & DefaultOptions) => {
  const field = useFieldContext<string>();
  const invalid = !field.state.meta.isValid;

  return (
    <Field data-invalid={invalid}>
      <div className="flex w-full items-center gap-2">
        <FieldLabel htmlFor={field.name}>{props.label}</FieldLabel>
        {children}
      </div>
      <Input
        id={field.name}
        value={field.state.value ?? ""}
        onChange={(e) => field.handleChange(e.target.value)}
        {...props}
        aria-invalid={invalid}
      />
      {props.description && (
        <FieldDescription>{props.description}</FieldDescription>
      )}
      <FieldError errors={field.getMeta().errors} />
    </Field>
  );
};

const TextAreaField = ({
  children,
  ...props
}: React.ComponentProps<"textarea"> & DefaultOptions) => {
  const field = useFieldContext<string>();
  const invalid = !field.state.meta.isValid;

  return (
    <Field data-invalid={invalid}>
      <div className="flex w-full items-center gap-2">
        <FieldLabel htmlFor={field.name}>{props.label}</FieldLabel>
        {children}
      </div>
      <Textarea
        id={field.name}
        value={field.state.value ?? ""}
        onChange={(e) => field.handleChange(e.target.value)}
        {...props}
        aria-invalid={invalid}
      />
      {props.description && (
        <FieldDescription>{props.description}</FieldDescription>
      )}
      <FieldError errors={field.getMeta().errors} />
    </Field>
  );
};

const CheckboxField = (props: DefaultOptions) => {
  const field = useFieldContext<boolean>();
  const invalid = !field.state.meta.isValid;

  return (
    <Field data-invalid={invalid}>
      <div className="flex flex-row items-center gap-2">
        <Checkbox
          id={field.name}
          name={field.name}
          checked={field.state.value ?? false}
          onBlur={field.handleBlur}
          onCheckedChange={(checked: boolean) => field.handleChange(checked)}
          aria-invalid={invalid}
        />
        <FieldLabel htmlFor={field.name}>{props.label}</FieldLabel>
      </div>
      {props.description && (
        <FieldDescription>{props.description}</FieldDescription>
      )}
      <FieldError errors={field.getMeta().errors} />
    </Field>
  );
};

const SelectField = ({
  options,
  ...props
}: DefaultOptions & {
  options: {
    label: string;
    value: string;
  }[];
}) => {
  const field = useFieldContext<string>();
  const invalid = !field.state.meta.isValid;

  return (
    <Field data-invalid={invalid}>
      <FieldLabel htmlFor={field.name}>{props.label}</FieldLabel>
      <Select
        items={options}
        required
        onValueChange={(value) => field.handleChange(value ?? "")}
        defaultValue={field.state.value}
      >
        <SelectTrigger className="gap-1" id={field.name} aria-invalid={invalid}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {options.map((option) => (
              <SelectItem key={option.label} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      {props.description && (
        <FieldDescription>{props.description}</FieldDescription>
      )}
      <FieldError errors={field.getMeta().errors} />
    </Field>
  );
};

const KeyValueField = (
  props: DefaultOptions & { messages?: FormMessageOverrides },
) => {
  const labels = formMessages(props.messages);
  const field = useFieldContext<Record<string, string>>();
  const invalid = !field.state.meta.isValid;

  const keyValues = Object.entries(field.state.value ?? {});

  const updateKeyValue = (key: string, value: string, index: number) => {
    return Object.fromEntries(
      Object.entries(field.state.value).map(([k, v], i) => {
        if (index === i) {
          return [key, value];
        }
        return [k, v];
      }),
    );
  };

  const deleteKeyValue = (index: number) => {
    return Object.fromEntries(
      Object.entries(field.state.value).filter((_, i) => {
        if (index === i) {
          return false;
        }
        return true;
      }),
    );
  };

  return (
    <Field data-invalid={invalid}>
      <FieldLabel htmlFor={field.name}>{props.label}</FieldLabel>
      {keyValues.map(([key, value], index) => (
        <div key={index} className="flex w-full flex-row items-center gap-2">
          <Input
            id={field.name}
            placeholder={labels.keyValueKey}
            name={field.name}
            type="text"
            className="w-auto"
            value={key}
            onChange={(e) => {
              field.handleChange(updateKeyValue(e.target.value, value, index));
            }}
          />
          <Input
            id={field.name}
            name={field.name}
            type="text"
            className="w-auto flex-1"
            placeholder={labels.keyValueValue}
            value={value}
            onChange={(e) => {
              field.handleChange(updateKeyValue(key, e.target.value, index));
            }}
          />
          <Button
            type="button"
            variant="secondary"
            onClick={(e) => {
              e.preventDefault();
              field.handleChange(deleteKeyValue(index));
            }}
          >
            <Trash />
            {labels.keyValueDelete}
          </Button>
        </div>
      ))}
      <div className="flex flex-row items-center gap-2">
        <Button
          size="sm"
          className="mt-2"
          onClick={(e) => {
            e.preventDefault();
            field.setValue({
              ...field.state.value,
              "": "",
            });
          }}
        >
          <Plus />
          {labels.keyValueAdd}
        </Button>
      </div>
      {props.description && (
        <FieldDescription>{props.description}</FieldDescription>
      )}
      <FieldError errors={field.getMeta().errors} />
    </Field>
  );
};

const MultiSelectField = ({
  options,
  ...props
}: DefaultOptions & {
  options: {
    label: string;
    value: string;
  }[];
  placeholder?: string;
}) => {
  const field = useFieldContext<string[]>();
  const invalid = !field.state.meta.isValid;

  return (
    <Field data-invalid={invalid}>
      <FieldLabel htmlFor={field.name}>{props.label}</FieldLabel>
      <Select
        items={options}
        onValueChange={(value) => field.handleChange(value ?? [])}
        multiple
        value={field.state.value ?? []}
      >
        <SelectTrigger className="gap-1" id={field.name} aria-invalid={invalid}>
          <SelectValue placeholder={props.placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {options.map((option) => (
              <SelectItem key={option.label} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      {props.description && (
        <FieldDescription>{props.description}</FieldDescription>
      )}
      <FieldError errors={field.getMeta().errors} />
    </Field>
  );
};

const FileField = ({
  label,
  accept,
  messages,
  required = false,
}: Omit<DefaultOptions, "description"> & {
  accept: InputHTMLAttributes<HTMLInputElement>["accept"];
  messages?: FormMessageOverrides;
  required?: boolean;
}) => {
  const labels = formMessages(messages);
  const field = useFieldContext<File | "">();
  const invalid = !field.state.meta.isValid;

  return (
    <Field data-invalid={invalid}>
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      <Input
        id={field.name}
        name={field.name}
        type="file"
        accept={accept}
        onChange={(event) => {
          field.handleChange(event.target.files ? event.target.files[0] : "");
        }}
        required={required}
        aria-invalid={invalid}
      />
      <FieldDescription>{labels.accepts(accept as string)}</FieldDescription>
      <FieldError errors={field.getMeta().errors} />
    </Field>
  );
};

const ImageField = ({
  label,
  defaultImageUrl,
  messages,
  size,
}: {
  label: string;
  defaultImageUrl?: string;
  messages?: FormMessageOverrides;
  size: {
    width: number;
    height: number;
    suggestedWidth?: number;
    suggestedHeight?: number;
  };
}) => {
  const labels = formMessages(messages);
  const { width, height } = size;
  const field = useFieldContext<File | string | null>();
  const invalid = !field.state.meta.isValid;

  const imageUrl =
    field.state.value instanceof File
      ? URL.createObjectURL(field.state.value).toString()
      : (field.state.value ?? defaultImageUrl);

  return (
    <Field data-invalid={invalid}>
      <Label htmlFor={field.name} className="flex-col items-start">
        {label}
        {imageUrl ? (
          <img
            src={imageUrl}
            height={height}
            style={{
              maxHeight: size.height,
            }}
            alt={label}
            className="rounded-md border"
          />
        ) : (
          <div
            className="bg-muted rounded-md"
            style={{
              width,
              height,
            }}
          />
        )}
      </Label>
      <div className="flex items-center gap-2">
        <Input
          id={field.name}
          name={field.name}
          type="file"
          accept="image/*"
          onChange={(event) => {
            field.handleChange(
              event.target.files ? event.target.files[0] : null,
            );
          }}
          aria-invalid={invalid}
        />
        {field.state.value && (
          <Button
            type="button"
            variant="secondary"
            onClick={(e) => {
              e.preventDefault();
              field.handleChange(null);
            }}
          >
            {labels.delete}
          </Button>
        )}
      </div>
      {size.suggestedWidth && size.suggestedHeight && (
        <FieldDescription>
          {labels.suggestedImageSize(
            String(size.suggestedWidth),
            String(size.suggestedHeight),
          )}
        </FieldDescription>
      )}
      <FieldError errors={field.getMeta().errors} />
    </Field>
  );
};

export const BlockNavigation = ({
  messages,
}: {
  messages?: FormMessageOverrides;
}) => {
  const labels = formMessages(messages);
  const form = useFormContext();
  const shouldBlock = useStore(
    form.store,
    (formState) =>
      formState.isDirty && !(formState.isSubmitting || formState.isSubmitted),
  );

  return (
    <Block
      enableBeforeUnload={() => shouldBlock}
      shouldBlockFn={() => shouldBlock}
      withResolver
    >
      {({ status, proceed, reset }) => (
        <AlertDialog open={status === "blocked"}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{labels.blockNavigationTitle}</AlertDialogTitle>
              <AlertDialogDescription>
                {labels.blockNavigationDescription}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={reset}>
                {labels.blockNavigationCancel}
              </AlertDialogCancel>
              <AlertDialogAction onClick={proceed}>
                {labels.blockNavigationConfirm}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </Block>
  );
};

const SubmitButton = ({
  children,
  messages,
}: {
  children?: React.ReactNode;
  messages?: FormMessageOverrides;
}) => {
  const labels = formMessages(messages);
  const form = useFormContext();
  return (
    <form.Subscribe selector={(formState) => [formState.isSubmitting]}>
      {([isSubmitting]) => (
        <Button type="submit" disabled={isSubmitting} className="self-start">
          {isSubmitting && <Loader2 className="animate-spin" />}
          {children ?? labels.submit}
        </Button>
      )}
    </form.Subscribe>
  );
};

const getFormErrorText = (error: unknown) => {
  if (!error) return undefined;

  if (typeof error === "object" && "form" in error) {
    const formError = error.form;
    return formError ? String(formError) : undefined;
  }

  return String(error);
};

const FormError = () => {
  const form = useFormContext();
  return (
    <form.Subscribe
      selector={(formState) => getFormErrorText(formState.errorMap.onSubmit)}
    >
      {(error) => (error ? <ErrorMessage text={error} /> : null)}
    </form.Subscribe>
  );
};

export const FieldWrapper = ({
  children,
  legend,
  localized = true,
  description,
  locales,
  editingLocale,
}: {
  children: React.ReactNode;
} & DefaultFormOptions & {
    localized?: boolean;
    editingLocale?: string;
    locales?: {
      label: string;
      value: string;
    }[];
  }) => {
  return (
    <FieldSet>
      {legend && (
        <FieldLegend className="flex items-center gap-2">
          {legend}
          {localized && editingLocale && locales && (
            <Badge variant="outline">
              <Languages />
              {locales.find((l) => l.value === editingLocale)!.label}
            </Badge>
          )}
        </FieldLegend>
      )}
      {description && <FieldDescription>{description}</FieldDescription>}
      <FieldGroup>{children}</FieldGroup>
    </FieldSet>
  );
};

const RevertButton = ({
  messages,
  original,
}: {
  messages?: FormMessageOverrides;
  original: string;
}) => {
  const labels = formMessages(messages);
  const field = useFieldContext<string>();

  if (field.state.value !== original) {
    return (
      <div className="flex flex-1 justify-end">
        <Button
          variant="link"
          className="-mr-4 h-auto py-0"
          onClick={() => field.handleChange(original)}
        >
          {labels.revert}
        </Button>
      </div>
    );
  }
};

const { useAppForm, withForm, withFieldGroup } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {
    TextField,
    TextAreaField,
    SelectField,
    MultiSelectField,
    CheckboxField,
    FileField,
    KeyValueField,
    ImageField,
    RevertButton,
  },
  formComponents: {
    SubmitButton,
    FormError,
    FieldWrapper,
    BlockNavigation,
  },
});

export { useAppForm, withForm, withFieldGroup };
