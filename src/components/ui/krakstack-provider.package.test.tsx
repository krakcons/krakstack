import { describe, expect, it } from "@effect/vitest";
import { KrakstackProvider } from "@krak-stack/registry/krakstack-provider";
import { Loading } from "@krak-stack/registry/loading";
import { renderToStaticMarkup } from "react-dom/server";

describe("packaged KrakstackProvider", () => {
  it("shares its locale context with separately packaged components", () => {
    const html = renderToStaticMarkup(
      <KrakstackProvider locale="fr" locales={["en", "fr"]}>
        <Loading />
      </KrakstackProvider>,
    );

    expect(html).toContain("Chargement...");
  });
});
