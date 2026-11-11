import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import {
  ArrowDownIcon,
  BotIcon,
  Maximize2Icon,
  MessageCircleDashedIcon,
  Minimize2Icon,
  MinusIcon,
  SendIcon,
  SquareIcon,
  WrenchIcon,
  XIcon,
} from "lucide-react";
import type { AgentEvent } from "../schema";

import { MarkdownContent } from "@/lib/markdown/content";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentMedia,
  AttachmentTitle,
} from "@/components/ui/attachment";
import { Badge } from "@/components/ui/badge";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import { Button } from "@/components/ui/button";
import { CodeBlock } from "@/components/ui/code-block";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogClose,
  DialogHeader,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemFooter,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { Message, MessageContent } from "@/components/ui/message";
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@/components/ui/message-scroller";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Trace,
  TraceCollapsible,
  TraceCollapsibleContent,
  TraceCollapsibleTrigger,
  TraceDescription,
  TraceIcon,
  TraceLine,
  TraceTitle,
} from "@/components/ui/trace";
import { cn } from "@/lib/utils";
import type {
  AgentMessage,
  AgentState,
  AgentSubmitAction,
  AgentToolActivity,
} from "@/services/agent/client/atom";
import type { AgentErrorCode, AgentReference } from "@/services/agent/schema";
import { AGENT_REFERENCE_LIMIT } from "@/services/agent/schema";

import { useKrakstackLocale } from "@/components/ui/krakstack-provider";
export type AgentWidgetReference<Resource> = AgentReference<Resource> & {
  readonly icon?: ReactNode;
  readonly key: string;
};

export type AgentWidgetMessages = {
  approve: string;
  approvalDestructive: string;
  approvalDestructiveLabel: string;
  approvalRequired: string;
  cancel: string;
  close: string;
  codeDescription: (language: string) => string;
  copied: string;
  copy: string;
  description: string;
  errorInvalidRequest: string;
  errorStreamFailed: string;
  errorUnavailable: string;
  maximize: string;
  minimize: string;
  noReferences: string;
  open: string;
  placeholder: string;
  removeContext: string;
  references: string;
  restore: string;
  scrollLatest: string;
  send: string;
  stop: string;
  title: string;
  toolActivity: string;
  toolDenied: string;
  toolFailed: string;
  toolRunning: string;
  toolWorked: (seconds: number) => string;
  viewLess: string;
  viewMore: string;
  welcome: string;
};

const messages = {
  en: {
    approve: "Approve",
    approvalDestructive:
      "This may permanently remove data. Check the action before continuing.",
    approvalDestructiveLabel: "Destructive",
    approvalRequired:
      "The assistant needs your confirmation before making this change.",
    cancel: "Cancel",
    close: "Close",
    codeDescription: (language: string) => `${language} code`,
    copied: "Copied",
    copy: "Copy",
    description: "Ask questions and use available tools to get things done.",
    errorInvalidRequest:
      "The request could not be processed. Start a new conversation and try again.",
    errorStreamFailed: "The response was interrupted. Please try again.",
    errorUnavailable: "The assistant is currently unavailable.",
    maximize: "Maximize assistant",
    minimize: "Minimize assistant",
    noReferences: "No references found.",
    open: "Open AI Assistant",
    placeholder: "Ask a question...",
    removeContext: "Remove context",
    references: "References",
    restore: "Restore assistant window",
    scrollLatest: "Scroll to latest message",
    send: "Send message",
    stop: "Stop response",
    title: "AI Assistant",
    toolActivity: "Tool activity",
    toolDenied: "Cancelled",
    toolFailed: "Failed",
    toolRunning: "Working",
    toolWorked: (seconds) =>
      `Worked for ${seconds} ${seconds === 1 ? "second" : "seconds"}`,
    viewLess: "View less",
    viewMore: "View more",
    welcome: "How can I help?",
  },
  fr: {
    approve: "Approuver",
    approvalDestructive:
      "Cette action peut supprimer définitivement des données. Vérifiez-la avant de continuer.",
    approvalDestructiveLabel: "Destructif",
    approvalRequired:
      "L'assistant a besoin de votre confirmation avant d'effectuer cette modification.",
    cancel: "Annuler",
    close: "Fermer",
    codeDescription: (language: string) => `code ${language}`,
    copied: "Copié",
    copy: "Copier",
    description:
      "Posez des questions et utilisez les outils disponibles pour accomplir vos tâches.",
    errorInvalidRequest:
      "La demande n'a pas pu être traitée. Commencez une nouvelle conversation et réessayez.",
    errorStreamFailed: "La réponse a été interrompue. Veuillez réessayer.",
    errorUnavailable: "L'assistant est actuellement indisponible.",
    maximize: "Agrandir l'assistant",
    minimize: "Réduire l'assistant",
    noReferences: "Aucune référence trouvée.",
    open: "Ouvrir l'assistant IA",
    placeholder: "Posez une question...",
    removeContext: "Supprimer le contexte",
    references: "Références",
    restore: "Restaurer la fenêtre de l'assistant",
    scrollLatest: "Défiler jusqu'au dernier message",
    send: "Envoyer le message",
    stop: "Arrêter la réponse",
    title: "Assistant IA",
    toolActivity: "Activité des outils",
    toolDenied: "Annulé",
    toolFailed: "Échec",
    toolRunning: "En cours",
    toolWorked: (seconds) =>
      `A travaillé pendant ${seconds} ${seconds === 1 ? "seconde" : "secondes"}`,
    viewLess: "Voir moins",
    viewMore: "Voir plus",
    welcome: "Comment puis-je vous aider?",
  },
} as const satisfies Record<"en" | "fr", AgentWidgetMessages>;

export type AgentWidgetMessageTranslations = Partial<
  Record<string, Partial<AgentWidgetMessages>>
>;

export const agentWidgetMessages = (
  locale = "en",
  translations?: AgentWidgetMessageTranslations,
): AgentWidgetMessages => ({
  ...(locale.startsWith("fr") ? messages.fr : messages.en),
  ...translations?.[locale.split("-")[0] ?? locale],
  ...translations?.[locale],
});

const errorMessage = (code: AgentErrorCode, labels: AgentWidgetMessages) => {
  switch (code) {
    case "invalid-request":
      return labels.errorInvalidRequest;
    case "stream-failed":
      return labels.errorStreamFailed;
    case "unavailable":
      return labels.errorUnavailable;
  }
};

type AgentToolInput = Extract<AgentEvent, { type: "tool-call" }>["input"];

const inputCode = (input: AgentToolInput) =>
  JSON.stringify(input, null, 2) ?? String(input);

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const referenceMentionPattern = (label: string) =>
  new RegExp(`@${escapeRegExp(label)}(?![\\p{L}\\p{N}_-])`, "u");

const hasReferenceMention = (input: string, label: string) =>
  referenceMentionPattern(label).test(input);

const highlightedInput = (
  input: string,
  references: ReadonlyArray<AgentWidgetReference<unknown>>,
) => {
  const mentions = references
    .map(({ label }) => `@${label}`)
    .sort((left, right) => right.length - left.length);
  if (mentions.length === 0) return input;

  const mentionPattern = new RegExp(
    `(${mentions.map(escapeRegExp).join("|")})(?![\\p{L}\\p{N}_-])`,
    "gu",
  );
  const mentionSet = new Set(mentions);
  return input.split(mentionPattern).map((part, index) =>
    mentionSet.has(part) ? (
      <span
        key={`${part}:${index}`}
        className="bg-primary text-primary-foreground rounded-sm [box-shadow:2px_0_0_var(--primary),-2px_0_0_var(--primary)]"
      >
        {part}
      </span>
    ) : (
      part
    ),
  );
};

type ReferenceSearch = {
  readonly end: number;
  readonly query: string;
  readonly start: number;
};

const referenceSearchAtCursor = (
  input: string,
  cursor: number,
): ReferenceSearch | undefined => {
  const beforeCursor = input.slice(0, cursor);
  const match = beforeCursor.match(/(?:^|\s)@([^@\n]*)$/);
  if (!match) return undefined;

  return {
    start: beforeCursor.lastIndexOf("@"),
    end: cursor,
    query: match[1].trimEnd(),
  };
};

const insertReferenceMention = (
  input: string,
  search: ReferenceSearch,
  label: string,
) => {
  const suffix = input.slice(search.end);
  const mention = `@${label}`;
  const separator = /^[ \t]/.test(suffix) ? "" : " ";

  return {
    input: `${input.slice(0, search.start)}${mention}${separator}${suffix}`,
    cursor: search.start + mention.length + 1,
  };
};

const completesSelectedReference = (
  input: string,
  search: ReferenceSearch,
  references: ReadonlyArray<AgentWidgetReference<unknown>>,
) => {
  const searchText = input.slice(search.start + 1, search.end);
  return references.some(({ label }) => searchText.startsWith(`${label} `));
};

const ToolInput = ({
  labels,
  locale,
  tool,
}: {
  readonly labels: AgentWidgetMessages;
  readonly locale: string;
  readonly tool: AgentToolActivity;
}) => (
  <div className="min-w-0 space-y-2">
    {tool.metadata.description ? <p>{tool.metadata.description}</p> : null}
    <CodeBlock
      code={inputCode(tool.input)}
      language="json"
      locale={locale}
      messages={{
        [locale]: {
          codeDescription: labels.codeDescription,
          copied: labels.copied,
          copy: labels.copy,
        },
      }}
    />
  </div>
);

const ToolApproval = ({
  disabled,
  labels,
  locale,
  onApproval,
  tool,
}: {
  readonly disabled: boolean;
  readonly labels: AgentWidgetMessages;
  readonly locale: string;
  readonly onApproval: (tool: AgentToolActivity, approved: boolean) => void;
  readonly tool: AgentToolActivity;
}) => (
  <Item
    variant="outline"
    size="sm"
    role="group"
    aria-label={tool.metadata.title ?? tool.name}
  >
    <ItemMedia variant="icon">
      <WrenchIcon />
    </ItemMedia>
    <ItemContent className="min-w-0">
      <ItemTitle className="line-clamp-none">
        {tool.metadata.title ?? tool.name}
        {tool.metadata.destructive ? (
          <Badge variant="destructive">{labels.approvalDestructiveLabel}</Badge>
        ) : null}
      </ItemTitle>
      <ItemDescription className="line-clamp-none">
        {tool.metadata.destructive
          ? labels.approvalDestructive
          : labels.approvalRequired}
      </ItemDescription>
    </ItemContent>
    <ItemActions>
      <Button
        size="sm"
        variant={tool.metadata.destructive ? "destructive" : "default"}
        disabled={disabled}
        onClick={() => onApproval(tool, true)}
      >
        {labels.approve}
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={disabled}
        onClick={() => onApproval(tool, false)}
      >
        {labels.cancel}
      </Button>
    </ItemActions>
    <ItemFooter className="block min-w-0">
      <Trace>
        <TraceCollapsible>
          <TraceCollapsibleTrigger>
            <TraceLine>
              <TraceTitle>{labels.viewMore}</TraceTitle>
            </TraceLine>
          </TraceCollapsibleTrigger>
          <TraceCollapsibleContent>
            <ToolInput labels={labels} locale={locale} tool={tool} />
          </TraceCollapsibleContent>
        </TraceCollapsible>
      </Trace>
    </ItemFooter>
  </Item>
);

const ToolActivity = ({
  labels,
  locale,
  pending,
  tool,
}: {
  readonly labels: AgentWidgetMessages;
  readonly locale: string;
  readonly pending: boolean;
  readonly tool: AgentToolActivity;
}) => {
  const running =
    pending && (tool.status === "running" || tool.status === "approved");
  const statusLabel =
    tool.status === "failed"
      ? labels.toolFailed
      : tool.status === "denied"
        ? labels.toolDenied
        : running
          ? labels.toolRunning
          : undefined;
  const line = (
    <TraceLine
      status={
        tool.status === "failed" ? "error" : running ? "running" : undefined
      }
    >
      <TraceIcon>
        <WrenchIcon />
      </TraceIcon>
      <TraceTitle>{tool.metadata.title ?? tool.name}</TraceTitle>
      {statusLabel ? <TraceDescription>{statusLabel}</TraceDescription> : null}
    </TraceLine>
  );
  if (running) return line;

  return (
    <TraceCollapsible>
      <TraceCollapsibleTrigger>{line}</TraceCollapsibleTrigger>
      <TraceCollapsibleContent>
        <ToolInput labels={labels} locale={locale} tool={tool} />
      </TraceCollapsibleContent>
    </TraceCollapsible>
  );
};

function ToolActivityLog({
  disabled,
  labels,
  locale,
  onApproval,
  pending,
  tools,
  workedSeconds,
}: {
  readonly disabled: boolean;
  readonly labels: AgentWidgetMessages;
  readonly locale: string;
  readonly onApproval: (tool: AgentToolActivity, approved: boolean) => void;
  readonly pending: boolean;
  readonly tools: ReadonlyArray<AgentToolActivity>;
  readonly workedSeconds?: number;
}) {
  const [open, setOpen] = useState<boolean>();
  const approvals = tools.filter((tool) => tool.status === "approval-required");
  const activity = tools.filter((tool) => tool.status !== "approval-required");
  const currentTool = activity.at(-1);
  const running = pending && approvals.length === 0;
  const failed = activity.some((tool) => tool.status === "failed");

  if (tools.length === 0) {
    return (
      <Trace>
        <TraceLine status={pending ? "running" : undefined}>
          <TraceIcon>
            <WrenchIcon />
          </TraceIcon>
          <TraceTitle>{labels.toolRunning}</TraceTitle>
        </TraceLine>
      </Trace>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {currentTool ? (
        <Trace>
          <TraceCollapsible open={open ?? running} onOpenChange={setOpen}>
            <TraceCollapsibleTrigger>
              <TraceLine
                status={failed ? "error" : running ? "running" : undefined}
              >
                <TraceIcon>
                  <WrenchIcon />
                </TraceIcon>
                <TraceTitle>
                  {approvals.length > 0 || running
                    ? labels.toolActivity
                    : workedSeconds !== undefined
                      ? labels.toolWorked(workedSeconds)
                      : (currentTool.metadata.title ?? currentTool.name)}
                </TraceTitle>
                {failed || running ? (
                  <TraceDescription>
                    {failed ? labels.toolFailed : labels.toolRunning}
                  </TraceDescription>
                ) : null}
              </TraceLine>
            </TraceCollapsibleTrigger>
            <TraceCollapsibleContent>
              <Trace>
                {activity.map((tool) => (
                  <ToolActivity
                    key={tool.toolCallId}
                    labels={labels}
                    locale={locale}
                    pending={pending}
                    tool={tool}
                  />
                ))}
              </Trace>
            </TraceCollapsibleContent>
          </TraceCollapsible>
        </Trace>
      ) : null}
      {approvals.map((tool) => (
        <ToolApproval
          key={tool.toolCallId}
          disabled={disabled}
          labels={labels}
          locale={locale}
          onApproval={onApproval}
          tool={tool}
        />
      ))}
    </div>
  );
}

function AgentMessageRow({
  disabled,
  labels,
  locale,
  message,
  onApproval,
  pending,
}: {
  readonly disabled: boolean;
  readonly labels: AgentWidgetMessages;
  readonly locale: string;
  readonly message: AgentMessage;
  readonly onApproval: (tool: AgentToolActivity, approved: boolean) => void;
  readonly pending: boolean;
}) {
  const isUser = message.role === "user";
  const activeStartedAt = useRef<number | undefined>(undefined);
  const activeMilliseconds = useRef(0);
  const wasPending = useRef(pending);
  const [workedSeconds, setWorkedSeconds] = useState<number>();
  const hasPendingApproval = message.tools.some(
    (tool) => tool.status === "approval-required",
  );

  useEffect(() => {
    const isWorking = pending && !hasPendingApproval;

    if (isWorking) {
      wasPending.current = true;
      activeStartedAt.current ??= Date.now();
      return;
    }

    if (activeStartedAt.current !== undefined) {
      activeMilliseconds.current += Date.now() - activeStartedAt.current;
      activeStartedAt.current = undefined;
    }

    const completed =
      !isUser &&
      message.tools.length > 0 &&
      !hasPendingApproval &&
      (message.text.length > 0 || !pending);
    if (!completed || !wasPending.current || workedSeconds !== undefined) {
      return;
    }

    setWorkedSeconds(
      Math.max(1, Math.round(activeMilliseconds.current / 1000)),
    );
  }, [
    hasPendingApproval,
    isUser,
    message.text,
    message.tools.length,
    pending,
    workedSeconds,
  ]);

  return (
    <Message align={isUser ? "end" : "start"}>
      <MessageContent>
        {!isUser && (message.tools.length > 0 || (pending && !message.text)) ? (
          <ToolActivityLog
            disabled={disabled}
            labels={labels}
            locale={locale}
            onApproval={onApproval}
            pending={pending}
            tools={message.tools}
            workedSeconds={workedSeconds}
          />
        ) : null}
        {message.text ? (
          isUser ? (
            <Bubble align="end">
              <BubbleContent className="whitespace-pre-wrap">
                {message.text}
              </BubbleContent>
            </Bubble>
          ) : (
            <Bubble variant="ghost" className="w-full">
              <BubbleContent className="w-full">
                {message.markdown ? (
                  <MarkdownContent
                    className="w-full"
                    codeBlocks={message.markdown.codeBlocks}
                    html={message.markdown.html}
                    messages={{
                      [locale]: {
                        codeDescription: labels.codeDescription,
                        copied: labels.copied,
                        copy: labels.copy,
                      },
                    }}
                    locale={locale}
                  />
                ) : (
                  <div className="whitespace-pre-wrap">{message.text}</div>
                )}
              </BubbleContent>
            </Bubble>
          )
        ) : null}
      </MessageContent>
    </Message>
  );
}

export function AgentWidget<Resource = never>({
  availableReferences = [],
  context,
  locale: localeOverride,
  messages: messageOverrides,
  onInterrupt,
  onRemoveContext,
  onReset,
  onSubmit,
  state,
}: {
  readonly availableReferences?: ReadonlyArray<AgentWidgetReference<Resource>>;
  readonly context?: AgentWidgetReference<Resource>;
  readonly locale?: string;
  readonly messages?: AgentWidgetMessageTranslations;
  readonly onInterrupt: () => void;
  readonly onRemoveContext?: () => void;
  readonly onReset: () => void;
  readonly onSubmit: (action: AgentSubmitAction<Resource>) => void;
  readonly state: AgentState<Resource>;
}) {
  const locale = useKrakstackLocale(localeOverride);
  const labels = agentWidgetMessages(locale, messageOverrides);
  const referenceInputId = useId();
  const referenceListId = `${referenceInputId}-list`;
  const [open, setOpen] = useState(false);
  const [maximized, setMaximized] = useState(false);
  const [referencePickerOpen, setReferencePickerOpen] = useState(false);
  const [activeReferenceKey, setActiveReferenceKey] = useState("");
  const [activeReferenceSearch, setActiveReferenceSearch] =
    useState<ReferenceSearch>();
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const inputOverlayRef = useRef<HTMLDivElement>(null);
  const [references, setReferences] = useState<
    ReadonlyArray<AgentWidgetReference<Resource>>
  >([]);
  const activeContext: AgentWidgetReference<Resource> | undefined =
    state.contextLocked
      ? state.context
        ? {
            ...state.context,
            icon: availableReferences.find(
              ({ key }) => key === state.context?.key,
            )?.icon,
          }
        : undefined
      : context;
  const referenceQuery = activeReferenceSearch?.query;
  const selectedKeys = new Set(references.map(({ key }) => key));
  const selectedLabels = new Set(references.map(({ label }) => label));
  const selectableReferences = availableReferences.filter(
    (reference) =>
      references.length < AGENT_REFERENCE_LIMIT &&
      reference.key !== activeContext?.key &&
      !selectedKeys.has(reference.key) &&
      !selectedLabels.has(reference.label),
  );
  const matchingReferences = selectableReferences.filter((reference) =>
    referenceQuery === undefined
      ? false
      : `${reference.label} ${reference.key}`
          .toLocaleLowerCase()
          .includes(referenceQuery.toLocaleLowerCase()),
  );
  const activeReferenceIndex = Math.max(
    0,
    matchingReferences.findIndex(
      (reference) => reference.key === activeReferenceKey,
    ),
  );
  const activeReference = matchingReferences[activeReferenceIndex];
  const hasPendingApproval = state.messages.some((message) =>
    message.tools.some((tool) => tool.status === "approval-required"),
  );

  const sendMessage = () => {
    const text = input.trim();
    if (!text || state.pending || hasPendingApproval) return;

    setInput("");
    setReferences([]);
    setActiveReferenceSearch(undefined);
    setReferencePickerOpen(false);
    const messageReferences =
      references.length > 0
        ? references.map(({ label, resource }) => ({ label, resource }))
        : undefined;
    const action: AgentSubmitAction<Resource> = {
      type: "message",
      text,
      references: messageReferences,
    };
    onSubmit(action);
  };

  const respondToApproval = (tool: AgentToolActivity, approved: boolean) => {
    if (!tool.approvalId || state.pending) return;

    onSubmit({
      type: "approval",
      approvalId: tool.approvalId,
      toolCallId: tool.toolCallId,
      approved,
    });
  };

  const selectReference = (reference: AgentWidgetReference<Resource>) => {
    if (!activeReferenceSearch) return;

    const replacement = insertReferenceMention(
      input,
      activeReferenceSearch,
      reference.label,
    );
    setReferences((current) => [...current, reference]);
    setInput(replacement.input);
    setActiveReferenceSearch(undefined);
    setReferencePickerOpen(false);
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.setSelectionRange(
        replacement.cursor,
        replacement.cursor,
      );
    });
  };

  const clearConversation = () => {
    onInterrupt();
    onReset();
    setInput("");
    setReferences([]);
    setActiveReferenceSearch(undefined);
    setReferencePickerOpen(false);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      clearConversation();
      setMaximized(false);
    }
    setOpen(nextOpen);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
      modal={false}
      disablePointerDismissal
    >
      <DialogTrigger
        render={
          <Button
            size="icon-lg"
            className="fixed right-4 bottom-4 z-9999 rounded-full shadow-lg md:right-6 md:bottom-6"
          />
        }
      >
        <BotIcon />
        <span className="sr-only">{labels.open}</span>
      </DialogTrigger>
      <DialogPortal>
        <DialogPrimitive.Popup
          data-slot="dialog-content"
          className={cn(
            "bg-popover text-popover-foreground ring-foreground/10 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 fixed z-50 flex flex-col gap-0 overflow-hidden rounded-xl text-sm shadow-lg ring-1 duration-100 outline-none",
            maximized
              ? "inset-4 max-h-none max-w-none md:inset-6"
              : "right-4 bottom-20 h-[min(42rem,calc(100svh-6rem))] w-[calc(100%-2rem)] max-w-md md:right-6",
          )}
        >
          <DialogHeader className="shrink-0 border-b p-4">
            <div className="flex items-center gap-1">
              <DialogTitle className="min-w-0 flex-1 truncate text-sm leading-none font-medium">
                {labels.title}
              </DialogTitle>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setOpen(false)}
              >
                <MinusIcon />
                <span className="sr-only">{labels.minimize}</span>
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setMaximized((current) => !current)}
              >
                {maximized ? <Minimize2Icon /> : <Maximize2Icon />}
                <span className="sr-only">
                  {maximized ? labels.restore : labels.maximize}
                </span>
              </Button>
              <DialogClose render={<Button variant="ghost" size="icon-sm" />}>
                <XIcon />
                <span className="sr-only">{labels.close}</span>
              </DialogClose>
            </div>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-hidden">
            {state.messages.length === 0 && !state.error ? (
              <Empty className="h-full">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <MessageCircleDashedIcon />
                  </EmptyMedia>
                  <EmptyTitle>{labels.welcome}</EmptyTitle>
                  <EmptyDescription>{labels.description}</EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <MessageScrollerProvider autoScroll>
                <MessageScroller>
                  <MessageScrollerViewport aria-label={labels.title}>
                    <MessageScrollerContent
                      aria-busy={state.pending}
                      className="p-4"
                    >
                      {state.messages.map((message, index) => (
                        <MessageScrollerItem
                          key={message.id}
                          messageId={message.id}
                          scrollAnchor={message.role === "user"}
                        >
                          <AgentMessageRow
                            disabled={state.pending}
                            labels={labels}
                            locale={locale}
                            message={message}
                            onApproval={respondToApproval}
                            pending={
                              state.pending &&
                              index === state.messages.length - 1
                            }
                          />
                        </MessageScrollerItem>
                      ))}
                      {state.error ? (
                        <MessageScrollerItem messageId="error">
                          <Alert variant="destructive">
                            <AlertTitle>{labels.title}</AlertTitle>
                            <AlertDescription>
                              {errorMessage(state.error, labels)}
                            </AlertDescription>
                          </Alert>
                        </MessageScrollerItem>
                      ) : null}
                    </MessageScrollerContent>
                  </MessageScrollerViewport>
                  <MessageScrollerButton>
                    <ArrowDownIcon />
                    <span className="sr-only">{labels.scrollLatest}</span>
                  </MessageScrollerButton>
                </MessageScroller>
              </MessageScrollerProvider>
            )}
          </div>

          <form
            className="shrink-0 border-t p-3"
            onSubmit={(event) => {
              event.preventDefault();
              sendMessage();
            }}
          >
            <InputGroup>
              {activeContext ? (
                <InputGroupAddon align="block-start">
                  <Attachment size="xs" className="min-w-0">
                    {activeContext.icon ? (
                      <AttachmentMedia>{activeContext.icon}</AttachmentMedia>
                    ) : null}
                    <AttachmentContent>
                      <AttachmentTitle>{activeContext.label}</AttachmentTitle>
                    </AttachmentContent>
                    {onRemoveContext ? (
                      <AttachmentActions>
                        <AttachmentAction
                          type="button"
                          aria-label={`${labels.removeContext}: ${activeContext.label}`}
                          onClick={onRemoveContext}
                        >
                          <XIcon />
                        </AttachmentAction>
                      </AttachmentActions>
                    ) : null}
                  </Attachment>
                </InputGroupAddon>
              ) : null}
              <div className="relative w-full min-w-0 self-stretch text-left">
                <div
                  ref={inputOverlayRef}
                  aria-hidden="true"
                  className="text-foreground pointer-events-none absolute inset-0 [scrollbar-width:thin] [scrollbar-gutter:stable] overflow-hidden px-2.5 py-2 text-left font-[inherit] text-base break-words whitespace-pre-wrap md:text-sm"
                >
                  {highlightedInput(input, references)}
                </div>
                <Popover
                  open={referencePickerOpen}
                  triggerId={referenceInputId}
                >
                  <PopoverTrigger
                    id={referenceInputId}
                    nativeButton={false}
                    // Keep textarea keys from activating the trigger as a button.
                    onKeyDown={(event) => event.preventBaseUIHandler()}
                    onKeyUp={(event) => event.preventBaseUIHandler()}
                    render={
                      <InputGroupTextarea
                        ref={inputRef}
                        className="caret-foreground selection:bg-primary selection:text-primary-foreground relative max-h-32 w-full [scrollbar-width:thin] [scrollbar-color:var(--border)_transparent] [scrollbar-gutter:stable] overflow-y-auto overscroll-contain text-left text-transparent"
                        value={input}
                        placeholder={labels.placeholder}
                        aria-label={labels.placeholder}
                        aria-activedescendant={
                          referencePickerOpen && activeReference
                            ? `${referenceInputId}-reference-${activeReferenceIndex}`
                            : undefined
                        }
                        aria-autocomplete="list"
                        aria-controls={referenceListId}
                        aria-expanded={referencePickerOpen}
                        disabled={state.pending || hasPendingApproval}
                        role="combobox"
                        rows={2}
                        onScroll={(event) => {
                          if (inputOverlayRef.current) {
                            inputOverlayRef.current.scrollTop =
                              event.currentTarget.scrollTop;
                          }
                        }}
                        onChange={(event) => {
                          const value = event.target.value;
                          const candidate = referenceSearchAtCursor(
                            value,
                            event.currentTarget.selectionStart,
                          );
                          const search =
                            candidate &&
                            !completesSelectedReference(
                              value,
                              candidate,
                              references,
                            )
                              ? candidate
                              : undefined;
                          setInput(value);
                          setActiveReferenceSearch(search);
                          setReferences((current) =>
                            current.filter(({ label }) =>
                              hasReferenceMention(value, label),
                            ),
                          );
                          setReferencePickerOpen(
                            search !== undefined &&
                              selectableReferences.length > 0,
                          );
                        }}
                        onKeyDown={(event) => {
                          if (event.key === "Escape" && referencePickerOpen) {
                            event.preventDefault();
                            setReferencePickerOpen(false);
                            return;
                          }
                          if (
                            referencePickerOpen &&
                            (event.key === "ArrowDown" ||
                              event.key === "ArrowUp") &&
                            matchingReferences.length > 0
                          ) {
                            event.preventDefault();
                            const offset = event.key === "ArrowDown" ? 1 : -1;
                            const nextIndex = Math.min(
                              matchingReferences.length - 1,
                              Math.max(0, activeReferenceIndex + offset),
                            );
                            setActiveReferenceKey(
                              matchingReferences[nextIndex].key,
                            );
                            return;
                          }
                          if (
                            event.key === "Enter" &&
                            !event.shiftKey &&
                            referencePickerOpen &&
                            activeReference
                          ) {
                            event.preventDefault();
                            selectReference(activeReference);
                            return;
                          }
                          if (event.key === "Enter" && !event.shiftKey) {
                            event.preventDefault();
                            event.currentTarget.form?.requestSubmit();
                          }
                        }}
                      />
                    }
                  />
                  <PopoverContent
                    align="start"
                    initialFocus={false}
                    side="top"
                    className="w-[min(24rem,calc(100vw-2rem))] p-0"
                  >
                    <Command
                      shouldFilter={false}
                      value={activeReference?.key ?? ""}
                      onValueChange={setActiveReferenceKey}
                    >
                      <CommandList id={referenceListId}>
                        <CommandEmpty>{labels.noReferences}</CommandEmpty>
                        {matchingReferences.length > 0 ? (
                          <CommandGroup heading={labels.references}>
                            {matchingReferences.map((reference, index) => (
                              <CommandItem
                                key={reference.key}
                                id={`${referenceInputId}-reference-${index}`}
                                value={reference.key}
                                onSelect={() => selectReference(reference)}
                              >
                                {reference.icon}
                                <span className="truncate">
                                  {reference.label}
                                </span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        ) : null}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <InputGroupAddon align="block-end" className="justify-end">
                {state.pending ? (
                  <InputGroupButton size="icon-xs" onClick={onInterrupt}>
                    <SquareIcon />
                    <span className="sr-only">{labels.stop}</span>
                  </InputGroupButton>
                ) : (
                  <InputGroupButton
                    type="submit"
                    size="icon-xs"
                    disabled={!input.trim() || hasPendingApproval}
                  >
                    <SendIcon />
                    <span className="sr-only">{labels.send}</span>
                  </InputGroupButton>
                )}
              </InputGroupAddon>
            </InputGroup>
          </form>
        </DialogPrimitive.Popup>
      </DialogPortal>
    </Dialog>
  );
}
