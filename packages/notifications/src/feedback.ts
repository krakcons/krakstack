import { Context, Layer } from "effect";

// Host capability configuration, never publication request data. Enable only
// alongside authenticated feedback ingestion and durable reconciliation.
export const NotificationFeedbackChannels = Context.Reference<
  ReadonlyArray<string>
>("@krak-stack/notifications/FeedbackChannels", { defaultValue: () => [] });
export const notificationFeedbackLayer = (channels: ReadonlyArray<string>) =>
  Layer.succeed(NotificationFeedbackChannels, [...channels]);
