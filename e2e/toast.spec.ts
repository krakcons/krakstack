import { expect, test, type Page } from "@playwright/test";

const origin = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3019";
const visit = async (page: Page, locale: string) => {
  await page.setViewportSize({
    width: locale === "fr" ? 320 : 1280,
    height: 1000,
  });
  await page.goto(`${origin}/${locale}/docs/toast`);
  await page.getByRole("tab", { name: "Code", exact: true }).click();
  const name = locale === "fr" ? "Aperçu" : "Preview";
  await page.getByRole("tab", { name, exact: true }).click();
  return page.getByRole("tabpanel", { name, exact: true });
};
for (const locale of ["en", "fr"]) {
  const french = locale === "fr";
  test(`toast keyboard dismissal, actions and progress updates in ${locale}`, async ({
    page,
  }) => {
    const demo = await visit(page, locale);
    await demo.getByRole("combobox").click();
    await page
      .getByRole("option", {
        name: french ? "En haut au centre" : "Top center",
        exact: true,
      })
      .click();
    await demo
      .getByRole("button", {
        name: french ? "Notification de succès" : "Success toast",
        exact: true,
      })
      .click();
    const saved = page.getByRole("dialog", {
      name: french ? "Modifications enregistrées" : "Changes saved",
      exact: true,
    });
    await expect(saved).toBeVisible();
    await page.keyboard.press("F6");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Escape");
    await expect(saved).toHaveCount(0);
    await demo
      .getByRole("button", {
        name: french ? "Notification avec action" : "Toast with action",
        exact: true,
      })
      .click();
    await page
      .getByRole("button", { name: french ? "Annuler" : "Undo", exact: true })
      .click();
    await expect(
      page.getByRole("dialog", {
        name: french ? "Élément d’exemple restauré" : "Sample item restored",
        exact: true,
      }),
    ).toBeVisible();
    await demo
      .getByRole("button", {
        name: french ? "Tout fermer" : "Dismiss all",
        exact: true,
      })
      .click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await demo
      .getByRole("button", {
        name: french
          ? "Démarrer une notification de chargement"
          : "Start loading toast",
        exact: true,
      })
      .click();
    await expect(
      page.getByRole("dialog", {
        name: french
          ? "Préparation de l’export d’exemple…"
          : "Preparing the sample export…",
        exact: true,
      }),
    ).toBeVisible();
    await demo
      .getByRole("button", {
        name: french ? "Terminer l’export d’exemple" : "Finish sample export",
        exact: true,
      })
      .click();
    await expect(
      page.getByRole("dialog", {
        name: french ? "Export d’exemple prêt" : "Sample export ready",
        exact: true,
      }),
    ).toBeVisible();
    await expect(page.getByRole("dialog")).toHaveCount(1);
    await expect
      .poll(() =>
        page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      )
      .toBe(true);
    await page.keyboard.press("F6");
    await page
      .getByRole("button", {
        name: french ? "Fermer la notification" : "Dismiss notification",
        exact: true,
      })
      .click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });
  test(`toast visible limit and automatic dismissal in ${locale}`, async ({
    page,
  }) => {
    const demo = await visit(page, locale);
    await demo.getByRole("combobox").click();
    await page
      .getByRole("option", {
        name: french ? "En haut à droite" : "Top right",
        exact: true,
      })
      .click();
    for (const name of french
      ? [
          "Notification de succès",
          "Notification d’erreur",
          "Notification d’avertissement",
          "Notification d’information",
        ]
      : ["Success toast", "Error toast", "Warning toast", "Info toast"])
      await demo.getByRole("button", { name, exact: true }).click();
    await expect(page.getByRole("dialog")).toHaveCount(3);
    await expect
      .poll(() =>
        page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      )
      .toBe(true);
    await page.mouse.move(0, 0);
    await expect(page.getByRole("dialog")).toHaveCount(0, { timeout: 8000 });
  });
}

test("overflowing toast animations do not flash a scrollbar", async ({
  page,
}) => {
  const demo = await visit(page, "en");
  for (const name of [
    "Success toast",
    "Info toast",
    "Warning toast",
    "Error toast",
  ])
    await demo.getByRole("button", { name, exact: true }).click();

  const scrollbarFrames = await demo
    .getByRole("button", { name: "Dismiss all", exact: true })
    .evaluate(
      (button: HTMLButtonElement) =>
        new Promise<number>((resolve) => {
          const viewport = document.querySelector<HTMLElement>(
            '[aria-label="Notifications"]',
          )!;
          let frames = 0;
          const started = performance.now();
          const sample = () => {
            const style = getComputedStyle(viewport);
            if (
              viewport.scrollHeight > viewport.clientHeight + 1 &&
              style.scrollbarWidth !== "none" &&
              /auto|scroll/.test(style.overflowY)
            )
              frames++;
            if (
              !viewport.childElementCount ||
              performance.now() - started > 2000
            ) {
              resolve(frames);
              return;
            }
            requestAnimationFrame(sample);
          };
          button.click();
          sample();
        }),
    );

  expect(scrollbarFrames).toBe(0);
  await expect(page.getByRole("dialog")).toHaveCount(0);

  await page.setViewportSize({ width: 1280, height: 240 });
  for (const name of ["Success toast", "Info toast", "Warning toast"])
    await demo
      .getByRole("button", { name, exact: true })
      .evaluate((button: HTMLButtonElement) => button.click());
  const viewport = page.getByRole("region", {
    name: "Notifications",
    exact: true,
  });
  await expect(page.getByRole("dialog")).toHaveCount(3);
  await viewport.evaluate((element) => {
    element.scrollTop = 0;
  });
  await page.getByRole("dialog").first().hover();
  await page.mouse.wheel(0, 200);
  await expect
    .poll(() => viewport.evaluate((element) => element.scrollTop))
    .toBeGreaterThan(0);
});
