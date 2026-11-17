import { Schema } from "effect";
import {
  useEffect,
  useEffectEvent,
  useId,
  useRef,
  useState,
  type ReactNode,
  type CSSProperties,
} from "react";
import {
  Bold,
  Italic,
  Underline,
  Undo2,
  Redo2,
  Link2,
  Unlink,
  Braces,
  ChevronDown,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useKrakstackLocale } from "@/components/ui/krakstack-provider";
import {
  RichTextDocument,
  RichTextLink,
  RichTextBlockKind,
  type RichTextInline,
  type RichTextMarks,
  type RichTextVariable,
} from "@/lib/rich-text/schema";
import {
  formatRichText,
  replaceRichText,
  richTextMarksAt,
  richTextPlainText,
  setRichTextBlock,
  type TextSelection,
} from "@/lib/rich-text/model";
import {
  readRichTextDOM,
  readEditorSelection,
  restoreRichTextSelection,
  writeRichTextDOM,
} from "@/lib/rich-text/dom";

const labels = {
  en: {
    bold: "Bold",
    italic: "Italic",
    underline: "Underline",
    undo: "Undo",
    redo: "Redo",
    link: "Link",
    unlink: "Remove link",
    linkUrl: "Link URL",
    apply: "Apply link",
    variable: "Insert variable",
    paragraph: "Paragraph",
    heading: "Heading",
    bullet: "Bulleted list",
    numbered: "Numbered list",
    toolbar: "Text formatting",
    invalid: "The content is too long or contains an unsupported value.",
    invalidLink: "Enter an HTTPS or mailto link.",
    cancel: "Cancel",
  },
  fr: {
    bold: "Gras",
    italic: "Italique",
    underline: "Souligné",
    undo: "Annuler",
    redo: "Rétablir",
    link: "Lien",
    unlink: "Retirer le lien",
    linkUrl: "URL du lien",
    apply: "Appliquer le lien",
    variable: "Insérer une variable",
    paragraph: "Paragraphe",
    heading: "Titre",
    bullet: "Liste à puces",
    numbered: "Liste numérotée",
    toolbar: "Mise en forme",
    invalid:
      "Le contenu est trop long ou contient une valeur non prise en charge.",
    invalidLink: "Saisissez un lien HTTPS ou mailto.",
    cancel: "Annuler",
  },
};
export type RichTextEditorMessages = { [K in keyof typeof labels.en]: string };
export type RichTextEditorProps = {
  value: RichTextDocument;
  onChange: (value: RichTextDocument) => void;
  label: string;
  variables?: readonly RichTextVariable[];
  disabled?: boolean;
  locale?: string;
  messages?: Partial<Record<string, Partial<RichTextEditorMessages>>>;
  className?: string;
  contentStyle?: CSSProperties;
  /** Plain single-line text with atomic variables, suitable for email headers. */
  singleLine?: boolean;
  /** Limit serialized text, including {{variable}} tokens. */
  maxLength?: number;
};
const equivalent = Schema.toEquivalence(RichTextDocument);
type Snapshot = { value: RichTextDocument; selection: TextSelection };
const ToolButton = ({
  label,
  children,
  onClick,
  pressed,
  disabled,
}: {
  label: string;
  children: ReactNode;
  onClick: () => void;
  pressed?: boolean;
  disabled?: boolean;
}) => (
  <Button
    type="button"
    size="icon-sm"
    variant={pressed ? "secondary" : "ghost"}
    aria-label={label}
    title={label}
    aria-pressed={pressed}
    disabled={disabled}
    onPointerDown={(event) => event.preventDefault()}
    onClick={onClick}
  >
    {children}
  </Button>
);

const inlineContent = (
  inline: RichTextInline,
  variables: readonly RichTextVariable[],
  values?: Readonly<Record<string, string>>,
): ReactNode => {
  let content: ReactNode =
    inline.type === "text"
      ? inline.text
      : (values?.[inline.key] ?? (
          <span
            contentEditable={false}
            data-rich-variable={inline.key}
            className="inline-block rounded bg-indigo-50 px-1.5 font-mono text-[0.85em] text-indigo-800 select-all"
          >
            {`{{${variables.find((variable) => variable.key === inline.key)?.label ?? inline.key}}}`}
          </span>
        ));
  if (inline.marks?.bold) content = <strong>{content}</strong>;
  if (inline.marks?.italic) content = <em>{content}</em>;
  if (inline.marks?.underline) content = <u>{content}</u>;
  if (inline.marks?.href)
    content = (
      <a href={inline.marks.href} className="underline">
        {content}
      </a>
    );
  return content;
};

export const RichTextContent = ({
  value,
  variables = [],
  values,
}: {
  value: RichTextDocument;
  variables?: readonly RichTextVariable[];
  values?: Readonly<Record<string, string>>;
}) => (
  <>
    {value.blocks.map((block, index) => {
      const content = block.content.map((inline, key) => (
        <span key={key}>{inlineContent(inline, variables, values)}</span>
      ));
      if (block.type === "heading")
        return (
          <h2 key={index} className="text-xl font-semibold">
            {content.length ? content : <br />}
          </h2>
        );
      return (
        <div
          key={index}
          data-rich-kind={block.type}
          style={
            block.type === "bullet" || block.type === "numbered"
              ? {
                  display: "list-item",
                  marginLeft: "1.5em",
                  listStyleType: block.type === "bullet" ? "disc" : "decimal",
                }
              : undefined
          }
        >
          {content.length ? content : <br />}
        </div>
      );
    })}
  </>
);

/** Native editable DOM is normalized into a constrained, HTML-free document. */
export const RichTextEditor = ({
  value,
  onChange,
  label,
  variables = [],
  disabled,
  locale: override,
  messages,
  className,
  contentStyle,
  singleLine = false,
  maxLength,
}: RichTextEditorProps) => {
  const locale = useKrakstackLocale(override);
  const copy = {
    ...(locale.startsWith("fr") ? labels.fr : labels.en),
    ...messages?.[locale.split("-")[0] ?? locale],
    ...messages?.[locale],
  };
  const root = useRef<HTMLDivElement>(null);
  const model = useRef(value);
  const composing = useRef(false);
  const selected = useRef<TextSelection>({ from: 0, to: 0 });
  const history = useRef<Snapshot[]>([
    { value, selection: { from: 0, to: 0 } },
  ]);
  const cursor = useRef(0);
  const [marks, setMarks] = useState<RichTextMarks>({});
  const pendingMarks = useRef<RichTextMarks | null>(null);
  const [error, setError] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [link, setLink] = useState("");
  const [linkError, setLinkError] = useState(false);
  const [revision, setRevision] = useState(0);
  const [historyState, setHistoryState] = useState({
    undo: false,
    redo: false,
  });
  const id = useId();
  const [initial] = useState(() => (
    <RichTextContent value={value} variables={variables} />
  ));

  const selection = () => {
    const element = root.current;
    if (!element) return selected.current;
    const next = readEditorSelection(element, readRichTextDOM(element).points);
    if (next) selected.current = next;
    return selected.current;
  };
  const focusEditor = () => {
    const element = root.current;
    if (element) {
      element.focus();
      restoreRichTextSelection(element, selected.current);
    }
    return false;
  };
  const commit = (
    next: RichTextDocument,
    range: TextSelection,
    write = true,
    record = true,
  ) => {
    const element = root.current;
    if (!element || disabled) return;
    const original = next;
    if (singleLine) {
      next = {
        version: 1,
        blocks: [
          {
            type: "paragraph",
            content: next.blocks.flatMap((block, index) => [
              ...(index
                ? [{ type: "text", text: " " } satisfies RichTextInline]
                : []),
              ...block.content.map((inline): RichTextInline =>
                inline.type === "variable"
                  ? { type: "variable", key: inline.key }
                  : {
                      type: "text",
                      text: inline.text.replace(/[\r\n]+/g, " "),
                    },
              ),
            ]),
          },
        ],
      };
      if (!equivalent(original, next)) write = true;
    }
    if (
      !Schema.is(RichTextDocument)(next) ||
      (maxLength !== undefined && richTextPlainText(next).length > maxLength)
    ) {
      setError(true);
      writeRichTextDOM(element, model.current, variables);
      element.focus();
      restoreRichTextSelection(element, selected.current);
      return;
    }
    setError(false);
    if (record && !equivalent(model.current, next)) {
      history.current[cursor.current] = {
        value: model.current,
        selection: selected.current,
      };
      history.current = [
        ...history.current.slice(0, cursor.current + 1),
        { value: next, selection: range },
      ].slice(-100);
      cursor.current = history.current.length - 1;
    }
    model.current = next;
    selected.current = range;
    if (write) {
      writeRichTextDOM(element, next, variables);
      element.focus();
      restoreRichTextSelection(element, range);
    }
    setRevision((current) => current + 1);
    setHistoryState({
      undo: cursor.current > 0,
      redo: cursor.current < history.current.length - 1,
    });
    onChange(next);
  };
  const travel = (direction: number) => {
    const index = Math.max(
      0,
      Math.min(history.current.length - 1, cursor.current + direction),
    );
    const snapshot = history.current[index];
    if (!snapshot || index === cursor.current) return;
    cursor.current = index;
    pendingMarks.current = null;
    commit(snapshot.value, snapshot.selection, true, false);
  };
  const insert = (inline: RichTextInline) => {
    const result = replaceRichText(model.current, selection(), inline);
    commit(result.value, result.selection);
  };
  const format = (mark: "bold" | "italic" | "underline") => {
    const range = selection();
    const next = {
      ...(pendingMarks.current ?? richTextMarksAt(model.current, range.to)),
      [mark]: !marks[mark],
    };
    setMarks(next);
    if (range.from === range.to) {
      pendingMarks.current = next;
      root.current?.focus();
    } else
      commit(formatRichText(model.current, range, mark, next[mark]), range);
  };
  const syncInput = () => {
    const element = root.current;
    if (!element || composing.current) return;
    const parsed = readRichTextDOM(element);
    const range =
      readEditorSelection(element, parsed.points) ?? selected.current;
    if (parsed.value) commit(parsed.value, range, false);
    else {
      setError(true);
      writeRichTextDOM(element, model.current, variables);
      restoreRichTextSelection(element, selected.current);
    }
  };
  const beforeInput = useEffectEvent((event: InputEvent) => {
    if (disabled || composing.current || event.isComposing) return;
    if (
      event.inputType === "historyUndo" ||
      event.inputType === "historyRedo"
    ) {
      event.preventDefault();
      travel(event.inputType === "historyUndo" ? -1 : 1);
    } else if (
      ["insertText", "insertParagraph", "insertLineBreak"].includes(
        event.inputType,
      )
    ) {
      event.preventDefault();
      if (singleLine && event.inputType !== "insertText") return;
      const range = selection();
      insert({
        type: "text",
        text: event.inputType === "insertText" ? (event.data ?? "") : "\n",
        marks: pendingMarks.current ?? richTextMarksAt(model.current, range.to),
      });
    } else if (
      event.inputType === "formatBold" ||
      event.inputType === "formatItalic" ||
      event.inputType === "formatUnderline"
    ) {
      event.preventDefault();
      if (!singleLine)
        format(
          event.inputType === "formatBold"
            ? "bold"
            : event.inputType === "formatItalic"
              ? "italic"
              : "underline",
        );
    }
  });
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const listener = (event: InputEvent) => beforeInput(event);
    element.addEventListener("beforeinput", listener);
    return () => element.removeEventListener("beforeinput", listener);
  }, []);
  const remember = useEffectEvent(() => {
    const element = root.current;
    if (!element || document.activeElement !== element || composing.current)
      return;
    const previous = selected.current;
    const range = selection();
    if (previous.from !== range.from || previous.to !== range.to)
      pendingMarks.current = null;
    setMarks(pendingMarks.current ?? richTextMarksAt(model.current, range.to));
  });
  useEffect(() => {
    document.addEventListener("selectionchange", remember);
    return () => document.removeEventListener("selectionchange", remember);
  }, []);
  useEffect(() => {
    const element = root.current;
    if (!element || composing.current) return;
    if (!equivalent(model.current, value)) {
      model.current = value;
      history.current = [{ value, selection: { from: 0, to: 0 } }];
      cursor.current = 0;
      selected.current = { from: 0, to: 0 };
      writeRichTextDOM(element, value, variables);
      setRevision((current) => current + 1);
      setHistoryState({ undo: false, redo: false });
    }
  }, [value, variables]);

  return (
    <div
      data-slot="rich-text-editor"
      className={`bg-background text-foreground overflow-hidden rounded-xl border ${className ?? ""}`}
      data-revision={revision}
    >
      <div
        role="group"
        aria-label={copy.toolbar}
        className="bg-muted/30 flex flex-wrap items-center gap-1 border-b p-2"
      >
        <ToolButton
          label={copy.undo}
          disabled={disabled || !historyState.undo}
          onClick={() => travel(-1)}
        >
          <Undo2 />
        </ToolButton>
        <ToolButton
          label={copy.redo}
          disabled={disabled || !historyState.redo}
          onClick={() => travel(1)}
        >
          <Redo2 />
        </ToolButton>
        {!singleLine ? (
          <>
            <span className="mx-1 h-5 border-l" aria-hidden />
            <Select
              disabled={disabled}
              defaultValue="paragraph"
              items={[
                { value: "paragraph", label: copy.paragraph },
                { value: "heading", label: copy.heading },
                { value: "bullet", label: copy.bullet },
                { value: "numbered", label: copy.numbered },
              ]}
              onOpenChange={(open) => {
                if (open) selection();
              }}
              onValueChange={(value) => {
                const type = Schema.decodeUnknownSync(RichTextBlockKind)(value);
                const range = selection();
                commit(setRichTextBlock(model.current, range, type), range);
              }}
            >
              <SelectTrigger
                size="sm"
                aria-label={copy.paragraph}
                className="max-w-40 text-xs"
                onPointerDown={selection}
                onFocus={selection}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent
                align="start"
                alignItemWithTrigger={false}
                finalFocus={focusEditor}
              >
                <SelectItem value="paragraph">{copy.paragraph}</SelectItem>
                <SelectItem value="heading">{copy.heading}</SelectItem>
                <SelectItem value="bullet">{copy.bullet}</SelectItem>
                <SelectItem value="numbered">{copy.numbered}</SelectItem>
              </SelectContent>
            </Select>
            <ToolButton
              label={copy.bold}
              disabled={disabled}
              pressed={!!marks.bold}
              onClick={() => format("bold")}
            >
              <Bold />
            </ToolButton>
            <ToolButton
              label={copy.italic}
              disabled={disabled}
              pressed={!!marks.italic}
              onClick={() => format("italic")}
            >
              <Italic />
            </ToolButton>
            <ToolButton
              label={copy.underline}
              disabled={disabled}
              pressed={!!marks.underline}
              onClick={() => format("underline")}
            >
              <Underline />
            </ToolButton>
            <ToolButton
              label={copy.link}
              disabled={disabled}
              pressed={linkOpen || !!marks.href}
              onClick={() => {
                selection();
                setLink(marks.href ?? "");
                setLinkError(false);
                setLinkOpen(!linkOpen);
              }}
            >
              <Link2 />
            </ToolButton>
          </>
        ) : null}
        {variables.length ? (
          <DropdownMenu
            onOpenChange={(open) => {
              if (open) selection();
            }}
          >
            <DropdownMenuTrigger
              disabled={disabled}
              onPointerDown={selection}
              onFocus={selection}
              render={
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="ml-auto text-xs"
                />
              }
            >
              <Braces className="size-3.5" aria-hidden />
              {copy.variable}
              <ChevronDown className="size-3.5" aria-hidden />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" finalFocus={focusEditor}>
              {variables.map((variable) => (
                <DropdownMenuItem
                  key={variable.key}
                  onClick={() =>
                    insert({ type: "variable", key: variable.key })
                  }
                >
                  {variable.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>
      {linkOpen ? (
        <div className="flex flex-wrap items-end gap-2 border-b p-3">
          <label className="grid min-w-0 flex-1 gap-1 text-xs">
            {copy.linkUrl}
            <Input
              value={link}
              aria-invalid={linkError}
              placeholder="https://"
              onChange={(event) => setLink(event.target.value)}
            />
          </label>
          <Button
            type="button"
            size="sm"
            disabled={disabled}
            onClick={() => {
              if (!Schema.is(RichTextLink)(link)) {
                setLinkError(true);
                return;
              }
              commit(
                formatRichText(model.current, selected.current, "href", link),
                selected.current,
              );
              setLinkOpen(false);
            }}
          >
            {copy.apply}
          </Button>
          {marks.href ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={disabled}
              onClick={() => {
                commit(
                  formatRichText(
                    model.current,
                    selected.current,
                    "href",
                    undefined,
                  ),
                  selected.current,
                );
                setLinkOpen(false);
                setLinkError(false);
              }}
            >
              <Unlink aria-hidden />
              {copy.unlink}
            </Button>
          ) : null}
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setLinkOpen(false)}
          >
            {copy.cancel}
          </Button>
          {linkError ? (
            <p role="alert" className="text-destructive w-full text-xs">
              {copy.invalidLink}
            </p>
          ) : null}
        </div>
      ) : null}
      <div
        ref={root}
        style={contentStyle}
        role="textbox"
        aria-label={label}
        aria-multiline={!singleLine}
        aria-disabled={disabled}
        aria-describedby={error ? `${id}-error` : undefined}
        contentEditable={!disabled}
        suppressContentEditableWarning
        className={`focus-visible:ring-ring ${singleLine ? "min-h-10" : "min-h-32"} px-4 py-3 text-sm leading-relaxed outline-none focus-visible:ring-2 focus-visible:ring-inset [&>div]:min-h-[1.5em]`}
        onInput={syncInput}
        onKeyUp={selection}
        onPointerUp={selection}
        onBlur={selection}
        onCompositionStart={() => {
          composing.current = true;
        }}
        onCompositionEnd={() => {
          composing.current = false;
          syncInput();
        }}
        onPaste={(event) => {
          event.preventDefault();
          const text = event.clipboardData.getData("text/plain");
          insert({
            type: "text",
            text: singleLine ? text.replace(/[\r\n]+/g, " ") : text,
          });
        }}
        onDrop={(event) => event.preventDefault()}
        onClick={(event) => {
          if (event.target instanceof HTMLElement && event.target.closest("a"))
            event.preventDefault();
        }}
        onKeyDown={(event) => {
          if (event.nativeEvent.isComposing) return;
          if ((event.ctrlKey || event.metaKey) && !event.altKey) {
            const key = event.key.toLowerCase();
            if (["b", "i", "u", "z", "y"].includes(key)) {
              event.preventDefault();
              if (key === "z" || key === "y")
                travel(key === "y" || event.shiftKey ? 1 : -1);
              else if (!singleLine)
                format(
                  key === "b" ? "bold" : key === "i" ? "italic" : "underline",
                );
            }
          }
        }}
      >
        {initial}
      </div>
      {error ? (
        <p
          id={`${id}-error`}
          role="alert"
          className="text-destructive px-4 pb-3 text-xs"
        >
          {copy.invalid}
        </p>
      ) : null}
    </div>
  );
};
