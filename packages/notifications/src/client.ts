// Keep React presentation out of the server entry point. The registry remains
// the single implementation shared by package and source-registry consumers.
export {
  NotificationMenu,
  NotificationMenuTrigger,
  NotificationList,
  NotificationListItem,
  NotificationEmpty,
  notificationMenuMessages,
  type NotificationItem,
  type NotificationMenuMessages,
  type NotificationMenuMessageTranslations,
  type NotificationMenuProps,
  type NotificationMenuState,
  type NotificationMenuTab,
} from "@krak-stack/registry/service-notification/client";
