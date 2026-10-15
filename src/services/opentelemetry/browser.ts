import {
  Context,
  Effect,
  FiberSet,
  Layer,
  Predicate,
  Ref,
  References,
  Schema,
  Stream,
} from "effect";
import { FetchHttpClient, HttpClientRequest } from "effect/http";
import {
  type Otlp,
  OtlpExporter,
  OtlpLogger,
  OtlpMetrics,
  OtlpSerialization,
  OtlpTracer,
} from "effect/observability";

import { OtlpEvents, track, type EventExportOptions } from "./events";
import {
  BrowserIdentity,
  PageEvent,
  type EventAttributes,
  type EventOptions,
  type PageOptions,
} from "./schema";

export type {
  BrowserIdentity,
  EventAttributes,
  EventOptions,
  PageOptions,
} from "./schema";

class BrowserIdentityState extends Context.Service<
  BrowserIdentityState,
  Ref.Ref<BrowserIdentity>
>()("krakstack/opentelemetry/BrowserIdentity") {
  static readonly layer = Layer.effect(this, Ref.make<BrowserIdentity>({}));
}

class BrowserReportedError extends Schema.TaggedError<BrowserReportedError>()(
  "BrowserReportedError",
  {
    type: Schema.Literals(["window.error", "unhandledrejection"]),
    message: Schema.String,
    stack: Schema.optional(Schema.String),
  },
) {}

const reportBrowserException = (exception: BrowserReportedError) =>
  Effect.fail(exception).pipe(
    Effect.withSpan("browser.exception", {
      root: true,
      sampled: true,
      attributes: {
        "exception.type": exception.type,
        "exception.message": exception.message,
        "exception.stacktrace": exception.stack ?? "",
      },
    }),
    Effect.ignoreCause,
  );

const BrowserExceptionTrackingLive = Layer.effectDiscard(
  Stream.merge(
    Stream.fromEventListener<ErrorEvent>(globalThis, "error", {
      bufferSize: 100,
    }).pipe(
      Stream.map((event) => {
        const error: unknown = event.error;
        return new BrowserReportedError({
          type: "window.error",
          message: event.message,
          stack: Predicate.isError(error) ? error.stack : undefined,
        });
      }),
    ),
    Stream.fromEventListener<PromiseRejectionEvent>(
      globalThis,
      "unhandledrejection",
      { bufferSize: 100 },
    ).pipe(
      Stream.map((event) => {
        const reason: unknown = event.reason;
        return new BrowserReportedError(
          Predicate.isError(reason)
            ? {
                type: "unhandledrejection",
                message: reason.message,
                stack: reason.stack,
              }
            : {
                type: "unhandledrejection",
                message: "Unhandled promise rejection",
              },
        );
      }),
    ),
  ).pipe(Stream.runForEach(reportBrowserException), Effect.forkScoped),
);

const BrowserLifecycleFlushingLive = Layer.effectDiscard(
  Effect.gen(function* () {
    const flusher = yield* OtlpExporter.Flusher;
    const fibers = yield* FiberSet.make();
    const run = yield* FiberSet.runtime(fibers)();
    const flush = () => {
      run(
        flusher.flush.pipe(
          Effect.provideService(FetchHttpClient.RequestInit, {
            keepalive: true,
          }),
        ),
      );
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") flush();
    };

    yield* Effect.acquireRelease(
      Effect.sync(() => {
        document.addEventListener("visibilitychange", onVisibilityChange);
        globalThis.addEventListener("pagehide", flush);
      }),
      () =>
        Effect.sync(() => {
          document.removeEventListener("visibilitychange", onVisibilityChange);
          globalThis.removeEventListener("pagehide", flush);
        }),
    );
  }),
);

type OtlpOptions = Parameters<typeof Otlp.layerJson>[0];

type SignalOptions<Options> = Omit<Options, "url" | "resource" | "headers">;

export interface BrowserOtlpOptions {
  readonly serviceName: string;
  readonly serviceVersion?: string;
  readonly attributes?: NonNullable<OtlpOptions["resource"]>["attributes"];
  readonly baseUrl?: string;
  readonly headers?: OtlpOptions["headers"];
  readonly traces?:
    | false
    | SignalOptions<Parameters<typeof OtlpTracer.layer>[0]>;
  readonly metrics?:
    | false
    | SignalOptions<Parameters<typeof OtlpMetrics.layer>[0]>;
  readonly logs?: false | SignalOptions<Parameters<typeof OtlpLogger.layer>[0]>;
  readonly events?:
    | false
    | (EventExportOptions & {
        /** Initial page and pathname changes; enabled by default. */
        readonly pageViews?: boolean;
      });
}

const browserEffects = {
  /** Replaces identity for future events; null clears it without emitting an event. */
  identify: Effect.fnUntraced(function* (input: BrowserIdentity | null) {
    const identity = yield* Schema.decodeUnknownEffect(BrowserIdentity)(
      input === null ? {} : input,
    );
    const state = yield* BrowserIdentityState;
    yield* Ref.set(state, identity);
  }),

  track: Effect.fnUntraced(function* (
    name: string,
    properties?: EventAttributes,
    options?: EventOptions,
  ) {
    const state = yield* BrowserIdentityState;
    const identity = yield* Ref.get(state);
    const annotations: Record<string, string> = {};
    if (identity.userId) annotations["user.id"] = identity.userId;
    if (identity.organizationId)
      annotations["organization.id"] = identity.organizationId;
    const scoped = yield* References.CurrentLogAnnotations;
    yield* track(name, properties, options).pipe(
      Effect.annotateLogs({ ...annotations, ...scoped }),
    );
  }),

  /** Call on initial render and completed SPA navigations; no identifiers are persisted. */
  page: Effect.fnUntraced(function* (
    input: PageOptions = {},
  ): Effect.fn.Return<
    void,
    Schema.SchemaError,
    BrowserIdentityState | OtlpEvents
  > {
    const page = yield* Schema.decodeUnknownEffect(PageEvent)(input);
    const properties = { ...page.properties };
    if (page.name) properties["analytics.page.name"] = page.name;
    if (page.category) properties["analytics.page.category"] = page.category;
    properties["url.path"] =
      (page.path ?? globalThis.location.pathname).split(/[?#]/, 1)[0] ?? "/";
    yield* browserEffects.track("browser.page_view", properties, page.options);
  }),
};

type BrowserProgram = Effect.Effect<
  void,
  Schema.SchemaError,
  BrowserIdentityState | OtlpEvents
>;
interface BrowserClient {
  readonly identity: Ref.Ref<BrowserIdentity>;
  readonly events: OtlpEvents["Service"];
}
const browserClients: Array<BrowserClient> = [];
const runBrowser = (
  program: BrowserProgram,
): Effect.Effect<void, Schema.SchemaError> =>
  Effect.suspend(() => {
    const client = browserClients.at(-1);
    if (!client) return Effect.void;
    return program.pipe(
      Effect.provideService(BrowserIdentityState, client.identity),
      Effect.provideService(OtlpEvents, client.events),
    );
  });

const BrowserClientLive = Layer.effectDiscard(
  Effect.gen(function* () {
    const identity = yield* BrowserIdentityState;
    const events = yield* OtlpEvents;
    yield* Effect.acquireRelease(
      Effect.sync(() => {
        const client = { identity, events };
        browserClients.push(client);
        return client;
      }),
      (client) =>
        Effect.sync(() => {
          const index = browserClients.indexOf(client);
          if (index !== -1) browserClients.splice(index, 1);
        }),
    );
  }),
);

const pageViewListeners = new Set<() => void>();
let stopPageViewTracking: (() => void) | undefined;

const subscribePageViews = (listener: () => void) => {
  if (pageViewListeners.size === 0) {
    const history = globalThis.history;
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
    const run = yield* FiberSet.runtime(fibers)<
      BrowserIdentityState | OtlpEvents
    >();
    let previousPath = globalThis.location.pathname;
    yield* Effect.acquireRelease(
      Effect.sync(() =>
        subscribePageViews(() => {
          const path = globalThis.location.pathname;
          if (path === previousPath) return;
          previousPath = path;
          run(browserEffects.page({ path }).pipe(Effect.ignore));
        }),
      ),
      (unsubscribe) => Effect.sync(unsubscribe),
    );
    yield* browserEffects.page({ path: previousPath }).pipe(Effect.ignore);
  }),
);

export class BrowserOtlp {
  /** Uses the active browser layer; invalid identity warns without failing or changing state. */
  static readonly identify = (identity: BrowserIdentity | null) =>
    runBrowser(browserEffects.identify(identity)).pipe(
      Effect.catch(() =>
        Effect.logWarning(
          "Invalid browser telemetry identity; keeping previous identity",
        ),
      ),
    );
  static readonly track = (
    name: string,
    properties?: EventAttributes,
    options?: EventOptions,
  ) => runBrowser(browserEffects.track(name, properties, options));
  static readonly page = (options?: PageOptions) =>
    runBrowser(browserEffects.page(options));

  static readonly pageView = BrowserOtlp.page;

  static readonly layer = ({
    attributes,
    baseUrl = "/api/otel",
    logs = false,
    events = false,
    metrics = false,
    serviceName,
    serviceVersion,
    traces = {},
    headers,
  }: BrowserOtlpOptions) => {
    const { pageViews = true, ...eventOptions } =
      events === false ? {} : events;
    const resource = { attributes, serviceName, serviceVersion };
    const request = HttpClientRequest.get(baseUrl);
    const signalUrl = (signal: "logs" | "metrics" | "traces") =>
      HttpClientRequest.appendUrl(request, `/v1/${signal}`).url;
    const exporters = Layer.mergeAll(
      OtlpExporter.layerFlusher,
      events !== false
        ? OtlpEvents.layer({
            exportInterval: "30 seconds",
            maxBatchSize: 100,
            shutdownTimeout: "3 seconds",
            ...eventOptions,
            url: signalUrl("logs"),
            resource,
            headers,
          })
        : OtlpEvents.disabledLayer,
      traces !== false
        ? OtlpTracer.layer({
            exportInterval: "30 seconds",
            ...traces,
            url: signalUrl("traces"),
            resource,
            headers,
          })
        : Layer.empty,
      metrics !== false
        ? OtlpMetrics.layer({
            exportInterval: "60 seconds",
            ...metrics,
            url: signalUrl("metrics"),
            resource,
            headers,
          })
        : Layer.empty,
      logs !== false
        ? OtlpLogger.layer({
            excludeLogSpans: true,
            mergeWithExisting: true,
            ...logs,
            url: signalUrl("logs"),
            resource,
            headers,
          })
        : Layer.empty,
    ).pipe(
      Layer.provideMerge(OtlpExporter.layerFlusher),
      Layer.provide(OtlpSerialization.layerJson),
      Layer.provide(FetchHttpClient.layer),
    );

    return Layer.mergeAll(
      BrowserClientLive,
      BrowserLifecycleFlushingLive,
      events !== false && pageViews ? BrowserPageViewsLive : Layer.empty,
      traces !== false ? BrowserExceptionTrackingLive : Layer.empty,
    ).pipe(
      Layer.provideMerge(Layer.merge(BrowserIdentityState.layer, exporters)),
    );
  };
}
