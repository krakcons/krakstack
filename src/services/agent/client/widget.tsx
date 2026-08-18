import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { code } from "@streamdown/code";
import {
  ArrowDownIcon,
  BotIcon,
  ChevronDownIcon,
  Maximize2Icon,
  MessageCircleDashedIcon,
  Minimize2Icon,
  MinusIcon,
  SendIcon,
  SquareIcon,
  XIcon,
} from "lucide-react";
import { Streamdown } from "streamdown";
import type { AgentEvent } from "../schema";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
import { Marker, MarkerContent } from "@/components/ui/marker";
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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { getLocale } from "@/paraglide/runtime";
import type {
  AgentMessage,
  AgentState,
  AgentSubmitAction,
  AgentToolActivity,
} from "@/services/agent/client/atom";
import type { AgentErrorCode, AgentReference } from "@/services/agent/schema";
import { AGENT_REFERENCE_LIMIT } from "@/services/agent/schema";

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
    toolDenied: "Cancelled",
    toolFailed: "Failed",
    toolRunning: "Checking the API",
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
    toolDenied: "Annulé",
    toolFailed: "Échec",
    toolRunning: "Consultation de l'API",
    toolWorked: (seconds) =>
      `A travaillé pendant ${seconds} ${seconds === 1 ? "seconde" : "secondes"}`,
    viewLess: "Voir moins",
    viewMore: "Voir plus",
    welcome: "Comment puis-je vous aider?",
  },
} as const satisfies Record<"en" | "fr", AgentWidgetMessages>;

export const agentWidgetMessages = (
  locale = getLocale(),
  overrides?: Partial<AgentWidgetMessages>,
): AgentWidgetMessages => ({
  ...(locale.startsWith("fr") ? messages.fr : messages.en),
  ...overrides,
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

const inputCodeBlock = (input: AgentToolInput) => {
  const value = JSON.stringify(input, null, 2) ?? String(input);
  const longestFence = Math.max(
    0,
    ...(value.match(/`+/g)?.map((fence) => fence.length) ?? []),
  );
  const fence = "`".repeat(Math.max(3, longestFence + 1));
  return `${fence}json\n${value}\n${fence}`;
};

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

const ToolLabel = ({
  description,
  label,
}: {
  readonly description?: string;
  readonly label: string;
}) => {
  if (!description) return label;

  return (
    <Tooltip>
      <TooltipTrigger render={<span className="cursor-help" tabIndex={0} />}>
        {label}
      </TooltipTrigger>
      <TooltipContent className="max-w-sm">{description}</TooltipContent>
    </Tooltip>
  );
};

function ToolActivityCard({
  disabled,
  labels,
  onApproval,
  tool,
}: {
  readonly disabled: boolean;
  readonly labels: AgentWidgetMessages;
  readonly onApproval: (tool: AgentToolActivity, approved: boolean) => void;
  readonly tool: AgentToolActivity;
}) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const requiresApproval = tool.status === "approval-required";
  const label = tool.metadata.title ?? tool.name;

  if (!requiresApproval) {
    return (
      <Marker>
        <MarkerContent>
          <span
            className={cn(
              "block w-fit max-w-full",
              tool.status === "running" && "shimmer",
            )}
          >
            <ToolLabel description={tool.metadata.description} label={label} />
          </span>
        </MarkerContent>
        {tool.status === "failed" || tool.status === "denied" ? (
          <Badge variant="destructive">
            {tool.status === "failed" ? labels.toolFailed : labels.toolDenied}
          </Badge>
        ) : null}
      </Marker>
    );
  }

  return (
    <Collapsible
      className="mx-1"
      open={detailsOpen}
      onOpenChange={setDetailsOpen}
    >
      <Card size="sm" className="w-full border shadow-none ring-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ToolLabel description={tool.metadata.description} label={label} />
            {tool.metadata.destructive ? (
              <Badge variant="destructive">
                {labels.approvalDestructiveLabel}
              </Badge>
            ) : null}
          </CardTitle>
          <CardDescription>
            {tool.metadata.destructive
              ? labels.approvalDestructive
              : labels.approvalRequired}
          </CardDescription>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="min-w-0 overflow-hidden border-y py-3">
            <Streamdown
              className="min-w-0 text-xs"
              controls={{
                code: { copy: true, download: false },
                mermaid: false,
                table: false,
              }}
              linkSafety={{ enabled: false }}
              plugins={{ code }}
              translations={{
                copied: labels.copied,
                copyCode: labels.copy,
              }}
            >
              {inputCodeBlock(tool.input)}
            </Streamdown>
          </CardContent>
        </CollapsibleContent>
        <CardFooter className="flex flex-wrap gap-2">
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
          <CollapsibleTrigger
            render={
              <Button variant="ghost" size="sm" className="ml-auto">
                {detailsOpen ? labels.viewLess : labels.viewMore}
                <ChevronDownIcon
                  data-icon="inline-end"
                  className={cn(
                    "transition-transform",
                    detailsOpen && "rotate-180",
                  )}
                />
              </Button>
            }
          />
        </CardFooter>
      </Card>
    </Collapsible>
  );
}

function ToolActivityLog({
  disabled,
  labels,
  onApproval,
  pending,
  tools,
  workedSeconds,
}: {
  readonly disabled: boolean;
  readonly labels: AgentWidgetMessages;
  readonly onApproval: (tool: AgentToolActivity, approved: boolean) => void;
  readonly pending: boolean;
  readonly tools: ReadonlyArray<AgentToolActivity>;
  readonly workedSeconds?: number;
}) {
  const [logOpen, setLogOpen] = useState(false);
  const currentTool = tools.at(-1);

  if (!currentTool) {
    return (
      <Marker>
        <MarkerContent>
          <span className="shimmer block w-fit max-w-full">
            {labels.toolRunning}
          </span>
        </MarkerContent>
      </Marker>
    );
  }

  const label = currentTool.metadata.title ?? currentTool.name;
  const showWorkedSummary =
    workedSeconds !== undefined && currentTool.status !== "approval-required";
  const isWorking =
    pending &&
    workedSeconds === undefined &&
    currentTool.status !== "approval-required";
  const loggedTools = showWorkedSummary ? tools : tools.slice(0, -1);

  if (currentTool.status === "approval-required") {
    return (
      <div className="flex flex-col gap-2">
        {loggedTools.length > 0 ? (
          <Collapsible open={logOpen} onOpenChange={setLogOpen}>
            <CollapsibleTrigger
              render={<Button variant="ghost" size="sm" className="ml-auto" />}
            >
              {logOpen ? labels.viewLess : labels.viewMore}
              <ChevronDownIcon
                data-icon="inline-end"
                className={cn("transition-transform", logOpen && "rotate-180")}
              />
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 ml-2 flex flex-col gap-2 border-l pl-3">
              {loggedTools.map((tool) => (
                <ToolActivityCard
                  key={tool.toolCallId}
                  disabled={disabled}
                  labels={labels}
                  onApproval={onApproval}
                  tool={tool}
                />
              ))}
            </CollapsibleContent>
          </Collapsible>
        ) : null}
        <ToolActivityCard
          disabled={disabled}
          labels={labels}
          onApproval={onApproval}
          tool={currentTool}
        />
      </div>
    );
  }

  return (
    <Collapsible open={logOpen} onOpenChange={setLogOpen}>
      <CollapsibleTrigger
        render={
          <Marker
            className="focus-visible:ring-ring/50 cursor-pointer rounded-sm outline-none focus-visible:ring-3"
            render={<button type="button" />}
          />
        }
      >
        <MarkerContent className="flex-1">
          <span
            className={cn("block w-fit max-w-full", isWorking && "shimmer")}
          >
            {showWorkedSummary ? labels.toolWorked(workedSeconds) : label}
          </span>
        </MarkerContent>
        {currentTool.status === "failed" || currentTool.status === "denied" ? (
          <Badge variant="destructive">
            {currentTool.status === "failed"
              ? labels.toolFailed
              : labels.toolDenied}
          </Badge>
        ) : null}
        <ChevronDownIcon
          className={cn("transition-transform", logOpen && "rotate-180")}
        />
        <span className="sr-only">
          {logOpen ? labels.viewLess : labels.viewMore}
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2 ml-2 flex flex-col gap-2 border-l pl-3">
        <Marker>
          <MarkerContent>{labels.toolRunning}</MarkerContent>
        </Marker>
        {loggedTools.map((tool) => (
          <ToolActivityCard
            key={tool.toolCallId}
            disabled={disabled}
            labels={labels}
            onApproval={onApproval}
            tool={tool}
          />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}

function AgentMessageRow({
  disabled,
  labels,
  message,
  onApproval,
  pending,
}: {
  readonly disabled: boolean;
  readonly labels: AgentWidgetMessages;
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
            <Streamdown
              animated
              className="w-full"
              controls={{
                code: { copy: true, download: false },
                mermaid: false,
                table: false,
              }}
              isAnimating={pending}
              linkSafety={{ enabled: false }}
              plugins={{ code }}
              translations={{
                copied: labels.copied,
                copyCode: labels.copy,
              }}
            >
              {message.text}
            </Streamdown>
          )
        ) : null}
      </MessageContent>
    </Message>
  );
}

export function AgentWidget<Resource = never>({
  availableReferences = [],
  context,
  messages: messageOverrides,
  onInterrupt,
  onRemoveContext,
  onReset,
  onSubmit,
  state,
}: {
  readonly availableReferences?: ReadonlyArray<AgentWidgetReference<Resource>>;
  readonly context?: AgentWidgetReference<Resource>;
  readonly messages?: Partial<AgentWidgetMessages>;
  readonly onInterrupt: () => void;
  readonly onRemoveContext?: () => void;
  readonly onReset: () => void;
  readonly onSubmit: (action: AgentSubmitAction<Resource>) => void;
  readonly state: AgentState<Resource>;
}) {
  const labels = agentWidgetMessages(getLocale(), messageOverrides);
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
                  <MessageScrollerViewport
                    aria-label={labels.title}
                    className="[scrollbar-width:thin] [scrollbar-color:var(--border)_transparent]"
                  >
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
                <InputGroupAddon
                  align="block-start"
                  className="bg-background rounded-t-[calc(var(--radius-md)-1px)] border-b"
                >
                  {activeContext.icon}
                  <span className="min-w-0 flex-1 truncate text-left">
                    {activeContext.label}
                  </span>
                  {onRemoveContext ? (
                    <InputGroupButton
                      size="icon-xs"
                      aria-label={`${labels.removeContext}: ${activeContext.label}`}
                      onClick={onRemoveContext}
                    >
                      <XIcon />
                    </InputGroupButton>
                  ) : null}
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
