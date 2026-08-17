import { describe, expect, it } from "@effect/vitest";

import { LocaleContext, localize } from "./localization";

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

  it("returns the base record when exact localization has no match", () => {
    expect(
      localize(
        { fallbackLocale: "none", locale: "fr" },
        {
          id: "record-id",
          name: "Base name",
          translations: [{ locale: "en", name: "English name" }],
        },
      ),
    ).toEqual({ id: "record-id", locale: "fr" });
  });
});
