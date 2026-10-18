import { onCLS, onFCP, onINP, onLCP, onTTFB, type Metric } from "web-vitals";
import { Clock, Context, Effect, Layer, Schema } from "effect";
import { OtlpEvents } from "./events";
import { BrowserWebVital } from "./schema";

const subscribers = new Set<(metric: Metric) => void>();
let started = false;

/** web-vitals observers are document-scoped; only subscribers retain application state. */
export const subscribeWebVitals = (subscriber: (metric: Metric) => void) => {
  subscribers.add(subscriber);
  if (!started) {
    started = true;
    const report = (metric: Metric) => {
      for (const listener of subscribers) listener(metric);
    };
    onCLS(report);
    onFCP(report);
    onINP(report);
    onLCP(report);
    onTTFB(report);
  }
  return () => {
    subscribers.delete(subscriber);
  };
};

export const WebVitals = Context.Reference<{
  readonly subscribe: typeof subscribeWebVitals;
}>("krakstack/opentelemetry/WebVitals", {
  defaultValue: () => ({ subscribe: subscribeWebVitals }),
});

/** https://opentelemetry.io/docs/specs/semconv/browser/browser-events/ */
export const BrowserWebVitalsLive = Layer.effectDiscard(
  Effect.gen(function* () {
    const vitals = yield* WebVitals;
    const events = yield* OtlpEvents;
    const clock = yield* Clock.Clock;
    const seen = new Map<string, number>();
    yield* Effect.acquireRelease(
      Effect.sync(() =>
        vitals.subscribe((input) => {
          const parsed = Schema.decodeUnknownOption(BrowserWebVital)(input);
          if (parsed._tag === "None") return;
          const metric = parsed.value;
          const key = `${metric.name}:${metric.id}`;
          if (seen.get(key) === metric.value) return;
          seen.set(key, metric.value);
          const timestamp = clock.currentTimeNanosUnsafe().toString();
          events.push({
            eventName: "browser.web_vital",
            timeUnixNano: timestamp,
            observedTimeUnixNano: timestamp,
            severityNumber: 9,
            droppedAttributesCount: 0,
            attributes: [
              {
                key: "browser.web_vital.name",
                value: { stringValue: metric.name.toLowerCase() },
              },
              {
                key: "browser.web_vital.id",
                value: { stringValue: metric.id },
              },
              {
                key: "browser.web_vital.value",
                value: { doubleValue: metric.value },
              },
              {
                key: "browser.web_vital.delta",
                value: { doubleValue: metric.delta },
              },
              {
                key: "browser.web_vital.rating",
                value: { stringValue: metric.rating },
              },
              {
                key: "browser.web_vital.navigation_type",
                value: { stringValue: metric.navigationType },
              },
              {
                key: "log.record.uid",
                value: { stringValue: `${metric.id}:${metric.value}` },
              },
            ],
          });
        }),
      ),
      (unsubscribe) => Effect.sync(unsubscribe),
    );
  }),
);
