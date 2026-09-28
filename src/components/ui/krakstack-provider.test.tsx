import { describe, expect, it } from "@effect/vitest";
import { renderToStaticMarkup } from "react-dom/server";

import {
  KrakstackProvider,
  useKrakstackLocale,
  useKrakstackLocales,
} from "./krakstack-provider";
import { Loading } from "./loading";

const LocaleProbe = ({ locale }: { locale?: string }) => (
  <span>{useKrakstackLocale(locale)}</span>
);

const LocalesProbe = () => <span>{useKrakstackLocales().join(",")}</span>;

describe("KrakstackProvider", () => {
  it("provides the locale during server rendering", () => {
    const html = renderToStaticMarkup(
      <KrakstackProvider locale="fr">
        <LocaleProbe />
      </KrakstackProvider>,
    );

    expect(html).toBe("<span>fr</span>");
  });

  it("allows an explicit locale to override the provider", () => {
    const html = renderToStaticMarkup(
      <KrakstackProvider locale="fr">
        <LocaleProbe locale="en-CA" />
      </KrakstackProvider>,
    );

    expect(html).toBe("<span>en-CA</span>");
  });

  it("localizes nested registry components during server rendering", () => {
    const html = renderToStaticMarkup(
      <KrakstackProvider locale="fr">
        <Loading />
      </KrakstackProvider>,
    );

    expect(html).toContain("Chargement...");
  });

  it("provides the supported locales during server rendering", () => {
    const html = renderToStaticMarkup(
      <KrakstackProvider locale="fr" locales={["en", "fr"]}>
        <LocalesProbe />
      </KrakstackProvider>,
    );

    expect(html).toBe("<span>en,fr</span>");
  });
});
