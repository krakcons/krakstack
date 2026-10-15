import { describe, expect, it } from "@effect/vitest";
import { Effect, Schema } from "effect";
import { extract, ExtractInputKind } from "@xberg-io/xberg";
import { contextualizeChunks } from "./chunks.js";
import {
  AssetProcessingLimitsSchema,
  defaultAssetProcessingOptions,
} from "./processing.js";
import { AssetIndexedTextSchema } from "./schema.js";

describe("native asset chunks", () => {
  it.effect(
    "preserves heading and table context across native continuation chunks",
    () =>
      Effect.gen(function* () {
        const content =
          "# Fees\n\n| Product | Fee |\n| --- | --- |\n" +
          Array.from(
            { length: 200 },
            (_, i) => `| plan${i} | ${i} dollars |`,
          ).join("\n");
        const result = yield* Effect.promise(() =>
          extract(
            {
              kind: ExtractInputKind.Bytes,
              bytes: new TextEncoder().encode(content),
              filename: "fees.md",
              mimeType: "text/markdown",
            },
            defaultAssetProcessingOptions.extraction,
          ),
        );
        const chunks = contextualizeChunks(result.results?.[0]?.chunks ?? []);
        expect(chunks.length).toBeGreaterThan(2);
        const last = chunks.at(-1);
        expect(last?.content).toContain("plan199");
        expect(last?.content).toContain("| Product | Fee |");
        expect(last?.headingPath).toBe("Fees");
        expect(last?.firstPage).toBeNull();
        yield* Schema.decodeUnknownEffect(AssetIndexedTextSchema)({
          content,
          contentByteSize: new TextEncoder().encode(content).byteLength,
          truncated: false,
          chunks,
        });
      }),
  );

  it("rejects processing limits that could stall or silently break extraction", () => {
    for (const concurrency of [0, -1, 1.5, Infinity, NaN]) {
      expect(
        Schema.is(AssetProcessingLimitsSchema)({
          ...defaultAssetProcessingOptions,
          concurrency,
        }),
      ).toBe(false);
    }
    for (const maxOutputBytes of [0, -1, Infinity, NaN]) {
      expect(
        Schema.is(AssetProcessingLimitsSchema)({
          ...defaultAssetProcessingOptions,
          maxOutputBytes,
        }),
      ).toBe(false);
    }
  });
});
