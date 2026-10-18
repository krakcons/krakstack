import { Context, Effect, Schema } from "effect";
import type { HttpServerRequest } from "effect/http";

export interface OtlpLogsResult {
  readonly body: Uint8Array;
  /** All records in this batch have committed to authoritative storage. */
  readonly persisted: boolean;
}

export class OtlpProcessingError extends Schema.TaggedError<OtlpProcessingError>()(
  "OtlpProcessingError",
  { status: Schema.Literals([400, 403, 409, 413, 503]) },
) {}

/** Optional processing at the existing OTLP/HTTP logs boundary. */
export class OtlpLogsProcessor extends Context.Service<
  OtlpLogsProcessor,
  {
    readonly process: (
      body: Uint8Array,
    ) => Effect.Effect<
      OtlpLogsResult,
      OtlpProcessingError,
      HttpServerRequest.HttpServerRequest
    >;
  }
>()("krakstack/opentelemetry/OtlpLogsProcessor") {}
