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

  it("accepts provider-independent locale values and ignores malformed tags", () => {
    expect(
      LocaleContext.fromRequest(
        new Request("https://example.com?locale=de", {
          headers: { cookie: "locale=fr", locale: "de" },
        }),
      ),
    ).toEqual({ fallbackLocale: "en", locale: "de" });

    expect(
      LocaleContext.fromRequest(
        new Request("https://example.com?locale=not_a_locale", {
          headers: { cookie: "locale=fr" },
        }),
      ),
    ).toEqual({ fallbackLocale: "en", locale: "fr" });
  });

  it("selects the highest-quality valid Accept-Language entry", () => {
    expect(
      LocaleContext.fromRequest(
        new Request("https://example.com", {
          headers: { "accept-language": "en;q=0.5, es-MX;q=0.9, *;q=1" },
        }),
      ),
    ).toEqual({ fallbackLocale: "en", locale: "es-MX" });
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

  it("falls back from a regional locale to its base-language translation", () => {
    expect(
      localize(
        { fallbackLocale: "en", locale: "fr-CA" },
        {
          id: "record-id",
          translations: [
            { locale: "en", name: "English name" },
            { locale: "fr", name: "Nom français" },
          ],
        },
      ),
    ).toEqual({ id: "record-id", locale: "fr", name: "Nom français" });
  });
});
