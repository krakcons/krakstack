import { describe, expect, it } from "@effect/vitest";

import { extractedText, limitTextBytes } from "./text.js";

describe("asset text bounds", () => {
  it("never splits a multibyte character", () => {
    const content = "aé😀z";
    for (const [maxBytes, expected] of [
      [0, ""],
      [1, "a"],
      [2, "a"],
      [3, "aé"],
      [4, "aé"],
      [5, "aé"],
      [6, "aé"],
      [7, "aé😀"],
      [8, content],
    ] as const) {
      expect(limitTextBytes(content, maxBytes)).toEqual({
        content: expected,
        byteSize: new TextEncoder().encode(expected).byteLength,
      });
    }
  });

  it("normalizes line endings and records output truncation", () => {
    expect(extractedText("  é\r\nabc\rdef  ", 6)).toEqual({
      content: "é\nabc",
      contentByteSize: 6,
      truncated: true,
    });
    expect(extractedText(" é\r\nx ", 10)).toEqual({
      content: "é\nx",
      contentByteSize: 4,
      truncated: false,
    });
  });
});
