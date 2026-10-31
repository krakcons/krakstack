import { Effect } from "effect";
import { SecureRandom } from "effect/crypto";
import { useEffect, useRef, useState } from "react";
import { BookOpenIcon, FileTextIcon } from "lucide-react";

import * as m from "@/paraglide/messages";
import { Button } from "@/components/ui/button";
import type { AgentEvent } from "@/services/agent/schema";
import {
  AgentWidget,
  type AgentWidgetReference,
  initialAgentState,
  reduceAgentEvent,
  type AgentState,
  type AgentSubmitAction,
} from "@krak-stack/registry/agent/client";

const random = Effect.runSync(
  SecureRandom.SecureRandom.pipe(Effect.provide(SecureRandom.layerWebCrypto)),
);

type PreviewResource = {
  readonly id: string;
  readonly type: "course" | "document";
};

type Scenario =
  | "chat"
  | "tools"
  | "approval"
  | "destructive"
  | "failure"
  | "error"
  | "markdown";
type PreviewStep = { readonly at: number; readonly event: AgentEvent };

const code =
  'const result = await agent.submit({\n  text: "Summarize this resource",\n});';

const responseSteps = (
  messageId: string,
  text: string,
  start = 0,
): PreviewStep[] =>
  Array.from({ length: Math.ceil(text.length / 8) }, (_, index) => ({
    at: start + (index + 1) * 40,
    event: {
      type: "text-delta",
      messageId,
      delta: text.slice(index * 8, (index + 1) * 8),
    },
  }));

export function AgentPreview() {
  const [state, setState] =
    useState<AgentState<PreviewResource>>(initialAgentState);
  const steps = useRef<PreviewStep[]>([]);
  const responseIndex = useRef(0);
  const [run, setRun] = useState(0);
  const [scenario, setScenario] = useState<Scenario>("chat");
  const [contextRemoved, setContextRemoved] = useState(false);

  useEffect(() => {
    if (!state.pending) return;

    let elapsed = 0;
    const timer = window.setInterval(() => {
      elapsed += 40;
      const ready: AgentEvent[] = [];
      while (steps.current[0] && steps.current[0].at <= elapsed) {
        const step = steps.current.shift();
        if (step) ready.push(step.event);
      }
      if (ready.length === 0) return;
      const pending = steps.current.length > 0;
      setState((current) => ({
        ...ready.reduce(reduceAgentEvent, current),
        pending,
      }));
    }, 40);

    return () => window.clearInterval(timer);
  }, [state.pending, run]);

  const availableReferences: ReadonlyArray<
    AgentWidgetReference<PreviewResource>
  > = [
    {
      key: "course:customer-onboarding",
      label: m.home_preview_template(),
      icon: <BookOpenIcon />,
      resource: { type: "course", id: "customer-onboarding" },
    },
    {
      key: "document:product-requirements",
      label: m.home_nav_docs(),
      icon: <FileTextIcon />,
      resource: { type: "document", id: "product-requirements" },
    },
  ];

  const demos = [
    { id: "chat", label: m.agent_preview_chat() },
    { id: "tools", label: m.agent_preview_tools() },
    { id: "approval", label: m.agent_preview_approval() },
    { id: "destructive", label: m.agent_preview_destructive() },
    { id: "failure", label: m.agent_preview_failure() },
    { id: "error", label: m.agent_preview_error() },
    { id: "markdown", label: m.agent_preview_markdown() },
  ] as const;

  const start = (
    action: Extract<AgentSubmitAction<PreviewResource>, { type: "message" }>,
    demo: Scenario,
    fresh = false,
  ) => {
    const messageId = Effect.runSync(random.uuidV7());
    const userMessageId = Effect.runSync(random.uuidV7());
    const toolCall = (
      name: string,
      title: string,
      destructive = false,
    ): AgentEvent => ({
      type: "tool-call",
      messageId,
      toolCallId: `${messageId}:${name}`,
      name,
      input: { resource: "customer-onboarding", preview: true },
      metadata: {
        title,
        description: m.agent_preview_tool_description(),
        destructive,
      },
    });

    const replies = [
      m.agent_preview_response_intro(),
      m.agent_preview_response_plan(),
      m.agent_preview_response_followup(),
    ];
    const response = action.references?.length
      ? m.agent_preview_response_references({
          references: action.references.map(({ label }) => label).join(", "),
        })
      : replies[responseIndex.current % replies.length];
    responseIndex.current += 1;

    let queue = responseSteps(messageId, response);
    if (demo === "chat" || demo === "tools" || demo === "failure") {
      queue = [
        {
          at: 40,
          event: toolCall("searchResources", m.agent_preview_search_tool()),
        },
        {
          at: 800,
          event: {
            type: "tool-result",
            toolCallId: `${messageId}:searchResources`,
            name: "searchResources",
            isFailure: false,
          },
        },
        {
          at: 840,
          event: toolCall("readResource", m.agent_preview_read_tool()),
        },
        {
          at: 1600,
          event: {
            type: "tool-result",
            toolCallId: `${messageId}:readResource`,
            name: "readResource",
            isFailure: demo === "failure",
          },
        },
        ...responseSteps(
          messageId,
          demo === "failure"
            ? m.agent_preview_tool_failure_response()
            : demo === "chat"
              ? response
              : m.agent_preview_tools_response(),
          1640,
        ),
      ];
    } else if (demo === "approval" || demo === "destructive") {
      const name = demo === "destructive" ? "deleteDraft" : "updateDraft";
      queue = [
        {
          at: 40,
          event: toolCall(
            name,
            demo === "destructive"
              ? m.agent_preview_delete_tool()
              : m.agent_preview_update_tool(),
            demo === "destructive",
          ),
        },
        {
          at: 600,
          event: {
            type: "approval-required",
            toolCallId: `${messageId}:${name}`,
            approvalId: `${messageId}:approval`,
          },
        },
      ];
    } else if (demo === "error") {
      queue = [{ at: 600, event: { type: "error", code: "unavailable" } }];
    } else if (demo === "markdown") {
      const text = m.agent_preview_markdown_response();
      queue = [
        ...responseSteps(messageId, text),
        {
          at: Math.ceil(text.length / 8) * 40 + 40,
          event: {
            type: "markdown-snapshot",
            messageId,
            // Only trusted, application-owned translations enter this HTML fixture.
            html: `<p><strong>${text}</strong></p><ul><li>${m.agent_preview_markdown_item()}</li></ul><markdown-code-block data-index="0"></markdown-code-block>`,
            codeBlocks: [{ code, language: "typescript" }],
          },
        },
      ];
    }
    steps.current = queue;
    setRun((current) => current + 1);

    setState((previous) => {
      const current = fresh ? initialAgentState : previous;
      return {
        ...current,
        error: undefined,
        context: current.contextLocked
          ? current.context
          : contextRemoved
            ? undefined
            : availableReferences[0],
        contextLocked: true,
        pending: true,
        messages: [
          ...current.messages,
          {
            id: userMessageId,
            role: "user",
            text: action.text,
            tools: [],
          },
          {
            id: messageId,
            role: "assistant",
            text: "",
            tools: [],
          },
        ],
      };
    });
  };

  const submit = (action: AgentSubmitAction<PreviewResource>) => {
    if (state.pending) return;
    if (action.type === "message") {
      start(action, scenario);
      return;
    }
    const message = state.messages.find(({ tools }) =>
      tools.some(
        (tool) =>
          tool.toolCallId === action.toolCallId &&
          tool.approvalId === action.approvalId &&
          tool.status === "approval-required",
      ),
    );
    if (!message) return;
    const tool = message.tools.find(
      (entry) => entry.toolCallId === action.toolCallId,
    );
    if (!tool) return;
    steps.current = [
      ...(action.approved
        ? [
            {
              at: 600,
              event: {
                type: "tool-result" as const,
                toolCallId: tool.toolCallId,
                name: tool.name,
                isFailure: false,
              },
            },
          ]
        : []),
      ...responseSteps(
        message.id,
        action.approved
          ? m.agent_preview_approved_response()
          : m.agent_preview_denied_response(),
        action.approved ? 640 : 0,
      ),
    ];
    setState((current) => ({
      ...current,
      pending: true,
      messages: current.messages.map((entry) => ({
        ...entry,
        tools: entry.tools.map((tool) =>
          tool.toolCallId === action.toolCallId
            ? { ...tool, status: action.approved ? "approved" : "denied" }
            : tool,
        ),
      })),
    }));
    setRun((current) => current + 1);
  };

  return (
    <div className="min-h-72">
      <p className="text-muted-foreground mb-3 text-sm">
        {m.agent_preview_demo_description()}
      </p>
      <div className="flex flex-wrap gap-2">
        {demos.map((demo) => (
          <Button
            key={demo.id}
            size="sm"
            variant={scenario === demo.id ? "secondary" : "outline"}
            aria-pressed={scenario === demo.id}
            onClick={() => {
              setScenario(demo.id);
              start(
                {
                  type: "message",
                  text: m.agent_preview_demo_prompt({ scenario: demo.label }),
                },
                demo.id,
                true,
              );
            }}
          >
            {demo.label}
          </Button>
        ))}
      </div>
      <AgentWidget
        availableReferences={availableReferences}
        context={contextRemoved ? undefined : availableReferences[0]}
        onRemoveContext={() => {
          setContextRemoved(true);
          setState((current) => ({ ...current, context: undefined }));
        }}
        state={state}
        onInterrupt={() => {
          steps.current = [];
          setState((current) => ({
            ...current,
            pending: false,
            messages: current.messages.map((message) => ({
              ...message,
              tools: message.tools.map((tool) =>
                tool.status === "running" || tool.status === "approved"
                  ? { ...tool, status: "denied" }
                  : tool,
              ),
            })),
          }));
        }}
        onReset={() => {
          steps.current = [];
          responseIndex.current = 0;
          setState(initialAgentState);
        }}
        onSubmit={submit}
      />
    </div>
  );
}
