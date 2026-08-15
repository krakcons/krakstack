import { describe, expect, it } from "@effect/vitest";
import { Effect, Layer, Schema, Stream } from "effect";
import { HttpClient, HttpClientResponse } from "effect/unstable/http";

import { FileExtractionService } from "@/services/file-extraction";

import {
  WebFetchRequest,
  WebFetchToolkit,
  WebFetchToolkitLayer,
} from "./webfetch-toolkit";

describe("web fetch toolkit", () => {
  it.effect("fetches and extracts a public HTML page", () => {
    const client = HttpClient.make((request) =>
      Effect.succeed(
        HttpClientResponse.fromWeb(
          request,
          new Response("<main><h1>Effect</h1><p>Typed effects.</p></main>", {
            headers: { "content-type": "text/html; charset=utf-8" },
          }),
        ),
      ),
    );

    return Effect.gen(function* () {
      const toolkit = yield* WebFetchToolkit;
      const resultStream = yield* toolkit.handle("webFetch", {
        url: "https://effect.website/docs",
      });
      const results = Array.from(yield* Stream.runCollect(resultStream));

      expect(results).toHaveLength(1);
      expect(results[0]?.isFailure).toBe(false);
      expect(results[0]?.result).toMatchObject({
        url: "https://effect.website/docs",
        contentType: "text/html",
        truncated: false,
      });
      expect(JSON.stringify(results[0]?.result)).toContain("Effect");
    }).pipe(
      Effect.provide(WebFetchToolkitLayer()),
      Effect.provide(FileExtractionService.layer),
      Effect.provide(Layer.succeed(HttpClient.HttpClient, client)),
    );
  });

  it("rejects unsafe URL forms", () => {
    const decode = Schema.decodeUnknownExit(WebFetchRequest);

    expect(decode({ url: "http://example.com" })._tag).toBe("Failure");
    expect(decode({ url: "https://localhost" })._tag).toBe("Failure");
    expect(decode({ url: "https://127.0.0.1" })._tag).toBe("Failure");
    expect(decode({ url: "https://user:pass@example.com" })._tag).toBe(
      "Failure",
    );
    expect(decode({ url: "https://example.com:8443" })._tag).toBe("Failure");
  });

  it.effect("rejects oversized responses before extraction", () => {
    const client = HttpClient.make((request) =>
      Effect.succeed(
        HttpClientResponse.fromWeb(
          request,
          new Response("too large", {
            headers: {
              "content-length": String(2 * 1024 * 1024 + 1),
              "content-type": "text/plain",
            },
          }),
        ),
      ),
    );

    return Effect.gen(function* () {
      const toolkit = yield* WebFetchToolkit;
      const resultStream = yield* toolkit.handle("webFetch", {
        url: "https://example.com/document.txt",
      });
      const results = Array.from(yield* Stream.runCollect(resultStream));

      expect(results[0]?.isFailure).toBe(true);
      expect(results[0]?.result).toMatchObject({ code: "too-large" });
    }).pipe(
      Effect.provide(WebFetchToolkitLayer()),
      Effect.provide(FileExtractionService.layer),
      Effect.provide(Layer.succeed(HttpClient.HttpClient, client)),
    );
  });

  it.effect("applies consumer content limits", () => {
    const client = HttpClient.make((request) =>
      Effect.succeed(
        HttpClientResponse.fromWeb(
          request,
          new Response("abcdefghij", {
            headers: { "content-type": "text/plain" },
          }),
        ),
      ),
    );

    return Effect.gen(function* () {
      const toolkit = yield* WebFetchToolkit;
      const resultStream = yield* toolkit.handle("webFetch", {
        url: "https://example.com/document.txt",
      });
      const results = Array.from(yield* Stream.runCollect(resultStream));

      expect(results[0]?.result).toMatchObject({
        content: "abcde",
        truncated: true,
      });
    }).pipe(
      Effect.provide(WebFetchToolkitLayer({ maxContentCharacters: 5 })),
      Effect.provide(FileExtractionService.layer),
      Effect.provide(Layer.succeed(HttpClient.HttpClient, client)),
    );
  });
});
