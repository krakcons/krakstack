import { useState } from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { code } from "@streamdown/code";
import {
  ArrowDownIcon,
  BotIcon,
  ChevronDownIcon,
  DatabaseIcon,
  Maximize2Icon,
  MessageCircleDashedIcon,
  Minimize2Icon,
  MinusIcon,
  SearchIcon,
  SendIcon,
  SquareIcon,
  XIcon,
} from "lucide-react";
import { Streamdown } from "streamdown";

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
import { Loading } from "@/components/ui/loading";
import { Marker, MarkerContent, MarkerIcon } from "@/components/ui/marker";
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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { getLocale } from "@/paraglide/runtime";
import {
  type ChatErrorCode,
  type ChatMessage,
  type ChatState,
  type ChatSubmitAction,
  type ChatToolActivity,
} from "@/services/chat/state";

export type ChatWidgetMessages = {
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
  errorRoundLimit: string;
  errorStreamFailed: string;
  errorUnavailable: string;
  maximize: string;
  minimize: string;
  open: string;
  placeholder: string;
  restore: string;
  scrollLatest: string;
  send: string;
  stop: string;
  title: string;
  toolDenied: string;
  toolFailed: string;
  toolRunning: string;
  toolSearch: string;
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
    errorRoundLimit:
      "The assistant stopped after too many API steps. Try a more specific request.",
    errorStreamFailed: "The response was interrupted. Please try again.",
    errorUnavailable: "The assistant is currently unavailable.",
    maximize: "Maximize assistant",
    minimize: "Minimize assistant",
    open: "Open AI Assistant",
    placeholder: "Ask a question...",
    restore: "Restore assistant window",
    scrollLatest: "Scroll to latest message",
    send: "Send message",
    stop: "Stop response",
    title: "AI Assistant",
    toolDenied: "Cancelled",
    toolFailed: "Failed",
    toolRunning: "Checking the API",
    toolSearch: "Search documentation",
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
    errorRoundLimit:
      "L'assistant s'est arrêté après trop d'étapes d'API. Essayez une demande plus précise.",
    errorStreamFailed: "La réponse a été interrompue. Veuillez réessayer.",
    errorUnavailable: "L'assistant est actuellement indisponible.",
    maximize: "Agrandir l'assistant",
    minimize: "Réduire l'assistant",
    open: "Ouvrir l'assistant IA",
    placeholder: "Posez une question...",
    restore: "Restaurer la fenêtre de l'assistant",
    scrollLatest: "Défiler jusqu'au dernier message",
    send: "Envoyer le message",
    stop: "Arrêter la réponse",
    title: "Assistant IA",
    toolDenied: "Annulé",
    toolFailed: "Échec",
    toolRunning: "Consultation de l'API",
    toolSearch: "Rechercher dans la documentation",
    viewLess: "Voir moins",
    viewMore: "Voir plus",
    welcome: "Comment puis-je vous aider?",
  },
} as const satisfies Record<"en" | "fr", ChatWidgetMessages>;

export const chatWidgetMessages = (
  locale = getLocale(),
  overrides?: Partial<ChatWidgetMessages>,
): ChatWidgetMessages => ({
  ...(locale.startsWith("fr") ? messages.fr : messages.en),
  ...overrides,
});

const errorMessage = (code: ChatErrorCode, labels: ChatWidgetMessages) => {
  switch (code) {
    case "invalid-request":
      return labels.errorInvalidRequest;
    case "round-limit":
      return labels.errorRoundLimit;
    case "stream-failed":
      return labels.errorStreamFailed;
    case "unavailable":
      return labels.errorUnavailable;
  }
};

const inputCodeBlock = (input: unknown) => {
  const value = JSON.stringify(input, null, 2) ?? String(input);
  const longestFence = Math.max(
    0,
    ...(value.match(/`+/g)?.map((fence) => fence.length) ?? []),
  );
  const fence = "`".repeat(Math.max(3, longestFence + 1));
  return `${fence}json\n${value}\n${fence}`;
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
  readonly labels: ChatWidgetMessages;
  readonly onApproval: (tool: ChatToolActivity, approved: boolean) => void;
  readonly tool: ChatToolActivity;
}) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const requiresApproval = tool.status === "approval-required";
  const isSearch = tool.name === "readDocumentation";
  const label = isSearch
    ? labels.toolSearch
    : (tool.metadata.title ?? tool.name);

  if (!requiresApproval) {
    return (
      <Marker>
        <MarkerIcon>{isSearch ? <SearchIcon /> : <DatabaseIcon />}</MarkerIcon>
        <MarkerContent>
          <ToolLabel description={tool.metadata.description} label={label} />
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
            <MarkerIcon>
              {isSearch ? <SearchIcon /> : <DatabaseIcon />}
            </MarkerIcon>
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

function ChatMessageRow({
  disabled,
  labels,
  message,
  onApproval,
  pending,
}: {
  readonly disabled: boolean;
  readonly labels: ChatWidgetMessages;
  readonly message: ChatMessage;
  readonly onApproval: (tool: ChatToolActivity, approved: boolean) => void;
  readonly pending: boolean;
}) {
  const isUser = message.role === "user";

  return (
    <Message align={isUser ? "end" : "start"}>
      <MessageContent>
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
        {message.tools.map((tool) => (
          <ToolActivityCard
            key={tool.toolCallId}
            disabled={disabled}
            labels={labels}
            onApproval={onApproval}
            tool={tool}
          />
        ))}
        {!isUser && pending && !message.text && message.tools.length === 0 ? (
          <Loading
            className="justify-start px-3 py-2"
            label={labels.toolRunning}
          />
        ) : null}
      </MessageContent>
    </Message>
  );
}

export function ChatWidget({
  messages: messageOverrides,
  onInterrupt,
  onReset,
  onSubmit,
  state,
}: {
  readonly messages?: Partial<ChatWidgetMessages>;
  readonly onInterrupt: () => void;
  readonly onReset: () => void;
  readonly onSubmit: (action: ChatSubmitAction) => void;
  readonly state: ChatState;
}) {
  const labels = chatWidgetMessages(getLocale(), messageOverrides);
  const [open, setOpen] = useState(false);
  const [maximized, setMaximized] = useState(false);
  const [input, setInput] = useState("");
  const hasPendingApproval = state.messages.some((message) =>
    message.tools.some((tool) => tool.status === "approval-required"),
  );

  const sendMessage = () => {
    const text = input.trim();
    if (!text || state.pending || hasPendingApproval) return;

    setInput("");
    onSubmit({ type: "message", text });
  };

  const respondToApproval = (tool: ChatToolActivity, approved: boolean) => {
    if (!tool.approvalId || state.pending) return;

    onSubmit({
      type: "approval",
      approvalId: tool.approvalId,
      toolCallId: tool.toolCallId,
      approved,
    });
  };

  const clearConversation = () => {
    onInterrupt();
    onReset();
    setInput("");
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
            className="fixed right-4 bottom-4 rounded-full shadow-lg md:right-6 md:bottom-6"
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
              <DialogTitle className="min-w-0 flex-1 truncate">
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

          <div className="min-h-0 flex-1">
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
                          <ChatMessageRow
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
              <InputGroupTextarea
                value={input}
                placeholder={labels.placeholder}
                aria-label={labels.placeholder}
                disabled={state.pending || hasPendingApproval}
                rows={2}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    event.currentTarget.form?.requestSubmit();
                  }
                }}
              />
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
