import { expect, test, type Page } from "@playwright/test";

const origin = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3010";
test.use({ timezoneId: "America/New_York" });
const visit = async (page: Page, locale: string, slug: string) => {
  await page.setViewportSize({
    width: locale === "fr" ? 320 : 1280,
    height: 1000,
  });
  await page.goto(`${origin}/${locale}/docs/${slug}`);
  const code = page.getByRole("tab", { name: "Code", exact: true });
  await code.click();
  await expect(code).toHaveAttribute("aria-selected", "true");
  const name = locale === "fr" ? "Aperçu" : "Preview";
  await page.getByRole("tab", { name, exact: true }).click();
  await expect(page.getByRole("tab", { name, exact: true })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    )
    .toBe(true);
  return page.getByRole("tabpanel", { name, exact: true });
};

for (const locale of ["en", "fr"]) {
  const french = locale === "fr";
  test(`crop editor exports a real bounded image with pointer and keyboard positioning in ${locale}`, async ({
    page,
  }) => {
    const demo = await visit(page, locale, "image-crop-editor");
    const crop = demo.getByRole("img", {
      name: french ? "Recadrer l’image d’exemple" : "Crop example image",
      exact: true,
    });
    await expect(crop).toBeVisible();
    const zoom = demo.getByRole("slider", { name: "Zoom", exact: true });
    await zoom.fill("2");
    const position = demo.getByRole("slider", {
      name: french ? "Position horizontale" : "Horizontal position",
    });
    await position.focus();
    await position.press("ArrowRight");
    await expect(position).toHaveValue("51");
    await crop.scrollIntoViewIfNeeded();
    const bounds = await crop.boundingBox();
    if (!bounds) throw new Error("Crop viewport must be visible");
    await page.mouse.move(
      bounds.x + bounds.width / 2,
      bounds.y + bounds.height / 2,
    );
    await page.mouse.down();
    await page.mouse.move(
      bounds.x + bounds.width / 2 + 30,
      bounds.y + bounds.height / 2,
      { steps: 4 },
    );
    await page.mouse.up();
    await expect(position).not.toHaveValue("51");
    await demo
      .getByRole("button", { name: french ? "Pivoter de 90°" : "Rotate 90°" })
      .click();
    await demo
      .getByRole("button", {
        name: french ? "Exporter l’image" : "Export image",
      })
      .click();
    const result = demo.getByRole("img", {
      name: french ? "Aperçu du PNG exporté" : "Exported PNG preview",
    });
    await expect(result).toBeVisible();
    await expect
      .poll(() =>
        result.evaluate((image: HTMLImageElement) => image.naturalWidth),
      )
      .toBe(300);
    expect(
      await result.evaluate((image: HTMLImageElement) => image.naturalHeight),
    ).toBe(300);
    // Ensure the export is actual non-transparent image content, not just an encoded blank canvas.
    expect(
      await result.evaluate((image: HTMLImageElement) => {
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = 1;
        const context = canvas.getContext("2d");
        if (!context) return 0;
        context.drawImage(image, 0, 0, 1, 1);
        return context.getImageData(0, 0, 1, 1).data[3];
      }),
    ).toBe(255);
  });

  test(`timezone select searches and compares zones without changing its controlled value on search in ${locale}`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    // Stable local zone and instant: winter New York is UTC-05:00.
    await page.clock.setFixedTime(new Date("2026-01-15T12:00:00Z"));
    const demo = await visit(page, locale, "timezone-select");
    const trigger = demo.getByRole("combobox", {
      name: french ? "Fuseau horaire préféré" : "Preferred time zone",
      exact: true,
    });
    await expect(demo.getByRole("combobox")).toHaveCount(1);
    await expect(trigger).toContainText("America/Toronto");
    await expect(demo.getByRole("definition")).toContainText(
      french ? "Même heure" : "Same time",
    );
    await expect(
      demo.getByText(/(Your time|Votre heure): America\/New York/),
    ).toContainText("UTC-05:00");
    await trigger.click();
    const search = page.getByPlaceholder(
      french
        ? "Rechercher une ville, un fuseau ou un décalage UTC…"
        : "Search city, time zone or UTC offset…",
    );
    await search.fill("America/New_York");
    await expect(
      page.getByRole("option", { name: /America\/New York/ }),
    ).toBeVisible();
    await search.fill("Sao Paulo");
    await expect(
      page.getByText(
        french
          ? "Aucun fuseau horaire correspondant."
          : "No matching time zones.",
        { exact: true },
      ),
    ).toBeVisible();
    await search.press("Escape");
    await expect(search).toBeHidden();
    await trigger.click();
    await search.fill("America/Los_Angeles");
    const option = page.getByRole("option", { name: /America\/Los Angeles/ });
    await expect(option).toBeVisible();
    await expect(option).toContainText("UTC-08:00");
    await search.press("ArrowDown");
    await search.press("Enter");
    await expect(search).toBeHidden();
    await expect(trigger).toContainText("America/Los Angeles");
    await expect(demo.getByRole("definition")).toContainText(
      /3.*(behind|retard)/,
    );
    await trigger.click();
    await search.fill("NoSuchCityAnywhere");
    await expect(
      page.getByText(
        french
          ? "Aucun fuseau horaire correspondant."
          : "No matching time zones.",
        { exact: true },
      ),
    ).toBeVisible();
    await search.press("Escape");
    await expect(trigger).toContainText("America/Los Angeles");
    await expect(search).toBeHidden();
    await demo
      .getByRole("button", {
        name: french ? "Utiliser mon fuseau horaire" : "Use my time zone",
        exact: true,
      })
      .click();
    await expect(trigger).toContainText("America/New York");
    await demo
      .getByRole("button", {
        name: french ? "Effacer le fuseau horaire" : "Clear time zone",
        exact: true,
      })
      .click();
    await expect(trigger).toContainText(
      french ? "Choisir un fuseau horaire" : "Select a time zone",
    );
  });
}
