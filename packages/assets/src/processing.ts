import {
  ChunkerType,
  OutputFormat,
  TableChunkingMode,
  type ExtractionConfig,
} from "@xberg-io/xberg";
import { Schema } from "effect";

export const ASSET_PROCESSOR_VERSION = 4;

export interface AssetProcessingOptions {
  readonly processorVersion: number;
  readonly maxInputBytes: number;
  readonly maxOutputBytes: number;
  readonly concurrency: number;
  readonly extraction: ExtractionConfig;
}

const PositiveInt = Schema.Int.check(Schema.isGreaterThan(0));
export const AssetProcessingLimitsSchema = Schema.Struct({
  processorVersion: PositiveInt,
  maxInputBytes: PositiveInt.check(
    Schema.isLessThanOrEqualTo(100 * 1024 * 1024),
  ),
  maxOutputBytes: PositiveInt.check(
    Schema.isLessThanOrEqualTo(100 * 1024 * 1024),
  ),
  concurrency: PositiveInt.check(Schema.isLessThanOrEqualTo(64)),
}).annotate({ identifier: "AssetProcessingLimits" });

export const defaultAssetProcessingOptions: AssetProcessingOptions = {
  processorVersion: ASSET_PROCESSOR_VERSION,
  maxInputBytes: 20 * 1024 * 1024,
  maxOutputBytes: 20 * 1024 * 1024,
  concurrency: 2,
  extraction: {
    outputFormat: OutputFormat.Markdown,
    pages: { extractPages: true },
    chunking: {
      chunkerType: ChunkerType.Markdown,
      maxCharacters: 4000,
      overlap: 200,
      prependHeadingContext: true,
      tableChunking: TableChunkingMode.RepeatHeader,
    },
    extractionTimeoutSecs: 30,
    maxConcurrentExtractions: 1,
    maxEmbeddedFileBytes: 10 * 1024 * 1024,
    useCache: false,
    securityLimits: {
      maxArchiveSize: 50 * 1024 * 1024,
      maxCompressionRatio: 100,
      maxFilesInArchive: 1000,
      maxNestingDepth: 50,
      maxEntityLength: 1024 * 1024,
      maxContentSize: 20 * 1024 * 1024,
      maxIterations: 1_000_000,
      maxXmlDepth: 50,
      maxTableCells: 100_000,
    },
  },
};

export const PROCESSABLE_MIME_TYPES = new Set([
  "text/vtt",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "text/markdown",
  "text/csv",
  "application/json",
  "application/rtf",
  "text/rtf",
]);
