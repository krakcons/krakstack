import {
  Link,
  useRouterState,
  type ErrorComponentProps as RouterErrorComponentProps,
} from "@tanstack/react-router";
import { CircleAlert, RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";
import { Option, Schema } from "effect";
import { HttpClientError, HttpTraceContext } from "effect/unstable/http";

import { Button, buttonVariants } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { Textarea } from "@/components/ui/textarea";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { cn } from "@/lib/utils";
import { getLocale } from "@/paraglide/runtime";

const TraceId = Schema.String.check(
  Schema.isPattern(/^(?!0+$)(?:[a-f0-9]{16}|[a-f0-9]{32})$/i),
).annotate({ identifier: "ErrorTraceId" });
const decodeTraceId = Schema.decodeUnknownOption(TraceId);

const getErrorTraceId = (error: Error): string | undefined => {
  const visited = new Set<Error>();
  let current: unknown = error;
  while (current instanceof Error && !visited.has(current)) {
    visited.add(current);
    if (HttpClientError.isHttpClientError(current)) {
      const traceId = HttpTraceContext.fromHeaders(
        current.request.headers,
      ).pipe(Option.flatMap((span) => decodeTraceId(span.traceId)));
      if (Option.isSome(traceId)) return traceId.value;
    }
    current = current.cause;
  }
  return undefined;
};

export type ErrorComponentMessages = {
  title: string;
  description: string;
  retry: string;
  home: string;
  copy: string;
  copied: string;
  copyFailed: string;
  details: string;
  errorLabel: string;
  messageLabel: string;
  pageLabel: string;
  timeLabel: string;
  languageLabel: string;
  appLabel: string;
  versionLabel: string;
  referenceLabel: string;
};

const defaultMessages = {
  en: {
    title: "Unable to load this page",
    description:
      "Something went wrong while loading this page. Please try again.",
    retry: "Try again",
    home: "Go to homepage",
    copy: "Copy error details",
    copied: "Error details copied",
    copyFailed: "Copy failed. Select and copy the details below.",
    details: "Error details",
    errorLabel: "Error",
    messageLabel: "Message",
    pageLabel: "Page",
    timeLabel: "Time",
    languageLabel: "Language",
    appLabel: "Application",
    versionLabel: "Version",
    referenceLabel: "Reference",
  },
  fr: {
    title: "Impossible de charger cette page",
    description:
      "Une erreur est survenue lors du chargement de cette page. Veuillez réessayer.",
    retry: "Réessayer",
    home: "Retour à l'accueil",
    copy: "Copier les détails de l'erreur",
    copied: "Détails de l'erreur copiés",
    copyFailed:
      "La copie a échoué. Sélectionnez et copiez les détails ci-dessous.",
    details: "Détails de l'erreur",
    errorLabel: "Erreur",
    messageLabel: "Message",
    pageLabel: "Page",
    timeLabel: "Date",
    languageLabel: "Langue",
    appLabel: "Application",
    versionLabel: "Version",
    referenceLabel: "Référence",
  },
} satisfies Record<"en" | "fr", ErrorComponentMessages>;

export type ErrorComponentProps = RouterErrorComponentProps & {
  messages?: Partial<ErrorComponentMessages>;
  retryable?: boolean;
  className?: string;
  diagnostics?: {
    app?: string;
    version?: string;
    reference?: string;
  };
};

export const ErrorComponent = ({
  error,
  messages,
  retryable = true,
  className,
  diagnostics,
}: ErrorComponentProps) => {
  const locale = getLocale();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const labels = useMemo(
    () => ({
      ...defaultMessages[locale.startsWith("fr") ? "fr" : "en"],
      ...messages,
    }),
    [locale, messages],
  );
  const reference = diagnostics?.reference ?? getErrorTraceId(error);
  const report = useMemo(
    () =>
      [
        `${labels.errorLabel}: ${error.name}`,
        `${labels.messageLabel}: ${error.message.trim() || labels.description}`,
        "",
        `${labels.pageLabel}: ${pathname}`,
        `${labels.timeLabel}: ${new Date().toISOString()}`,
        `${labels.languageLabel}: ${locale}`,
        ...(diagnostics?.app ? [`${labels.appLabel}: ${diagnostics.app}`] : []),
        ...(diagnostics?.version
          ? [`${labels.versionLabel}: ${diagnostics.version}`]
          : []),
        ...(reference ? [`${labels.referenceLabel}: ${reference}`] : []),
      ].join("\n"),
    [
      error,
      pathname,
      locale,
      labels,
      diagnostics?.app,
      diagnostics?.version,
      reference,
    ],
  );
  const [copyResult, setCopyResult] = useState<{
    report: string;
    status: "copied" | "failed";
  } | null>(null);
  const copyStatus =
    copyResult?.report === report ? copyResult.status : undefined;

  return (
    <main
      className={cn(
        "flex min-h-[60vh] items-center justify-center p-6",
        className,
      )}
    >
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <CircleAlert />
          </EmptyMedia>
          <EmptyTitle>
            <h1>{labels.title}</h1>
          </EmptyTitle>
          <EmptyDescription>
            {error.message.trim() || labels.description}
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <div className="flex flex-wrap justify-center gap-2">
            {retryable && (
              <Button onClick={() => window.location.reload()}>
                <RefreshCw data-icon="inline-start" />
                {labels.retry}
              </Button>
            )}
            <Link to="/" className={buttonVariants({ variant: "outline" })}>
              {labels.home}
            </Link>
          </div>
          <CopyButton
            value={report}
            copyVariant="large"
            variant="link"
            messages={{
              copy: labels.copy,
              copied: labels.copied,
              copyFailed: labels.copyFailed,
            }}
            onCopied={() => setCopyResult({ report, status: "copied" })}
            onCopyError={() => setCopyResult({ report, status: "failed" })}
          />
          {copyStatus === "failed" && <p>{labels.copyFailed}</p>}
          {copyStatus === "failed" && (
            <Textarea
              aria-label={labels.details}
              readOnly
              value={report}
              rows={10}
              onFocus={(event) => event.currentTarget.select()}
            />
          )}
        </EmptyContent>
      </Empty>
    </main>
  );
};
