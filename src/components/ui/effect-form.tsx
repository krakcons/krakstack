import { useAtomSet, useAtomValue } from "@effect/atom-react";
import type { ComponentProps, JSX, ReactNode } from "react";
import { Block } from "@tanstack/react-router";
import { FormReact } from "@lucas-barake/effect-form-react";
import { Cause, Option, Schema } from "effect";
import { AsyncResult, Atom } from "effect/unstable/reactivity";
import { Languages, Loader2, Plus, Trash } from "lucide-react";

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
import { FilePicker } from "@/components/ui/file-picker";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  VirtualizedCombobox,
  virtualizedComboboxMessages,
  type VirtualizedComboboxMessageOverrides,
  type VirtualizedComboboxOption,
} from "@/components/ui/virtualized-combobox";
import { getLocale } from "@/paraglide/runtime";

export type EffectFormMessages = {
  add: string;
  blockNavigationCancel: string;
  blockNavigationConfirm: string;
  blockNavigationDescription: string;
  blockNavigationTitle: string;
  delete: string;
  description: string;
  folder: string;
  key: string;
  name: string;
  nameRequired: string;
  revert: string;
  submit: string;
  suggestedImageSize: (width: string, height: string) => string;
  value: string;
};

const messages = {
  en: {
    add: "Add",
    blockNavigationCancel: "Cancel",
    blockNavigationConfirm: "Confirm",
    blockNavigationDescription:
      "Your changes have not been saved. If you leave, you will lose your changes.",
    blockNavigationTitle: "Leave without saving?",
    delete: "Delete",
    description: "Description",
    folder: "Folder",
    key: "Key",
    name: "Name",
    nameRequired: "Name is required",
    revert: "Revert to default",
    submit: "Submit",
    suggestedImageSize: (width: string, height: string) =>
      `Suggested image size: ${width} x ${height}`,
    value: "Value",
  },
  fr: {
    add: "Ajouter",
    blockNavigationCancel: "Annuler",
    blockNavigationConfirm: "Confirmer",
    blockNavigationDescription:
      "Vos modifications n'ont pas été sauvegardées. Si vous quittez, vous les perdrez.",
    blockNavigationTitle: "Quitter sans sauvegarder?",
    delete: "Supprimer",
    description: "Description",
    folder: "Dossier",
    key: "Clé",
    name: "Nom",
    nameRequired: "Le nom est obligatoire",
    revert: "Revenir aux paramètres par défaut",
    submit: "Soumettre",
    suggestedImageSize: (width: string, height: string) =>
      `Taille de l'image suggérée : ${width} x ${height}`,
    value: "Valeur",
  },
} as const satisfies Record<"en" | "fr", EffectFormMessages>;

export type EffectFormMessageOverrides = Partial<EffectFormMessages>;

export const effectFormMessages = (
  overrides?: EffectFormMessageOverrides,
): EffectFormMessages => ({
  ...(getLocale().startsWith("fr") ? messages.fr : messages.en),
  ...overrides,
});

const getCauseErrorMessage = (cause: Cause.Cause<unknown>) => {
  const error = Cause.squash(cause);
  return error instanceof Error ? error.message : String(error);
};

export type FieldOptions = {
  label: JSX.Element | string;
  description?: string;
  children?: ReactNode;
};

export type FieldWrapperOptions = {
  children: ReactNode;
  description?: string;
  editingLocale?: string;
  legend?: string;
  locales?: ReadonlyArray<{ label: string; value: string }>;
  localized?: boolean;
};

export const FieldWrapper = ({
  children,
  description,
  editingLocale,
  legend,
  locales,
  localized = true,
}: FieldWrapperOptions) => (
  <FieldSet>
    {legend && (
      <FieldLegend className="flex items-center gap-2">
        {legend}
        {localized && editingLocale && locales && (
          <Badge variant="outline">
            <Languages />
            {locales.find(({ value }) => value === editingLocale)?.label}
          </Badge>
        )}
      </FieldLegend>
    )}
    {description && <FieldDescription>{description}</FieldDescription>}
    <FieldGroup>{children}</FieldGroup>
  </FieldSet>
);

export const ErrorMessage = ({ text }: { text: string }) => (
  <em role="alert" className="text-destructive text-sm">
    {text}
  </em>
);

export const SubmitError = <A, E>({
  result,
}: {
  result: AsyncResult.AsyncResult<A, E>;
}) => {
  const message = AsyncResult.isFailure(result)
    ? Schema.isSchemaError(Cause.squash(result.cause))
      ? undefined
      : getCauseErrorMessage(result.cause)
    : undefined;

  return message ? <ErrorMessage text={message} /> : null;
};

export type SubmitForm<A, E> = {
  isDirty: Atom.Atom<boolean>;
  hasChangedSinceSubmit: Atom.Atom<boolean>;
  lastSubmittedValues: Atom.Atom<Option.Option<unknown>>;
  submit: Atom.AtomResultFn<void, A, E>;
};

export const SubmitButton = <A, E>({
  children,
  form,
}: {
  children?: ReactNode;
  form: SubmitForm<A, E>;
}) => {
  const submit = useAtomSet(form.submit);
  const submitResult = useAtomValue(form.submit);
  const isDirty = useAtomValue(form.isDirty);
  const hasChangedSinceSubmit = useAtomValue(form.hasChangedSinceSubmit);
  const lastSubmittedValues = useAtomValue(form.lastSubmittedValues);
  const hasPendingChanges =
    isDirty && (Option.isNone(lastSubmittedValues) || hasChangedSinceSubmit);

  return (
    <Button
      type="button"
      disabled={!hasPendingChanges || submitResult.waiting}
      className="self-start"
      onClick={() => submit()}
    >
      {submitResult.waiting && (
        <Loader2 data-icon="inline-start" className="animate-spin" />
      )}
      {children ?? effectFormMessages().submit}
    </Button>
  );
};

const FieldError = ({
  error,
  message,
}: {
  error: Option.Option<string>;
  message?: string;
}) =>
  Option.match(error, {
    onNone: () => null,
    onSome: (errorMessage) => <ErrorMessage text={message ?? errorMessage} />,
  });

type TextFieldOptions = FieldOptions &
  Omit<
    ComponentProps<"input">,
    | "children"
    | "defaultValue"
    | "id"
    | "name"
    | "onBlur"
    | "onChange"
    | "value"
  > & { errorMessage?: string };

export const TextField: FormReact.FieldComponent<string, TextFieldOptions> = ({
  field,
  props,
}) => {
  const { children, description, errorMessage, label, ...inputProps } = props;

  return (
    <Field data-invalid={Option.isSome(field.error)}>
      <div className="flex w-full items-center gap-2">
        <FieldLabel htmlFor={field.path}>{label}</FieldLabel>
        {children}
      </div>
      <Input
        {...inputProps}
        id={field.path}
        name={field.path}
        value={field.value}
        onBlur={field.onBlur}
        onChange={(event) => field.onChange(event.target.value)}
        aria-invalid={Option.isSome(field.error)}
      />
      {description && <FieldDescription>{description}</FieldDescription>}
      <FieldError error={field.error} message={errorMessage} />
    </Field>
  );
};

type NameFieldOptions = Omit<TextFieldOptions, "label">;

export const NameField: FormReact.FieldComponent<string, NameFieldOptions> = ({
  field,
  props,
}) => (
  <TextField
    field={field}
    props={{
      ...props,
      label: effectFormMessages().name,
      errorMessage: props.errorMessage ?? effectFormMessages().nameRequired,
    }}
  />
);

type TextAreaFieldOptions = FieldOptions &
  Omit<
    ComponentProps<"textarea">,
    | "children"
    | "defaultValue"
    | "id"
    | "name"
    | "onBlur"
    | "onChange"
    | "value"
  > & { original?: string };

export const TextAreaField: FormReact.FieldComponent<
  string,
  TextAreaFieldOptions
> = ({ field, props }) => {
  const { children, description, label, ...textareaProps } = props;
  const nativeTextareaProps = { ...textareaProps };
  delete nativeTextareaProps.original;

  return (
    <Field data-invalid={Option.isSome(field.error)}>
      <div className="flex w-full items-center gap-2">
        <FieldLabel htmlFor={field.path}>{label}</FieldLabel>
        {children}
      </div>
      <Textarea
        {...nativeTextareaProps}
        id={field.path}
        name={field.path}
        value={field.value}
        onBlur={field.onBlur}
        onChange={(event) => field.onChange(event.target.value)}
        aria-invalid={Option.isSome(field.error)}
      />
      {description && <FieldDescription>{description}</FieldDescription>}
      <FieldError error={field.error} />
    </Field>
  );
};

type DescriptionFieldOptions = Omit<TextAreaFieldOptions, "label">;

export const DescriptionField: FormReact.FieldComponent<
  string,
  DescriptionFieldOptions
> = ({ field, props }) => (
  <TextAreaField
    field={field}
    props={{ ...props, label: effectFormMessages().description }}
  />
);

type FileFieldOptions = FieldOptions & {
  accept: ComponentProps<"input">["accept"];
  onFileChange?: (file: File | undefined) => void;
  required?: boolean;
};

export const FileField: FormReact.FieldComponent<
  File | undefined,
  FileFieldOptions
> = ({ field, props }) => {
  const invalid = Option.isSome(field.error);

  return (
    <Field data-invalid={invalid}>
      <FieldLabel htmlFor={field.path}>{props.label}</FieldLabel>
      <FilePicker
        accept={props.accept ?? ""}
        canClear={field.value instanceof File}
        {...(field.value ? { file: field.value } : {})}
        id={field.path}
        invalid={invalid}
        name={field.path}
        onBlur={field.onBlur}
        onChange={(file) => {
          field.onChange(file);
          props.onFileChange?.(file);
        }}
        onClear={() => {
          field.onChange(undefined);
          props.onFileChange?.(undefined);
        }}
        {...(props.required === undefined ? {} : { required: props.required })}
        title={field.value?.name ?? props.label}
      />
      {props.description && (
        <FieldDescription>{props.description}</FieldDescription>
      )}
      <FieldError error={field.error} />
    </Field>
  );
};

export const NullableTextAreaField: FormReact.FieldComponent<
  string | null | undefined,
  TextAreaFieldOptions
> = ({ field, props }) => {
  const { children, description, label, ...textareaProps } = props;
  const nativeTextareaProps = { ...textareaProps };
  delete nativeTextareaProps.original;

  return (
    <Field data-invalid={Option.isSome(field.error)}>
      <div className="flex w-full items-center gap-2">
        <FieldLabel htmlFor={field.path}>{label}</FieldLabel>
        {children}
      </div>
      <Textarea
        {...nativeTextareaProps}
        id={field.path}
        name={field.path}
        value={field.value ?? ""}
        onBlur={field.onBlur}
        onChange={(event) => field.onChange(event.target.value)}
        aria-invalid={Option.isSome(field.error)}
      />
      {description && <FieldDescription>{description}</FieldDescription>}
      <FieldError error={field.error} />
    </Field>
  );
};

export const CheckboxField: FormReact.FieldComponent<boolean, FieldOptions> = ({
  field,
  props,
}) => (
  <Field data-invalid={Option.isSome(field.error)}>
    <div className="flex w-full flex-row items-center gap-2">
      <Checkbox
        id={field.path}
        name={field.path}
        checked={field.value}
        onBlur={field.onBlur}
        onCheckedChange={field.onChange}
        aria-invalid={Option.isSome(field.error)}
      />
      <FieldLabel htmlFor={field.path}>{props.label}</FieldLabel>
      {props.children}
    </div>
    {props.description && (
      <FieldDescription>{props.description}</FieldDescription>
    )}
    <FieldError error={field.error} />
  </Field>
);

type SelectFieldOptions<T extends string> = FieldOptions & {
  options: ReadonlyArray<{ label: string; value: T }>;
  placeholder?: string;
};

export const SelectField = <T extends string>({
  field,
  props,
}: FormReact.FieldComponentProps<T, SelectFieldOptions<T>>) => (
  <Field data-invalid={Option.isSome(field.error)}>
    <FieldLabel htmlFor={field.path}>{props.label}</FieldLabel>
    <Select
      items={props.options}
      onValueChange={(value) => {
        if (value !== null) field.onChange(value);
      }}
      value={field.value}
    >
      <SelectTrigger id={field.path} aria-invalid={Option.isSome(field.error)}>
        <SelectValue placeholder={props.placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {props.options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
    {props.description && (
      <FieldDescription>{props.description}</FieldDescription>
    )}
    <FieldError error={field.error} />
  </Field>
);

type FolderFieldOptions<T extends string> = Omit<
  SelectFieldOptions<T>,
  "label"
>;

export const FolderField = <T extends string>({
  field,
  props,
}: FormReact.FieldComponentProps<T, FolderFieldOptions<T>>) => (
  <SelectField
    field={field}
    props={{ ...props, label: effectFormMessages().folder }}
  />
);

type MultiSelectFieldOptions<T extends string> = FieldOptions & {
  options: ReadonlyArray<{ label: string; value: T }>;
  placeholder?: string;
};

export const MultiSelectField = <T extends string>({
  field,
  props,
}: FormReact.FieldComponentProps<
  ReadonlyArray<T>,
  MultiSelectFieldOptions<T>
>) => (
  <Field data-invalid={Option.isSome(field.error)}>
    <FieldLabel htmlFor={field.path}>{props.label}</FieldLabel>
    <Select
      items={props.options}
      onValueChange={(value) => field.onChange(value ?? [])}
      multiple
      value={Array.from(field.value)}
    >
      <SelectTrigger
        className="gap-1"
        id={field.path}
        aria-invalid={Option.isSome(field.error)}
      >
        <SelectValue placeholder={props.placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {props.options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
    {props.description && (
      <FieldDescription>{props.description}</FieldDescription>
    )}
    <FieldError error={field.error} />
  </Field>
);

export const NullableMultiSelectField = <T extends string>({
  field,
  props,
}: FormReact.FieldComponentProps<
  ReadonlyArray<T> | null | undefined,
  MultiSelectFieldOptions<T>
>) => (
  <Field data-invalid={Option.isSome(field.error)}>
    <FieldLabel htmlFor={field.path}>{props.label}</FieldLabel>
    <Select
      items={props.options}
      onValueChange={(value) =>
        field.onChange(value && value.length > 0 ? value : null)
      }
      multiple
      value={field.value ? Array.from(field.value) : []}
    >
      <SelectTrigger
        className="gap-1"
        id={field.path}
        aria-invalid={Option.isSome(field.error)}
      >
        <SelectValue placeholder={props.placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {props.options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
    {props.description && (
      <FieldDescription>{props.description}</FieldDescription>
    )}
    <FieldError error={field.error} />
  </Field>
);

type SearchableSelectFieldSharedOptions<TData> = FieldOptions & {
  emptyLabel: ReactNode;
  initialItems?: readonly VirtualizedComboboxOption<TData>[];
  items: readonly VirtualizedComboboxOption<TData>[];
  messages?: VirtualizedComboboxMessageOverrides;
  onSearchValueChange?: (value: string) => void;
  placeholder: ReactNode;
  renderItem?: (item: VirtualizedComboboxOption<TData>) => ReactNode;
  searchValue?: string;
};

const getSearchableSelectItems = <TData,>(
  values: readonly string[],
  initialItems: readonly VirtualizedComboboxOption<TData>[],
  items: readonly VirtualizedComboboxOption<TData>[],
) => {
  const itemsByValue = new Map(
    [...initialItems, ...items].map((item) => [item.value, item]),
  );
  const selectedItems = values.map(
    (value) => itemsByValue.get(value) ?? { value, label: value },
  );
  const selectedValues = new Set(values);

  return {
    selectedItems,
    mergedItems: [
      ...selectedItems,
      ...items.filter(({ value }) => !selectedValues.has(value)),
    ],
  };
};

export const SearchableSelectField = <TData,>({
  field,
  props,
}: FormReact.FieldComponentProps<
  ReadonlyArray<string>,
  SearchableSelectFieldSharedOptions<TData> & { multiple?: true }
>) => {
  const { selectedItems, mergedItems } = getSearchableSelectItems(
    field.value,
    props.initialItems ?? [],
    props.items,
  );
  const invalid = Option.isSome(field.error);
  const labels = virtualizedComboboxMessages(props.messages);
  const ariaLabel =
    typeof props.label === "string" ? props.label : labels.search;

  return (
    <Field className="min-w-0" data-invalid={invalid}>
      <FieldLabel htmlFor={field.path}>{props.label}</FieldLabel>
      <VirtualizedCombobox<TData>
        ariaInvalid={invalid}
        ariaLabel={ariaLabel}
        emptyLabel={props.emptyLabel}
        items={mergedItems}
        {...(props.messages ? { messages: props.messages } : {})}
        multiple
        {...(props.onSearchValueChange
          ? { onSearchValueChange: props.onSearchValueChange }
          : {})}
        onValueChange={(options) =>
          field.onChange(options.map(({ value }) => value))
        }
        placeholder={props.placeholder}
        {...(props.renderItem ? { renderItem: props.renderItem } : {})}
        {...(props.searchValue === undefined
          ? {}
          : { searchValue: props.searchValue })}
        triggerId={field.path}
        value={selectedItems}
      />
      {props.description && (
        <FieldDescription>{props.description}</FieldDescription>
      )}
      <FieldError error={field.error} />
    </Field>
  );
};

export const SingleSearchableSelectField = <TData,>({
  field,
  props,
}: FormReact.FieldComponentProps<
  string,
  SearchableSelectFieldSharedOptions<TData> & { multiple?: false }
>) => {
  const { selectedItems, mergedItems } = getSearchableSelectItems(
    field.value ? [field.value] : [],
    props.initialItems ?? [],
    props.items,
  );
  const invalid = Option.isSome(field.error);
  const labels = virtualizedComboboxMessages(props.messages);
  const ariaLabel =
    typeof props.label === "string" ? props.label : labels.search;

  return (
    <Field className="min-w-0" data-invalid={invalid}>
      <FieldLabel htmlFor={field.path}>{props.label}</FieldLabel>
      <VirtualizedCombobox<TData>
        ariaInvalid={invalid}
        ariaLabel={ariaLabel}
        emptyLabel={props.emptyLabel}
        items={mergedItems}
        {...(props.messages ? { messages: props.messages } : {})}
        {...(props.onSearchValueChange
          ? { onSearchValueChange: props.onSearchValueChange }
          : {})}
        onValueChange={(option) => field.onChange(option?.value ?? "")}
        placeholder={props.placeholder}
        {...(props.renderItem ? { renderItem: props.renderItem } : {})}
        {...(props.searchValue === undefined
          ? {}
          : { searchValue: props.searchValue })}
        triggerId={field.path}
        value={selectedItems[0] ?? null}
      />
      {props.description && (
        <FieldDescription>{props.description}</FieldDescription>
      )}
      <FieldError error={field.error} />
    </Field>
  );
};

export const NullableKeyValueField = ({
  field,
  props,
}: FormReact.FieldComponentProps<
  Readonly<Record<string, string>> | null,
  FieldOptions
>) => {
  const entries = Object.entries(field.value ?? {});

  const updateEntry = (index: number, key: string, value: string) =>
    Object.fromEntries(
      entries.map(([currentKey, currentValue], currentIndex) =>
        currentIndex === index ? [key, value] : [currentKey, currentValue],
      ),
    );

  return (
    <Field data-invalid={Option.isSome(field.error)}>
      <FieldLabel>{props.label}</FieldLabel>
      {entries.map(([key, value], index) => (
        <div key={index} className="flex w-full flex-row items-center gap-2">
          <Input
            id={`${field.path}-${index}-key`}
            name={`${field.path}.${index}.key`}
            type="text"
            className="w-auto"
            placeholder={effectFormMessages().key}
            value={key}
            onBlur={field.onBlur}
            onChange={(event) =>
              field.onChange(updateEntry(index, event.target.value, value))
            }
            aria-invalid={Option.isSome(field.error)}
          />
          <Input
            id={`${field.path}-${index}-value`}
            name={`${field.path}.${index}.value`}
            type="text"
            className="w-auto flex-1"
            placeholder={effectFormMessages().value}
            value={value}
            onBlur={field.onBlur}
            onChange={(event) =>
              field.onChange(updateEntry(index, key, event.target.value))
            }
            aria-invalid={Option.isSome(field.error)}
          />
          <Button
            type="button"
            variant="secondary"
            onClick={() =>
              field.onChange(
                Object.fromEntries(
                  entries.filter((_, currentIndex) => currentIndex !== index),
                ),
              )
            }
          >
            <Trash data-icon="inline-start" />
            {effectFormMessages().delete}
          </Button>
        </div>
      ))}
      <Button
        type="button"
        size="sm"
        className="self-start"
        onClick={() => field.onChange({ ...field.value, "": "" })}
      >
        <Plus data-icon="inline-start" />
        {effectFormMessages().add}
      </Button>
      {props.description && (
        <FieldDescription>{props.description}</FieldDescription>
      )}
      <FieldError error={field.error} />
    </Field>
  );
};

export const KeyValueField = ({
  field,
  props,
}: FormReact.FieldComponentProps<
  Readonly<Record<string, string>>,
  FieldOptions
>) => {
  const entries = Object.entries(field.value);
  const updateEntry = (index: number, key: string, value: string) =>
    Object.fromEntries(
      entries.map(([currentKey, currentValue], currentIndex) =>
        currentIndex === index ? [key, value] : [currentKey, currentValue],
      ),
    );

  return (
    <Field data-invalid={Option.isSome(field.error)}>
      <FieldLabel>{props.label}</FieldLabel>
      {entries.map(([key, value], index) => (
        <div key={index} className="flex w-full flex-row items-center gap-2">
          <Input
            id={`${field.path}-${index}-key`}
            name={`${field.path}.${index}.key`}
            type="text"
            className="w-auto"
            placeholder={effectFormMessages().key}
            value={key}
            onBlur={field.onBlur}
            onChange={(event) =>
              field.onChange(updateEntry(index, event.target.value, value))
            }
            aria-invalid={Option.isSome(field.error)}
          />
          <Input
            id={`${field.path}-${index}-value`}
            name={`${field.path}.${index}.value`}
            type="text"
            className="w-auto flex-1"
            placeholder={effectFormMessages().value}
            value={value}
            onBlur={field.onBlur}
            onChange={(event) =>
              field.onChange(updateEntry(index, key, event.target.value))
            }
            aria-invalid={Option.isSome(field.error)}
          />
          <Button
            type="button"
            variant="secondary"
            onClick={() =>
              field.onChange(
                Object.fromEntries(
                  entries.filter((_, currentIndex) => currentIndex !== index),
                ),
              )
            }
          >
            <Trash data-icon="inline-start" />
            {effectFormMessages().delete}
          </Button>
        </div>
      ))}
      <Button
        type="button"
        size="sm"
        className="self-start"
        onClick={() => field.onChange({ ...field.value, "": "" })}
      >
        <Plus data-icon="inline-start" />
        {effectFormMessages().add}
      </Button>
      {props.description && (
        <FieldDescription>{props.description}</FieldDescription>
      )}
      <FieldError error={field.error} />
    </Field>
  );
};

export const RevertButton = ({
  field,
  props,
}: {
  field: { value: string; onChange: (value: string) => void };
  props: { original: string };
}) =>
  field.value === props.original ? null : (
    <div className="flex flex-1 justify-end">
      <Button
        type="button"
        variant="link"
        className="-mr-4 h-auto py-0"
        onClick={() => field.onChange(props.original)}
      >
        {effectFormMessages().revert}
      </Button>
    </div>
  );

type ImageFieldOptions = {
  label: string;
  size: {
    width: number;
    height: number;
    suggestedWidth?: number;
    suggestedHeight?: number;
  };
};

export const ImageField: FormReact.FieldComponent<
  File | string | null | undefined,
  ImageFieldOptions
> = ({ field, props }) => {
  const imageUrl = typeof field.value === "string" ? field.value : undefined;
  const invalid = Option.isSome(field.error);

  return (
    <Field data-invalid={invalid}>
      <FieldLabel htmlFor={field.path}>{props.label}</FieldLabel>
      <FilePicker
        accept="image/*"
        onBlur={field.onBlur}
        canClear={Boolean(field.value)}
        {...(field.value instanceof File ? { file: field.value } : {})}
        {...(imageUrl
          ? {
              image: {
                alt: props.label,
                height: props.size.height,
                src: imageUrl,
                width: props.size.width,
              },
            }
          : {})}
        id={field.path}
        invalid={invalid}
        name={field.path}
        onChange={field.onChange}
        onClear={() => field.onChange(null)}
        title={field.value instanceof File ? field.value.name : props.label}
      />
      {props.size.suggestedWidth && props.size.suggestedHeight ? (
        <FieldDescription>
          {effectFormMessages().suggestedImageSize(
            String(props.size.suggestedWidth),
            String(props.size.suggestedHeight),
          )}
        </FieldDescription>
      ) : null}
      <FieldError error={field.error} />
    </Field>
  );
};

const NavigationBlock = ({ shouldBlock }: { shouldBlock: boolean }) => (
  <Block
    enableBeforeUnload={() => shouldBlock}
    shouldBlockFn={() => shouldBlock}
    withResolver
  >
    {({ status, proceed, reset }) => (
      <AlertDialog open={status === "blocked"}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {effectFormMessages().blockNavigationTitle}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {effectFormMessages().blockNavigationDescription}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={reset}>
              {effectFormMessages().blockNavigationCancel}
            </AlertDialogCancel>
            <AlertDialogAction onClick={proceed}>
              {effectFormMessages().blockNavigationConfirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )}
  </Block>
);

const FormBlockNavigation = <A, E>({ form }: { form: SubmitForm<A, E> }) => {
  const submitResult = useAtomValue(form.submit);
  const isDirty = useAtomValue(form.isDirty);
  const hasChangedSinceSubmit = useAtomValue(form.hasChangedSinceSubmit);
  const lastSubmittedValues = useAtomValue(form.lastSubmittedValues);
  const shouldBlock =
    !submitResult.waiting &&
    isDirty &&
    (Option.isNone(lastSubmittedValues) || hasChangedSinceSubmit);

  return <NavigationBlock shouldBlock={shouldBlock} />;
};

export const BlockNavigation = <A, E>({ form }: { form: SubmitForm<A, E> }) => (
  <FormBlockNavigation form={form} />
);
