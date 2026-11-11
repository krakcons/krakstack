import {
  Archive,
  ArchiveRestore,
  Bell,
  BellDot,
  Inbox,
  TriangleAlert,
} from "lucide-react";
import { Fragment, type ReactElement, type ReactNode, useState } from "react";
import { Schema } from "effect";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

import { useKrakstackLocale } from "@/components/ui/krakstack-provider";
export type NotificationMenuTab = "inbox" | "archive";

export type NotificationItem = {
  archivedAt?: Date | null | string | undefined;
  createdAt?: Date | string | undefined;
  description?: ReactNode | undefined;
  href?: string | undefined;
  id: string;
  readAt?: Date | null | string | undefined;
  timestampLabel?: string | undefined;
  title: ReactNode;
};

export type NotificationMenuMessages = {
  archive: string;
  archiveAll: string;
  archiveItem: (title: string) => string;
  archived: string;
  emptyArchiveDescription: string;
  emptyArchiveTitle: string;
  emptyInboxDescription: string;
  emptyInboxTitle: string;
  errorDescription: string;
  errorTitle: string;
  inbox: string;
  loading: string;
  notifications: string;
  unread: (count: number) => string;
};

const defaultMessages = {
  en: {
    archive: "Archive",
    archiveAll: "Archive all",
    archiveItem: (title: string) => `Archive ${title}`,
    archived: "Archived",
    emptyArchiveDescription: "Notifications you archive will appear here.",
    emptyArchiveTitle: "No archived notifications",
    emptyInboxDescription: "You are all caught up.",
    emptyInboxTitle: "No new notifications",
    errorDescription: "Refresh the page and try again.",
    errorTitle: "Notifications could not be loaded",
    inbox: "Inbox",
    loading: "Loading notifications",
    notifications: "Notifications",
    unread: (count: number) =>
      `${count} unread ${count === 1 ? "notification" : "notifications"}`,
  },
  fr: {
    archive: "Archiver",
    archiveAll: "Tout archiver",
    archiveItem: (title: string) => `Archiver ${title}`,
    archived: "Archivées",
    emptyArchiveDescription:
      "Les notifications que vous archivez apparaîtront ici.",
    emptyArchiveTitle: "Aucune notification archivée",
    emptyInboxDescription: "Vous êtes à jour.",
    emptyInboxTitle: "Aucune nouvelle notification",
    errorDescription: "Actualisez la page et réessayez.",
    errorTitle: "Impossible de charger les notifications",
    inbox: "Boîte de réception",
    loading: "Chargement des notifications",
    notifications: "Notifications",
    unread: (count: number) =>
      `${count} notification${count === 1 ? "" : "s"} non lue${count === 1 ? "" : "s"}`,
  },
} as const satisfies Record<"en" | "fr", NotificationMenuMessages>;

export type NotificationMenuMessageTranslations = Partial<
  Record<string, Partial<NotificationMenuMessages>>
>;

export const notificationMenuMessages = (
  locale = "en",
  translations?: NotificationMenuMessageTranslations,
): NotificationMenuMessages => ({
  ...(locale.startsWith("fr") ? defaultMessages.fr : defaultMessages.en),
  ...translations?.[locale.split("-")[0] ?? locale],
  ...translations?.[locale],
});

export type NotificationMenuState = {
  archivedCount: number;
  open: boolean;
  unreadCount: number;
};

type NotificationAction<Result = ErrorOptions["cause"]> = (
  notificationIds: readonly string[],
) => Promise<Result> | Result | void;

export type NotificationMenuProps<ActionResult = ErrorOptions["cause"]> = {
  className?: string | undefined;
  defaultOpen?: boolean | undefined;
  error?: boolean | undefined;
  isLoading?: boolean | undefined;
  locale?: string | undefined;
  markReadOnOpen?: boolean | undefined;
  messages?: NotificationMenuMessageTranslations | undefined;
  notifications: readonly NotificationItem[];
  onArchive?: NotificationAction<ActionResult> | undefined;
  onMarkRead?: NotificationAction<ActionResult> | undefined;
  onNavigate?: ((notification: NotificationItem) => void) | undefined;
  onOpenChange?: ((open: boolean) => void) | undefined;
  open?: boolean | undefined;
  renderItem?: ((notification: NotificationItem) => ReactNode) | undefined;
  renderTrigger?: ((state: NotificationMenuState) => ReactElement) | undefined;
};

export function NotificationMenu<ActionResult = ErrorOptions["cause"]>({
  className,
  defaultOpen = false,
  error = false,
  isLoading = false,
  locale: localeOverride,
  markReadOnOpen = true,
  messages: messageOverrides,
  notifications,
  onArchive,
  onMarkRead,
  onNavigate,
  onOpenChange,
  open: controlledOpen,
  renderItem,
  renderTrigger,
}: NotificationMenuProps<ActionResult>) {
  const locale = useKrakstackLocale(localeOverride);
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const [tab, setTab] = useState<NotificationMenuTab>("inbox");
  const open = controlledOpen ?? uncontrolledOpen;
  const labels = notificationMenuMessages(locale, messageOverrides);
  const inbox = notifications.filter(
    (notification) => !notification.archivedAt,
  );
  const archive = notifications.filter(
    (notification) => notification.archivedAt,
  );
  const unreadIds = inbox
    .filter((notification) => !notification.readAt)
    .map((notification) => notification.id);
  const triggerState = {
    archivedCount: archive.length,
    open,
    unreadCount: unreadIds.length,
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (controlledOpen === undefined) setUncontrolledOpen(nextOpen);
    onOpenChange?.(nextOpen);

    if (nextOpen && markReadOnOpen && unreadIds.length > 0) {
      void onMarkRead?.(unreadIds);
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      {renderTrigger ? (
        <PopoverTrigger render={renderTrigger(triggerState)} />
      ) : (
        <NotificationMenuTrigger
          labels={labels}
          unreadCount={unreadIds.length}
        />
      )}
      <PopoverContent
        align="end"
        className={cn(
          "max-h-[min(32rem,80svh,var(--available-height))] w-96 max-w-[calc(100vw-1rem)] gap-0 overflow-hidden p-0",
          className,
        )}
      >
        <PopoverHeader className="shrink-0 border-b px-4 py-3">
          <PopoverTitle>{labels.notifications}</PopoverTitle>
        </PopoverHeader>
        <Tabs
          value={tab}
          onValueChange={(value) =>
            setTab(value === "archive" ? "archive" : "inbox")
          }
          className="min-h-0 min-w-0 flex-1 gap-0"
        >
          <div className="flex shrink-0 flex-col gap-2 border-b p-2">
            <TabsList className="grid w-full min-w-0 grid-cols-2">
              <TabsTrigger className="min-w-0" value="inbox">
                <Inbox data-icon="inline-start" />
                <span className="truncate">{labels.inbox}</span>
                {inbox.length > 0 ? (
                  <Badge className="shrink-0 tabular-nums" variant="secondary">
                    {inbox.length}
                  </Badge>
                ) : null}
              </TabsTrigger>
              <TabsTrigger className="min-w-0" value="archive">
                <ArchiveRestore data-icon="inline-start" />
                <span className="truncate">{labels.archived}</span>
              </TabsTrigger>
            </TabsList>
            {tab === "inbox" && inbox.length > 0 && onArchive ? (
              <ArchiveButton
                showLabel
                className="w-full"
                label={labels.archiveAll}
                notificationIds={inbox.map((notification) => notification.id)}
                onArchive={onArchive}
              />
            ) : null}
          </div>
          <NotificationList
            key={tab}
            error={error}
            isLoading={isLoading}
            labels={labels}
            locale={locale}
            notifications={tab === "inbox" ? inbox : archive}
            onArchive={tab === "inbox" ? onArchive : undefined}
            onNavigate={onNavigate}
            renderItem={renderItem}
            tab={tab}
          />
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}

export function NotificationMenuTrigger({
  labels: providedLabels,
  locale: localeOverride,
  messages,
  unreadCount,
}: {
  labels?: NotificationMenuMessages | undefined;
  locale?: string | undefined;
  messages?: NotificationMenuMessageTranslations | undefined;
  unreadCount: number;
}) {
  const locale = useKrakstackLocale(localeOverride);
  const labels = providedLabels ?? notificationMenuMessages(locale, messages);
  return (
    <PopoverTrigger
      aria-label={
        unreadCount > 0
          ? `${labels.notifications}, ${labels.unread(unreadCount)}`
          : labels.notifications
      }
      className={cn(
        buttonVariants({ variant: "outline", size: "icon" }),
        "relative",
      )}
      type="button"
    >
      <Bell />
      {unreadCount > 0 ? (
        <Badge
          aria-hidden="true"
          className="absolute -top-1 -right-1 min-w-5 px-1 tabular-nums"
        >
          {unreadCount > 99 ? "99+" : unreadCount}
        </Badge>
      ) : null}
    </PopoverTrigger>
  );
}

export function NotificationList<ActionResult>({
  error,
  isLoading,
  labels,
  locale,
  notifications,
  onArchive,
  onNavigate,
  renderItem,
  tab,
}: {
  error: boolean;
  isLoading: boolean;
  labels: NotificationMenuMessages;
  locale: string;
  notifications: readonly NotificationItem[];
  onArchive?: NotificationAction<ActionResult> | undefined;
  onNavigate?: ((notification: NotificationItem) => void) | undefined;
  renderItem?: ((notification: NotificationItem) => ReactNode) | undefined;
  tab: NotificationMenuTab;
}) {
  if (isLoading) return <NotificationListLoading label={labels.loading} />;

  if (error) {
    return (
      <NotificationEmpty
        description={labels.errorDescription}
        icon={<TriangleAlert />}
        title={labels.errorTitle}
      />
    );
  }

  if (notifications.length === 0) {
    return (
      <NotificationEmpty
        description={
          tab === "inbox"
            ? labels.emptyInboxDescription
            : labels.emptyArchiveDescription
        }
        icon={tab === "inbox" ? <BellDot /> : <Archive />}
        title={
          tab === "inbox" ? labels.emptyInboxTitle : labels.emptyArchiveTitle
        }
      />
    );
  }

  return (
    <ScrollArea className="h-[min(24rem,60svh)] min-h-0 min-w-0 flex-1">
      <div className="flex min-w-0 flex-col">
        {notifications.map((notification, index) => (
          <Fragment key={notification.id}>
            {index > 0 ? <Separator /> : null}
            <NotificationListItem
              labels={labels}
              locale={locale}
              notification={notification}
              onArchive={onArchive}
              onNavigate={onNavigate}
              renderItem={renderItem}
            />
          </Fragment>
        ))}
      </div>
    </ScrollArea>
  );
}

export function NotificationListItem<ActionResult>({
  labels,
  locale,
  notification,
  onArchive,
  onNavigate,
  renderItem,
}: {
  labels: NotificationMenuMessages;
  locale: string;
  notification: NotificationItem;
  onArchive?: NotificationAction<ActionResult> | undefined;
  onNavigate?: ((notification: NotificationItem) => void) | undefined;
  renderItem?: ((notification: NotificationItem) => ReactNode) | undefined;
}) {
  const unread = !notification.readAt && !notification.archivedAt;
  const selectNotification = () => {
    if (onNavigate) {
      onNavigate(notification);
      return;
    }

    if (notification.href && globalThis.window) {
      window.location.assign(notification.href);
    }
  };
  const content = renderItem?.(notification) ?? (
    <span className="flex min-w-0 flex-1 flex-col gap-1">
      <span className="flex min-w-0 items-start gap-2">
        {unread ? (
          <span
            aria-hidden="true"
            className="bg-primary mt-1.5 size-2 shrink-0 rounded-full"
          />
        ) : null}
        <span className="min-w-0 flex-1 font-medium">{notification.title}</span>
      </span>
      {notification.description ? (
        <span className="text-muted-foreground line-clamp-2 text-xs font-normal">
          {notification.description}
        </span>
      ) : null}
      {notification.timestampLabel || notification.createdAt ? (
        <span className="text-muted-foreground text-xs font-normal">
          {notification.timestampLabel ??
            formatNotificationDate(notification.createdAt, locale)}
        </span>
      ) : null}
    </span>
  );

  return (
    <div
      className={cn(
        "group grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start py-2",
        unread && "bg-muted/70",
      )}
      data-unread={unread || undefined}
    >
      {notification.href || onNavigate ? (
        <Button
          className="h-auto w-full min-w-0 justify-start px-3 py-2.5 text-left [overflow-wrap:anywhere] whitespace-normal"
          onClick={selectNotification}
          type="button"
          variant="ghost"
        >
          {content}
        </Button>
      ) : (
        <div className="flex min-w-0 px-3 py-2.5 [overflow-wrap:anywhere]">
          {content}
        </div>
      )}
      {!notification.archivedAt && onArchive ? (
        <div className="pt-2 pr-2">
          <ArchiveButton
            label={labels.archiveItem(notificationTitle(notification))}
            notificationIds={[notification.id]}
            onArchive={onArchive}
          />
        </div>
      ) : null}
    </div>
  );
}

export function NotificationEmpty({
  description,
  icon,
  title,
}: {
  description: string;
  icon: ReactNode;
  title: string;
}) {
  return (
    <Empty className="min-h-48 p-6">
      <EmptyHeader>
        <EmptyMedia variant="icon">{icon}</EmptyMedia>
        <EmptyTitle className="text-sm">{title}</EmptyTitle>
        <EmptyDescription className="text-xs">{description}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

function ArchiveButton<ActionResult>({
  className,
  label,
  showLabel = false,
  notificationIds,
  onArchive,
}: {
  className?: string | undefined;
  label: string;
  showLabel?: boolean;
  notificationIds: readonly string[];
  onArchive: NotificationAction<ActionResult>;
}) {
  const [pending, setPending] = useState(false);
  const archiveNotifications = async () => {
    setPending(true);
    try {
      await onArchive(notificationIds);
    } finally {
      setPending(false);
    }
  };

  return (
    <Button
      aria-label={label}
      className={className}
      disabled={pending}
      onClick={() => void archiveNotifications()}
      size={showLabel ? "sm" : "icon-sm"}
      title={label}
      type="button"
      variant={showLabel ? "outline" : "ghost"}
    >
      <Archive data-icon={showLabel ? "inline-start" : undefined} />
      {showLabel ? label : null}
    </Button>
  );
}

function NotificationListLoading({ label }: { label: string }) {
  return (
    <div aria-label={label} className="flex flex-col gap-2 p-3" role="status">
      {[0, 1, 2].map((item) => (
        <div className="flex items-center gap-3 p-2" key={item}>
          <Skeleton className="size-2 shrink-0 rounded-full" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-3 w-2/5" />
          </div>
        </div>
      ))}
    </div>
  );
}

const formatNotificationDate = (
  value: Date | string | undefined,
  locale: string,
) => {
  if (!value) return undefined;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const notificationTitle = (notification: NotificationItem) =>
  Schema.is(Schema.String)(notification.title)
    ? notification.title
    : defaultMessages.en.notifications;
