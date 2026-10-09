import { describe, expect, it } from "@effect/vitest";
import { Effect, Stream } from "effect";

import {
  DocumentationToolkit,
  DocumentationToolkitLayer,
} from "./documentation-toolkit";
import { createDocsSource, makeDocs } from "./docs";

describe("documentation toolkit", () => {
  it.effect(
    "returns matching search and read handlers for the supplied catalogue",
    () =>
      Effect.gen(function* () {
        const docs = makeDocs({
          source: createDocsSource({ pages: [], locales: ["en"] }),
          basePath: "/docs",
          defaultSlug: "introduction",
          origin: "https://example.com",
          siteName: "Example",
        });
        const toolkit = yield* DocumentationToolkit.pipe(
          Effect.provide(DocumentationToolkitLayer({ docs, locale: "en" })),
        );
        const search = Array.from(
          yield* Stream.runCollect(
            yield* toolkit.handle("searchDocumentation", { query: "missing" }),
          ),
        );
        expect(search[0]).toMatchObject({ isFailure: false, result: [] });
        const read = Array.from(
          yield* Stream.runCollect(
            yield* toolkit.handle("readDocumentation", {
              paths: ["/docs/missing"],
            }),
          ),
        );
        expect(read[0]).toMatchObject({
          isFailure: false,
          result: { pages: [], missingPaths: ["/docs/missing"] },
        });
      }),
  );
});
