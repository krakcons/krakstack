import { Schema } from "effect";
import { Popover } from "@base-ui/react/popover";
import {
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  Type,
  Image,
  MousePointer2,
  Minus,
  Space,
  KeyRound,
  ScanLine,
  Trash2,
  Copy,
  Pencil,
  X,
  ChevronDown,
  Plus,
  Palette,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PopoverContent,
  PopoverTrigger,
  PopoverTitle,
} from "@/components/ui/popover";
import { AnimatedList } from "@/components/ui/animated-list";
import {
  RichTextEditor,
  RichTextContent,
} from "@/components/ui/rich-text-editor";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useKrakstackLocale } from "@/components/ui/krakstack-provider";
import { RichTextLink, type RichTextVariable } from "@/lib/rich-text/schema";
import {
  EmailAlignment,
  EmailColor,
  EmailFont,
  type EmailDocument,
  type EmailElement,
} from "@/lib/email-document/schema";
import {
  emailElementTypes,
  newEmailElement,
  validateEmailDocument,
  richTextFromEmailText,
} from "@/lib/email-document/model";
import { richTextPlainText } from "@/lib/rich-text/model";

const EmailEditorSelect = ({
  label,
  value,
  options,
  disabled,
  onValueChange,
}: {
  label: string;
  value: string;
  options: readonly { value: string; label: string }[];
  disabled?: boolean;
  onValueChange: (value: string) => void;
}) => (
  <Select
    items={options}
    value={value}
    disabled={disabled}
    onValueChange={(value) => {
      if (value !== null) onValueChange(value);
    }}
  >
    <SelectTrigger aria-label={label} className="w-full min-w-0 text-xs">
      <SelectValue />
    </SelectTrigger>
    <SelectContent align="start" alignItemWithTrigger={false}>
      {options.map((option) => (
        <SelectItem key={option.value} value={option.value}>
          {option.label}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
);

const labels = {
  en: {
    edit: "Design",
    preview: "Preview",
    subject: "Subject",
    preheader: "Preview text",
    add: "Add element",
    text: "Text",
    button: "Button",
    code: "Verification code",
    logo: "Logo",
    image: "Image",
    divider: "Divider",
    spacer: "Spacer",
    content: "Email content",
    properties: "Element settings",
    select: "Select an element to edit its settings.",
    alignment: "Alignment",
    left: "Left",
    center: "Center",
    right: "Right",
    paddingTop: "Space above",
    paddingBottom: "Space below",
    width: "Width",
    height: "Height",
    src: "Image URL",
    alt: "Alternative text",
    label: "Button label",
    destination: "Destination",
    url: "Custom URL",
    variable: "Variable",
    insertVariable: "Insert variable",
    close: "Close settings",
    duplicate: "Duplicate element",
    remove: "Remove element",
    background: "Canvas",
    surface: "Paper",
    primary: "Accent",
    primaryText: "Button text",
    foreground: "Text color",
    font: "Font",
    sans: "Sans serif",
    serif: "Serif",
    mono: "Monospace",
    branding: "Branding",
    invalid:
      "Fix invalid settings or missing variables before using this email.",
    newText: "Write your message here.",
    newButton: "Continue",
    newImage: "Your image",
    empty: "Start with an element. Everything can be moved.",
    editElement: "Edit element",
    local:
      "Drag by the grip or use the arrow keys on it. Your changes stay in this editor.",
  },
  fr: {
    edit: "Création",
    preview: "Aperçu",
    subject: "Objet",
    preheader: "Texte d’aperçu",
    add: "Ajouter un élément",
    text: "Texte",
    button: "Bouton",
    code: "Code de vérification",
    logo: "Logo",
    image: "Image",
    divider: "Séparateur",
    spacer: "Espacement",
    content: "Contenu du courriel",
    properties: "Réglages de l’élément",
    select: "Sélectionnez un élément pour modifier ses réglages.",
    alignment: "Alignement",
    left: "Gauche",
    center: "Centre",
    right: "Droite",
    paddingTop: "Espace au-dessus",
    paddingBottom: "Espace en dessous",
    width: "Largeur",
    height: "Hauteur",
    src: "URL de l’image",
    alt: "Texte de remplacement",
    label: "Libellé du bouton",
    destination: "Destination",
    url: "URL personnalisée",
    variable: "Variable",
    insertVariable: "Insérer une variable",
    close: "Fermer les réglages",
    duplicate: "Dupliquer l’élément",
    remove: "Retirer l’élément",
    background: "Fond",
    surface: "Papier",
    primary: "Accent",
    primaryText: "Texte du bouton",
    foreground: "Couleur du texte",
    font: "Police",
    sans: "Sans empattement",
    serif: "Avec empattement",
    mono: "Chasse fixe",
    branding: "Identité visuelle",
    invalid:
      "Corrigez les réglages invalides ou les variables manquantes avant d’utiliser ce courriel.",
    newText: "Rédigez votre message ici.",
    newButton: "Continuer",
    newImage: "Votre image",
    empty: "Commencez par un élément. Tout peut être déplacé.",
    editElement: "Modifier l’élément",
    local:
      "Glissez avec la poignée ou utilisez ses touches fléchées. Vos modifications restent dans cet éditeur.",
  },
};
export type EmailEditorMessages = { [K in keyof typeof labels.en]: string };
export type EmailEditorProps = {
  value: EmailDocument;
  onChange: (value: EmailDocument) => void;
  variables?: readonly RichTextVariable[];
  requiredVariables?: readonly string[];
  preview?: ReactNode;
  disabled?: boolean;
  locale?: string;
  messages?: Partial<Record<string, Partial<EmailEditorMessages>>>;
};
const icons = {
  text: Type,
  button: MousePointer2,
  code: KeyRound,
  logo: ScanLine,
  image: Image,
  divider: Minus,
  spacer: Space,
};
const fonts = {
  sans: "Arial, sans-serif",
  serif: "Georgia, serif",
  mono: "'Courier New', monospace",
};

export const EmailEditor = ({
  value,
  onChange,
  variables = [],
  requiredVariables = [],
  preview,
  disabled,
  locale: override,
  messages,
}: EmailEditorProps) => {
  const locale = useKrakstackLocale(override);
  const copy = {
    ...(locale.startsWith("fr") ? labels.fr : labels.en),
    ...messages?.[locale.split("-")[0] ?? locale],
    ...messages?.[locale],
  };
  const [active, setActive] = useState<string | null>(
    value.elements.find((element) => element.type === "text")?.id ?? null,
  );
  const selected = value.elements.find((element) => element.id === active);
  const [view, setView] = useState("design");
  const canvas = useRef<HTMLDivElement>(null);
  const elementSurfaces = useRef(new Map<string, HTMLDivElement>());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsAnchor = useMemo(
    () =>
      settingsOpen
        ? {
            get contextElement() {
              return canvas.current ?? undefined;
            },
            getBoundingClientRect: () => {
              const canvasBounds = canvas.current?.getBoundingClientRect();
              const elementBounds = active
                ? elementSurfaces.current.get(active)?.getBoundingClientRect()
                : undefined;
              return new DOMRect(
                canvasBounds?.x,
                elementBounds?.y ?? canvasBounds?.y,
                canvasBounds?.width,
                elementBounds?.height ?? canvasBounds?.height,
              );
            },
          }
        : null,
    [active, settingsOpen],
  );
  const id = useId();
  const [insertOpen, setInsertOpen] = useState(false);
  const update = (element: EmailElement) => {
    if (!disabled)
      onChange({
        ...value,
        elements: value.elements.map((item) =>
          item.id === element.id ? element : item,
        ),
      });
  };
  const add = (type: (typeof emailElementTypes)[number]) => {
    const element = newEmailElement(type, {
      id: crypto.randomUUID(),
      text: copy.newText,
      button: copy.newButton,
      imageAlt: copy.newImage,
      codeVariable:
        variables.find((variable) => variable.key === "code")?.key ??
        variables.find((variable) => variable.type === "text")?.key,
      urlVariable: variables.find((variable) => variable.type === "url")?.key,
    });
    onChange({ ...value, elements: [...value.elements, element] });
    setActive(element.id);
  };
  const field = (label: string, control: ReactNode) => (
    <label className="grid min-w-0 gap-1.5 text-xs font-medium">
      {label}
      {control}
    </label>
  );
  const invalid =
    validateEmailDocument({ document: value, variables, requiredVariables })
      .length > 0;
  const canvasVariables: CSSProperties &
    Record<"--email-paper" | "--email-hover", string> = {
    "--email-paper": value.appearance.surface,
    "--email-hover": `color-mix(in srgb, ${value.appearance.surface} 94%, ${value.appearance.text})`,
  };

  return (
    <div data-slot="email-editor" className="min-w-0 space-y-4">
      <Tabs value={view} onValueChange={setView}>
        <TabsList>
          <TabsTrigger value="design">{copy.edit}</TabsTrigger>
          <TabsTrigger value="preview" disabled={!preview}>
            {copy.preview}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="preview" className="mt-4">
          {preview}
        </TabsContent>
        <TabsContent value="design" className="mt-4 space-y-4">
          <div className="grid gap-3">
            {(["subject", "preview"] as const).map((key) => {
              const label = key === "subject" ? copy.subject : copy.preheader;
              return (
                <div
                  key={key}
                  role="group"
                  aria-label={label}
                  className="min-w-0 space-y-1.5"
                >
                  <p className="text-xs font-medium">{label}</p>
                  <RichTextEditor
                    label={label}
                    value={richTextFromEmailText(value[key])}
                    onChange={(content) =>
                      onChange({ ...value, [key]: richTextPlainText(content) })
                    }
                    variables={variables}
                    locale={locale}
                    disabled={disabled}
                    singleLine
                    maxLength={200}
                  />
                </div>
              );
            })}
          </div>
          <div className="bg-muted/20 flex flex-wrap items-center justify-between gap-2 rounded-xl border p-2">
            <Popover.Root open={insertOpen} onOpenChange={setInsertOpen}>
              <PopoverTrigger
                id={`${id}-add`}
                render={
                  <Button
                    type="button"
                    size="sm"
                    disabled={disabled || value.elements.length >= 40}
                  />
                }
              >
                <Plus className="size-3.5" aria-hidden />
                {copy.add}
                <ChevronDown className="size-3.5" aria-hidden />
              </PopoverTrigger>
              <PopoverContent align="start" className="w-64">
                <PopoverTitle>{copy.add}</PopoverTitle>
                <div className="grid gap-1">
                  {emailElementTypes.map((type) => {
                    const Icon = icons[type];
                    return (
                      <Button
                        key={type}
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-auto min-h-8 min-w-0 justify-start text-left whitespace-normal"
                        disabled={disabled || value.elements.length >= 40}
                        onClick={() => {
                          add(type);
                          setInsertOpen(false);
                        }}
                      >
                        <Icon className="size-3.5" aria-hidden />
                        {copy[type]}
                      </Button>
                    );
                  })}
                </div>
              </PopoverContent>
            </Popover.Root>
            <Popover.Root>
              <PopoverTrigger
                render={
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={disabled}
                  />
                }
              >
                <Palette className="size-3.5" aria-hidden />
                {copy.branding}
                <ChevronDown className="size-3.5" aria-hidden />
              </PopoverTrigger>
              <PopoverContent
                align="end"
                className="w-[min(380px,calc(100vw-2rem))]"
              >
                <PopoverTitle>{copy.branding}</PopoverTitle>
                <div className="grid grid-cols-2 gap-4">
                  {(
                    [
                      "background",
                      "surface",
                      "primary",
                      "primaryText",
                      "text",
                    ] as const
                  ).map((key) => (
                    <label
                      key={key}
                      className="flex items-center justify-between gap-2 text-xs"
                    >
                      {key === "text" ? copy.foreground : copy[key]}
                      <input
                        type="color"
                        value={value.appearance[key]}
                        disabled={disabled}
                        className="h-8 w-9 cursor-pointer rounded border p-0.5"
                        onChange={(event) =>
                          onChange({
                            ...value,
                            appearance: {
                              ...value.appearance,
                              [key]: event.target.value,
                            },
                          })
                        }
                      />
                    </label>
                  ))}
                  {field(
                    copy.font,
                    <EmailEditorSelect
                      label={copy.font}
                      value={value.appearance.font}
                      disabled={disabled}
                      options={(["sans", "serif", "mono"] as const).map(
                        (font) => ({ value: font, label: copy[font] }),
                      )}
                      onValueChange={(font) =>
                        onChange({
                          ...value,
                          appearance: {
                            ...value.appearance,
                            font: Schema.decodeUnknownSync(EmailFont)(font),
                          },
                        })
                      }
                    />,
                  )}
                </div>
              </PopoverContent>
            </Popover.Root>
          </div>
          <div className="flex min-w-0 flex-col gap-4">
            <div
              ref={canvas}
              data-slot="email-editor-canvas"
              className="min-w-0 rounded-xl border p-3 sm:p-4"
              style={{
                backgroundColor: Schema.is(EmailColor)(
                  value.appearance.background,
                )
                  ? value.appearance.background
                  : "#f4f4f5",
              }}
            >
              <div
                className="min-w-0 rounded-lg p-2 shadow-sm sm:p-3"
                style={{
                  ...canvasVariables,
                  backgroundColor: Schema.is(EmailColor)(
                    value.appearance.surface,
                  )
                    ? value.appearance.surface
                    : "#ffffff",
                  color: Schema.is(EmailColor)(value.appearance.text)
                    ? value.appearance.text
                    : "#18181b",
                  fontFamily: fonts[value.appearance.font],
                }}
              >
                {!value.elements.length ? (
                  <p className="p-8 text-center text-sm">{copy.empty}</p>
                ) : null}
                <AnimatedList
                  items={value.elements}
                  getKey={(element) => element.id}
                  label={copy.content}
                  locale={locale}
                  getItemLabel={(element) => copy[element.type]}
                  duration={140}
                  onReorder={
                    disabled
                      ? undefined
                      : (elements) => onChange({ ...value, elements })
                  }
                  itemClassName="group flex min-w-0 items-start gap-1 rounded-lg bg-[var(--email-paper)] transition-[background-color,box-shadow] hover:bg-[var(--email-hover)] data-[dragging]:bg-[var(--email-hover)] data-[dragging]:shadow-lg [&>[data-slot=animated-list-handle]]:text-inherit"
                >
                  {(element) => (
                    <div
                      ref={(surface) => {
                        if (surface)
                          elementSurfaces.current.set(element.id, surface);
                        else elementSurfaces.current.delete(element.id);
                      }}
                      className="min-w-0 flex-1 rounded-lg border border-transparent transition-colors hover:border-current"
                      onClick={() => {
                        if (!disabled) {
                          setActive(element.id);
                          setSettingsOpen(true);
                        }
                      }}
                      onFocusCapture={() => {
                        if (!disabled) setActive(element.id);
                      }}
                      style={
                        active === element.id
                          ? { borderColor: value.appearance.primary }
                          : undefined
                      }
                    >
                      <div className="flex items-center justify-between gap-2 px-2 py-1 text-xs">
                        <button
                          type="button"
                          disabled={disabled}
                          aria-label={`${copy.editElement}: ${copy[element.type]}`}
                          onClick={() => {
                            setActive(element.id);
                            setSettingsOpen(true);
                          }}
                          className="inline-flex items-center gap-1 rounded px-1 py-0.5 hover:underline"
                        >
                          <Pencil className="size-3" aria-hidden />
                          {copy[element.type]}
                        </button>
                      </div>
                      <div
                        style={{
                          textAlign: element.alignment,
                          paddingTop: element.paddingTop,
                          paddingBottom: element.paddingBottom,
                        }}
                        className="min-w-0 px-2"
                      >
                        {element.type === "text" ? (
                          active === element.id ? (
                            <RichTextEditor
                              value={element.content}
                              variables={variables}
                              locale={locale}
                              label={copy.text}
                              disabled={disabled}
                              contentStyle={{
                                color: value.appearance.text,
                                backgroundColor: value.appearance.surface,
                              }}
                              onChange={(content) =>
                                update({ ...element, content })
                              }
                            />
                          ) : (
                            <div
                              role="button"
                              tabIndex={disabled ? -1 : 0}
                              aria-label={`${copy.editElement}: ${copy.text}`}
                              className="cursor-text text-sm leading-relaxed"
                              onClick={(event) => {
                                event.preventDefault();
                                setActive(element.id);
                              }}
                              onKeyDown={(event) => {
                                if (
                                  event.key === "Enter" ||
                                  event.key === " "
                                ) {
                                  event.preventDefault();
                                  setActive(element.id);
                                  setSettingsOpen(true);
                                }
                              }}
                            >
                              <RichTextContent
                                value={element.content}
                                variables={variables}
                              />
                            </div>
                          )
                        ) : element.type === "button" ? (
                          <button
                            type="button"
                            disabled={disabled}
                            onClick={() => setActive(element.id)}
                            className="max-w-full rounded-md px-5 py-3 text-sm font-semibold break-words"
                            style={{
                              backgroundColor: value.appearance.primary,
                              color: value.appearance.primaryText,
                            }}
                          >
                            {element.label}
                          </button>
                        ) : element.type === "code" ? (
                          <button
                            type="button"
                            disabled={disabled}
                            onClick={() => setActive(element.id)}
                            className="w-full rounded-lg border border-[#e5e7eb] p-4 font-mono text-xl tracking-[0.2em]"
                          >
                            {`{{${element.variable}}}`}
                          </button>
                        ) : element.type === "image" ||
                          element.type === "logo" ? (
                          Schema.is(RichTextLink)(element.src) ? (
                            <img
                              src={element.src}
                              alt={element.alt}
                              width={element.width}
                              className="inline-block max-w-full"
                            />
                          ) : (
                            <Image className="mx-auto size-8" />
                          )
                        ) : element.type === "divider" ? (
                          <hr className="border-[#e5e7eb]" />
                        ) : element.type === "spacer" ? (
                          <div
                            style={{ height: element.height }}
                            className="min-h-2 rounded border border-dashed border-[#e5e7eb]"
                          />
                        ) : null}
                      </div>
                    </div>
                  )}
                </AnimatedList>
              </div>
            </div>
            <Popover.Root
              open={settingsOpen && !!selected}
              onOpenChange={setSettingsOpen}
            >
              <Popover.Portal>
                <Popover.Positioner
                  anchor={settingsAnchor}
                  side="right"
                  align="start"
                  sideOffset={8}
                  collisionAvoidance={{
                    side: "none",
                    align: "none",
                    fallbackAxisSide: "none",
                  }}
                  className="z-50"
                >
                  <Popover.Popup
                    initialFocus={false}
                    className="bg-popover text-popover-foreground max-h-[min(480px,80dvh)] w-[min(380px,calc(100vw-2rem))] space-y-3 overflow-y-auto rounded-xl border p-4 shadow-lg outline-none"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <Popover.Title className="text-xs font-semibold">
                        {selected ? copy[selected.type] : copy.properties}
                      </Popover.Title>
                      <Popover.Close
                        aria-label={copy.close}
                        className="hover:bg-muted rounded p-1"
                      >
                        <X className="size-4" />
                      </Popover.Close>
                    </div>
                    {!selected ? (
                      <p className="text-muted-foreground text-xs">
                        {copy.select}
                      </p>
                    ) : (
                      <div className="grid min-w-0 items-end gap-3 sm:grid-cols-2 [&>label]:min-w-0">
                        {field(
                          copy.alignment,
                          <EmailEditorSelect
                            label={copy.alignment}
                            value={selected.alignment}
                            disabled={disabled}
                            options={(["left", "center", "right"] as const).map(
                              (alignment) => ({
                                value: alignment,
                                label: copy[alignment],
                              }),
                            )}
                            onValueChange={(alignment) =>
                              update({
                                ...selected,
                                alignment:
                                  Schema.decodeUnknownSync(EmailAlignment)(
                                    alignment,
                                  ),
                              })
                            }
                          />,
                        )}
                        <div className="grid grid-cols-2 gap-2">
                          {(["paddingTop", "paddingBottom"] as const).map(
                            (key) => (
                              <label
                                key={key}
                                className="grid gap-1.5 text-[11px]"
                              >
                                {copy[key]}
                                <Input
                                  type="number"
                                  min={0}
                                  max={96}
                                  value={selected[key]}
                                  disabled={disabled}
                                  onChange={(event) =>
                                    update({
                                      ...selected,
                                      [key]: event.target.valueAsNumber,
                                    })
                                  }
                                />
                              </label>
                            ),
                          )}
                        </div>
                        {selected.type === "button" ? (
                          <>
                            {field(
                              copy.label,
                              <Input
                                value={selected.label}
                                disabled={disabled}
                                onChange={(event) =>
                                  update({
                                    ...selected,
                                    label: event.target.value,
                                  })
                                }
                              />,
                            )}
                            {field(
                              copy.destination,
                              <EmailEditorSelect
                                label={copy.destination}
                                disabled={disabled}
                                options={[
                                  { value: "__url", label: copy.url },
                                  ...variables
                                    .filter(
                                      (variable) => variable.type === "url",
                                    )
                                    .map((variable) => ({
                                      value: variable.key,
                                      label: variable.label,
                                    })),
                                ]}
                                value={
                                  selected.destination.type === "variable"
                                    ? selected.destination.key
                                    : "__url"
                                }
                                onValueChange={(destination) =>
                                  update({
                                    ...selected,
                                    destination:
                                      destination === "__url"
                                        ? {
                                            type: "url",
                                            url: "https://example.com",
                                          }
                                        : {
                                            type: "variable",
                                            key: destination,
                                          },
                                  })
                                }
                              />,
                            )}
                            {selected.destination.type === "url"
                              ? field(
                                  copy.url,
                                  <Input
                                    type="url"
                                    value={selected.destination.url}
                                    disabled={disabled}
                                    onChange={(event) =>
                                      update({
                                        ...selected,
                                        destination: {
                                          type: "url",
                                          url: event.target.value,
                                        },
                                      })
                                    }
                                  />,
                                )
                              : null}
                          </>
                        ) : null}
                        {selected.type === "code"
                          ? field(
                              copy.variable,
                              <EmailEditorSelect
                                label={copy.variable}
                                disabled={disabled}
                                value={selected.variable}
                                options={variables
                                  .filter(
                                    (variable) => variable.type === "text",
                                  )
                                  .map((variable) => ({
                                    value: variable.key,
                                    label: variable.label,
                                  }))}
                                onValueChange={(variable) =>
                                  update({
                                    ...selected,
                                    variable,
                                  })
                                }
                              />,
                            )
                          : null}
                        {selected.type === "logo" ||
                        selected.type === "image" ? (
                          <>
                            {field(
                              copy.src,
                              <Input
                                type="url"
                                value={selected.src}
                                disabled={disabled}
                                onChange={(event) =>
                                  update({
                                    ...selected,
                                    src: event.target.value,
                                  })
                                }
                              />,
                            )}
                            {field(
                              copy.alt,
                              <Input
                                value={selected.alt}
                                disabled={disabled}
                                onChange={(event) =>
                                  update({
                                    ...selected,
                                    alt: event.target.value,
                                  })
                                }
                              />,
                            )}
                            {field(
                              copy.width,
                              <Input
                                type="number"
                                min={32}
                                max={560}
                                value={selected.width}
                                disabled={disabled}
                                onChange={(event) =>
                                  update({
                                    ...selected,
                                    width: event.target.valueAsNumber,
                                  })
                                }
                              />,
                            )}
                          </>
                        ) : null}
                        {selected.type === "spacer"
                          ? field(
                              copy.height,
                              <Input
                                type="number"
                                min={0}
                                max={96}
                                value={selected.height}
                                disabled={disabled}
                                onChange={(event) =>
                                  update({
                                    ...selected,
                                    height: event.target.valueAsNumber,
                                  })
                                }
                              />,
                            )
                          : null}
                        <div className="flex flex-wrap items-center gap-2 sm:col-span-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={disabled || value.elements.length >= 40}
                            onClick={() => {
                              const duplicate = {
                                ...selected,
                                id: crypto.randomUUID(),
                              };
                              const index = value.elements.findIndex(
                                (element) => element.id === selected.id,
                              );
                              onChange({
                                ...value,
                                elements: [
                                  ...value.elements.slice(0, index + 1),
                                  duplicate,
                                  ...value.elements.slice(index + 1),
                                ],
                              });
                              setActive(duplicate.id);
                            }}
                          >
                            <Copy className="size-3.5" />
                            {copy.duplicate}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="text-destructive"
                            disabled={disabled}
                            onClick={() => {
                              document.getElementById(`${id}-add`)?.focus();
                              onChange({
                                ...value,
                                elements: value.elements.filter(
                                  (element) => element.id !== selected.id,
                                ),
                              });
                              setActive(null);
                              setSettingsOpen(false);
                            }}
                          >
                            <Trash2 className="size-3.5" />
                            {copy.remove}
                          </Button>
                        </div>
                      </div>
                    )}
                  </Popover.Popup>
                </Popover.Positioner>
              </Popover.Portal>
            </Popover.Root>
          </div>
          <p className="text-muted-foreground text-xs">{copy.local}</p>
        </TabsContent>
      </Tabs>
      {invalid ? (
        <p role="alert" className="text-destructive text-xs">
          {copy.invalid}
        </p>
      ) : null}
    </div>
  );
};
