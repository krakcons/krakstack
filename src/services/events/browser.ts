import type { EventAttributes } from "../opentelemetry/schema";
import { OtlpEvents, event } from "../opentelemetry/events";
import { Context, Effect, FiberSet, Layer, Option, Schema } from "effect";
import {
  analyticsAllowed,
  analyticsExportGuard,
  browserPrivacyEnabled,
  subscribeAnalyticsConsent,
} from "../opentelemetry/consent";
export {
  analyticsAllowed,
  analyticsConsentSnapshot,
  saveAnalyticsPreference,
  subscribeAnalyticsConsent,
} from "../opentelemetry/consent";

import {
  BrowserEventOptions,
  BrowserPage,
  type BrowserPageOptions,
} from "./schema";

export type { BrowserEventOptions, BrowserPageOptions } from "./schema";
export type { EventAttributes } from "../opentelemetry/schema";

export interface BrowserEventsOptions {
  readonly enabled?: boolean;
  /** Opt in to the shared notice policy. Defaults to true. */
  readonly requireConsent?: boolean;
  readonly respectDoNotTrack?: boolean;
  readonly pageViews?: boolean;
  readonly locale?: () => string;
  /** Replace paths containing personal identifiers with route templates. */
  readonly sanitizePath?: (path: string) => string;
}

const eventProperties = (properties?: EventAttributes) =>
  Object.fromEntries(
    Object.entries(properties ?? {}).map(([key, value]) => [
      key.startsWith("app.") ? key : `app.${key}`,
      value,
    ]),
  );

class BrowserEventsClient extends Context.Service<
  BrowserEventsClient,
  {
    readonly events: OtlpEvents["Service"];
    readonly allowed: () => boolean;
    readonly context: (
      name: string,
      properties?: EventAttributes,
    ) => EventAttributes;
  }
>()("krakstack/events/BrowserEventsClient") {}

const emit = Effect.fnUntraced(function* (
  name: string,
  properties?: EventAttributes,
  options?: BrowserEventOptions,
) {
  const client = yield* BrowserEventsClient;
  if (!client.allowed()) return;
  const decoded = yield* Schema.decodeUnknownEffect(BrowserEventOptions)(
    options ?? {},
  );
  yield* event(
    name,
    { ...properties, ...client.context(name, properties) },
    decoded,
  ).pipe(Effect.provideService(OtlpEvents, client.events));
});

const page = Effect.fnUntraced(function* (input: BrowserPageOptions = {}) {
  const client = yield* BrowserEventsClient;
  if (!client.allowed()) return;
  const decoded = yield* Schema.decodeUnknownEffect(BrowserPage)(input);
  const properties = eventProperties(decoded.properties);
  if (decoded.name) properties["analytics.page.name"] = decoded.name;
  if (decoded.category)
    properties["analytics.page.category"] = decoded.category;
  properties["url.path"] =
    (decoded.path ?? location.pathname).split(/[?#]/, 1)[0] ?? "/";
  yield* emit("browser.page_view", properties, decoded.options);
});

const clients: Array<BrowserEventsClient["Service"]> = [];
const runBrowser = (
  program: Effect.Effect<void, Schema.SchemaError, BrowserEventsClient>,
) =>
  Effect.suspend(() => {
    const client = clients.at(-1);
    return client
      ? program.pipe(Effect.provideService(BrowserEventsClient, client))
      : Effect.void;
  });

const BrowserClientLive = Layer.effectDiscard(
  Effect.gen(function* () {
    const client = yield* BrowserEventsClient;
    yield* Effect.acquireRelease(
      Effect.sync(() => {
        clients.push(client);
        return client;
      }),
      (client) =>
        Effect.sync(() => {
          const index = clients.indexOf(client);
          if (index !== -1) clients.splice(index, 1);
        }),
    );
  }),
);

const pageViewListeners = new Set<() => void>();
let stopPageViewTracking: (() => void) | undefined;

const subscribePageViews = (listener: () => void) => {
  if (pageViewListeners.size === 0) {
    const pushState = history.pushState;
    const replaceState = history.replaceState;
    const notify = () => {
      for (const onPage of pageViewListeners) onPage();
    };
    const trackedPushState: History["pushState"] = (...args) => {
      pushState.apply(history, args);
      notify();
    };
    const trackedReplaceState: History["replaceState"] = (...args) => {
      replaceState.apply(history, args);
      notify();
    };
    history.pushState = trackedPushState;
    history.replaceState = trackedReplaceState;
    globalThis.addEventListener("popstate", notify);
    stopPageViewTracking = () => {
      globalThis.removeEventListener("popstate", notify);
      if (history.pushState === trackedPushState) history.pushState = pushState;
      if (history.replaceState === trackedReplaceState)
        history.replaceState = replaceState;
    };
  }
  pageViewListeners.add(listener);
  return () => {
    pageViewListeners.delete(listener);
    if (pageViewListeners.size === 0) {
      stopPageViewTracking?.();
      stopPageViewTracking = undefined;
    }
  };
};

const BrowserPageViewsLive = Layer.effectDiscard(
  Effect.gen(function* () {
    const fibers = yield* FiberSet.make();
    const run = yield* FiberSet.runtime(fibers)<BrowserEventsClient>();
    let previousPath = location.pathname;
    yield* Effect.acquireRelease(
      Effect.sync(() =>
        subscribePageViews(() => {
          const path = location.pathname;
          if (path === previousPath) return;
          previousPath = path;
          run(page({ path }).pipe(Effect.ignore));
        }),
      ),
      (unsubscribe) => Effect.sync(unsubscribe),
    );
    yield* page({ path: previousPath }).pipe(Effect.ignore);
    yield* Effect.acquireRelease(
      Effect.sync(() => {
        let allowed = analyticsAllowed();
        return subscribeAnalyticsConsent(() => {
          const active = analyticsAllowed();
          if (active && !allowed) run(page().pipe(Effect.ignore));
          allowed = active;
        });
      }),
      (unsubscribe) => Effect.sync(unsubscribe),
    );
  }),
);

export class BrowserEvents {
  static readonly track = (
    name: string,
    properties?: EventAttributes,
    options?: BrowserEventOptions,
  ) => runBrowser(emit(name, eventProperties(properties), options));
  static readonly page = (options?: BrowserPageOptions) =>
    runBrowser(page(options));

  /** Requires BrowserOtlp; no identifiers are persisted. */
  static readonly layer = ({
    enabled = true,
    requireConsent = true,
    respectDoNotTrack = true,
    pageViews = true,
    locale,
    sanitizePath,
  }: BrowserEventsOptions = {}) => {
    const allowed = () =>
      enabled &&
      (!respectDoNotTrack || !browserPrivacyEnabled()) &&
      (!requireConsent || analyticsAllowed());
    let previousPath: string | undefined;
    let pageViewId = crypto.randomUUID();
    const context = (
      name: string,
      properties?: EventAttributes,
    ): EventAttributes => {
      const explicitPath = Schema.decodeUnknownOption(Schema.String)(
        properties?.["url.path"],
      );
      const path = Option.getOrElse(explicitPath, () => location.pathname);
      if (location.pathname !== previousPath || name === "browser.page_view") {
        previousPath = location.pathname;
        pageViewId = crypto.randomUUID();
      }
      const attributes = {
        "app.event.schema.version": "1",
        "analytics.page_view.id": pageViewId,
        "log.record.uid": crypto.randomUUID(),
        "url.path": sanitizePath?.(path) ?? path,
        "browser.language": navigator.language.slice(0, 256),
      };
      const optional: Record<string, string> = {};
      if (locale) optional["analytics.locale"] = locale();
      if (document.referrer) {
        const referrer = URL.parse(document.referrer);
        if (referrer && referrer.hostname !== location.hostname)
          optional["url.referrer"] = referrer.hostname;
      }
      const search = new URLSearchParams(location.search);
      for (const key of ["source", "medium", "campaign", "content", "term"]) {
        const value = search.get(`utm_${key}`);
        if (value) optional[`utm.${key}`] = value.slice(0, 256);
      }
      return { ...attributes, ...optional };
    };
    const client = Layer.effect(
      BrowserEventsClient,
      Effect.gen(function* () {
        const exporter = yield* OtlpEvents;
        return {
          allowed,
          events: {
            push: (record: Parameters<typeof exporter.push>[0]) => {
              if (allowed())
                exporter.push({
                  ...record,
                  canExport: requireConsent ? analyticsExportGuard() : allowed,
                  scopeName: "krakstack.application.events",
                });
            },
          },
          context,
        };
      }),
    );
    const browser = Layer.mergeAll(
      BrowserClientLive,
      enabled && pageViews ? BrowserPageViewsLive : Layer.empty,
    ).pipe(Layer.provideMerge(client));
    return browser;
  };
}
