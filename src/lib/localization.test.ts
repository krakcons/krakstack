import { describe, expect, it } from "@effect/vitest";

import { LocaleContext } from "./localization";

describe("LocaleContext", () => {
  it("resolves locale from query, header, then cookie", () => {
    expect(
      LocaleContext.fromRequest(
        new Request("https://example.com?locale=fr", {
          headers: { cookie: "locale=en", locale: "en" },
        }),
      ),
    ).toEqual({ fallbackLocale: "en", locale: "fr" });

    expect(
      LocaleContext.fromRequest({
        headers: new Headers(),
        url: "/api/pages?locale=fr",
      }),
    ).toEqual({ fallbackLocale: "en", locale: "fr" });

    expect(
      LocaleContext.fromRequest(
        new Request("https://example.com", {
          headers: { cookie: "locale=fr", locale: "en" },
        }),
      ),
    ).toEqual({ fallbackLocale: "en", locale: "en" });

    expect(
      LocaleContext.fromRequest(
        new Request("https://example.com", {
          headers: { cookie: "locale=fr" },
        }),
      ),
    ).toEqual({ fallbackLocale: "en", locale: "fr" });
  });

  it("ignores unsupported explicit locale values", () => {
    expect(
      LocaleContext.fromRequest(
        new Request("https://example.com?locale=de", {
          headers: { cookie: "locale=fr", locale: "de" },
        }),
      ),
    ).toEqual({ fallbackLocale: "en", locale: "fr" });
  });
});
