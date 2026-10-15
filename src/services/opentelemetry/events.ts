import {
  Clock,
  Context,
  DateTime,
  Effect,
  Layer,
  Option,
  References,
  Schema,
} from "effect";
import {
  OtlpExporter,
  OtlpResource,
  OtlpSerialization,
} from "effect/observability";

import {
  TelemetryEvent,
  type EventAttributes,
  type EventOptions,
} from "./schema";

type ExporterOptions = Pick<
  Parameters<typeof OtlpExporter.make>[0],
  "url" | "headers" | "exportInterval" | "maxBatchSize" | "shutdownTimeout"
> & {
  readonly resource?: Parameters<typeof OtlpResource.fromConfig>[0];
};

export type EventExportOptions = Partial<
  Pick<ExporterOptions, "exportInterval" | "maxBatchSize" | "shutdownTimeout">
>;

export class OtlpEvents extends Context.Service<
  OtlpEvents,
  { readonly push: (record: EventRecord) => void }
>()("krakstack/opentelemetry/Events") {
  static readonly disabledLayer = Layer.succeed(this, { push: () => {} });

  static readonly layer = (options: ExporterOptions) =>
    Layer.effect(
      this,
      Effect.gen(function* () {
        const serialization = yield* OtlpSerialization.OtlpSerialization;
        const resource = yield* OtlpResource.fromConfig(options.resource);
        return yield* OtlpExporter.make({
          ...options,
          label: "OtlpEvents",
          body: (logRecords) => [
            serialization.logs({
              resourceLogs: [
                {
                  resource,
                  scopeLogs: [
                    {
                      scope: { name: "krakstack.events" },
                      logRecords,
                    },
                  ],
                },
              ],
            }),
            Effect.void,
          ],
        });
      }),
    );
}

interface EventRecord {
  readonly eventName: string;
  readonly timeUnixNano: string;
  readonly observedTimeUnixNano: string;
  readonly severityNumber: 9;
  readonly attributes: ReturnType<typeof OtlpResource.entriesToAttributes>;
  readonly droppedAttributesCount: 0;
  readonly traceId?: string;
  readonly spanId?: string;
}

/** Emits an INFO event without creating a tracing span or persisting identity. */
export const track = Effect.fnUntraced(function* (
  name: string,
  properties?: EventAttributes,
  options?: EventOptions,
) {
  const event = yield* Schema.decodeUnknownEffect(TelemetryEvent)({
    name,
    properties,
    options,
  });
  const events = yield* OtlpEvents;
  const clock = yield* Clock.Clock;
  const observedTime = clock.currentTimeNanosUnsafe().toString();
  const timestamp = event.options?.timestamp
    ? (
        BigInt(DateTime.toEpochMillis(event.options.timestamp)) * 1_000_000n
      ).toString()
    : observedTime;
  const span = yield* Effect.currentSpan.pipe(Effect.option);
  const attributes = { ...event.options?.context, ...event.properties };
  if (event.options?.userId) attributes["user.id"] = event.options.userId;
  if (event.options?.anonymousId)
    attributes["analytics.anonymous_id"] = event.options.anonymousId;
  if (event.options?.sessionId)
    attributes["session.id"] = event.options.sessionId;
  if (event.options?.messageId)
    attributes["log.record.uid"] = event.options.messageId;
  const annotations = yield* References.CurrentLogAnnotations;
  events.push({
    eventName: event.name,
    timeUnixNano: timestamp,
    observedTimeUnixNano: observedTime,
    severityNumber: 9,
    attributes: OtlpResource.entriesToAttributes(
      Object.entries({
        ...attributes,
        ...annotations,
      }),
    ),
    droppedAttributesCount: 0,
    traceId: Option.isSome(span) ? span.value.traceId : undefined,
    spanId: Option.isSome(span) ? span.value.spanId : undefined,
  });
});
