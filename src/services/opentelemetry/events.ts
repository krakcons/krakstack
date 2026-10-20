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
  readonly scopeName?: string;
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
          body: (logRecords: Array<EventRecord>) => {
            const scopes = new Map<string, Array<EventRecord>>();
            for (const { scopeName, canExport, ...record } of logRecords) {
              if (canExport && !canExport()) continue;
              const name = scopeName ?? options.scopeName ?? "krakstack.events";
              const records = scopes.get(name);
              if (records) records.push(record);
              else scopes.set(name, [record]);
            }
            return [
              serialization.logs({
                resourceLogs: [
                  {
                    resource,
                    scopeLogs: Array.from(scopes, ([name, records]) => ({
                      scope: { name },
                      logRecords: records,
                    })),
                  },
                ],
              }),
              Effect.void,
            ];
          },
        });
      }),
    );
}

interface EventRecord {
  /** Local-only revocation check; never serialized into OTLP. */
  readonly canExport?: () => boolean;
  readonly scopeName?: string;
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
export const event = Effect.fnUntraced(function* (
  name: string,
  properties?: EventAttributes,
  options?: EventOptions,
) {
  const decoded = yield* Schema.decodeUnknownEffect(TelemetryEvent)({
    name,
    properties,
    options,
  });
  const events = yield* OtlpEvents;
  const clock = yield* Clock.Clock;
  const observedTime = clock.currentTimeNanosUnsafe().toString();
  const timestamp = decoded.options?.timestamp
    ? (
        BigInt(DateTime.toEpochMillis(decoded.options.timestamp)) * 1_000_000n
      ).toString()
    : observedTime;
  const span = yield* Effect.currentSpan.pipe(Effect.option);
  const attributes = { ...decoded.options?.context, ...decoded.properties };
  if (decoded.options?.userId) attributes["user.id"] = decoded.options.userId;
  if (decoded.options?.anonymousId)
    attributes["analytics.anonymous_id"] = decoded.options.anonymousId;
  if (decoded.options?.sessionId)
    attributes["session.id"] = decoded.options.sessionId;
  if (decoded.options?.messageId)
    attributes["log.record.uid"] = decoded.options.messageId;
  const annotations = yield* References.CurrentLogAnnotations;
  events.push({
    eventName: decoded.name,
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
