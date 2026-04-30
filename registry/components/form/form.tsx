import { m } from "@/paraglide/messages";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createFormHook, createFormHookContexts, useStore } from "@tanstack/react-form";
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

export const ErrorMessage = ({ text }: { text: string }) => {
  return (
    <em role="alert" className="text-sm text-destructive">
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

const { fieldContext, useFieldContext, formContext, useFormContext } = createFormHookContexts();

export type DefaultFormOptions = {
  legend?: string;
  description?: string;
};
export type DefaultOptions = {
  label: JSX.Element | string;
  description?: string;
};

const TextField = ({ children, ...props }: React.ComponentProps<"input"> & DefaultOptions) => {
  const field = useFieldContext<string>();
  const invalid = !field.state.meta.isValid;

  return (
    <Field data-invalid={invalid}>
      <div className="flex items-center gap-2 w-full">
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
      {props.description && <FieldDescription>{props.description}</FieldDescription>}
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
      <div className="flex items-center gap-2 w-full">
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
      {props.description && <FieldDescription>{props.description}</FieldDescription>}
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
      {props.description && <FieldDescription>{props.description}</FieldDescription>}
      <FieldError errors={field.getMeta().errors} />
    </Field>
  );
};

const SelectField = ({
  options,
  children,
  ...props
}: DefaultOptions & {
  options: {
    label: string;
    value: string;
  }[];
  children?: React.ReactNode;
}) => {
  const field = useFieldContext<string>();
  const invalid = !field.state.meta.isValid;

  return (
    <Field data-invalid={invalid}>
      <div className="flex items-center gap-2 w-full">
        <FieldLabel htmlFor={field.name}>{props.label}</FieldLabel>
        {children}
      </div>
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
      {props.description && <FieldDescription>{props.description}</FieldDescription>}
      <FieldError errors={field.getMeta().errors} />
    </Field>
  );
};

const KeyValueField = (props: DefaultOptions) => {
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
        <div key={index} className="flex flex-row items-center gap-2 w-full">
          <Input
            id={field.name}
            placeholder={m.key_value_field_key()}
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
            className="flex-1 w-auto"
            placeholder={m.key_value_field_value()}
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
            {m.key_value_field_delete()}
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
          {m.key_value_field_add()}
        </Button>
      </div>
      {props.description && <FieldDescription>{props.description}</FieldDescription>}
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
      {props.description && <FieldDescription>{props.description}</FieldDescription>}
      <FieldError errors={field.getMeta().errors} />
    </Field>
  );
};

const FileField = ({
  label,
  accept,
  required = false,
}: Omit<DefaultOptions, "description"> & {
  accept: InputHTMLAttributes<HTMLInputElement>["accept"];
  required?: boolean;
}) => {
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
      <FieldDescription>{m.form_accepts({ accepts: accept as string })}</FieldDescription>
      <FieldError errors={field.getMeta().errors} />
    </Field>
  );
};

const ImageField = ({
  label,
  defaultImageUrl,
  size,
}: {
  label: string;
  defaultImageUrl?: string;
  size: {
    width: number;
    height: number;
    suggestedWidth?: number;
    suggestedHeight?: number;
  };
}) => {
  const { width, height } = size;
  const field = useFieldContext<File | null>();
  const invalid = !field.state.meta.isValid;

  const imageUrl = field.state.value
    ? URL.createObjectURL(field.state.value).toString()
    : defaultImageUrl;

  return (
    <Field data-invalid={invalid}>
      <Label htmlFor={field.name} className="items-start flex-col">
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
            field.handleChange(event.target.files ? event.target.files[0] : null);
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
            {m.actions_delete()}
          </Button>
        )}
      </div>
      {size.suggestedWidth && size.suggestedHeight && (
        <FieldDescription>
          {m.form_suggested_image_size({
            width: String(size.suggestedWidth),
            height: String(size.suggestedHeight),
          })}
        </FieldDescription>
      )}
      <FieldError errors={field.getMeta().errors} />
    </Field>
  );
};

export const BlockNavigation = () => {
  const form = useFormContext();
  const shouldBlock = useStore(
    form.store,
    (formState) => formState.isDirty && !(formState.isSubmitting || formState.isSubmitted),
  );

  return (
    <Block enableBeforeUnload={() => shouldBlock} shouldBlockFn={() => shouldBlock} withResolver>
      {({ status, proceed, reset }) => (
        <AlertDialog open={status === "blocked"}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{m.form_block_navigation_title()}</AlertDialogTitle>
              <AlertDialogDescription>
                {m.form_block_navigation_description()}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={reset}>
                {m.form_block_navigation_cancel()}
              </AlertDialogCancel>
              <AlertDialogAction onClick={proceed}>
                {m.form_block_navigation_confirm()}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </Block>
  );
};

const SubmitButton = () => {
  const form = useFormContext();
  return (
    <form.Subscribe selector={(formState) => [formState.isSubmitting]}>
      {([isSubmitting]) => (
        <Button type="submit" disabled={isSubmitting} className="self-start">
          {isSubmitting && <Loader2 className="animate-spin" />}
          {m.form_submit()}
        </Button>
      )}
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
        <FieldLegend className="gap-2 flex items-center">
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

const RevertButton = ({ original }: { original: string }) => {
  const field = useFieldContext<string>();

  if (field.state.value !== original) {
    return (
      <div className="flex flex-1 justify-end">
        <Button
          variant="link"
          className="-mr-4 py-0 h-auto"
          onClick={() => field.handleChange(original)}
        >
          {m.form_revert()}
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
    FieldWrapper,
    BlockNavigation,
  },
});

export { useAppForm, withForm, withFieldGroup };
